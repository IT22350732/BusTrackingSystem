using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BusTrackingApi.Data;
using BusTrackingApi.Models;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

namespace BusTrackingApi.Services;

public class AuthService
{
    private readonly MongoDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(MongoDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<(string? Token, string? Error)> LoginAsync(string email, string password)
    {
        var user = await _context.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (user == null)
            return (null, "Invalid email or password");

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return (null, "Invalid email or password");

        var token = GenerateJwtToken(user);
        return (token, null);
    }

    public async Task<(string? Token, string? Error)> RegisterAsync(string name, string email, string password)
    {
        // Check if email already exists
        var existing = await _context.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (existing != null)
            return (null, "An account with this email already exists");

        var nextId = await _context.GetNextSequenceAsync("users");
        var user = new User
        {
            Id = nextId,
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.InsertOneAsync(user);

        var token = GenerateJwtToken(user);
        return (token, null);
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "BusTracker_SuperSecret_Key_2024_!@#$%^&*()_MinLength32"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, "Operator")
        };

        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "480");

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "BusTrackingApi",
            audience: _configuration["Jwt:Audience"] ?? "BusTrackingApp",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
