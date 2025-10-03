import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const dbPath = path.join(process.cwd(), 'server', 'db.sqlite')
const first = !fs.existsSync(dbPath)
const db = new Database(dbPath)

if (first){
  db.exec(`
    CREATE TABLE people(
      id TEXT PRIMARY KEY,
      full_name TEXT,
      relation TEXT,
      friendliness_level INTEGER,
      tags TEXT,
      history TEXT,
      traumas TEXT,
      important_notes TEXT,
      last_contact_date TEXT,
      photoDataUrl TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `)
}

app.get('/api/ping', (req,res)=> res.json({ok:true}))

app.get('/api/people', (req,res)=>{
  const rows = db.prepare('SELECT * FROM people ORDER BY datetime(updated_at) DESC').all()
  rows.forEach(r => r.tags = r.tags ? JSON.parse(r.tags) : [])
  res.json(rows)
})

app.post('/api/people', (req,res)=>{
  const it = req.body || {}
  const stmt = db.prepare(`INSERT OR REPLACE INTO people
    (id, full_name, relation, friendliness_level, tags, history, traumas, important_notes, last_contact_date, photoDataUrl, created_at, updated_at)
    VALUES (@id,@full_name,@relation,@friendliness_level,@tags,@history,@traumas,@important_notes,@last_contact_date,@photoDataUrl,@created_at,@updated_at)`)
  stmt.run({ ...it, tags: JSON.stringify(it.tags||[]) })
  res.json({ ok:true })
})

app.put('/api/people/:id', (req,res)=>{
  const id = req.params.id
  const patch = req.body || {}
  const current = db.prepare('SELECT * FROM people WHERE id=?').get(id)
  if (!current) return res.status(404).json({ error:'not found' })
  const updated = { ...current, ...patch, tags: JSON.stringify((patch.tags ?? JSON.parse(current.tags||'[]'))) }
  db.prepare(`UPDATE people SET
    full_name=@full_name, relation=@relation, friendliness_level=@friendliness_level, tags=@tags,
    history=@history, traumas=@traumas, important_notes=@important_notes, last_contact_date=@last_contact_date,
    photoDataUrl=@photoDataUrl, updated_at=@updated_at
    WHERE id=@id`).run({ ...updated, id })
  res.json({ ok:true })
})

app.delete('/api/people/:id', (req,res)=>{
  const id = req.params.id
  db.prepare('DELETE FROM people WHERE id=?').run(id)
  res.json({ ok:true })
})

const PORT = process.env.PORT || 8787
app.listen(PORT, ()=> console.log('API on http://localhost:'+PORT))