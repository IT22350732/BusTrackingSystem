using BusTrackingApi.Data;
using BusTrackingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusTrackingApi.Services;

public class VehicleService
{
    private readonly AppDbContext _context;

    public VehicleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Vehicle>> GetAllAsync()
    {
        return await _context.Vehicles.OrderBy(v => v.BusNumber).ToListAsync();
    }

    public async Task<Vehicle?> GetByIdAsync(int id)
    {
        return await _context.Vehicles.FindAsync(id);
    }

    public async Task<(Vehicle? Vehicle, string? Error)> CreateAsync(Vehicle vehicle)
    {
        // Check unique constraints
        if (await _context.Vehicles.AnyAsync(v => v.GpsDeviceId == vehicle.GpsDeviceId))
            return (null, "A vehicle with this GPS Device ID already exists");

        if (await _context.Vehicles.AnyAsync(v => v.BusNumber == vehicle.BusNumber))
            return (null, "A vehicle with this Bus Number already exists");

        vehicle.CreatedAt = DateTime.UtcNow;
        vehicle.UpdatedAt = DateTime.UtcNow;

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        return (vehicle, null);
    }

    public async Task<(Vehicle? Vehicle, string? Error)> UpdateAsync(int id, Vehicle updated)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null)
            return (null, "Vehicle not found");

        // Check unique constraints (excluding current vehicle)
        if (await _context.Vehicles.AnyAsync(v => v.GpsDeviceId == updated.GpsDeviceId && v.Id != id))
            return (null, "A vehicle with this GPS Device ID already exists");

        if (await _context.Vehicles.AnyAsync(v => v.BusNumber == updated.BusNumber && v.Id != id))
            return (null, "A vehicle with this Bus Number already exists");

        vehicle.BusNumber = updated.BusNumber;
        vehicle.RouteName = updated.RouteName;
        vehicle.GpsDeviceId = updated.GpsDeviceId;
        vehicle.DeviceModel = updated.DeviceModel;
        vehicle.Status = updated.Status;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (vehicle, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null)
            return (false, "Vehicle not found");

        // Soft delete — set to Inactive
        vehicle.Status = VehicleStatus.Inactive;
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return (true, null);
    }
}
