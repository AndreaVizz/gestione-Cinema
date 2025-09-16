using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace cinema_ITS.Classi;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<CinemaDbContext>
{
    public CinemaDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();

        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connStr = config.GetConnectionString("DefaultConnection") ?? "Data Source=./cinema.db";

        var options = new DbContextOptionsBuilder<CinemaDbContext>()
            .UseSqlite(connStr)
            .Options;

        return new CinemaDbContext(options);
    }
}
