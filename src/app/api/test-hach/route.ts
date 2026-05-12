import bcrypt from 'bcryptjs';

export async function GET() {
  const hash = await bcrypt.hash('password', 10);
  return Response.json({ hash });
}