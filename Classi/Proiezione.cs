namespace cinema_ITS.Classi
{
    public class Proiezione
    {
        public int Id { get; set; }
        public string Titolo { get; set; } = string.Empty;
        public int DurataMinuti { get; set; }
        public string Genere { get; set; } = string.Empty;
        public string? Nazionalita { get; set; }
        public string? Lingua { get; set; }
        public string? Descrizione { get; set; }
        public string Sala { get; set; } = "Sala 1";
        public DateTime OrarioInizio { get; set; }

        // 🔹 Campi nuovi
        public int PostiTotali { get; set; } = 100;
        public decimal Prezzo { get; set; } = 0;

        public ICollection<Biglietto> Biglietti { get; set; } = new List<Biglietto>();
    }
}

