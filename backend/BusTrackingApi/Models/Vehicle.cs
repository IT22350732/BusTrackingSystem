using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BusTrackingApi.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum VehicleStatus
{
    Active,
    Inactive,
    Maintenance
}

public class Vehicle
{
    [Key]
    [BsonId]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string BusNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string RouteName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string GpsDeviceId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? DeviceModel { get; set; }

    [BsonRepresentation(BsonType.String)]
    public VehicleStatus Status { get; set; } = VehicleStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
