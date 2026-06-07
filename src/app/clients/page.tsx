"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, X, Building2, User, RefreshCw, Search } from "lucide-react";

interface Client {
  id: number; nom: string; prenom: string; email: string;
  telephone: string; adresse: string; type_client: string; titre: string;
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 2px 12px rgba(124,58,237,.35)}
.btn-primary:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.inp{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.inp:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.inp::placeholder{color:var(--text-muted)}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-surface) !important}
.overlay{position:fixed;inset:0;background:rgba(4,4,20,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .2s}
label{font-size:11.5px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;display:block;letter-spacing:.02em}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function Clients() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [filtered, setFiltered]   = useState<Client[]>([]);
  const [search, setSearch]       = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", adresse: "" });

  async function fetchClients() {
    setLoading(true);
    try {
      setError("");
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (!res.ok) { setClients([]); setFiltered([]); setError(data?.error || "Impossible de charger"); return; }
      const arr = Array.isArray(data) ? data : [];
      setClients(arr); setFiltered(arr);
    } catch { setClients([]); setFiltered([]); setError("Erreur réseau"); }
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clients.filter(c => `${c.prenom} ${c.nom} ${c.titre} ${c.email} ${c.telephone}`.toLowerCase().includes(q)));
  }, [search, clients]);

  function openAdd() { setEditClient(null); setForm({ nom: "", email: "", telephone: "", adresse: "" }); setShowModal(true); }
  function openEdit(c: Client) { setEditClient(c); setForm({ nom: c.nom, email: c.email, telephone: c.telephone, adresse: c.adresse }); setShowModal(true); }

  async function handleSubmit() {
    const url = editClient ? `/api/clients/${editClient.id}` : "/api/clients";
    await fetch(url, { method: editClient ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false); fetchClients();
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
  }

  const individuel = clients.filter(c => c.type_client !== "entreprise").length;
  const entreprise = clients.filter(c => c.type_client === "entreprise").length;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: "28px 32px", maxWidth: 1400 }}>
      <style>{DS}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--violet)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Administration</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(124,58,237,.4)" }}>
              <Users size={18} color="white" />
            </div>
            Clients
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{clients.length} clients enregistrés</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchClients} className="btn-ghost">
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
          </button>
          <button onClick={openAdd} className="btn-primary"><Plus size={15} /> Ajouter</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total",        value: clients.length, color: "#a855f7", bg: "rgba(168,85,247,.1)", border: "rgba(168,85,247,.2)" },
          { label: "Particuliers", value: individuel,     color: "#06b6d4", bg: "rgba(6,182,212,.1)",  border: "rgba(6,182,212,.2)"  },
          { label: "Entreprises",  value: entreprise,     color: "#10b981", bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.2)" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input className="inp" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444" }}>{error}</div>}

      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
              {["Client", "Type", "Email", "Téléphone", "Adresse", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 56 }}>
                <Users size={32} style={{ display: "block", margin: "0 auto 10px", opacity: 0.2, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{search ? "Aucun résultat" : "Aucun client"}</span>
              </td></tr>
            ) : filtered.map(c => {
              const isEnt  = c.type_client === "entreprise";
              const nomAff = isEnt ? c.titre : `${c.prenom || ""} ${c.nom || ""}`.trim() || c.nom;
              return (
                <tr key={c.id} className="tr-row">
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: isEnt ? "rgba(6,182,212,.12)" : "rgba(168,85,247,.12)", border: `1px solid ${isEnt ? "rgba(6,182,212,.25)" : "rgba(168,85,247,.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isEnt ? <Building2 size={15} color="#06b6d4" /> : <User size={14} color="#a855f7" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{nomAff}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID #{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: isEnt ? "rgba(6,182,212,.1)" : "rgba(168,85,247,.1)", color: isEnt ? "#06b6d4" : "#a855f7", border: `1px solid ${isEnt ? "rgba(6,182,212,.25)" : "rgba(168,85,247,.25)"}` }}>
                      {isEnt ? "Entreprise" : "Particulier"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{c.email || "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{c.telephone || "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 180 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.adresse || "—"}</div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.25)", color: "#a855f7", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn-danger"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} client{filtered.length > 1 ? "s" : ""}</div>}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)", margin: 0 }}>{editClient ? "Modifier" : "Ajouter"} un client</h2>
              <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><X size={14} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div><label>Nom complet</label><input className="inp" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
              <div><label>Email</label><input className="inp" type="email" placeholder="client@exemple.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label>Téléphone</label><input className="inp" type="tel" placeholder="0555 123 456" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
              <div><label>Adresse</label><textarea className="inp" placeholder="Adresse complète" rows={2} value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value } as any)} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Annuler</button>
              <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>{editClient ? "Enregistrer" : "Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}