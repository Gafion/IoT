using System.ComponentModel.DataAnnotations;

namespace IoTApi.Models;

public class ReadingDto {
    [Required]
    [StringLength(64, MinimumLength = 1)]
    public required string DeviceId { get; set; }
    
    [Required]
    public DateTime Timestamp { get; set; }
    
    [Range(0, 1000)]
    public double DistanceCm { get; set; }
    
    public bool LedOn { get; set; }
}