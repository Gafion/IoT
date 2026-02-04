using System.ComponentModel.DataAnnotations;

namespace IoTApi.Models;

public class ReadingDto {
    [Required]
    [StringLength(64, MinimumLength = 1)]
    public required string DeviceId { get; set; }
    
    [Required]
    public DateTime Timestamp { get; set; }
    
    public bool LedOn { get; set; }
}