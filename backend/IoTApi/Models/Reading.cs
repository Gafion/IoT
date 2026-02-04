namespace IoTApi.Models;

public class Reading {
    public long Id { get; set; }
    public required string DeviceId { get; set; }
    public DateTime Timestamp { get; set; }
    public double DistanceCm { get; set; }
    public bool LedOn { get; set; }
}