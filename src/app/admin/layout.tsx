import Sidebar from "@/components/Sidebar";
import SessionWrapper from "../SessionWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionWrapper>
      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        background: '#080812', fontFamily: "'Outfit', sans-serif",
      }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </SessionWrapper>
  );
}