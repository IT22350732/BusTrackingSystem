using BusTrackingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusTrackingApi.Data;

public static class SeedData
{
    public static async Task Initialize(AppDbContext context)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Seed admin user if none exists
        if (!await context.Users.AnyAsync())
        {
            context.Users.Add(new User
            {
                Name = "Admin Operator",
                Email = "admin@bustracker.lk",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                CreatedAt = DateTime.UtcNow
            });
        }

        // Seed sample vehicles if none exist
        if (!await context.Vehicles.AnyAsync())
        {
            var vehicles = new List<Vehicle>
            {
                new()
                {
                    BusNumber = "NB-2547",
                    RouteName = "Colombo – Kandy (Route 1)",
                    GpsDeviceId = "TRK-001-SIM",
                    DeviceModel = "Teltonika FMB920",
                    Status = VehicleStatus.Active
                },
                new()
                {
                    BusNumber = "NC-3891",
                    RouteName = "Colombo – Galle (Route 2)",
                    GpsDeviceId = "TRK-002-SIM",
                    DeviceModel = "Teltonika FMB920",
                    Status = VehicleStatus.Active
                },
                new()
                {
                    BusNumber = "NW-1234",
                    RouteName = "Kandy – Nuwara Eliya (Route 3)",
                    GpsDeviceId = "TRK-003-SIM",
                    DeviceModel = "Queclink GV300",
                    Status = VehicleStatus.Active
                },
                new()
                {
                    BusNumber = "SP-4567",
                    RouteName = "Colombo – Jaffna (Route 4)",
                    GpsDeviceId = "TRK-004-SIM",
                    DeviceModel = "Queclink GV300",
                    Status = VehicleStatus.Active
                },
                new()
                {
                    BusNumber = "EP-7890",
                    RouteName = "Colombo – Batticaloa (Route 5)",
                    GpsDeviceId = "TRK-005-SIM",
                    DeviceModel = "Teltonika FMB120",
                    Status = VehicleStatus.Maintenance
                }
            };

            context.Vehicles.AddRange(vehicles);
        }

        await context.SaveChangesAsync();
    }
}
