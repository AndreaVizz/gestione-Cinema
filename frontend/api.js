// api.js (globale, no import/export)
const BASE_URL = "http://localhost:5074";

async function http(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();
  if (!res.ok) {
    throw new Error(typeof body === "string" ? body : (body?.title || body?.error || res.statusText));
  }
  return body;
}

// ===== API =====
const ProiezioniApi = {
  list: () => http("/proiezioni"),
  get: (id) => http(`/proiezioni/${id}`),
  create: (p) => http("/proiezioni", { method: "POST", body: JSON.stringify(p) }),
  update: (id, dto) => http(`/proiezioni/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  remove: (id) => http(`/proiezioni/${id}`, { method: "DELETE" }),
};

const BigliettiApi = {
  listAll: () => http("/biglietti"),
  listByProiezione: (id) => http(`/proiezioni/${id}/biglietti`),
  create: (b) => http("/biglietti", { method: "POST", body: JSON.stringify(b) }),
  acquista: (dto) => http("/biglietti/acquista", { method: "POST", body: JSON.stringify(dto) }),
  get: (id) => http(`/biglietti/${id}`),
  remove: (id) => http(`/biglietti/${id}`, { method: "DELETE" }),
};

// Espongo in globale, così altri file possono leggerle
window.CinemaApi = { ProiezioniApi, BigliettiApi };
