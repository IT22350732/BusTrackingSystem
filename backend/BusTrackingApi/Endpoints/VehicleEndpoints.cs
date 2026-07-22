using BusTrackingApi.Models;
using BusTrackingApi.Services;

namespace BusTrackingApi.Endpoints;

public static class VehicleEndpoints
{
    public static void MapVehicleEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/vehicles");

        // GET all vehicles — public (riders can see the list)
        group.MapGet("/", async (VehicleService vehicleService) =>
        {
            var vehicles = await vehicleService.GetAllAsync();
            return Results.Ok(vehicles);
        })
        .WithName("GetAllVehicles")
        .WithOpenApi()
        .AllowAnonymous();

        // GET single vehicle — public
        group.MapGet("/{id:int}", async (int id, VehicleService vehicleService) =>
        {
            var vehicle = await vehicleService.GetByIdAsync(id);
            return vehicle is null ? Results.NotFound() : Results.Ok(vehicle);
        })
        .WithName("GetVehicle")
        .WithOpenApi()
        .AllowAnonymous();

        // POST create vehicle — auth required
        group.MapPost("/", async (Vehicle vehicle, VehicleService vehicleService) =>
        {
            var (created, error) = await vehicleService.CreateAsync(vehicle);
            return error != null
                ? Results.BadRequest(new { error })
                : Results.Created($"/api/vehicles/{created!.Id}", created);
        })
        .WithName("CreateVehicle")
        .WithOpenApi()
        .RequireAuthorization();

        // PUT update vehicle — auth required
        group.MapPut("/{id:int}", async (int id, Vehicle vehicle, VehicleService vehicleService) =>
        {
            var (updated, error) = await vehicleService.UpdateAsync(id, vehicle);
            return error != null
                ? Results.BadRequest(new { error })
                : Results.Ok(updated);
        })
        .WithName("UpdateVehicle")
        .WithOpenApi()
        .RequireAuthorization();

        // DELETE (soft) vehicle — auth required
        group.MapDelete("/{id:int}", async (int id, VehicleService vehicleService) =>
        {
            var (success, error) = await vehicleService.DeleteAsync(id);
            return error != null
                ? Results.NotFound(new { error })
                : Results.Ok(new { message = "Vehicle deactivated" });
        })
        .WithName("DeleteVehicle")
        .WithOpenApi()
        .RequireAuthorization();
    }
}
