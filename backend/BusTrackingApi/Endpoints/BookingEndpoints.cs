using System.Security.Claims;
using BusTrackingApi.Models;
using BusTrackingApi.Services;

namespace BusTrackingApi.Endpoints;

public static class BookingEndpoints
{
    public static void MapBookingEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/bookings");

        // POST — create a new booking (auth required)
        group.MapPost("/", async (CreateBookingRequest request, BookingService bookingService, HttpContext httpContext) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null)
                return Results.Unauthorized();

            var (booking, error) = await bookingService.CreateBookingAsync(userId.Value, request);
            return error != null
                ? Results.BadRequest(new { error })
                : Results.Created($"/api/bookings/{booking!.Id}", booking);
        })
        .WithName("CreateBooking")
        .WithOpenApi()
        .RequireAuthorization();

        // GET — list current user's bookings (auth required)
        group.MapGet("/", async (BookingService bookingService, HttpContext httpContext) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null)
                return Results.Unauthorized();

            var bookings = await bookingService.GetUserBookingsAsync(userId.Value);
            return Results.Ok(bookings);
        })
        .WithName("GetMyBookings")
        .WithOpenApi()
        .RequireAuthorization();

        // GET — validate tracking access for a specific vehicle (auth required)
        app.MapGet("/api/tracking/{vehicleId:int}/validate", async (int vehicleId, BookingService bookingService, HttpContext httpContext) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == null)
                return Results.Unauthorized();

            var result = await bookingService.ValidateTrackingAccessAsync(userId.Value, vehicleId);
            return Results.Ok(result);
        })
        .WithName("ValidateTrackingAccess")
        .WithOpenApi()
        .RequireAuthorization();
    }

    private static int? GetUserId(HttpContext httpContext)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
