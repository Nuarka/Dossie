import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export async function DELETE(_, { params }){
  await sql`DELETE FROM facts WHERE id=${params.fid}`;
  return NextResponse.json({ ok: true });
}
