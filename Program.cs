using cinema_ITS.Classi;

var builder = WebApplication.CreateBuilder(args);

// CORS come fatto in classe
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors("AllowAll");

// ====== DATI IN-MEMORY ======
List<Proiezione> proiezioni = new()
{
    new Proiezione{
        Id = 1, Titolo = "Inception", DurataMin = 148, Genere = "Sci-Fi",
        Nazionalita = "USA", Lingua = "EN", Descrizione = "Sogni nel sogno",
        Sala = "Sala 1", OrarioInizio = DateTime.Today.AddHours(21),
        PostiTotali = 120, Prezzo = 9.50m
    },
    new Proiezione{
        Id = 2, Titolo = "La vita ии bella", DurataMin = 116, Genere = "Drammatico",
        Nazionalita = "ITA", Lingua = "IT", Descrizione = "Storia toccante",
        Sala = "Sala 2", OrarioInizio = DateTime.Today.AddDays(1).AddHours(18),
        PostiTotali = 80, Prezzo = 7.50m
    }
};
int NextId() => proiezioni.Count == 0 ? 1 : proiezioni.Max(p => p.Id) + 1;

// ====== ENDPOINTS PROIEZIONI ======
app.MapGet("/proiezioni", (string? genere, string? lingua) =>
{
    IEnumerable<Proiezione> q = proiezioni;
    if (!string.IsNullOrWhiteSpace(genere))
        q = q.Where(p => p.Genere.Equals(genere, StringComparison.OrdinalIgnoreCase));
    if (!string.IsNullOrWhiteSpace(lingua))
        q = q.Where(p => p.Lingua.Equals(lingua, StringComparison.OrdinalIgnoreCase));
    return Results.Ok(q.OrderBy(p => p.OrarioInizio));
});

app.MapGet("/proiezioni/{id:int}", (int id) =>
{
    var p = proiezioni.FirstOrDefault(p => p.Id == id);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

app.MapPost("/proiezioni", (Proiezione dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Titolo))
        return Results.BadRequest("Titolo obbligatorio");
    if (dto.OrarioInizio == default)
        return Results.BadRequest("OrarioInizio obbligatorio");

    dto.Id = NextId();
    if (dto.PostiTotali <= 0) dto.PostiTotali = 100;
    if (dto.Prezzo <= 0) dto.Prezzo = 8.50m;

    proiezioni.Add(dto);
    return Results.Created($"/proiezioni/{dto.Id}", dto);
});

app.MapPut("/proiezioni/{id:int}", (int id, Proiezione patch) =>
{
    var p = proiezioni.FirstOrDefault(p => p.Id == id);
    if (p is null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(patch.Titolo)) p.Titolo = patch.Titolo;
    if (patch.DurataMin > 0) p.DurataMin = patch.DurataMin;
    if (!string.IsNullOrWhiteSpace(patch.Genere)) p.Genere = patch.Genere;
    if (!string.IsNullOrWhiteSpace(patch.Nazionalita)) p.Nazionalita = patch.Nazionalita;
    if (!string.IsNullOrWhiteSpace(patch.Lingua)) p.Lingua = patch.Lingua;
    if (!string.IsNullOrWhiteSpace(patch.Descrizione)) p.Descrizione = patch.Descrizione;
    if (!string.IsNullOrWhiteSpace(patch.Sala)) p.Sala = patch.Sala;
    if (patch.OrarioInizio != default) p.OrarioInizio = patch.OrarioInizio;
    if (patch.Prezzo > 0) p.Prezzo = patch.Prezzo;
    if (patch.PostiTotali > 0) p.PostiTotali = Math.Max(patch.PostiTotali, p.PostiOccupati);

    return Results.Ok(p);
});

app.MapDelete("/proiezioni/{id:int}", (int id) =>
{
    var p = proiezioni.FirstOrDefault(p => p.Id == id);
    if (p is null) return Results.NotFound();
    proiezioni.Remove(p);
    return Results.NoContent();
});

app.Run();
