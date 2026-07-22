using BusTrackingApi.Models;

namespace BusTrackingApi.Services;

/// <summary>
/// Background service that simulates GPS devices sending location updates
/// for demo purposes. Moves buses along predefined Sri Lankan routes.
/// </summary>
public class SimulatorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SimulatorService> _logger;

    // Route waypoints for each simulated bus (Sri Lankan coordinates)
    private static readonly Dictionary<string, List<(double Lat, double Lng)>> Routes = new()
    {
        // Colombo to Kandy route
        ["TRK-001-SIM"] = new List<(double, double)>
        {
            (6.9271, 79.8612),   // Colombo
            (6.9350, 79.8700),
            (6.9500, 79.9000),
            (6.9600, 79.9200),
            (6.9800, 79.9500),
            (7.0000, 79.9800),
            (7.0300, 80.0200),
            (7.0600, 80.0500),
            (7.1000, 80.1000),
            (7.1500, 80.1500),
            (7.2000, 80.2000),
            (7.2500, 80.3000),
            (7.2700, 80.3500),
            (7.2900, 80.4000),
            (7.2906, 80.6337),   // Kandy
        },
        // Colombo to Galle route
        ["TRK-002-SIM"] = new List<(double, double)>
        {
            (6.9271, 79.8612),   // Colombo
            (6.8800, 79.8700),
            (6.8300, 79.8800),
            (6.7800, 79.8900),
            (6.7200, 79.9000),
            (6.6500, 79.9200),
            (6.5800, 79.9500),
            (6.5000, 80.0000),
            (6.4200, 80.0300),
            (6.3500, 80.0600),
            (6.3000, 80.1000),
            (6.2500, 80.1500),
            (6.2000, 80.1800),
            (6.1500, 80.2000),
            (6.0535, 80.2210),   // Galle
        },
        // Kandy to Nuwara Eliya route
        ["TRK-003-SIM"] = new List<(double, double)>
        {
            (7.2906, 80.6337),   // Kandy
            (7.2700, 80.6500),
            (7.2400, 80.6700),
            (7.2100, 80.6900),
            (7.1800, 80.7100),
            (7.1500, 80.7300),
            (7.1200, 80.7500),
            (7.0900, 80.7600),
            (7.0600, 80.7700),
            (7.0300, 80.7800),
            (7.0000, 80.7700),
            (6.9700, 80.7800),
            (6.9490, 80.7897),   // Nuwara Eliya
        },
        // Colombo to Jaffna route
        ["TRK-004-SIM"] = new List<(double, double)>
        {
            (6.9271, 79.8612),   // Colombo
            (7.0000, 79.9000),
            (7.1500, 79.9500),
            (7.3000, 80.0000),
            (7.5000, 80.0500),
            (7.7000, 80.1000),
            (7.9000, 80.0800),
            (8.1000, 80.0500),
            (8.3000, 80.0200),
            (8.5000, 80.0000),
            (8.7000, 79.9800),
            (8.9000, 79.9500),
            (9.1000, 80.0000),
            (9.3000, 80.0500),
            (9.6615, 80.0255),   // Jaffna
        },
    };

    private readonly Dictionary<string, int> _currentWaypointIndex = new();
    private readonly Dictionary<string, bool> _movingForward = new();

    public SimulatorService(IServiceProvider serviceProvider, ILogger<SimulatorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        // Initialize state for each route
        foreach (var deviceId in Routes.Keys)
        {
            _currentWaypointIndex[deviceId] = 0;
            _movingForward[deviceId] = true;
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("GPS Simulator Service started");

        // Wait a moment for the app to fully start
        await Task.Delay(3000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var locationService = scope.ServiceProvider.GetRequiredService<LocationService>();

                foreach (var (deviceId, waypoints) in Routes)
                {
                    var currentIndex = _currentWaypointIndex[deviceId];
                    var nextIndex = _movingForward[deviceId] ? currentIndex + 1 : currentIndex - 1;

                    // Bounce at route endpoints
                    if (nextIndex >= waypoints.Count)
                    {
                        _movingForward[deviceId] = false;
                        nextIndex = currentIndex - 1;
                    }
                    else if (nextIndex < 0)
                    {
                        _movingForward[deviceId] = true;
                        nextIndex = currentIndex + 1;
                    }

                    var current = waypoints[currentIndex];
                    var next = waypoints[Math.Clamp(nextIndex, 0, waypoints.Count - 1)];

                    // Interpolate between waypoints with some randomness
                    var random = new Random();
                    var progress = random.NextDouble() * 0.5 + 0.3; // 30-80% progress
                    var lat = current.Lat + (next.Lat - current.Lat) * progress;
                    var lng = current.Lng + (next.Lng - current.Lng) * progress;

                    // Add slight jitter for realism
                    lat += (random.NextDouble() - 0.5) * 0.002;
                    lng += (random.NextDouble() - 0.5) * 0.002;

                    var speed = 30 + random.NextDouble() * 50; // 30-80 km/h

                    var request = new LocationUpdateRequest
                    {
                        DeviceId = deviceId,
                        Latitude = Math.Round(lat, 6),
                        Longitude = Math.Round(lng, 6),
                        Speed = Math.Round(speed, 1),
                        Timestamp = DateTime.UtcNow
                    };

                    var result = await locationService.ProcessUpdateAsync(request);
                    if (result.Error != null)
                    {
                        _logger.LogWarning("Simulator error for {DeviceId}: {Error}", deviceId, result.Error);
                    }

                    _currentWaypointIndex[deviceId] = nextIndex;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Simulator error");
            }

            // Send updates every 5 seconds
            await Task.Delay(5000, stoppingToken);
        }
    }
}
