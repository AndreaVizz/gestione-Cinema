(() => {
  'use strict';
  if (window.__bigliettiLoaded) return;
  window.__bigliettiLoaded = true;

  // alias per evitare conflitti con i const globali in api.js
  const { ProiezioniApi: PApi, BigliettiApi: BApi, utils } = window.CinemaApi;
  const { $, $$, ready, toast, fmtMoney, fmtDate, populateSelect } = utils;

  ready(async function init() {
    // Fila A–L
    const FILA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, 12)
                  .split('').map(x => ({ value: x, label: x }));
    populateSelect('#a-fila', FILA, { includeBlank: true, blankLabel: '—' });

    await loadProiezioniSelect();
    await loadBiglietti();

    $('#btn-aggiorna').addEventListener('click', loadBiglietti);
    $('#btn-reset-a').addEventListener('click', () => $('#form-acquisto').reset());
    $('#form-acquisto').addEventListener('submit', onAcquista);

    // se arrivo da proiezioni.html?proiezioneId=#
    const pid = new URLSearchParams(location.search).get('proiezioneId');
    if (pid) $('#a-proiezione').value = String(pid);
  });

  async function loadProiezioniSelect() {
    try {
      const list = await PApi.list();
      const opts = list.map(p => ({
        value: String(p.id),
        label: `${p.titolo} — ${fmtDate(p.orarioInizio)} — ${p.sala}`
      }));
      populateSelect('#a-proiezione', opts, {
        includeBlank: true, blankLabel: '— Seleziona —'
      });
    } catch (e) {
      toast(`Errore caricamento proiezioni: ${e.message}`, 'err');
    }
  }

  async function onAcquista(ev) {
    ev.preventDefault();
    const proiezioneId = +$('#a-proiezione').value;
    const fila = $('#a-fila').value.trim();
    const numero = parseInt($('#a-numero').value || '0', 10);

    if (!proiezioneId || !fila || numero <= 0) {
      toast('Compila proiezione, fila e numero', 'err');
      return;
    }
    try {
      await BApi.acquista({ proiezioneId, fila, numero });
      toast('Acquisto completato');
      $('#form-acquisto').reset();
      await loadBiglietti();
    } catch (e) {
      toast(e.message || 'Acquisto non riuscito (409 se posto occupato)', 'err');
    }
  }

  async function loadBiglietti() {
    try {
      const data = await BApi.list();
      renderBiglietti(data);
    } catch (e) {
      toast(`Errore biglietti: ${e.message}`, 'err');
    }
  }

  const tbody = $('#tab-biglietti tbody');
  function renderBiglietti(list) {
    tbody.innerHTML = '';
    list.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${b.codice}</code></td>
        <td>${b.titoloProiezione ?? b.proiezioneTitolo ?? '(eliminata)'}</td>
        <td>${b.sala ?? '-'}</td>
        <td>${fmtDate(b.orarioInizio)}</td>
        <td>Fila ${b.fila} • ${b.numero}</td>
        <td>${fmtMoney(b.costo)}</td>
        <td>${fmtDate(b.orarioAcquisto)}</td>
        <td><button class="btn danger" data-id="${b.id}">Cancella</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-id]');
    if (!btn) return;
    const id = +btn.dataset.id;
    if (!confirm('Cancellare questo biglietto?')) return;
    try {
      await BApi.remove(id);
      toast('Biglietto cancellato');
      await loadBiglietti();
    } catch (e) {
      toast(`Errore cancellazione: ${e.message}`, 'err');
    }
  });
})();
