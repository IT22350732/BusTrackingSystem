using BusTrackingApi.Models;
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

        group.MapPost("/register", async (RegisterRequest request, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return Results.BadRequest(new { error = "Name, email, and password are required" });

            if (request.Password.Length < 6)
                return Results.BadRequest(new { error = "Password must be at least 6 characters" });

            var (token, error) = await authService.RegisterAsync(request.Name, request.Email, request.Password);

            if (error != null)
                return Results.BadRequest(new { error });

            return Results.Ok(new { token, message = "Registration successful" });
        })
        .WithName("Register")
        .WithOpenApi()
        .AllowAnonymous();
    }
}

public record LoginRequest(string Email, string Password);

