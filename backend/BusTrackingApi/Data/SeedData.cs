using BusTrackingApi.Models;
using MongoDB.Driver;

namespace BusTrackingApi.Data;

public static class SeedData
{
    public static async Task Initialize(MongoDbContext context)
    {
        // Seed admin user if none exists
        if (await context.Users.CountDocumentsAsync(_ => true) == 0)
        {
            var userId = await context.GetNextSequenceAsync("users");
            await context.Users.InsertOneAsync(new User
            {
                Id = userId,
                Name = "Admin Operator",
                Email = "admin@bustracker.lk",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                CreatedAt = DateTime.UtcNow
            });
        }

        // Seed sample vehicles if none exist
        if (await context.Vehicles.CountDocumentsAsync(_ => true) == 0)
        {
            var vehicles = new List<Vehicle>
            {
                new()
                {
                    Id = await context.GetNextSequenceAsync("vehicles"),
                    BusNumber = "NB-2547",
                    RouteName = "Colombo – Kandy (Route 1)",
                    GpsDeviceId = "TRK-001-SIM",
                    DeviceModel = "Teltonika FMB920",
                    Status = VehicleStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = await context.GetNextSequenceAsync("vehicles"),
                    BusNumber = "NC-3891",
                    RouteName = "Colombo – Galle (Route 2)",
                    GpsDeviceId = "TRK-002-SIM",
                    DeviceModel = "Teltonika FMB920",
                    Status = VehicleStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = await context.GetNextSequenceAsync("vehicles"),
                    BusNumber = "NW-1234",
                    RouteName = "Kandy – Nuwara Eliya (Route 3)",
                    GpsDeviceId = "TRK-003-SIM",
                    DeviceModel = "Queclink GV300",
                    Status = VehicleStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = await context.GetNextSequenceAsync("vehicles"),
                    BusNumber = "SP-4567",
                    RouteName = "Colombo – Jaffna (Route 4)",
                    GpsDeviceId = "TRK-004-SIM",
                    DeviceModel = "Queclink GV300",
                    Status = VehicleStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = await context.GetNextSequenceAsync("vehicles"),
                    BusNumber = "EP-7890",
                    RouteName = "Colombo – Batticaloa (Route 5)",
                    GpsDeviceId = "TRK-005-SIM",
                    DeviceModel = "Teltonika FMB120",
                    Status = VehicleStatus.Maintenance,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await context.Vehicles.InsertManyAsync(vehicles);
        }
    }
}
