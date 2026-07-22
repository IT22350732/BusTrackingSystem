using Microsoft.EntityFrameworkCore;
using BusTrackingApi.Models;

namespace BusTrackingApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<LocationUpdate> LocationUpdates => Set<LocationUpdate>();
    public DbSet<Booking> Bookings => Set<Booking>();

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

        modelBuilder.Entity<Booking>(entity =>
        {
            // Prevent duplicate bookings for same user, vehicle, and date
            entity.HasIndex(e => new { e.UserId, e.VehicleId, e.TravelDate }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
