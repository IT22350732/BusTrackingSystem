using Microsoft.AspNetCore.SignalR;

namespace BusTrackingApi.Hubs;

public class LocationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Allows a client to subscribe to updates for a specific vehicle
    /// </summary>
    public async Task SubscribeToVehicle(int vehicleId)
    {
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
