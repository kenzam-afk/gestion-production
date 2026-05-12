import { neon } from '@neondatabase/serverless';

// Vérification de sécurité pour éviter les erreurs au démarrage
if (!process.env.DATABASE_URL) {
  console.error("ERREUR: DATABASE_URL est manquante dans le fichier .env");
}

const sql = neon(process.env.DATABASE_URL);

export default sql;