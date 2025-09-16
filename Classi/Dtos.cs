namespace cinema_ITS.Classi
{
    // DTO per compatibilità con il tuo JS: es. "durataMin", "prezzo", ecc.
    public class ProiezioneDto
    {
        public string? Titolo { get; set; }
        public int? DurataMin { get; set; }           // frontend può inviare "durataMin"
        public string? Genere { get; set; }
        public string? Nazionalita { get; set; }
        public string? Lingua { get; set; }
        public string? Descrizione { get; set; }
        public string? Sala { get; set; }
        public DateTime? OrarioInizio { get; set; }

        // opzionali dal frontend, li accettiamo ma non li mappiamo sul dominio
        public int? PostiTotali { get; set; }
        public decimal? Prezzo { get; set; }
    }

    public static class DtoMap
    {
        public static Proiezione ApplyTo(this ProiezioneDto dto, Proiezione target)
        {
            if (dto.Titolo != null) target.Titolo = dto.Titolo;
            if (dto.DurataMin != null) target.DurataMinuti = dto.DurataMin.Value;
            if (dto.Genere != null) target.Genere = dto.Genere;
            if (dto.Nazionalita != null) target.Nazionalita = dto.Nazionalita;
            if (dto.Lingua != null) target.Lingua = dto.Lingua;
            if (dto.Descrizione != null) target.Descrizione = dto.Descrizione;
            if (dto.Sala != null) target.Sala = dto.Sala;
            if (dto.OrarioInizio != null) target.OrarioInizio = dto.OrarioInizio.Value;
            return target;
        }
    }

    public class AcquistoBigliettoDto
    {
        public int ProiezioneId { get; set; }
        public string Fila { get; set; } = "A";
        public int NumeroPosto { get; set; }
        public decimal Costo { get; set; }
    }
}
