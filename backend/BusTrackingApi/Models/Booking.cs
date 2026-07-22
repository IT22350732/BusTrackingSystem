using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BusTrackingApi.Models;

public class Booking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    [Required]
    public DateOnly TravelDate { get; set; }

    [Required]
    public TimeOnly DepartureTime { get; set; }

    [Required]
    public TimeOnly ArrivalTime { get; set; }

    public DateTime BookedAt { get; set; } = DateTime.UtcNow;
}

// DTO for creating a booking
public class CreateBookingRequest
{
    public int VehicleId { get; set; }
    public string TravelDate { get; set; } = string.Empty; // "yyyy-MM-dd"
    public string DepartureTime { get; set; } = string.Empty; // "HH:mm"
    public string ArrivalTime { get; set; } = string.Empty; // "HH:mm"
}

// DTO for booking response
public class BookingResponse
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string RouteName { get; set; } = string.Empty;
    public string TravelDate { get; set; } = string.Empty;
    public string DepartureTime { get; set; } = string.Empty;
    public string ArrivalTime { get; set; } = string.Empty;
    public string BookedAt { get; set; } = string.Empty;
}

// DTO for tracking access validation
public class TrackingAccessResponse
{
    public bool Allowed { get; set; }
    public string Message { get; set; } = string.Empty;
    public BookingResponse? Booking { get; set; }
}

// DTO for user registration
public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
