import SessionWrapper from '../SessionWrapper';
export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>;
}