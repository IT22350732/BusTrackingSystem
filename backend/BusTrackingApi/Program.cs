using System.Text;
using BusTrackingApi.Data;
using BusTrackingApi.Endpoints;
using BusTrackingApi.Hubs;
using BusTrackingApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Authentication (JWT) ---
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BusTracker_SuperSecret_Key_2024_!@#$%^&*()_MinLength32Chars";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "BusTrackingApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "BusTrackingApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// --- SignalR ---
builder.Services.AddSignalR();

// --- Services ---
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<VehicleService>();
builder.Services.AddScoped<LocationService>();

// --- GPS Simulator (Background Service) ---
builder.Services.AddHostedService<SimulatorService>();

// --- Swagger/OpenAPI ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Middleware Pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// --- Map Endpoints ---
app.MapAuthEndpoints();
app.MapVehicleEndpoints();
app.MapLocationEndpoints();

// --- Map SignalR Hub ---
app.MapHub<LocationHub>("/hubs/location");

// --- Database Migration & Seed ---
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await SeedData.Initialize(context);
}

// --- Run ---
app.Run();
