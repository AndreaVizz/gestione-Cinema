using Microsoft.EntityFrameworkCore;

namespace cinema_ITS.Classi;

public class CinemaDbContext : DbContext
{
    public CinemaDbContext(DbContextOptions<CinemaDbContext> options) : base(options) { }

    public DbSet<Proiezione> Proiezioni => Set<Proiezione>();
    public DbSet<Biglietto> Biglietti => Set<Biglietto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Proiezione>(e =>
        {
            e.ToTable("Proiezioni");
            e.HasKey(p => p.Id);
            e.Property(p => p.Titolo).IsRequired().HasMaxLength(200);
            e.Property(p => p.DurataMinuti).IsRequired();
            e.Property(p => p.Genere).IsRequired().HasMaxLength(60);
            e.Property(p => p.Nazionalita).HasMaxLength(60);
            e.Property(p => p.Lingua).HasMaxLength(60);
            e.Property(p => p.Descrizione).HasMaxLength(2000);
            e.Property(p => p.Sala).IsRequired().HasMaxLength(30);
            e.Property(p => p.OrarioInizio).IsRequired();

            e.HasMany(p => p.Biglietti)
             .WithOne(b => b.Proiezione!)
             .HasForeignKey(b => b.ProiezioneId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Biglietto>(e =>
        {
            e.ToTable("Biglietti");
            e.HasKey(b => b.Id);
            e.Property(b => b.Codice).IsRequired().HasMaxLength(40);
            e.HasIndex(b => b.Codice).IsUnique();
            e.Property(b => b.OrarioAcquisto).IsRequired();
            e.Property(b => b.Fila).IsRequired().HasMaxLength(5);
            e.Property(b => b.NumeroPosto).IsRequired();
            e.Property(b => b.Costo).HasColumnType("decimal(10,2)");
        });
    }
}

