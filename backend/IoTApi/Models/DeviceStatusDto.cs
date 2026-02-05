namespace IoTApi.Models;

public class DeviceStatusDto {
    public required string DeviceId { get; set; }
    public bool LedOn { get; set; }
    public DateTime TimestampUtc { get; set; }
}