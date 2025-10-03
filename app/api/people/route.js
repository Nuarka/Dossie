import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/utils/db';

export const runtime = 'nodejs';

export async function GET(){
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM people ORDER BY updated_at DESC NULLS LAST, id DESC`;
  return NextResponse.json(rows);
}

export async function POST(request){
  await ensureSchema();
  const now = Date.now();
  const body = await request.json();
  const { name, nickname, dob, friendliness=5, family, relationship, bio, events, traumas, habits, tags, photo_url, photo_caption } = body || {};
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  const { rows } = await sql`
    INSERT INTO people (name, nickname, dob, friendliness, family, relationship, bio, events, traumas, habits, tags, photo_url, photo_caption, created_at, updated_at)
    VALUES (${name}, ${nickname}, ${dob}, ${friendliness}, ${family}, ${relationship}, ${bio}, ${events}, ${traumas}, ${habits}, ${tags}, ${photo_url}, ${photo_caption}, ${now}, ${now})
    RETURNING *`;
  return NextResponse.json(rows[0]);
}
