using System.Text;
using BusTrackingApi.Data;
using BusTrackingApi.Endpoints;
using BusTrackingApi.Hubs;
using BusTrackingApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Database (MongoDB Atlas) ---
builder.Services.AddSingleton<MongoDbContext>();

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

        // Allow SignalR to read JWT from query string (WebSocket connections)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
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
builder.Services.AddScoped<BookingService>();

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
app.MapBookingEndpoints();

// --- Map SignalR Hub ---
app.MapHub<LocationHub>("/hubs/location");

// --- Database Migration & Seed ---
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await SeedData.Initialize(context);
}

// --- Run ---
app.Run();
