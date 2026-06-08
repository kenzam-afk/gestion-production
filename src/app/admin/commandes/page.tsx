"use client";

import { useEffect, useState } from "react";
import { Trash2, Package, ShoppingCart, RefreshCw, Search } from "lucide-react";

interface LigneCommande { produit_nom: string; produit_description: string; unite: string; quantite: number; prix_unitaire: number; }
interface Commande {
  id: number; client_id: number; total: number; statut: string;
  adresse_livraison: string; created_at?: string;
  client_nom?: string; client_prenom?: string; client_titre?: string; type_client?: string;
  lignes?: LigneCommande[];
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  en_attente:     { label: "En attente",     color: "#f59e0b", bg: "rgba(245,158,11,.12)",  border: "rgba(245,158,11,.3)"  },
  confirmee:      { label: "Confirmée",      color: "#a855f7", bg: "rgba(168,85,247,.12)",  border: "rgba(168,85,247,.3)"  },
  en_fabrication: { label: "En fabrication", color: "#ec4899", bg: "rgba(236,72,153,.12)",  border: "rgba(236,72,153,.3)"  },
  pret_livraison: { label: "Prêt livraison", color: "#06b6d4", bg: "rgba(6,182,212,.12)",   border: "rgba(6,182,212,.3)"   },
  livree:         { label: "Livrée",         color: "#10b981", bg: "rgba(16,185,129,.12)",  border: "rgba(16,185,129,.3)"  },
  annulee:        { label: "Annulée",        color: "#ef4444", bg: "rgba(239,68,68,.12)",   border: "rgba(239,68,68,.3)"   },
};

// ✅ MODIFIÉ : L'admin ne peut plus lancer la fabrication
// confirmee → en_fabrication est retiré — c'est le responsable prod qui le fait
const NEXT_STATUTS: Record<string, { label: string; statut: string; color: string }[]> = {
  en_attente:     [{ label: "✓ Confirmer", statut: "confirmee", color: "#a855f7" }, { label: "✕ Annuler", statut: "annulee", color: "#ef4444" }],
  confirmee:      [{ label: "✕ Annuler",  statut: "annulee",   color: "#ef4444" }],
  en_fabrication: [],
  pret_livraison: [],
  livree:         [],
  annulee:        [],
};

const DS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);color:var(--text-secondary);border-radius:9px;padding:8px 16px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;transition:all .15s}
.btn-ghost:hover{border-color:var(--violet);color:var(--violet-light);background:rgba(124,58,237,.08)}
.btn-danger{display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.input-field{width:100%;background:var(--bg-surface) !important;border:1px solid var(--border) !important;border-radius:9px;padding:10px 13px;font-family:'Outfit',sans-serif;font-size:13.5px;color:var(--text-primary) !important;outline:none;transition:all .15s}
.input-field:focus{border-color:var(--violet) !important;box-shadow:0 0 0 3px rgba(124,58,237,.15) !important}
.input-field::placeholder{color:var(--text-muted)}
.tr-row{border-bottom:1px solid var(--border);transition:background .15s}
.tr-row:hover td{background:var(--bg-surface) !important}
.filter-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid var(--border);background:transparent;cursor:pointer;font-family:'Outfit',sans-serif;color:var(--text-secondary);transition:all .15s}
.filter-btn.active{background:rgba(124,58,237,.15);color:var(--violet-light);border-color:rgba(124,58,247,.4)}
.filter-btn:hover:not(.active){border-color:var(--violet);color:var(--violet-light)}
.action-btn{display:inline-flex;align-items:center;gap:5px;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s;white-space:nowrap;border:1px solid transparent}
.action-btn:hover{opacity:.85;transform:translateY(-1px)}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/commandes");
      const data = await res.json();
      setCommandes(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette commande ?")) return;
    await fetch(`/api/commandes/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function changerStatut(id: number, statut: string) {
    await fetch(`/api/commandes/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    fetchAll();
  }

  const statutsList = ["tous", ...Object.keys(STATUT_CFG)];
  const stats = {
    total:   commandes.length,
    attente: commandes.filter(c => c.statut === "en_attente").length,
    fabr:    commandes.filter(c => c.statut === "en_fabrication").length,
    livrees: commandes.filter(c => c.statut === "livree").length,
    ca:      commandes.reduce((a, c) => a + (Number(c.total) || 0), 0),
  };

  const filtered = commandes.filter(c => {
    const nomClient = c.type_client === "entreprise"
      ? c.client_titre || ""
      : `${c.client_prenom || ""} ${c.client_nom || ""}`.trim();
    const produits = (c.lignes || []).map(l => l.produit_nom).join(" ");
    const text     = `${nomClient} ${produits} ${c.id}`.toLowerCase();
    const matchS   = filterStatut === "tous" || c.statut === filterStatut;
    return matchS && text.includes(search.toLowerCase());
  });

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: "28px 32px", maxWidth: 1400 }}>
      <style>{DS}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--violet)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Administration</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c3aed,#ec4899)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(124,58,237,.4)" }}>
              <ShoppingCart size={18} color="white" />
            </div>
            Commandes
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{stats.total} commandes au total</p>
        </div>
        <button onClick={fetchAll} className="btn-ghost">
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total",       value: stats.total,   color: "#a855f7", bg: "rgba(168,85,247,.1)", border: "rgba(168,85,247,.2)" },
          { label: "En attente",  value: stats.attente, color: "#f59e0b", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)" },
          { label: "Fabrication", value: stats.fabr,    color: "#ec4899", bg: "rgba(236,72,153,.1)", border: "rgba(236,72,153,.2)" },
          { label: "Livrées",     value: stats.livrees, color: "#10b981", bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.2)" },
          { label: "CA total",    value: `${stats.ca.toLocaleString("fr-DZ")} DA`, color: "#06b6d4", bg: "rgba(6,182,212,.1)", border: "rgba(6,182,212,.2)" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: i === 4 ? 14 : 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input-field" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statutsList.map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} className={`filter-btn${filterStatut === s ? " active" : ""}`}>
              {s === "tous" ? "Tous" : (STATUT_CFG[s]?.label || s)}
              {s !== "tous" && <span style={{ opacity: 0.7, fontSize: 11 }}>{commandes.filter(c => c.statut === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
              {["#", "Client", "Produits", "Statut", "Total", "Date", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: h === "Total" ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 56 }}>
                <ShoppingCart size={32} style={{ display: "block", margin: "0 auto 10px", opacity: 0.2, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Aucune commande</span>
              </td></tr>
            ) : filtered.map(cmd => {
              const cfg = STATUT_CFG[cmd.statut] || { label: cmd.statut, color: "var(--text-secondary)", bg: "var(--bg-surface)", border: "var(--border)" };
              const nomClient = cmd.type_client === "entreprise"
                ? cmd.client_titre || `Client #${cmd.client_id}`
                : `${cmd.client_prenom || ""} ${cmd.client_nom || ""}`.trim() || `Client #${cmd.client_id}`;
              const nextActions = NEXT_STATUTS[cmd.statut] || [];

              // ✅ Badge "Traitement prod" pour les commandes confirmées — indique que c'est au responsable d'agir
              const showProdBadge = cmd.statut === "confirmee";

              return (
                <tr key={cmd.id} className="tr-row">
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>#{cmd.id}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{nomClient}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID {cmd.client_id}</div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {cmd.lignes && cmd.lignes.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {cmd.lignes.map((l, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 24, background: "rgba(124,58,237,.12)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Package size={11} color="#a855f7" />
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>{l.produit_nom}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>×{l.quantite}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      {/* ✅ Indique que le responsable prod doit prendre en charge */}
                      {showProdBadge && (
                        <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 500, paddingLeft: 2 }}>
                          ⏳ En attente responsable prod
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>
                      {Number(cmd.total).toLocaleString("fr-DZ")} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)" }}>DA</span>
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 11.5, color: "var(--text-secondary)" }}>
                    {cmd.created_at ? new Date(cmd.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {nextActions.map((action, i) => (
                        <button key={i} onClick={() => changerStatut(cmd.id, action.statut)} className="action-btn"
                          style={{ background: action.color + "18", color: action.color, border: `1px solid ${action.color}40` }}>
                          {action.label}
                        </button>
                      ))}
                      <button onClick={() => handleDelete(cmd.id)} className="btn-danger"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
            {filtered.length} commande{filtered.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}