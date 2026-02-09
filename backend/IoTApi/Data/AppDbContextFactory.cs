using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace IoTApi.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();

        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString =
            config.GetConnectionString("DefaultConnection")
            ?? "Server=127.0.0.1;Database=<DB_NAME>;User=<DB_USER>;Password=<DB_PASSWORD>;";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        // IMPORTANT: Don't AutoDetect at design-time (it requires a live DB connection).
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 0));
        optionsBuilder.UseMySql(connectionString, serverVersion);

        return new AppDbContext(optionsBuilder.Options);
    }
}