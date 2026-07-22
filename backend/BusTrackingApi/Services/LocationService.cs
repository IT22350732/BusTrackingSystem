using BusTrackingApi.Data;
using BusTrackingApi.Hubs;
using BusTrackingApi.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BusTrackingApi.Services;

public class LocationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<LocationHub> _hubContext;
    private readonly IConfiguration _configuration;

    public LocationService(AppDbContext context, IHubContext<LocationHub> hubContext, IConfiguration configuration)
    {
        _context = context;
        _hubContext = hubContext;
        _configuration = configuration;
    }

    public async Task<(LocationResponse? Response, string? Error)> ProcessUpdateAsync(LocationUpdateRequest request)
    {
        // Find vehicle by GPS device ID
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.GpsDeviceId == request.DeviceId);
        if (vehicle == null)
            return (null, $"No vehicle found with device ID: {request.DeviceId}");

        if (vehicle.Status != VehicleStatus.Active)
            return (null, $"Vehicle {vehicle.BusNumber} is not active");

        // Check if location update already exists for this vehicle
        var existing = await _context.LocationUpdates
            .FirstOrDefaultAsync(l => l.VehicleId == vehicle.Id);

        if (existing != null)
        {
            // Update existing record
            existing.Latitude = request.Latitude;
            existing.Longitude = request.Longitude;
            existing.Speed = request.Speed;
            existing.DeviceTimestamp = request.Timestamp ?? DateTime.UtcNow;
            existing.ServerTimestamp = DateTime.UtcNow;
            existing.IsOnline = true;
        }
        else
        {
            // Create new location record
            var locationUpdate = new LocationUpdate
            {
                VehicleId = vehicle.Id,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Speed = request.Speed,
                DeviceTimestamp = request.Timestamp ?? DateTime.UtcNow,
                ServerTimestamp = DateTime.UtcNow,
                IsOnline = true
            };
            _context.LocationUpdates.Add(locationUpdate);
        }

        await _context.SaveChangesAsync();

        // Build response
        var response = new LocationResponse
        {
            VehicleId = vehicle.Id,
            BusNumber = vehicle.BusNumber,
            RouteName = vehicle.RouteName,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Speed = request.Speed,
            LastUpdate = DateTime.UtcNow,
            IsOnline = true,
            Status = vehicle.Status.ToString()
        };

        // Broadcast via SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveLocationUpdate", response);

        return (response, null);
    }

    public async Task<LocationResponse?> GetLatestLocationAsync(int vehicleId)
    {
        var location = await _context.LocationUpdates
            .Include(l => l.Vehicle)
            .FirstOrDefaultAsync(l => l.VehicleId == vehicleId);

        if (location?.Vehicle == null) return null;

        var thresholdSeconds = int.Parse(_configuration["Location:OfflineThresholdSeconds"] ?? "60");
        var isOnline = (DateTime.UtcNow - location.ServerTimestamp).TotalSeconds < thresholdSeconds;

        return new LocationResponse
        {
            VehicleId = location.VehicleId,
            BusNumber = location.Vehicle.BusNumber,
            RouteName = location.Vehicle.RouteName,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Speed = location.Speed,
            LastUpdate = location.ServerTimestamp,
            IsOnline = isOnline,
            Status = location.Vehicle.Status.ToString()
        };
    }

    public async Task<List<LocationResponse>> GetAllLatestLocationsAsync()
    {
        var thresholdSeconds = int.Parse(_configuration["Location:OfflineThresholdSeconds"] ?? "60");

        var locations = await _context.LocationUpdates
            .Include(l => l.Vehicle)
            .ToListAsync();

        return locations
            .Where(l => l.Vehicle != null)
            .Select(l => new LocationResponse
            {
                VehicleId = l.VehicleId,
                BusNumber = l.Vehicle!.BusNumber,
                RouteName = l.Vehicle.RouteName,
                Latitude = l.Latitude,
                Longitude = l.Longitude,
                Speed = l.Speed,
                LastUpdate = l.ServerTimestamp,
                IsOnline = (DateTime.UtcNow - l.ServerTimestamp).TotalSeconds < thresholdSeconds,
                Status = l.Vehicle.Status.ToString()
            })
            .ToList();
    }
}
