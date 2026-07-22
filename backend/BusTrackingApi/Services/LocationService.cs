using BusTrackingApi.Data;
using BusTrackingApi.Hubs;
using BusTrackingApi.Models;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;

namespace BusTrackingApi.Services;

public class LocationService
{
    private readonly MongoDbContext _context;
    private readonly IHubContext<LocationHub> _hubContext;
    private readonly IConfiguration _configuration;

    public LocationService(MongoDbContext context, IHubContext<LocationHub> hubContext, IConfiguration configuration)
    {
        _context = context;
        _hubContext = hubContext;
        _configuration = configuration;
    }

    public async Task<(LocationResponse? Response, string? Error)> ProcessUpdateAsync(LocationUpdateRequest request)
    {
        // Find vehicle by GPS device ID
        var vehicle = await _context.Vehicles.Find(v => v.GpsDeviceId == request.DeviceId).FirstOrDefaultAsync();
        if (vehicle == null)
            return (null, $"No vehicle found with device ID: {request.DeviceId}");

        if (vehicle.Status != VehicleStatus.Active)
            return (null, $"Vehicle {vehicle.BusNumber} is not active");

        // Check if location update already exists for this vehicle
        var existing = await _context.LocationUpdates.Find(l => l.VehicleId == vehicle.Id).FirstOrDefaultAsync();

        if (existing != null)
        {
            // Update existing record
            var filter = Builders<LocationUpdate>.Filter.Eq(l => l.Id, existing.Id);
            var updateDef = Builders<LocationUpdate>.Update
                .Set(l => l.Latitude, request.Latitude)
                .Set(l => l.Longitude, request.Longitude)
                .Set(l => l.Speed, request.Speed)
                .Set(l => l.DeviceTimestamp, request.Timestamp ?? DateTime.UtcNow)
                .Set(l => l.ServerTimestamp, DateTime.UtcNow)
                .Set(l => l.IsOnline, true);

            await _context.LocationUpdates.UpdateOneAsync(filter, updateDef);
        }
        else
        {
            // Create new location record
            var nextId = await _context.GetNextSequenceAsync("location_updates");
            var locationUpdate = new LocationUpdate
            {
                Id = nextId,
                VehicleId = vehicle.Id,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Speed = request.Speed,
                DeviceTimestamp = request.Timestamp ?? DateTime.UtcNow,
                ServerTimestamp = DateTime.UtcNow,
                IsOnline = true
            };
            await _context.LocationUpdates.InsertOneAsync(locationUpdate);
        }

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
        var location = await _context.LocationUpdates.Find(l => l.VehicleId == vehicleId).FirstOrDefaultAsync();
        if (location == null) return null;

        var vehicle = await _context.Vehicles.Find(v => v.Id == vehicleId).FirstOrDefaultAsync();
        if (vehicle == null) return null;

        var thresholdSeconds = int.Parse(_configuration["Location:OfflineThresholdSeconds"] ?? "60");
        var isOnline = (DateTime.UtcNow - location.ServerTimestamp).TotalSeconds < thresholdSeconds;

        return new LocationResponse
        {
            VehicleId = location.VehicleId,
            BusNumber = vehicle.BusNumber,
            RouteName = vehicle.RouteName,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Speed = location.Speed,
            LastUpdate = location.ServerTimestamp,
            IsOnline = isOnline,
            Status = vehicle.Status.ToString()
        };
    }

    public async Task<List<LocationResponse>> GetAllLatestLocationsAsync()
    {
        var thresholdSeconds = int.Parse(_configuration["Location:OfflineThresholdSeconds"] ?? "60");

        var locations = await _context.LocationUpdates.Find(_ => true).ToListAsync();
        var vehicles = await _context.Vehicles.Find(_ => true).ToListAsync();
        var vehicleMap = vehicles.ToDictionary(v => v.Id);

        var list = new List<LocationResponse>();
        foreach (var l in locations)
        {
            if (vehicleMap.TryGetValue(l.VehicleId, out var vehicle))
            {
                list.Add(new LocationResponse
                {
                    VehicleId = l.VehicleId,
                    BusNumber = vehicle.BusNumber,
                    RouteName = vehicle.RouteName,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    Speed = l.Speed,
                    LastUpdate = l.ServerTimestamp,
                    IsOnline = (DateTime.UtcNow - l.ServerTimestamp).TotalSeconds < thresholdSeconds,
                    Status = vehicle.Status.ToString()
                });
            }
        }

        return list;
    }
}
