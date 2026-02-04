using Microsoft.EntityFrameworkCore;
using IoTApi.Models;

namespace IoTApi.Data;

public class AppDbContext : DbContext {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<Reading> Readings => Set<Reading>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<Reading>(entity => {
            entity.ToTable("readings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DeviceId).HasColumnName("device_id");
            entity.Property(e => e.Timestamp).HasColumnName("timestamp");
            entity.Property(e => e.LedOn).HasColumnName("led_on");

            entity.HasIndex(e => new { e.DeviceId, e.Timestamp });
        });
    }
}