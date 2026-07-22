using BusTrackingApi.Data;
using BusTrackingApi.Models;
using MongoDB.Driver;

namespace BusTrackingApi.Services;

public class VehicleService
{
    private readonly MongoDbContext _context;

    public VehicleService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<Vehicle>> GetAllAsync()
    {
        return await _context.Vehicles.Find(_ => true)
            .SortBy(v => v.BusNumber)
            .ToListAsync();
    }

    public async Task<Vehicle?> GetByIdAsync(int id)
    {
        return await _context.Vehicles.Find(v => v.Id == id).FirstOrDefaultAsync();
    }

    public async Task<(Vehicle? Vehicle, string? Error)> CreateAsync(Vehicle vehicle)
    {
        // Check unique constraints
        if (await _context.Vehicles.Find(v => v.GpsDeviceId == vehicle.GpsDeviceId).AnyAsync())
            return (null, "A vehicle with this GPS Device ID already exists");

        if (await _context.Vehicles.Find(v => v.BusNumber == vehicle.BusNumber).AnyAsync())
            return (null, "A vehicle with this Bus Number already exists");

        vehicle.Id = await _context.GetNextSequenceAsync("vehicles");
        vehicle.CreatedAt = DateTime.UtcNow;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.Vehicles.InsertOneAsync(vehicle);
        return (vehicle, null);
    }

    public async Task<(Vehicle? Vehicle, string? Error)> UpdateAsync(int id, Vehicle updated)
    {
        var vehicle = await _context.Vehicles.Find(v => v.Id == id).FirstOrDefaultAsync();
        if (vehicle == null)
            return (null, "Vehicle not found");

        // Check unique constraints (excluding current vehicle)
        if (await _context.Vehicles.Find(v => v.GpsDeviceId == updated.GpsDeviceId && v.Id != id).AnyAsync())
            return (null, "A vehicle with this GPS Device ID already exists");

        if (await _context.Vehicles.Find(v => v.BusNumber == updated.BusNumber && v.Id != id).AnyAsync())
            return (null, "A vehicle with this Bus Number already exists");

        var filter = Builders<Vehicle>.Filter.Eq(v => v.Id, id);
        var updateDef = Builders<Vehicle>.Update
            .Set(v => v.BusNumber, updated.BusNumber)
            .Set(v => v.RouteName, updated.RouteName)
            .Set(v => v.GpsDeviceId, updated.GpsDeviceId)
            .Set(v => v.DeviceModel, updated.DeviceModel)
            .Set(v => v.Status, updated.Status)
            .Set(v => v.UpdatedAt, DateTime.UtcNow);

        await _context.Vehicles.UpdateOneAsync(filter, updateDef);
        
        updated.Id = id;
        updated.CreatedAt = vehicle.CreatedAt;
        updated.UpdatedAt = DateTime.UtcNow;

        return (updated, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var vehicle = await _context.Vehicles.Find(v => v.Id == id).FirstOrDefaultAsync();
        if (vehicle == null)
            return (false, "Vehicle not found");

        // Soft delete — set to Inactive
        var filter = Builders<Vehicle>.Filter.Eq(v => v.Id, id);
        var updateDef = Builders<Vehicle>.Update
            .Set(v => v.Status, VehicleStatus.Inactive)
            .Set(v => v.UpdatedAt, DateTime.UtcNow);

        await _context.Vehicles.UpdateOneAsync(filter, updateDef);
        return (true, null);
    }
}
