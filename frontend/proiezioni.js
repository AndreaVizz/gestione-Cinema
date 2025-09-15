(() => {
  'use strict';
  if (window.__proiezioniLoaded) return;
  window.__proiezioniLoaded = true;

  // NOTA: alias per evitare il conflitto con il const globale in api.js
  const { ProiezioniApi: PApi, utils } = window.CinemaApi;
  const {
    $, toast, fmtMoney, fmtDate, toLocalInputValue, populateSelect, ready,
    GENERI, LINGUE, NAZIONALITA, SALE
  } = utils;

  ready(async function init() {
    // Select preimpostati
    populateSelect('#genere', GENERI);
    populateSelect('#lingua', LINGUE);
    populateSelect('#nazionalita', NAZIONALITA);
    populateSelect('#sala', SALE);
    populateSelect('#f-genere', GENERI, { includeBlank: true, blankLabel: 'Tutti i generi' });
    populateSelect('#f-lingua', LINGUE, { includeBlank: true, blankLabel: 'Tutte le lingue' });

    // Eventi
    $('#btn-reset-form').addEventListener('click', resetForm);
    $('#btn-filtra').addEventListener('click', () => loadProiezioni(readFiltri()));
    $('#btn-reset-filtri').addEventListener('click', () => {
      populateSelect('#f-genere', GENERI, { includeBlank: true, blankLabel: 'Tutti i generi' });
      populateSelect('#f-lingua', LINGUE, { includeBlank: true, blankLabel: 'Tutte le lingue' });
      loadProiezioni();
    });
    $('#form-proiezione').addEventListener('submit', onSubmit);

    loadProiezioni();
  });

  function readFiltri() {
    const f = {};
    const g = $('#f-genere').value;
    const l = $('#f-lingua').value;
    if (g) f.genere = g;
    if (l) f.lingua = l;
    return f;
  }

  async function loadProiezioni(params = {}) {
    try {
      const data = await PApi.list(params);
      renderProiezioni(data);
    } catch (e) { toast(`Errore proiezioni: ${e.message}`, 'err'); }
  }

  const tbody = document.querySelector('#tab-proiezioni tbody');
  function renderProiezioni(list) {
    tbody.innerHTML = '';
    list.forEach(p => {
      const disp = (p.postiTotali ?? 0) - (p.postiOccupati ?? 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.titolo}</td>
        <td><span class="badge">${p.genere || '—'}</span></td>
        <td><span class="badge">${p.lingua || '—'}</span></td>
        <td>${p.sala}</td>
        <td>${fmtDate(p.orarioInizio)}</td>
        <td>${p.durataMin || '—'}</td>
        <td>${fmtMoney(p.prezzo)}</td>
        <td>${disp}</td>
        <td>
          <a class="btn primary" href="biglietti.html?proiezioneId=${p.id}">Acquista</a>
          <button class="btn" data-act="edit" data-id="${p.id}">Modifica</button>
          <button class="btn danger" data-act="del" data-id="${p.id}">Elimina</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const id = +btn.dataset.id;
    const act = btn.dataset.act;

    if (act === 'edit') {
      try {
        const p = await PApi.get(id);
        fillForm(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) { toast(`Caricamento proiezione fallito: ${e.message}`, 'err'); }
      return;
    }
    if (act === 'del') {
      if (!confirm('Eliminare questa proiezione?')) return;
      try {
        await PApi.remove(id);
        toast('Proiezione eliminata');
        loadProiezioni(readFiltri());
      } catch (e) { toast(e.message || 'Errore eliminazione (409 se ha biglietti acquistati)', 'err'); }
    }
  });

  function resetForm() {
    $('#form-proiezione').reset();
    $('#proiezione-id').value = '';
    $('#form-title').textContent = 'Inserisci/Modifica Proiezione';
  }
  function fillForm(p) {
    $('#proiezione-id').value   = p.id;
    $('#titolo').value          = p.titolo || '';
    $('#durataMin').value       = p.durataMin ?? '';
    $('#genere').value          = p.genere || '';
    $('#nazionalita').value     = p.nazionalita || '';
    $('#lingua').value          = p.lingua || '';
    $('#descrizione').value     = p.descrizione || '';
    $('#sala').value            = p.sala || '';
    $('#orarioInizio').value    = p.orarioInizio ? toLocalInputValue(p.orarioInizio) : '';
    $('#postiTotali').value     = p.postiTotali ?? 100;
    $('#prezzo').value          = p.prezzo ?? 8.5;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const id   = $('#proiezione-id').value;

    const titolo = $('#titolo').value.trim();
    const genere = $('#genere').value;
    const naz    = $('#nazionalita').value;
    const lin    = $('#lingua').value;
    const descr  = $('#descrizione').value.trim();
    const sala   = $('#sala').value;
    const orario = $('#orarioInizio').value;

    if (!titolo || !genere || !naz || !lin || !descr || !sala || !orario) {
      toast('Compila tutti i campi obbligatori (*)', 'err'); return;
    }

    const dto = {
      titolo,
      durataMin: +($('#durataMin').value || 0),
      genere,
      nazionalita: naz,
      lingua: lin,
      descrizione: descr,
      sala,
      orarioInizio: new Date(orario).toISOString(),
      postiTotali: +($('#postiTotali').value || 100),
      prezzo: parseFloat($('#prezzo').value || '8.50')
    };

    try {
      if (id) { await PApi.update(id, dto); toast('Proiezione aggiornata'); }
      else    { await PApi.create(dto);     toast('Proiezione creata');    }
      resetForm();
      loadProiezioni(readFiltri());
    } catch (e) { toast(`Salvataggio fallito: ${e.message}`, 'err'); }
  }
})();
