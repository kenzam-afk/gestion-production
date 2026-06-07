import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    const {
      nom, prenom, email, mot_de_passe, telephone, adresse,
      type_client, titre, nin, nif, date_naissance,
      annee_creation, siege_social
    } = body;

    if (!nom || !email || !mot_de_passe) {
      return Response.json({ error: 'Nom, email et mot de passe sont requis' }, { status: 400 });
    }

    // Vérifier email existant
    const existing = await sql`SELECT id FROM utilisateurs WHERE email = ${email}`;
    if (existing.length > 0) {
      return Response.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    // 1. Créer utilisateur
    const [user] = await sql`
      INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
      VALUES (${nom}, ${email}, ${hash}, 'client')
      RETURNING id
    `;

    // 2. Créer client lié
    await sql`
      INSERT INTO clients (
        utilisateur_id, nom, prenom, email, telephone, adresse,
        type_client, titre, nin, nif, date_naissance, annee_creation, siege_social
      ) VALUES (
        ${user.id},
        ${nom},
        ${prenom || ''},
        ${email},
        ${telephone || ''},
        ${adresse || ''},
        ${type_client || 'individuel'},
        ${titre || null},
        ${nin || null},
        ${nif || null},
        ${date_naissance || null},
        ${annee_creation || null},
        ${siege_social || null}
      )
    `;

    return Response.json({ id: user.id, message: 'Compte créé avec succès' }, { status: 201 });

  } catch (error: any) {
    console.error('Register error:', error);
    return Response.json({ error: 'Erreur serveur: ' + error.message }, { status: 500 });
  }
}