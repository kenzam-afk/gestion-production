import SessionWrapper from '../SessionWrapper';
export default function FournisseurLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>;
}