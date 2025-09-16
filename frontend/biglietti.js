// ===== API helper =====
async function api(path, opts = {}) {
  const res = await fetch(`http://localhost:5074${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function fmtDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt || "-";
  }
}

function fmtMoney(val) {
  if (val == null || isNaN(val)) return "-";
  return Number(val).toFixed(2) + " €";
}

// ===== Avvio =====
document.addEventListener("DOMContentLoaded", async () => {
  // Fila A–L
  const FILA = "ABCDEFGHIJKL".split("");
  const selFila = document.querySelector("#a-fila");
  selFila.innerHTML = '<option value="">—</option>';
  FILA.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    selFila.appendChild(opt);
  });

  await loadProiezioniSelect();

  // 🔹 Se arrivo da proiezioni.html con ?proiezioneId=#
  const pid = new URLSearchParams(location.search).get("proiezioneId");
  if (pid) document.querySelector("#a-proiezione").value = pid;

  await loadBiglietti();

  document.querySelector("#btn-aggiorna").addEventListener("click", loadBiglietti);
  document.querySelector("#btn-reset-a").addEventListener("click", () =>
    document.querySelector("#form-acquisto").reset()
  );
  document.querySelector("#form-acquisto").addEventListener("submit", onAcquista);
});

// ===== Carica combo Proiezioni =====
async function loadProiezioniSelect() {
  try {
    const list = await api("/proiezioni");
    const sel = document.querySelector("#a-proiezione");
    sel.innerHTML = '<option value="">—</option>';
    list.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.titolo} — ${fmtDate(p.orarioInizio)} — ${p.sala}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("Errore caricamento proiezioni:", err);
  }
}

// ===== Acquisto biglietto =====
async function onAcquista(ev) {
  ev.preventDefault();
  const proiezioneId = parseInt(document.querySelector("#a-proiezione").value);
  const fila = document.querySelector("#a-fila").value.trim();
  const numeroPosto = parseInt(document.querySelector("#a-numero").value || "0", 10);

  if (!proiezioneId || !fila || numeroPosto <= 0) {
    alert("Compila proiezione, fila e numero");
    return;
  }

  try {
    await api("/biglietti/acquista", {
      method: "POST",
      body: JSON.stringify({ proiezioneId, fila, numeroPosto })
    });
    alert("Biglietto acquistato con successo!");
    document.querySelector("#form-acquisto").reset();
    await loadBiglietti();
  } catch (err) {
    console.error("Errore durante l'acquisto:", err);
    alert(err.message || "Errore durante l'acquisto!");
  }
}

// ===== Carica elenco biglietti =====
async function loadBiglietti() {
  try {
    const data = await api("/biglietti");
    renderBiglietti(data);
  } catch (err) {
    console.error("Errore caricamento biglietti:", err);
  }
}

const tbody = document.querySelector("#tab-biglietti tbody");

function renderBiglietti(list) {
  tbody.innerHTML = "";
  list.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${b.codice}</code></td>
      <td>${b.titoloProiezione ?? "(eliminata)"}</td>
      <td>${b.sala ?? "-"}</td>
      <td>${b.orarioInizio ? fmtDate(b.orarioInizio) : "-"}</td>
      <td>Fila ${b.fila} • ${b.numeroPosto ?? "-"}</td>
      <td>${fmtMoney(b.costo)}</td>
      <td>${fmtDate(b.orarioAcquisto)}</td>
      <td><button class="btn danger" data-id="${b.id}">Cancella</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Cancellazione biglietto =====
tbody.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button[data-id]");
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  if (!confirm("Vuoi davvero cancellare questo biglietto?")) return;

  try {
    await api(`/biglietti/${id}`, { method: "DELETE" });
    alert("Biglietto cancellato");
    await loadBiglietti();
  } catch (err) {
    console.error("Errore cancellazione biglietto:", err);
    alert("Errore durante la cancellazione");
  }
});
