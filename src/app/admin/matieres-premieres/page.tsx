"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, X, RefreshCw, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

interface Matiere { id: number; titre: string; stock_actuel: number; unite?: string; }

const DS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-primary{display:inline-flex;align-items:center;gap:6px;background:#1a56db;color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:background .15s,transform .15s;box-shadow:0 2px 8px rgba(26,86,219,.25)}
.btn-primary:hover{background:#1648c2;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:#1a56db;color:#1a56db;background:#eff6ff}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.btn-danger:hover{background:#fee2e2}
.input-field{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:13.5px;color:#1e293b;outline:none;transition:border .15s;background:#f8fafc}
.input-field:focus{border-color:#1a56db;background:white;box-shadow:0 0 0 3px rgba(26,86,219,.08)}
label{font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:5px;display:block;letter-spacing:.02em}
.tr-row:hover td{background:#f8fafc}
.progress-track{height:5px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.progress-fill{height:100%;border-radius:3px;transition:width .5s ease}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function GestionMatieresPage() {
  const [matieres, setMatieres]   = useState<Matiere[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newM, setNewM] = useState({ titre: "", stock_actuel: 0, unite: "unités" });

  async function fetchMatieres() {
    setLoading(true);
    try {
      const res  = await fetch("/api/matieres-premieres");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setMatieres(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchMatieres(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/matieres-premieres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newM) });
      if (!res.ok) throw new Error("Erreur ajout");
      const created = await res.json();
      setMatieres(prev => [...prev, created]);
      setShowForm(false); setNewM({ titre: "", stock_actuel: 0, unite: "unités" });
    } catch (e: any) { setError(e.message); }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/matieres-premieres?id=" + id, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setMatieres(prev => prev.filter(m => m.id !== id));
    } catch (e: any) { setError(e.message); }
    finally { setDeletingId(null); }
  }

  const critique = matieres.filter(m => m.stock_actuel <= 5).length;
  const ok       = matieres.filter(m => m.stock_actuel > 5).length;
  const maxStock = Math.max(...matieres.map(m => m.stock_actuel), 1);

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", padding: "28px 32px", maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1a56db", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Approvisionnement</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#080f1e,#d97706)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} color="white" />
            </div>
            Matières Premières
          </h1>
          <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 3 }}>Suivi en temps réel de l'approvisionnement</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchMatieres} className="btn-ghost">
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={15} /> {showForm ? "Annuler" : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total composants", value: matieres.length, color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe", icon: <Layers size={16} color="#1a56db" /> },
          { label: "Stock OK",         value: ok,              color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={16} color="#059669" /> },
          { label: "Critique / Bas",   value: critique,        color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: <AlertTriangle size={16} color="#dc2626" /> },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerte critique */}
      {critique > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
            {critique} composant{critique > 1 ? "s" : ""} en stock critique — réapprovisionnement recommandé
          </span>
        </div>
      )}

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>{error}</div>}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: "#0f172a", margin: 0 }}>Nouvelle matière première</h2>
            <button type="button" onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="#64748b" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div><label>Nom *</label><input className="input-field" type="text" required placeholder="Ex: Bois de chêne" value={newM.titre} onChange={e => setNewM({ ...newM, titre: e.target.value })} /></div>
            <div><label>Stock initial</label><input className="input-field" type="number" min={0} value={newM.stock_actuel} onChange={e => setNewM({ ...newM, stock_actuel: parseInt(e.target.value) || 0 })} /></div>
            <div><label>Unité</label><input className="input-field" placeholder="kg, L, m², unités..." value={newM.unite} onChange={e => setNewM({ ...newM, unite: e.target.value })} /></div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button type="submit" className="btn-primary">Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#080f1e" }}>
              {["Composant", "Quantité en stock", "Niveau", "État", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "#4d7aa3", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Chargement...</td></tr>
            ) : matieres.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 56 }}>
                <Layers size={32} style={{ display: "block", margin: "0 auto 10px", opacity: 0.2, color: "#94a3b8" }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Aucune matière première</span>
              </td></tr>
            ) : matieres.map(m => {
              const pct     = Math.min((m.stock_actuel / maxStock) * 100, 100);
              const isOk    = m.stock_actuel > 5;
              const isMoyen = m.stock_actuel > 0 && m.stock_actuel <= 5;
              return (
                <tr key={m.id} className="tr-row" style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, background: isOk ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isOk ? "#bbf7d0" : "#fecaca"}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isOk ? <CheckCircle size={15} color="#059669" /> : <TrendingDown size={15} color="#dc2626" />}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{m.titre}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: isOk ? "#0f172a" : "#dc2626" }}>{m.stock_actuel}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{m.unite || "unités"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", minWidth: 140 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: isOk ? "#10b981" : isMoyen ? "#f59e0b" : "#ef4444" }} />
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: isOk ? "#f0fdf4" : "#fef2f2", color: isOk ? "#059669" : "#dc2626", border: `1px solid ${isOk ? "#bbf7d0" : "#fecaca"}` }}>
                      {isOk ? "Stock OK" : "CRITIQUE"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="btn-danger">
                      <X size={12} /> {deletingId === m.id ? "..." : "Supprimer"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {matieres.length > 0 && <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>{matieres.length} composant{matieres.length > 1 ? "s" : ""}</div>}
      </div>
    </div>
  );
}