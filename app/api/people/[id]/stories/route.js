import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/utils/db';

export const runtime = 'nodejs';

export async function GET(_, { params }){
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM stories WHERE person_id=${params.id} ORDER BY date DESC NULLS LAST, id DESC`;
  return NextResponse.json(rows);
}
export async function POST(request, { params }){
  await ensureSchema();
  const body = await request.json();
  const created_at = Date.now();
  await sql`INSERT INTO stories (person_id, date, title, content, created_at) VALUES (${params.id}, ${body.date}, ${body.title}, ${body.content}, ${created_at})`;
  const { rows } = await sql`SELECT * FROM stories WHERE person_id=${params.id} ORDER BY date DESC NULLS LAST, id DESC`;
  return NextResponse.json(rows);
}
