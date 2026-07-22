using BusTrackingApi.Models;
using BusTrackingApi.Services;

namespace BusTrackingApi.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/location");

        // POST — receive GPS update from device (no auth, device uses device ID)
        group.MapPost("/", async (LocationUpdateRequest request, LocationService locationService) =>
        {
            if (string.IsNullOrWhiteSpace(request.DeviceId))
                return Results.BadRequest(new { error = "DeviceId is required" });

            var (response, error) = await locationService.ProcessUpdateAsync(request);
            return error != null
                ? Results.BadRequest(new { error })
                : Results.Ok(response);
        })
        .WithName("PostLocation")
        .WithOpenApi()
        .AllowAnonymous();

        // GET all latest locations — public
        group.MapGet("/", async (LocationService locationService) =>
        {
            var locations = await locationService.GetAllLatestLocationsAsync();
            return Results.Ok(locations);
        })
        .WithName("GetAllLocations")
        .WithOpenApi()
        .AllowAnonymous();

        // GET latest location for a specific vehicle — public
        group.MapGet("/{vehicleId:int}", async (int vehicleId, LocationService locationService) =>
        {
            var location = await locationService.GetLatestLocationAsync(vehicleId);
            return location is null
                ? Results.NotFound(new { error = "No location data for this vehicle" })
                : Results.Ok(location);
        })
        .WithName("GetVehicleLocation")
        .WithOpenApi()
        .AllowAnonymous();
    }
}
