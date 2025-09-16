// ===== API helper =====
async function api(path, opts = {}) {
  const res = await fetch(`http://localhost:5074${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ===== Caricamento dropdown =====
function populateSelect(id, values) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">—</option>';
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Lista generi ampliata
  const generi = [
    "Azione", "Avventura", "Animazione", "Anime", "Biografico",
    "Commedia", "Crime", "Documentario", "Drammatico", "Famiglia",
    "Fantasy", "Guerra", "Horror", "Musicale", "Mistero",
    "Romantico", "Sci-Fi", "Sportivo", "Storico", "Thriller",
    "Western"
  ];

  populateSelect("genere", generi);
  populateSelect("nazionalita", ["ITA", "USA", "JP", "UK", "FR", "DE", "ES", "KR", "CN"]);
  populateSelect("lingua", ["IT", "EN", "JP", "FR", "DE", "ES", "ZH", "KO"]);
  populateSelect("sala", ["Sala 1", "Sala 2", "Sala 3"]);

  populateSelect("filtro-genere", generi);
  populateSelect("filtro-lingua", ["IT", "EN", "JP", "FR", "DE", "ES", "ZH", "KO"]);

  // Carica tutto inizialmente
  loadProiezioni();

  // Gestione pulsanti filtri
  document.getElementById("btn-filtra").addEventListener("click", () => {
    const g = document.getElementById("filtro-genere").value;
    const l = document.getElementById("filtro-lingua").value;
    loadProiezioni({ genere: g, lingua: l });
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    document.getElementById("filtro-genere").value = "";
    document.getElementById("filtro-lingua").value = "";
    loadProiezioni();
  });
});

// ===== Caricamento proiezioni =====
async function loadProiezioni(filtro = {}) {
  const tbody = document.querySelector("#proiezioni-tbody");
  tbody.innerHTML = "";

  try {
    let proiezioni = await api("/proiezioni");

    console.log("Dati ricevuti dal backend:", proiezioni);

    // Applica filtro lato client
    if (filtro.genere) {
      proiezioni = proiezioni.filter(p => p.genere === filtro.genere);
    }
    if (filtro.lingua) {
      proiezioni = proiezioni.filter(p => p.lingua === filtro.lingua);
    }

    proiezioni.forEach(p => {
      let postiDisponibili = "-";
      if (p.postiTotali !== undefined && p.biglietti) {
        postiDisponibili = p.postiTotali - p.biglietti.length;
      }

      const prezzoFormattato =
        (p.prezzo !== undefined && p.prezzo !== null)
          ? Number(p.prezzo).toFixed(2) + " €"
          : "-";

      const durataFormattata =
        (p.durataMinuti !== undefined && p.durataMinuti !== null)
          ? p.durataMinuti
          : "-";

      const tr = document.createElement("tr");
      tr.dataset.id = p.id; // 👈 serve per i pulsanti
      tr.innerHTML = `
        <td>${p.titolo}</td>
        <td>${p.genere}</td>
        <td>${p.lingua}</td>
        <td>${p.sala}</td>
        <td>${new Date(p.orarioInizio).toLocaleString()}</td>
        <td>${durataFormattata}</td>
        <td>${prezzoFormattato}</td>
        <td>${postiDisponibili}</td>
        <td class="actions">
          <button class="btn">Modifica</button>
          <button class="btn danger">Elimina</button>
          <button class="btn success">Acquista</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Errore nel caricamento proiezioni:", err);
  }
}

// ===== Salvataggio proiezione =====
const form = document.getElementById("form-proiezione");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    titolo: form.titolo.value,
    durataMinuti: parseInt(form.durataMinuti.value),
    genere: form.genere.value,
    nazionalita: form.nazionalita.value,
    lingua: form.lingua.value,
    descrizione: form.descrizione.value,
    sala: form.sala.value,
    orarioInizio: form.orarioInizio.value,
    postiTotali: parseInt(form.postiTotali.value),
    prezzo: parseFloat(form.prezzo.value)
  };

  try {
    await api("/proiezioni", {
      method: "POST",
      body: JSON.stringify(data)
    });
    form.reset();
    loadProiezioni();
  } catch (err) {
    console.error("Errore salvataggio proiezione:", err);
  }
});

// ===== Solo gestione ACQUISTA =====
document.querySelector("#proiezioni-tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("button.success");
  if (!btn) return;

  const tr = btn.closest("tr");
  const id = tr.dataset.id;

  // Reindirizza a biglietti.html con l'id della proiezione
  window.location.href = `biglietti.html?proiezioneId=${id}`;
});
