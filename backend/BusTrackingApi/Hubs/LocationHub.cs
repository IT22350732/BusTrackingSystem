using System.Security.Claims;
using BusTrackingApi.Services;
using Microsoft.AspNetCore.SignalR;

namespace BusTrackingApi.Hubs;

public class LocationHub : Hub
{
    private readonly BookingService _bookingService;

    public LocationHub(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Allows a client to subscribe to updates for a specific vehicle.
    /// Validates the user has a valid booking for today before allowing subscription.
    /// </summary>
    public async Task SubscribeToVehicle(int vehicleId)
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            throw new HubException("Authentication required. Please log in to track buses.");
        }

        var result = await _bookingService.ValidateTrackingAccessAsync(userId, vehicleId);

        if (!result.Allowed)
        {
            throw new HubException(result.Message);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"vehicle-{vehicleId}");
    }

    /// <summary>
    /// Allows a client to unsubscribe from a specific vehicle's updates
    /// </summary>
    public async Task UnsubscribeFromVehicle(int vehicleId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"vehicle-{vehicleId}");
    }
}

