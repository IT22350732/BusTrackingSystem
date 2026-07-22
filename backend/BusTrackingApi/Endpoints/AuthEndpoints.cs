using BusTrackingApi.Services;

namespace BusTrackingApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (LoginRequest request, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { error = "Email and password are required" });

            var (token, error) = await authService.LoginAsync(request.Email, request.Password);

            if (error != null)
                return Results.Unauthorized();

            return Results.Ok(new { token, message = "Login successful" });
        })
        .WithName("Login")
        .WithOpenApi()
        .AllowAnonymous();
    }
}

public record LoginRequest(string Email, string Password);
