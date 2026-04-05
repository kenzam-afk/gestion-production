export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🛍️ Mon Espace Client</h1>
        <a href="/api/auth/signout" className="text-red-500 hover:underline text-sm">Déconnexion</a>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}