import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#080812',
      backgroundImage: `
        radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(236,72,153,0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.05) 0%, transparent 70%)
      `,
      backgroundAttachment: 'fixed',
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <Sidebar />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}