using Microsoft.EntityFrameworkCore;
using BusTrackingApi.Models;

namespace BusTrackingApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<LocationUpdate> LocationUpdates => Set<LocationUpdate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(e => e.GpsDeviceId).IsUnique();
            entity.HasIndex(e => e.BusNumber).IsUnique();
        });

        modelBuilder.Entity<LocationUpdate>(entity =>
        {
            entity.HasIndex(e => e.VehicleId);
        });
    }
}
