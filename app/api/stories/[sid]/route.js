import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export async function DELETE(_, { params }){
  await sql`DELETE FROM stories WHERE id=${params.sid}`;
  return NextResponse.json({ ok: true });
}
