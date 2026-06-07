import SessionWrapper from '../SessionWrapper';
export default function LivreurLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>;
}