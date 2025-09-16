using cinema_ITS.Classi;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("frontend", p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .SetIsOriginAllowed(_ => true)
        .AllowCredentials());
});

// DbContext SQLite
var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<CinemaDbContext>(opt => opt.UseSqlite(connStr));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("frontend");

// Seed iniziale
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
    db.Database.Migrate();

    if (!db.Proiezioni.Any())
    {
        db.Proiezioni.AddRange(
            new Proiezione
            {
                Titolo = "Inception",
                DurataMinuti = 148,
                Genere = "Sci-Fi",
                Nazionalita = "USA",
                Lingua = "IT",
                Descrizione = "Sogni dentro sogni.",
                Sala = "Sala 1",
                OrarioInizio = DateTime.Today.AddHours(21),
                PostiTotali = 120,
                Prezzo = 7.50m
            },
            new Proiezione
            {
                Titolo = "Your Name",
                DurataMinuti = 106,
                Genere = "Anime",
                Nazionalita = "JP",
                Lingua = "IT",
                Descrizione = "Destini che si incrociano.",
                Sala = "Sala 2",
                OrarioInizio = DateTime.Today.AddHours(18),
                PostiTotali = 100,
                Prezzo = 6.50m
            }
        );
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ====== ENDPOINTS ======

// Health
app.MapGet("/health", () => Results.Ok(new { ok = true }));

// PROIEZIONI
app.MapGet("/proiezioni", async (CinemaDbContext db) =>
    await db.Proiezioni.AsNoTracking().OrderBy(p => p.OrarioInizio).ToListAsync());

app.MapGet("/proiezioni/{id:int}", async (int id, CinemaDbContext db) =>
{
    var p = await db.Proiezioni.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

app.MapPost("/proiezioni", async (Proiezione p, CinemaDbContext db) =>
{
    db.Proiezioni.Add(p);
    await db.SaveChangesAsync();
    return Results.Created($"/proiezioni/{p.Id}", p);
});

app.MapPut("/proiezioni/{id:int}", async (int id, ProiezioneDto dto, CinemaDbContext db) =>
{
    var p = await db.Proiezioni.FindAsync(id);
    if (p is null) return Results.NotFound();
    dto.ApplyTo(p);
    await db.SaveChangesAsync();
    return Results.Ok(p);
});

app.MapDelete("/proiezioni/{id:int}", async (int id, CinemaDbContext db) =>
{
    var p = await db.Proiezioni.FindAsync(id);
    if (p is null) return Results.NotFound();
    db.Proiezioni.Remove(p);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// BIGLIETTI
app.MapGet("/biglietti", async (CinemaDbContext db) =>
    await db.Biglietti
        .Include(b => b.Proiezione)
        .AsNoTracking()
        .OrderByDescending(b => b.OrarioAcquisto)
        .Select(b => new {
            b.Id,
            b.Codice,
            b.OrarioAcquisto,
            b.Fila,
            b.NumeroPosto,
            b.Costo,
            ProiezioneId = b.ProiezioneId,
            TitoloProiezione = b.Proiezione != null ? b.Proiezione.Titolo : "(eliminata)",
            Sala = b.Proiezione != null ? b.Proiezione.Sala : "-",
            OrarioInizio = b.Proiezione != null ? b.Proiezione.OrarioInizio : (DateTime?)null
        })
        .ToListAsync());

app.MapGet("/proiezioni/{id:int}/biglietti", async (int id, CinemaDbContext db) =>
    await db.Biglietti
        .Include(b => b.Proiezione)
        .AsNoTracking()
        .Where(b => b.ProiezioneId == id)
        .Select(b => new {
            b.Id,
            b.Codice,
            b.OrarioAcquisto,
            b.Fila,
            b.NumeroPosto,
            b.Costo,
            ProiezioneId = b.ProiezioneId,
            TitoloProiezione = b.Proiezione != null ? b.Proiezione.Titolo : "(eliminata)",
            Sala = b.Proiezione != null ? b.Proiezione.Sala : "-",
            OrarioInizio = b.Proiezione != null ? b.Proiezione.OrarioInizio : (DateTime?)null
        })
        .ToListAsync());

app.MapPost("/biglietti", async (Biglietto b, CinemaDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(b.Codice))
        b.Codice = Guid.NewGuid().ToString("N");
    b.OrarioAcquisto = DateTime.UtcNow;

    var proiezione = await db.Proiezioni.FindAsync(b.ProiezioneId);
    if (proiezione is null) return Results.BadRequest("Proiezione inesistente.");

    var occupied = await db.Biglietti.AnyAsync(x =>
        x.ProiezioneId == b.ProiezioneId &&
        x.Fila == b.Fila && x.NumeroPosto == b.NumeroPosto);
    if (occupied) return Results.Conflict("Posto già occupato.");

    b.Costo = proiezione.Prezzo;

    db.Biglietti.Add(b);
    await db.SaveChangesAsync();
    return Results.Created($"/biglietti/{b.Id}", b);
});

app.MapPost("/biglietti/acquista", async (AcquistoBigliettoDto dto, CinemaDbContext db) =>
{
    var proiezione = await db.Proiezioni.FindAsync(dto.ProiezioneId);
    if (proiezione is null) return Results.BadRequest("Proiezione inesistente.");

    var occupied = await db.Biglietti.AnyAsync(x =>
        x.ProiezioneId == dto.ProiezioneId &&
        x.Fila == dto.Fila && x.NumeroPosto == dto.NumeroPosto);
    if (occupied) return Results.Conflict("Posto già occupato.");

    var b = new Biglietto
    {
        ProiezioneId = dto.ProiezioneId,
        Fila = dto.Fila,
        NumeroPosto = dto.NumeroPosto,
        Costo = proiezione.Prezzo,
        Codice = Guid.NewGuid().ToString("N"),
        OrarioAcquisto = DateTime.UtcNow
    };

    db.Biglietti.Add(b);
    await db.SaveChangesAsync();
    return Results.Created($"/biglietti/{b.Id}", b);
});

app.MapGet("/biglietti/{id:int}", async (int id, CinemaDbContext db) =>
{
    var t = await db.Biglietti
        .Include(b => b.Proiezione)
        .AsNoTracking()
        .FirstOrDefaultAsync(b => b.Id == id);

    return t is null ? Results.NotFound() : Results.Ok(new
    {
        t.Id,
        t.Codice,
        t.OrarioAcquisto,
        t.Fila,
        t.NumeroPosto,
        t.Costo,
        ProiezioneId = t.ProiezioneId,
        TitoloProiezione = t.Proiezione?.Titolo,
        Sala = t.Proiezione?.Sala,
        OrarioInizio = t.Proiezione?.OrarioInizio
    });
});

app.MapDelete("/biglietti/{id:int}", async (int id, CinemaDbContext db) =>
{
    var t = await db.Biglietti.FindAsync(id);
    if (t is null) return Results.NotFound();
    db.Biglietti.Remove(t);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();
