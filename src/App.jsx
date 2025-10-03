import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ListFilter, Grid, Images, Table2, Search, Edit3, Save, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

const TABS = [
  { key: "add", icon: Plus, label: "Добавить" },
  { key: "list", icon: Table2, label: "Список" },
  { key: "photo", icon: Images, label: "Фото" },
]

function Field({ label, children }){
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function friendly(n){
  if (n === undefined || n === null || n === "") return "—"
  const num = Number(n)
  if (Number.isNaN(num)) return "—"
  return `${num}/5`
}

function nowIso(){ return new Date().toISOString() }

function useBackend(){
  const [online, setOnline] = useState(false)
  useEffect(()=>{
    fetch("/api/ping").then(r=>setOnline(r.ok)).catch(()=>setOnline(false))
  }, [])
  return online
}

function usePeople(){
  const [items, setItems] = useState([])
  const backend = useBackend()

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch("/api/people")
        if (r.ok){
          const data = await r.json()
          setItems(data)
        }
      }catch(e){
        // fallback: seed from localStorage if any
        const raw = localStorage.getItem("dossier_items") || "[]"
        setItems(JSON.parse(raw))
      }
    })()
  }, [])

  useEffect(()=>{
    localStorage.setItem("dossier_items", JSON.stringify(items))
  }, [items])

  async function create(it){
    const item = { ...it, id: crypto.randomUUID(), created_at: nowIso(), updated_at: nowIso() }
    setItems(prev => [item, ...prev])
    try{
      await fetch("/api/people", { method:"POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify(item) })
    }catch{}
  }

  async function remove(id){
    setItems(prev => prev.filter(x => x.id !== id))
    try{ await fetch(`/api/people/${id}`, { method:"DELETE" }) }catch{}
  }

  async function update(id, patch){
    setItems(prev => prev.map(x => x.id===id ? { ...x, ...patch, updated_at: nowIso() } : x))
    try{
      await fetch(`/api/people/${id}`, { method:"PUT", headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch) })
    }catch{}
  }

  return { items, create, remove, update, backend }
}

function AddForm({ onCreate }){
  const [full_name, setFullName] = useState("")
  const [relation, setRelation] = useState("")
  const [friendliness_level, setFriendliness] = useState(3)
  const [tags, setTags] = useState("")
  const [history, setHistory] = useState("")
  const [traumas, setTraumas] = useState("")
  const [important_notes, setImportant] = useState("")
  const [last_contact_date, setLastContact] = useState("")
  const [photoDataUrl, setPhoto] = useState("")

  function submit(){
    if (!full_name.trim()) return alert("Укажи имя")
    const item = {
      full_name: full_name.trim(),
      relation: relation.trim(),
      friendliness_level: Number(friendliness_level) || 0,
      tags: tags.split(',').map(s=>s.trim()).filter(Boolean),
      history, traumas, important_notes,
      last_contact_date: last_contact_date || null,
      photoDataUrl: photoDataUrl || null,
    }
    onCreate(item)
    setFullName(""); setRelation(""); setFriendliness(3); setTags(""); setHistory(""); setTraumas(""); setImportant(""); setLastContact(""); setPhoto("")
  }

  return (
    <Card>
      <CardHeader><CardTitle>Новое досье</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Имя">
            <Input value={full_name} onChange={(e)=>setFullName(e.target.value)} placeholder="Иван Иванов"/>
          </Field>
          <Field label="Связь со мной">
            <Input value={relation} onChange={(e)=>setRelation(e.target.value)} placeholder="одноклассник, заказчик, ..."/>
          </Field>
          <Field label="Дружелюбие (1–5)">
            <Select value={String(friendliness_level)} onValueChange={(v)=>setFriendliness(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue placeholder={String(friendliness_level)}/></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Теги (через запятую)">
            <Input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="школа, дизайн, Kwork"/>
          </Field>
          <Field label="Дата последнего контакта">
            <Input type="date" value={last_contact_date||''} onChange={(e)=>setLastContact(e.target.value)}/>
          </Field>
          <Field label="Фото (data URL)">
            <Input value={photoDataUrl||''} onChange={(e)=>setPhoto(e.target.value)} placeholder="data:image/png;base64,..."/>
          </Field>
        </div>
        <Field label="История / Как познакомились">
          <Textarea rows={3} value={history} onChange={(e)=>setHistory(e.target.value)}/>
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Травмы (чувствительное)">
            <Textarea rows={3} value={traumas} onChange={(e)=>setTraumas(e.target.value)}/>
          </Field>
          <Field label="Важно помнить">
            <Textarea rows={3} value={important_notes} onChange={(e)=>setImportant(e.target.value)}/>
          </Field>
        </div>
        <div className="flex gap-3">
          <Button onClick={submit}><Save className="h-4 w-4 mr-2"/>Сохранить</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GridCards({ items, onRemove, onEdit }){
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(it => (
        <Card key={it.id} className="overflow-hidden">
          {it.photoDataUrl && <img src={it.photoDataUrl} alt={it.full_name} className="w-full h-40 object-cover" />}
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{it.full_name}</div>
              <Badge>{friendly(it.friendliness_level)}</Badge>
            </div>
            {it.relation && <div className="text-sm text-gray-500">{it.relation}</div>}
            {it.tags?.length ? <div className="flex gap-1 flex-wrap">{it.tags.map(t=><Badge key={t}>{t}</Badge>)}</div> : null}
            <div className="flex gap-2 pt-2">
              <Button className="bg-gray-100 text-black" onClick={()=>onEdit(it.id)}><Edit3 className="h-4 w-4 mr-1"/>Редактировать</Button>
              <Button className="bg-red-600" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4 mr-1"/>Удалить</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableList({ items, onRemove, onEdit }){
  return (
    <div className="overflow-x-auto border rounded-2xl">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 w-48 text-left">Имя</th>
            <th className="p-3 w-40 text-left">Связь</th>
            <th className="p-3 w-24 text-left">Уровень</th>
            <th className="p-3 w-56 text-left">Теги</th>
            <th className="p-3 w-40 text-left">Обновлено</th>
            <th className="p-3 w-40 text-left">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} className="border-t">
              <td className="p-3 truncate">{it.full_name}</td>
              <td className="p-3 truncate">{it.relation||'—'}</td>
              <td className="p-3">{friendly(it.friendliness_level)}</td>
              <td className="p-3 truncate">{(it.tags||[]).join(', ')||'—'}</td>
              <td className="p-3">{new Date(it.updated_at||it.created_at).toLocaleString()}</td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button className="bg-gray-100 text-black" onClick={()=>onEdit(it.id)}><Edit3 className="h-4 w-4 mr-1"/>Edit</Button>
                  <Button className="bg-red-600" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4 mr-1"/>Del</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PhotoWall({ items, onRemove, onEdit }){
  if (!items.length) return <div className="text-sm text-gray-500">Нет фото.</div>
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
      {items.map(it => (
        <div key={it.id} className="mb-3 break-inside-avoid rounded-2xl overflow-hidden border">
          <img src={it.photoDataUrl} alt={it.full_name} className="w-full" />
          <div className="p-2 flex items-center justify-between">
            <span className="font-medium text-sm truncate">{it.full_name}</span>
            <div className="flex gap-2">
              <Button className="bg-gray-100 text-black h-8" onClick={()=>onEdit(it.id)}><Edit3 className="h-4 w-4"/></Button>
              <Button className="bg-red-600 h-8" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App(){
  const { items, create, remove, update, backend } = usePeople()
  const [tab, setTab] = useState("add")
  const [mode, setMode] = useState("grid")
  const [query, setQuery] = useState("")
  const [minFriend, setMinFriend] = useState(0)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [sortBy, setSortBy] = useState("updated_desc")

  const filtered = useMemo(()=>{
    let list = [...items]
    const q = query.trim().toLowerCase()
    if (q){
      list = list.filter(it => (it.full_name||'').toLowerCase().includes(q) || (it.relation||'').toLowerCase().includes(q) || (it.tags||[]).some(t => t.toLowerCase().includes(q)))
    }
    if (minFriend>0){
      list = list.filter(it => Number(it.friendliness_level||0) >= minFriend)
    }
    if (hasPhoto){
      list = list.filter(it => !!it.photoDataUrl)
    }
    switch (sortBy){
      case "name_asc": list.sort((a,b)=> (a.full_name||'').localeCompare(b.full_name||'')); break
      case "name_desc": list.sort((a,b)=> (b.full_name||'').localeCompare(a.full_name||'')); break
      case "updated_desc": list.sort((a,b)=> new Date(b.updated_at||0) - new Date(a.updated_at||0)); break
      case "friend_desc": list.sort((a,b)=> Number(b.friendliness_level||0) - Number(a.friendliness_level||0)); break
      default: break
    }
    return list
  }, [items, query, minFriend, hasPhoto, sortBy])

  function startEdit(id){
    const it = items.find(x=>x.id===id)
    if (!it) return
    const name = prompt("Имя", it.full_name) ?? it.full_name
    const relation = prompt("Связь со мной", it.relation||"") ?? it.relation
    const fl = Number(prompt("Дружелюбие (1–5)", String(it.friendliness_level||3)) ?? it.friendliness_level)
    update(id, { full_name: name, relation, friendliness_level: Math.max(0, Math.min(5, isNaN(fl)?it.friendliness_level:fl)) })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold">Dossier Manager</div>
          <div className="flex gap-2">
            {TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.key
              return (
                <Button key={t.key} className={active?'':'bg-gray-100 text-black'} onClick={()=>setTab(t.key)}>
                  <Icon className="h-4 w-4 mr-2"/>{t.label}
                </Button>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === "add" && (
            <motion.div key="add" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
              <AddForm onCreate={create}/>
            </motion.div>
          )}
          {tab === "list" && (
            <motion.div key="list" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Список досье</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-5 gap-3">
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Search className="h-4 w-4 opacity-60"/>
                      <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по имени, связи, тегам"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Мин. дружелюбие</Label>
                      <Input type="number" min={0} max={5} value={minFriend} onChange={e=>setMinFriend(Math.max(0, Math.min(5, Number(e.target.value) || 0)))} className="w-20"/>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={hasPhoto} onCheckedChange={setHasPhoto} />
                        <span className="text-sm">Только с фото</span>
                      </div>
                      <div className="w-48">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Сортировка"/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="updated_desc">По обновлению</SelectItem>
                            <SelectItem value="name_asc">Имя A→Z</SelectItem>
                            <SelectItem value="name_desc">Имя Z→A</SelectItem>
                            <SelectItem value="friend_desc">Дружелюбие</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button className={mode==='grid'?'':'bg-gray-100 text-black'} onClick={()=>setMode('grid')}><Grid className="h-4 w-4 mr-2"/>Карточки</Button>
                      <Button className={mode==='list'?'':'bg-gray-100 text-black'} onClick={()=>setMode('list')}><Table2 className="h-4 w-4 mr-2"/>Таблица</Button>
                      <Button className={mode==='photo'?'':'bg-gray-100 text-black'} onClick={()=>setMode('photo')}><Images className="h-4 w-4 mr-2"/>Фото</Button>
                    </div>
                  </div>
                  {filtered.length ? (
                    mode === 'grid' ? <GridCards items={filtered} onRemove={remove} onEdit={startEdit}/> :
                    mode === 'list' ? <TableList items={filtered} onRemove={remove} onEdit={startEdit}/> :
                    <PhotoWall items={filtered} onRemove={remove} onEdit={startEdit}/>
                  ) : <div className="text-sm text-gray-500">Ничего не найдено. Измени фильтры или добавь новые досье.</div>}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {tab === "photo" && (
            <motion.div key="photo" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
              <Card><CardHeader><CardTitle>Фото</CardTitle></CardHeader>
                <CardContent>
                  <PhotoWall items={items.filter(it=>!!it.photoDataUrl)} onRemove={remove} onEdit={startEdit}/>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-gray-500 pt-4">
          Бэкенд: {backend ? "онлайн / API" : "офлайн / localStorage"}.
        </div>
      </div>
    </div>
  )
}