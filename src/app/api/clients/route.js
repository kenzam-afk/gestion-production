import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type_client,
      email,
      telephone,
      adresse,
      nif,
      titre,
      annee_creation,
      siege_social,
      nom,
      prenom,
      date_naissance,
      nin,
    } = body;

    if (!type_client) {
      return Response.json({ error: 'type_client requis' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO clients 
        (type_client, email, telephone, adresse, nif, titre, annee_creation, 
         siege_social, nom, prenom, date_naissance, nin)
      VALUES 
        (${type_client}, ${email || null}, ${telephone || null}, ${adresse || null},
         ${nif || null}, ${titre || null}, ${annee_creation || null}, ${siege_social || null},
         ${nom || null}, ${prenom || null}, ${date_naissance || null}, ${nin || null})
      RETURNING id
    `;

    return Response.json({ id: result[0].id, message: 'Client créé' }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}