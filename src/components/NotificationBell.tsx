'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';

interface Notif {
  id: number; titre: string; message: string | null;
  type: string; lu: boolean; created_at: string;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  success: { bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.2)',  dot: '#10b981' },
  warning: { bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.2)',  dot: '#f59e0b' },
  danger:  { bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.2)',   dot: '#ef4444' },
  info:    { bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.2)',   dot: '#06b6d4' },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell({ accentColor = '#7c3aed' }: { accentColor?: string }) {
  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [nonLues, setNonLues]   = useState(0);
  const [open, setOpen]         = useState(false);
  const ref                     = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      const res  = await fetch('/api/notifications?limit=15');
      const data = await res.json();
      setNotifs(data.notifications || []);
      setNonLues(data.non_lues || 0);
    } catch { /* silent */ }
  }

  async function marquerLu() {
    await fetch('/api/notifications', { method: 'PUT' });
    setNonLues(0);
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
  }

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <style>{`
        .nb-btn{
          width:36px;height:36px;border-radius:10px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.1);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;position:relative;transition:all .15s;
        }
        .nb-btn:hover{background:rgba(255,255,255,.1);}
        .nb-badge{
          position:absolute;top:-4px;right:-4px;
          background:#ef4444;color:white;
          font-size:9px;font-weight:700;
          min-width:16px;height:16px;border-radius:8px;
          display:flex;align-items:center;justify-content:center;
          padding:0 3px;border:2px solid transparent;
          animation:nb-pulse 2s infinite;
        }
        @keyframes nb-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 4px rgba(239,68,68,0)}}
        .nb-dropdown{
          position:absolute;top:calc(100% + 10px);right:0;
          width:320px;
          background:#0f0f23;
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px;
          box-shadow:0 24px 60px rgba(0,0,0,.6);
          z-index:999;
          overflow:hidden;
          animation:nb-fadeIn .15s ease;
        }
        @media(max-width:400px){.nb-dropdown{width:calc(100vw - 32px);right:-80px;}}
        @keyframes nb-fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .nb-item{
          padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);
          transition:background .15s;cursor:default;
        }
        .nb-item:hover{background:rgba(255,255,255,.03)}
        .nb-item:last-child{border-bottom:none}
      `}</style>

      <button className="nb-btn" onClick={() => { setOpen(o => !o); if (!open && nonLues > 0) marquerLu(); }}>
        <Bell size={16} color="rgba(255,255,255,0.7)" />
        {nonLues > 0 && <span className="nb-badge">{nonLues > 9 ? '9+' : nonLues}</span>}
      </button>

      {open && (
        <div className="nb-dropdown">
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#e2e0ff' }}>Notifications</span>
            <div style={{ display:'flex', gap:6 }}>
              {nonLues > 0 && (
                <button onClick={marquerLu} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#5c5a7a' }}>
                  <CheckCheck size={12} /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#5c5a7a' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'#5c5a7a' }}>
                <Bell size={24} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }} />
                <p style={{ fontSize:13, margin:0 }}>Aucune notification</p>
              </div>
            ) : notifs.map(n => {
              const cfg = TYPE_COLORS[n.type] || TYPE_COLORS.info;
              return (
                <div key={n.id} className="nb-item" style={{ opacity: n.lu ? 0.6 : 1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.dot, flexShrink:0, marginTop:4 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'#e2e0ff', lineHeight:1.3 }}>{n.titre}</div>
                      {n.message && <div style={{ fontSize:11.5, color:'#5c5a7a', marginTop:2, lineHeight:1.4 }}>{n.message}</div>}
                      <div style={{ fontSize:10.5, color:'#4a4870', marginTop:4 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.lu && <div style={{ width:6, height:6, borderRadius:'50%', background:accentColor, flexShrink:0, marginTop:5 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}