using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MongoDB.Bson.Serialization.Attributes;

namespace BusTrackingApi.Models;

public class LocationUpdate
{
    [Key]
    [BsonId]
    public int Id { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [ForeignKey(nameof(VehicleId))]
    [BsonIgnore]
    public Vehicle? Vehicle { get; set; }

    [Required]
    public double Latitude { get; set; }

    [Required]
    public double Longitude { get; set; }

    public double Speed { get; set; }

    public DateTime DeviceTimestamp { get; set; }

    public DateTime ServerTimestamp { get; set; } = DateTime.UtcNow;

    public bool IsOnline { get; set; } = true;
}

// DTO for incoming GPS device data
public class LocationUpdateRequest
{
    public string DeviceId { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public DateTime? Timestamp { get; set; }
}

// DTO for outgoing location data
public class LocationResponse
{
    public int VehicleId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string RouteName { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public DateTime LastUpdate { get; set; }
    public bool IsOnline { get; set; }
    public string Status { get; set; } = string.Empty;
}
