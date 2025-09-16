namespace cinema_ITS.Classi;

public class Biglietto
{
    public int Id { get; set; }
    public string Codice { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime OrarioAcquisto { get; set; } = DateTime.UtcNow;

    public string Fila { get; set; } = "A";
    public int NumeroPosto { get; set; }
    public decimal Costo { get; set; }

    public int ProiezioneId { get; set; }
    public Proiezione? Proiezione { get; set; }
}
