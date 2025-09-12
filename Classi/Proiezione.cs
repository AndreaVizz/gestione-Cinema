namespace cinema_ITS.Classi
{
    public class Proiezione
    {
        public int Id { get; set; }
        public string Titolo { get; set; } = null!;
        public int DurataMin { get; set; } = 0;
        public string Genere { get; set; } = string.Empty;
        public string Nazionalita { get; set; } = string.Empty;
        public string Lingua { get; set; } = string.Empty;
        public string Descrizione { get; set; } = string.Empty;
        public string Sala { get; set; } = string.Empty;
        public DateTime OrarioInizio { get; set; }
        public int PostiTotali { get; set; } = 100;
        public int PostiOccupati { get; set; } = 0;
        public decimal Prezzo { get; set; } = 8.50m;
    }
}
