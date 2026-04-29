import type { Metadata } from "next";
import "./globals.css";
import SessionWrapper from "./SessionWrapper";

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
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}