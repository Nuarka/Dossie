import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export async function POST(request){
  const form = await request.formData();
  const file = form.get('file');
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  const arrayBuffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name?.replace(/[^a-zA-Z0-9._-]/g,'') || 'upload.bin'}`;
  const { url } = await put(filename, new Uint8Array(arrayBuffer), { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.json({ url });
}
