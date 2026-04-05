import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion Production",
  description: "Plateforme de gestion de production",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}