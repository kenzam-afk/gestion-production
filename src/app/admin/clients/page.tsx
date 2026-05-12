"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, X, Building2, User, RefreshCw, Search } from "lucide-react";

interface Client {
  id: number; nom: string; prenom: string; email: string;
  telephone: string; adresse: string; type_client: string; titre: string;
}

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s;box-shadow:0 2px 8px rgba(26,86,219,.25)}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-danger:hover{background:#fee2e2}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.overlay{position:fixed;inset:0;background:rgba(8,15,30,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:fadeIn .2s}
.modal{background:white;border-radius:18px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:28px;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:slideUp .2s}
.close-btn{width:30px;height:30px;border-radius:8px;background:#f1f5f9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
.close-btn:hover{background:#e2e8f0}
.tr-row:hover td{background:#f8fafc}
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
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: "28px 32px", maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1a56db", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Administration</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#080f1e,#1a56db)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="white" />
            </div>
            Clients
          </h1>
          <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 3 }}>{clients.length} clients enregistrés</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchClients} className="btn-ghost">
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
          </button>
          <button onClick={openAdd} className="btn-primary"><Plus size={15} /> Ajouter</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total",       value: clients.length, color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Particuliers", value: individuel,    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
          { label: "Entreprises",  value: entreprise,    color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input className="input-field" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>{error}</div>}

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#080f1e" }}>
              {["Client", "Type", "Email", "Téléphone", "Adresse", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "#4d7aa3", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 56 }}>
                <Users size={32} style={{ display: "block", margin: "0 auto 10px", opacity: 0.2, color: "#94a3b8" }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{search ? "Aucun résultat" : "Aucun client"}</span>
              </td></tr>
            ) : filtered.map(c => {
              const isEnt     = c.type_client === "entreprise";
              const nomAff    = isEnt ? c.titre : `${c.prenom || ""} ${c.nom || ""}`.trim() || c.nom;
              return (
                <tr key={c.id} className="tr-row" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: isEnt ? "linear-gradient(135deg,#0d1f3c,#1a56db)" : "linear-gradient(135deg,#1e3a6e,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isEnt ? <Building2 size={15} color="white" /> : <User size={14} color="white" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{nomAff}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>ID #{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: isEnt ? "#eff6ff" : "#f5f3ff", color: isEnt ? "#1a56db" : "#7c3aed", border: `1px solid ${isEnt ? "#bfdbfe" : "#ddd6fe"}` }}>
                      {isEnt ? "Entreprise" : "Particulier"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#475569" }}>{c.email || "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#475569" }}>{c.telephone || "—"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 12.5, color: "#64748b", maxWidth: 180 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.adresse || "—"}</div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1a56db", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn-danger"><Trash2 size={12} /> Suppr.</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>{filtered.length} client{filtered.length > 1 ? "s" : ""}</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18, color: "#0f172a", margin: 0 }}>{editClient ? "Modifier" : "Ajouter"} un client</h2>
              <button onClick={() => setShowModal(false)} className="close-btn"><X size={15} color="#64748b" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div><label>Nom complet</label><input className="input-field" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
              <div><label>Email</label><input className="input-field" type="email" placeholder="client@exemple.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label>Téléphone</label><input className="input-field" type="tel" placeholder="0555 123 456" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
              <div><label>Adresse</label><textarea className="input-field" placeholder="Adresse complète" rows={2} value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value } as any)} /></div>
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