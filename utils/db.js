import { sql } from '@vercel/postgres';

export async function ensureSchema(){
  await sql`CREATE TABLE IF NOT EXISTS people (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT,
    dob TEXT,
    friendliness INT DEFAULT 5,
    family TEXT,
    relationship TEXT,
    bio TEXT,
    events TEXT,
    traumas TEXT,
    habits TEXT,
    tags TEXT,
    photo_url TEXT,
    photo_caption TEXT,
    created_at BIGINT,
    updated_at BIGINT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS facts (
    id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    date TEXT, title TEXT, note TEXT, created_at BIGINT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    date TEXT, title TEXT, content TEXT, created_at BIGINT
  )`;
}
