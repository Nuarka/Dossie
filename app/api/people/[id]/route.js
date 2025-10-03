import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/utils/db';

export const runtime = 'nodejs';

export async function GET(_, { params }){
  await ensureSchema();
  const id = params.id;
  const person = await sql`SELECT * FROM people WHERE id=${id}`;
  if (!person.rows[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const facts = await sql`SELECT * FROM facts WHERE person_id=${id} ORDER BY date DESC NULLS LAST, id DESC`;
  const stories = await sql`SELECT * FROM stories WHERE person_id=${id} ORDER BY date DESC NULLS LAST, id DESC`;
  return NextResponse.json({ person: person.rows[0], facts: facts.rows, stories: stories.rows });
}

export async function PUT(request, { params }){
  await ensureSchema();
  const id = params.id;
  const existing = await sql`SELECT * FROM people WHERE id=${id}`;
  if (!existing.rows[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const now = Date.now();
  const body = await request.json();
  const p = { ...existing.rows[0], ...body, updated_at: now };
  const { rows } = await sql`
    UPDATE people SET
      name=${p.name}, nickname=${p.nickname}, dob=${p.dob}, friendliness=${p.friendliness},
      family=${p.family}, relationship=${p.relationship}, bio=${p.bio}, events=${p.events},
      traumas=${p.traumas}, habits=${p.habits}, tags=${p.tags}, photo_url=${p.photo_url},
      photo_caption=${p.photo_caption}, updated_at=${p.updated_at}
    WHERE id=${id}
    RETURNING *`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(_, { params }){
  await ensureSchema();
  await sql`DELETE FROM people WHERE id=${params.id}`;
  return NextResponse.json({ ok: true });
}
