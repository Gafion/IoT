using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoTApi.Data;
using IoTApi.Models;

namespace IoTApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReadingsController : ControllerBase {
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    
    public ReadingsController(AppDbContext db, IConfiguration config) {
        _db = db;
        _config = config;
    }
    
    // POST /api/readings
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> PostReading([FromBody] ReadingDto dto) {
        var expectedToken = _config["ApiToken"];
        if (!string.IsNullOrEmpty(expectedToken)) {
            var authHeader = Request.Headers.Authorization.ToString();
            if (authHeader != $"Bearer {expectedToken}") {
                return Unauthorized();
            }
        }
        
        var reading = new Reading {
            DeviceId = dto.DeviceId,
            Timestamp = dto.Timestamp.ToUniversalTime(),
            LedOn = dto.LedOn
        };

        _db.Readings.Add(reading);
        await _db.SaveChangesAsync();

        return Ok(new { ok = true, id = reading.Id });
    }

    // GET /api/readings/latest
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest() {
        var latest = await _db.Readings
            .OrderByDescending(r => r.Timestamp)
            .FirstOrDefaultAsync();

        if (latest == null) {
            return NotFound(new { error = "No readings yet"});
        }

        return Ok(latest);
    }

    // GET /api/readings/status
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() {
        var latest = await _db.Readings
            .OrderByDescending(r => r.Timestamp)
            .FirstOrDefaultAsync();

        if (latest == null) {
            return Ok(new {
                status = "UNKNOWN",
                message = "No readings received yet"
            });
        }

        var age = DateTime.UtcNow - latest.Timestamp;
        var isStale = age.TotalMinutes > 5;

        return Ok(new {
            status = latest.LedOn ? "ALARM" : "OK",
            lastReading = latest,
            lastUpdatedSecondsAgo = (int)age.TotalSeconds,
            isStale
        });
    }

    // GET /api/readings/status-per-device
    [HttpGet("status-per-device")]
    public async Task<IActionResult> GetStatusPerDevice() {
        var latestPerDevice = _db.Readings
            .AsNoTracking()
            .GroupBy(r => r.DeviceId)
            .Select(g => new {
                DeviceId = g.Key,
                LatestTimestamp = g.Max(x => x.Timestamp)
            });

        var result = await _db.Readings
            .AsNoTracking()
            .Join(
                latestPerDevice,
                r => new { r.DeviceId, r.Timestamp },
                x => new { x.DeviceId, Timestamp = x.LatestTimestamp },
                (r, _) => new DeviceStatusDto {
                    DeviceId = r.DeviceId,
                    LedOn = r.LedOn,
                    TimestampUtc = DateTime.SpecifyKind(r.Timestamp, DateTimeKind.Utc)
                }
            )
            .OrderBy(x => x.DeviceId)
            .ToListAsync();

        return Ok(result);
    }
}