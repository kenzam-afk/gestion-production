import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const ROLES_VALIDES = ['admin', 'livreur', 'responsable_production', 'fournisseur', 'client'];

// Redirection par rôle
export const ROLE_REDIRECTS: Record<string, string> = {
  admin:                   '/admin',
  livreur:                 '/livreur',
  responsable_production:  '/production',
  fournisseur:             '/fournisseur',
  client:                  '/',
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',          type: 'email'    },
        password: { label: 'Mot de passe',   type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql  = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT * FROM utilisateurs WHERE email = ${credentials.email}
        `;

        if (rows.length === 0) return null;

        const user          = rows[0];
        const passwordMatch = await bcrypt.compare(credentials.password, user.mot_de_passe);
        if (!passwordMatch) return null;

        // Enregistrer la connexion dans la traçabilité
        try {
          await sql`
            INSERT INTO tracabilite (entite_type, entite_id, action, nouvel_etat, utilisateur_id, utilisateur_nom)
            VALUES ('utilisateur', ${user.id}, 'connexion', 'connecte', ${user.id}, ${user.nom})
          `;
        } catch { /* non bloquant */ }

        return {
          id:    String(user.id),
          name:  user.nom,
          email: user.email,
          role:  user.role || 'client',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id   = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id   = token.id;
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };