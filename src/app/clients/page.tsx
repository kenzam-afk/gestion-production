'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, X, Building2, User, Search, Phone, Mail, MapPin, Calendar, Hash } from 'lucide-react';

interface Client {
  id: number; type_client: string; email: string; telephone: string;
  adresse: string; nif: string; titre: string; annee_creation: number;
  siege_social: string; nom: string; prenom: string;
  date_naissance: string; nin: string; created_at: string;
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box}
.pc{background:white;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
.inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 13px;font-family:'Sora',sans-serif;font-size:13px;color:#1e293b;outline:none;transition:border .2s;background:#f8fafc;box-sizing:border-box}
.inp:focus{border-color:#3b82f6;background:white}
.lbl{font-size:11px;font-weight:600;color:#64748b;margin-bottom:5px;display:block}
.bmain{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:none;border-radius:11px;padding:11px 20px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s;box-shadow:0 4px 12px rgba(59,130,246,.3)}
.bmain:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(59,130,246,.4)}
.bghost{display:flex;align-items:center;gap:7px;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;border-radius:11px;padding:10px 18px;font-weight:500;cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;transition:all .2s}
.bghost:hover{border-color:#3b82f6;color:#3b82f6;background:#eff6ff}
.tbtn{flex:1;padding:14px 16px;border-radius:13px;cursor:pointer;border:2px solid #e2e8f0;background:white;font-family:'Sora',sans-serif;text-align:left;transition:all .2s}
.tbtn.on{border-color:#3b82f6;background:#eff6ff}
.fbtn{padding:7px 14px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s}
.fbtn.on{background:#0f2547;border-color:#0f2547;color:white}
.trh:hover{background:#f8fafc}
.bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
`;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeClient, setTypeClient] = useState<'entreprise' | 'individuel'>('individuel');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'tous' | 'individuel' | 'entreprise'>('tous');
  const [form, setForm] = useState({ email:'',telephone:'',adresse:'',nif:'',titre:'',annee_creation:'',siege_social:'',nom:'',prenom:'',date_naissance:'',nin:'' });

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type_client: typeClient, ...form }) });
    if (res.ok) { setShowForm(false); setForm({ email:'',telephone:'',adresse:'',nif:'',titre:'',annee_creation:'',siege_social:'',nom:'',prenom:'',date_naissance:'',nin:'' }); fetchClients(); }
  };

  const filtered = clients.filter(c => {
    const name = c.type_client === 'entreprise' ? c.titre : `${c.prenom} ${c.nom}`;
    return (name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.telephone?.includes(search))
      && (filterType === 'tous' || c.type_client === filterType);
  });

  return (
    <div style={{ fontFamily:"'Sora',sans-serif", maxWidth:1100, margin:'0 auto' }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Administration</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, background:'linear-gradient(135deg,#1e40af,#3b82f6)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={22} color="white" />
            </div>
            Clients
          </h1>
        </div>
        <button className="bmain" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Ajouter un client</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Total clients', value:clients.length, color:'#1e40af', bg:'#eff6ff', border:'#bfdbfe' },
          { label:'Entreprises', value:clients.filter(c=>c.type_client==='entreprise').length, color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
          { label:'Individuels', value:clients.filter(c=>c.type_client==='individuel').length, color:'#059669', bg:'#f0fdf4', border:'#bbf7d0' },
        ].map((s,i) => (
          <div key={i} className="pc" style={{ padding:'20px 24px', border:`1px solid ${s.border}`, background:s.bg }}>
            <div style={{ fontSize:32, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:13, color:'#64748b', fontWeight:500, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="pc" style={{ padding:28, marginBottom:24, border:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontWeight:800, fontSize:17, color:'#0f172a', margin:0 }}>Nouveau client</h2>
            <button onClick={() => setShowForm(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="#64748b" /></button>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            {[
              { t:'individuel' as const, icon:<User size={18}/>, label:'Individuel', desc:'Particulier / acheteur' },
              { t:'entreprise' as const, icon:<Building2 size={18}/>, label:'Entreprise', desc:'Société / organisation' },
            ].map(opt => (
              <button key={opt.t} className={`tbtn${typeClient===opt.t?' on':''}`} onClick={() => setTypeClient(opt.t)}>
                <div style={{ color:typeClient===opt.t?'#1e40af':'#94a3b8', marginBottom:6 }}>{opt.icon}</div>
                <div style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{opt.label}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {typeClient === 'individuel' ? <>
              <div><label className="lbl">Nom *</label><input className="inp" placeholder="Benali" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} /></div>
              <div><label className="lbl">Prénom *</label><input className="inp" placeholder="Karim" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} /></div>
              <div><label className="lbl">Date de naissance</label><input className="inp" type="date" value={form.date_naissance} onChange={e=>setForm({...form,date_naissance:e.target.value})} /></div>
              <div><label className="lbl">NIN</label><input className="inp" placeholder="Numéro identité nationale" value={form.nin} onChange={e=>setForm({...form,nin:e.target.value})} /></div>
            </> : <>
              <div><label className="lbl">Raison sociale *</label><input className="inp" placeholder="SARL Bati-Construct" value={form.titre} onChange={e=>setForm({...form,titre:e.target.value})} /></div>
              <div><label className="lbl">NIF *</label><input className="inp" placeholder="123456789" value={form.nif} onChange={e=>setForm({...form,nif:e.target.value})} /></div>
              <div><label className="lbl">Année création</label><input className="inp" type="number" placeholder="2010" value={form.annee_creation} onChange={e=>setForm({...form,annee_creation:e.target.value})} /></div>
              <div><label className="lbl">Siège social</label><input className="inp" placeholder="Alger Centre" value={form.siege_social} onChange={e=>setForm({...form,siege_social:e.target.value})} /></div>
            </>}
            <div><label className="lbl">Email</label><input className="inp" type="email" placeholder="contact@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label className="lbl">Téléphone</label><input className="inp" type="tel" placeholder="0555 123 456" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} /></div>
            <div style={{ gridColumn:'span 2' }}><label className="lbl">Adresse</label><input className="inp" placeholder="12 Rue Didouche Mourad, Alger" value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} /></div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button className="bmain" onClick={handleSubmit}>Enregistrer</button>
            <button className="bghost" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Barre recherche + filtres */}
      <div className="pc" style={{ padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} color="#94a3b8" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
          <input className="inp" style={{ paddingLeft:36 }} placeholder="Rechercher un client..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {(['tous','individuel','entreprise'] as const).map(t => (
            <button key={t} className={`fbtn${filterType===t?' on':''}`} onClick={()=>setFilterType(t)}>
              {t==='tous'?'Tous':t==='individuel'?'👤 Individuels':'🏢 Entreprises'}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="pc" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'#94a3b8', fontSize:13 }}>Chargement...</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'linear-gradient(90deg,#0d1f3c,#0f2547)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                {['Type','Nom / Raison sociale','Identifiant','Contact','Adresse','Inscrit le'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'13px 16px', fontSize:11, fontWeight:700, color:'#7ea6cc', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:48, color:'#94a3b8', fontSize:14 }}>
                  <Users size={32} style={{ display:'block', margin:'0 auto 10px', opacity:0.3 }} />
                  {search ? 'Aucun résultat' : 'Aucun client enregistré'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="trh" style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'14px 16px' }}>
                    <span className="bdg" style={{ background:c.type_client==='entreprise'?'#f5f3ff':'#f0fdf4', color:c.type_client==='entreprise'?'#7c3aed':'#059669', border:`1px solid ${c.type_client==='entreprise'?'#ddd6fe':'#bbf7d0'}` }}>
                      {c.type_client==='entreprise'?<Building2 size={11}/>:<User size={11}/>}
                      {c.type_client==='entreprise'?'Entreprise':'Individuel'}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px', fontWeight:700, fontSize:13, color:'#0f172a' }}>
                    {c.type_client==='entreprise' ? c.titre : `${c.prenom||''} ${c.nom||''}`}
                    {c.type_client==='entreprise' && c.annee_creation && <div style={{ fontSize:11, color:'#94a3b8', fontWeight:400, marginTop:2 }}>Fondée en {c.annee_creation}</div>}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {(c.type_client==='entreprise'?c.nif:c.nin) ? (
                      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#475569' }}><Hash size={12} color="#94a3b8"/>{c.type_client==='entreprise'?c.nif:c.nin}</span>
                    ) : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                    {c.type_client==='individuel' && c.date_naissance && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#94a3b8', marginTop:3 }}><Calendar size={11}/>{new Date(c.date_naissance).toLocaleDateString('fr-FR')}</div>
                    )}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {c.telephone && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#475569', marginBottom:3 }}><Phone size={12} color="#94a3b8"/>{c.telephone}</div>}
                    {c.email && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#3b82f6' }}><Mail size={12}/>{c.email}</div>}
                    {!c.telephone && !c.email && <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:12, color:'#475569', maxWidth:150 }}>
                    {c.adresse ? <div style={{ display:'flex', alignItems:'flex-start', gap:5 }}><MapPin size={12} color="#94a3b8" style={{ flexShrink:0, marginTop:1 }}/><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.adresse}</span></div>
                    : <span style={{ color:'#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:11, color:'#94a3b8' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <div style={{ padding:'11px 16px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'#94a3b8' }}>{filtered.length} client{filtered.length>1?'s':''} affiché{filtered.length>1?'s':''}</span>
            <span style={{ fontSize:11, color:'#cbd5e1' }}>sur {clients.length} au total</span>
          </div>
        )}
      </div>
    </div>
  );
}