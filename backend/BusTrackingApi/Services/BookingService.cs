using BusTrackingApi.Data;
using BusTrackingApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BusTrackingApi.Services;

public class BookingService
{
    private readonly AppDbContext _context;

    // Sri Lanka timezone for date comparison
    private static readonly TimeZoneInfo SriLankaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Asia/Colombo");

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Create a new booking for a user
    /// </summary>
    public async Task<(BookingResponse? Booking, string? Error)> CreateBookingAsync(int userId, CreateBookingRequest request)
    {
        // Parse travel date
        if (!DateOnly.TryParseExact(request.TravelDate, "yyyy-MM-dd", out var travelDate))
            return (null, "Invalid travel date format. Use yyyy-MM-dd");

        // Parse departure time
        if (!TimeOnly.TryParseExact(request.DepartureTime, "HH:mm", out var departureTime))
            return (null, "Invalid departure time format. Use HH:mm");

        // Parse arrival time
        if (!TimeOnly.TryParseExact(request.ArrivalTime, "HH:mm", out var arrivalTime))
            return (null, "Invalid arrival time format. Use HH:mm");

        // Validate date is not in the past
        var todaySriLanka = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SriLankaTimeZone));
        if (travelDate < todaySriLanka)
            return (null, "Cannot book a ticket for a past date");

        // Validate vehicle exists and is active
        var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null)
            return (null, "Vehicle not found");

        if (vehicle.Status != VehicleStatus.Active)
            return (null, $"Vehicle {vehicle.BusNumber} is not active");

        // Check for duplicate booking
        var existingBooking = await _context.Bookings.AnyAsync(b =>
            b.UserId == userId &&
            b.VehicleId == request.VehicleId &&
            b.TravelDate == travelDate);

        if (existingBooking)
            return (null, "You already have a booking for this bus on this date");

        // Create booking
        var booking = new Booking
        {
            UserId = userId,
            VehicleId = request.VehicleId,
            TravelDate = travelDate,
            DepartureTime = departureTime,
            ArrivalTime = arrivalTime,
            BookedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        return (MapToResponse(booking, vehicle), null);
    }

    /// <summary>
    /// Get all bookings for a user
    /// </summary>
    public async Task<List<BookingResponse>> GetUserBookingsAsync(int userId)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Vehicle)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.TravelDate)
            .ThenBy(b => b.DepartureTime)
            .ToListAsync();

        return bookings
            .Where(b => b.Vehicle != null)
            .Select(b => MapToResponse(b, b.Vehicle!))
            .ToList();
    }

    /// <summary>
    /// Validate if a user can access tracking for a specific vehicle.
    /// Compares the stored travel date with today's date in Sri Lanka timezone.
    /// </summary>
    public async Task<TrackingAccessResponse> ValidateTrackingAccessAsync(int userId, int vehicleId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Vehicle)
            .Where(b => b.UserId == userId && b.VehicleId == vehicleId)
            .OrderByDescending(b => b.TravelDate)
            .FirstOrDefaultAsync();

        if (booking == null || booking.Vehicle == null)
        {
            return new TrackingAccessResponse
            {
                Allowed = false,
                Message = "No booking found for this bus. Please book a ticket first."
            };
        }

        var todaySriLanka = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SriLankaTimeZone));

        if (booking.TravelDate > todaySriLanka)
        {
            return new TrackingAccessResponse
            {
                Allowed = false,
                Message = $"Tracking will be available on your travel date ({booking.TravelDate:yyyy-MM-dd})",
                Booking = MapToResponse(booking, booking.Vehicle)
            };
        }

        if (booking.TravelDate < todaySriLanka)
        {
            return new TrackingAccessResponse
            {
                Allowed = false,
                Message = "Trip has already completed",
                Booking = MapToResponse(booking, booking.Vehicle)
            };
        }

        // Dates match — access granted
        return new TrackingAccessResponse
        {
            Allowed = true,
            Message = "Tracking access granted",
            Booking = MapToResponse(booking, booking.Vehicle)
        };
    }

    private static BookingResponse MapToResponse(Booking booking, Vehicle vehicle)
    {
        return new BookingResponse
        {
            Id = booking.Id,
            VehicleId = booking.VehicleId,
            BusNumber = vehicle.BusNumber,
            RouteName = vehicle.RouteName,
            TravelDate = booking.TravelDate.ToString("yyyy-MM-dd"),
            DepartureTime = booking.DepartureTime.ToString("HH:mm"),
            ArrivalTime = booking.ArrivalTime.ToString("HH:mm"),
            BookedAt = booking.BookedAt.ToString("o")
        };
    }
}
