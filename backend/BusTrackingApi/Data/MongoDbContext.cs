using BusTrackingApi.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;

namespace BusTrackingApi.Data;

public class Counter
{
    [BsonId]
    public string Id { get; set; } = string.Empty; // Collection name e.g. "users", "vehicles"
    public int SequenceValue { get; set; }
}

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    static MongoDbContext()
    {
        // Register DateOnly and TimeOnly BSON Serializers if not already registered
        try
        {
            BsonSerializer.RegisterSerializer(new DateOnlyAsStringSerializer());
            BsonSerializer.RegisterSerializer(new TimeOnlyAsStringSerializer());
        }
        catch
        {
            // Already registered
        }
    }

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDb:ConnectionString"]
            ?? "mongodb+srv://menda:menda@clustermendis.eqm7p.mongodb.net/?retryWrites=true&w=majority&appName=Clustermendis";
        var databaseName = configuration["MongoDb:DatabaseName"] ?? "bus_tracking";

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);

        CreateIndexes();
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Vehicle> Vehicles => _database.GetCollection<Vehicle>("vehicles");
    public IMongoCollection<LocationUpdate> LocationUpdates => _database.GetCollection<LocationUpdate>("location_updates");
    public IMongoCollection<Booking> Bookings => _database.GetCollection<Booking>("bookings");
    public IMongoCollection<Counter> Counters => _database.GetCollection<Counter>("counters");

    public async Task<int> GetNextSequenceAsync(string sequenceName)
    {
        var filter = Builders<Counter>.Filter.Eq(c => c.Id, sequenceName);
        var update = Builders<Counter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<Counter>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var result = await Counters.FindOneAndUpdateAsync(filter, update, options);
        return result.SequenceValue;
    }

    private void CreateIndexes()
    {
        try
        {
            // Unique index on User.Email
            Users.Indexes.CreateOne(new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true }));

            // Unique indexes on Vehicle.GpsDeviceId and BusNumber
            Vehicles.Indexes.CreateOne(new CreateIndexModel<Vehicle>(
                Builders<Vehicle>.IndexKeys.Ascending(v => v.GpsDeviceId),
                new CreateIndexOptions { Unique = true }));
            Vehicles.Indexes.CreateOne(new CreateIndexModel<Vehicle>(
                Builders<Vehicle>.IndexKeys.Ascending(v => v.BusNumber),
                new CreateIndexOptions { Unique = true }));

            // Index on LocationUpdate.VehicleId
            LocationUpdates.Indexes.CreateOne(new CreateIndexModel<LocationUpdate>(
                Builders<LocationUpdate>.IndexKeys.Ascending(l => l.VehicleId)));

            // Unique composite index on Booking (UserId, VehicleId, TravelDate)
            Bookings.Indexes.CreateOne(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys
                    .Ascending(b => b.UserId)
                    .Ascending(b => b.VehicleId)
                    .Ascending(b => b.TravelDate),
                new CreateIndexOptions { Unique = true }));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MongoDB Index creation notice: {ex.Message}");
        }
    }
}

public class DateOnlyAsStringSerializer : SerializerBase<DateOnly>
{
    public override DateOnly Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
    {
        var str = context.Reader.ReadString();
        return DateOnly.Parse(str);
    }

    public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, DateOnly value)
    {
        context.Writer.WriteString(value.ToString("yyyy-MM-dd"));
    }
}

public class TimeOnlyAsStringSerializer : SerializerBase<TimeOnly>
{
    public override TimeOnly Deserialize(BsonDeserializationContext context, BsonDeserializationArgs args)
    {
        var str = context.Reader.ReadString();
        return TimeOnly.Parse(str);
    }

    public override void Serialize(BsonSerializationContext context, BsonSerializationArgs args, TimeOnly value)
    {
        context.Writer.WriteString(value.ToString("HH:mm"));
    }
}
