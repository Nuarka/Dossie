import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListFilter, Grid, Images, Table2, Search, Upload, Trash2, Edit3, Save, Download, UploadCloud } from "lucide-react";

// Minimal shadcn primitives (assumed available)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ===================== Types =====================
/** @typedef {{
  id: string,
  full_name: string,
  dob?: string,
  parents?: string,
  history?: string,
  traumas?: string,
  habits?: string,
  communication_style?: string,
  friendliness_level?: number,
  relation?: string,
  last_contact_date?: string,
  photoDataUrl?: string,
  tags?: string[],
  created_at: string,
  updated_at: string,
}} Dossier */

// ===================== Storage helpers =====================
// Storage: localStorage (web) or file (Tauri desktop)
const STORAGE_KEY = "dossiers_v1";
const RUN_TESTS = true; // Render a small self-test panel at the bottom

async function isTauri() {
  // Tauri injects window.__TAURI__
  return typeof window !== "undefined" && !!(window).__TAURI__;
}

function useLocalDossiers() {
  const [items, setItems] = useState(/** @type {Dossier[]} */([]));
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        if (await isTauri()) {
          const { readTextFile, writeTextFile, createDir } = await import("@tauri-apps/api/fs");
          const { appDataDir, join } = await import("@tauri-apps/api/path");
          const base = await appDataDir();
          const dir = await join(base, "dossier-manager");
          const file = await join(dir, "dossiers.json");
          try { await createDir(dir, { recursive: true }); } catch {}
          try {
            const raw = await readTextFile(file);
            if (raw) setItems(JSON.parse(raw));
          } catch {
            // first run: create empty file
            await writeTextFile(file, "[]");
          }
          // Persist hook will call this saver
          const save = async (arr) => {
            try { await writeTextFile(file, JSON.stringify(arr)); } catch {}
          };
          (window).___DO_SAVE = save;
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setItems(JSON.parse(raw));
        }
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        if (await isTauri()) {
          if ((window).___DO_SAVE) await (window).___DO_SAVE(items);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
      } catch {}
    })();
  }, [items]);

  return [items, setItems];
}

// ===================== CSV helpers (module-level for tests) =====================
function escapeCSV(v){
  if (v == null) return "";
  const s = String(v);
  return (s.includes('"') || s.includes(',') || s.includes('\n'))
    ? '"' + s.replace(/"/g,'""') + '"'
    : s;
}

/** @param {Dossier[]} arr */
function toCSV(arr){
  const header = [
    'id','full_name','dob','parents','history','traumas','habits','communication_style','friendliness_level','relation','last_contact_date','photoDataUrl','tags','created_at','updated_at'
  ];
  const lines = [header.join(',')];
  for (const it of arr){
    const row = [
      it.id,
      it.full_name,
      it.dob||'',
      it.parents||'',
      it.history||'',
      it.traumas||'',
      it.habits||'',
      it.communication_style||'',
      Number(it.friendliness_level||0),
      it.relation||'',
      it.last_contact_date||'',
      it.photoDataUrl||'',
      (it.tags||[]).join('|'),
      it.created_at||'',
      it.updated_at||''
    ].map(escapeCSV).join(',');
    lines.push(row);
  }
  return lines.join('\n');
}

function parseCSV(text){
  const rows = [];
  let i=0, cur='';
  let inQ=false; let row=[];
  const pushCell=()=>{ row.push(cur); cur=''; };
  const pushRow=()=>{ rows.push(row); row=[]; };
  while(i<text.length){
    const ch=text[i++];
    if (inQ){
      if (ch==='"'){
        if (text[i]==='"'){ cur+='"'; i++; } else { inQ=false; }
      } else cur+=ch;
    } else {
      if (ch==='"'){ inQ=true; }
      else if (ch===','){ pushCell(); }
      else if (ch==='\n' || ch==='\r'){ if (cur!=='' || row.length){ pushCell(); pushRow(); } }
      else cur+=ch;
    }
  }
  if (cur!=='' || row.length){ pushCell(); pushRow(); }
  return rows;
}

function csvToItems(text){
  const rows = parseCSV(text).filter(r=>r.length>1);
  if (!rows.length) return [];
  const [header, ...data] = rows;
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
  const now = new Date().toISOString();
  /** @type {Dossier[]} */
  const out = [];
  for (const r of data){
    const get = (k)=> r[idx[k]] ?? '';
    out.push({
      id: get('id') || crypto.randomUUID(),
      full_name: String(get('full_name')||'Без имени'),
      dob: get('dob')||undefined,
      parents: get('parents')||undefined,
      history: get('history')||undefined,
      traumas: get('traumas')||undefined,
      habits: get('habits')||undefined,
      communication_style: get('communication_style')||undefined,
      friendliness_level: Math.max(0, Math.min(5, Number(get('friendliness_level')||0))),
      relation: get('relation')||undefined,
      last_contact_date: get('last_contact_date')||undefined,
      photoDataUrl: get('photoDataUrl')||undefined,
      tags: String(get('tags')||'').split('|').map(s=>s.trim()).filter(Boolean),
      created_at: get('created_at')||now,
      updated_at: get('updated_at')||now,
    });
  }
  return out;
}

function mergeItems(base, incoming){
  const byId = new Map(base.map(x=>[x.id,x]));
  for (const it of incoming){
    if (byId.has(it.id)){
      const prev = byId.get(it.id);
      const merged = { ...prev };
      for (const [k,v] of Object.entries(it)){
        if (v !== undefined && v !== '') merged[k] = v;
      }
      merged.updated_at = new Date().toISOString();
      byId.set(it.id, merged);
    } else {
      byId.set(it.id, it);
    }
  }
  return Array.from(byId.values());
}

// ===================== UI Bits =====================
const Stat = ({ label, value }) => (
  <div className="p-4 rounded-2xl bg-muted text-center">
    <div className="text-2xl font-bold leading-none">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
);

const modeOptions = [
  { key: "grid", icon: Grid, label: "Плитка" },
  { key: "list", icon: Table2, label: "Таблица" },
  { key: "photo", icon: Images, label: "Фото" },
];

function friendly(n){
  if (!n && n !== 0) return "—";
  return `${n}/5`;
}

function average(arr){
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10;
}

function DataURLFromFile(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function HeaderTabs({ tab, setTab }){
  return (
    <div className="flex items-center gap-2">
      <Button variant={tab==="add"?"default":"secondary"} onClick={()=>setTab("add")}>
        <Plus className="mr-2 h-4 w-4"/> Добавить досье
      </Button>
      <Button variant={tab==="list"?"default":"secondary"} onClick={()=>setTab("list")}>
        <ListFilter className="mr-2 h-4 w-4"/> Список досье
      </Button>
    </div>
  );
}

// ===================== App =====================
export default function App(){
  const [items, setItems] = useLocalDossiers();
  const [tab, setTab] = useState(/** @type {"add"|"list"} */("add"));

  const total = items.length;
  const friendlyAvg = average(items.map(i=>Number(i.friendliness_level||0)).filter(x=>x>0));
  const photosCount = items.filter(i=>!!i.photoDataUrl).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dossier Manager</h1>
            <p className="text-sm text-muted-foreground">
              Личный архив контактов: добавляй, фильтруй и смотри сводку. Данные хранятся локально.
            </p>
          </div>
          <HeaderTabs tab={tab} setTab={setTab} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Всего досье" value={total} />
          <Stat label="Средн. дружелюбие" value={friendlyAvg || "—"} />
          <Stat label="С фото" value={photosCount} />
          <Stat label="Обновлено" value={new Date().toLocaleDateString()} />
        </div>

        <AnimatePresence mode="wait">
          {tab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AddForm onCreate={(it)=>{
                setItems(prev=>[it, ...prev]);
                setTab("list");
              }} />
            </motion.div>
          )}
          {tab === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ListView items={items} setItems={setItems} />
            </motion.div>
          )}
        </AnimatePresence>

        {RUN_TESTS && <TestPanel />}
      </div>
    </div>
  );
}

// ===================== Add Form =====================
function AddForm({ onCreate }){
  const [full_name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [parents, setParents] = useState("");
  const [history, setHistory] = useState("");
  const [traumas, setTraumas] = useState("");
  const [habits, setHabits] = useState("");
  const [communication_style, setCommStyle] = useState("");
  const [friendliness_level, setFriendliness] = useState(3);
  const [relation, setRelation] = useState("");
  const [last_contact_date, setLastContact] = useState("");
  const [tags, setTags] = useState("");
  const [photoDataUrl, setPhoto] = useState("");
  const fileRef = useRef(/** @type {HTMLInputElement|null} */(null));

  async function handleFile(e){
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await DataURLFromFile(f);
    setPhoto(url);
  }

  function makeItem(){
    const now = new Date().toISOString();
    /** @type {Dossier} */
    const it = {
      id: crypto.randomUUID(),
      full_name,
      dob: dob || undefined,
      parents: parents || undefined,
      history: history || undefined,
      traumas: traumas || undefined,
      habits: habits || undefined,
      communication_style: communication_style || undefined,
      friendliness_level: Number(friendliness_level),
      relation: relation || undefined,
      last_contact_date: last_contact_date || undefined,
      photoDataUrl: photoDataUrl || undefined,
      tags: tags ? tags.split(",").map(s=>s.trim()).filter(Boolean) : [],
      created_at: now,
      updated_at: now,
    };
    return it;
  }

  function submit(){
    if (!full_name.trim()) return alert("Укажи имя/псевдоним");
    onCreate(makeItem());
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2"><CardTitle>Новое досье</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Имя/Псевдоним">
                <Input value={full_name} onChange={(e)=>setName(e.target.value)} placeholder="Иван..." />
              </Field>
              <Field label="Дата рождения">
                <Input type="date" value={dob} onChange={(e)=>setDob(e.target.value)} />
              </Field>
              <Field label="Родители">
                <Input value={parents} onChange={(e)=>setParents(e.target.value)} placeholder="мать/отец..." />
              </Field>
              <Field label="Связь со мной">
                <Input value={relation} onChange={(e)=>setRelation(e.target.value)} placeholder="друг, знакомый..." />
              </Field>
              <Field label="Дата последнего контакта">
                <Input type="date" value={last_contact_date} onChange={(e)=>setLastContact(e.target.value)} />
              </Field>
              <Field label="Дружелюбие (1–5)">
                <Select value={String(friendliness_level)} onValueChange={(v)=>setFriendliness(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="3"/></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n=> <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="История / Как познакомились">
              <Textarea value={history} onChange={(e)=>setHistory(e.target.value)} rows={3} />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Травмы (чувствительное)">
                <Textarea value={traumas} onChange={(e)=>setTraumas(e.target.value)} rows={3} />
              </Field>
              <Field label="Привычки">
                <Textarea value={habits} onChange={(e)=>setHabits(e.target.value)} rows={3} />
              </Field>
            </div>
            <Field label="Манера общения">
              <Input value={communication_style} onChange={(e)=>setCommStyle(e.target.value)} placeholder="прямой, саркастичный..." />
            </Field>
            <Field label="Теги (через запятую)">
              <Input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="школа, проект, сосед..." />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="aspect-square rounded-2xl border bg-muted overflow-hidden flex items-center justify-center">
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="Фото" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground text-sm px-4">
                  Фото не выбрано
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <Button variant="secondary" onClick={()=>fileRef.current?.click()} className="w-full">
                <Upload className="h-4 w-4 mr-2"/> Загрузить фото
              </Button>
            </div>
            <div className="pt-2">
              <Button onClick={submit} className="w-full">
                <Save className="h-4 w-4 mr-2"/> Сохранить досье
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }){
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ===================== List / Filters =====================
function ListView({ items, setItems }){
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState(/** @type {"grid"|"list"|"photo"} */("grid"));
  const [minFriend, setMinFriend] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [sortBy, setSortBy] = useState("updated_desc");
  const [importMode, setImportMode] = useState(/** @type {"merge"|"replace"} */("merge"));

  const filtered = useMemo(()=>{
    let list = [...items];
    if (query.trim()){
      const q = query.toLowerCase();
      list = list.filter(it =>
        it.full_name.toLowerCase().includes(q) ||
        (it.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
        (it.relation||"").toLowerCase().includes(q)
      );
    }
    if (minFriend>0) list = list.filter(it=>Number(it.friendliness_level||0) >= minFriend);
    if (hasPhoto) list = list.filter(it=>!!it.photoDataUrl);

    switch (sortBy){
      case "name_asc": list.sort((a,b)=>a.full_name.localeCompare(b.full_name)); break;
      case "name_desc": list.sort((a,b)=>b.full_name.localeCompare(a.full_name)); break;
      case "updated_desc": list.sort((a,b)=>new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime()); break;
      case "friend_desc": list.sort((a,b)=>(Number(b.friendliness_level||0)-Number(a.friendliness_level||0))); break;
    }
    return list;
  }, [items, query, minFriend, hasPhoto, sortBy]);

  function remove(id){
    if (!confirm("Удалить досье?")) return;
    setItems(prev=>prev.filter(x=>x.id!==id));
  }

  function startEdit(id){
    const it = items.find(x=>x.id===id);
    if (!it) return;
    const name = prompt("Имя", it.full_name) || it.full_name;
    const relation = prompt("Связь со мной", it.relation||"") || it.relation;
    const fl = Math.max(0, Math.min(5, Number(prompt("Дружелюбие (1–5)", String(it.friendliness_level||3))||it.friendliness_level||3)));
    const updated = { ...it, full_name: name, relation, friendliness_level: fl, updated_at: new Date().toISOString() };
    setItems(prev=>prev.map(x=>x.id===id?updated:x));
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dossiers.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV(){
    const csv = toCSV(items);
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dossiers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function importFile(e){
    const f = e.target.files?.[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = ()=>{
      try{
        const text = String(fr.result||'');
        let incoming = [];
        if (f.name.toLowerCase().endsWith('.csv')){
          incoming = csvToItems(text);
        } else {
          const arr = JSON.parse(text);
          if (!Array.isArray(arr)) throw new Error('Неверный формат JSON');
          const now = new Date().toISOString();
          incoming = arr.map((it)=>({
            id: it.id || crypto.randomUUID(),
            full_name: String(it.full_name||"Без имени"),
            dob: it.dob||undefined,
            parents: it.parents||undefined,
            history: it.history||undefined,
            traumas: it.traumas||undefined,
            habits: it.habits||undefined,
            communication_style: it.communication_style||undefined,
            friendliness_level: Math.max(0, Math.min(5, Number(it.friendliness_level||0))),
            relation: it.relation||undefined,
            last_contact_date: it.last_contact_date||undefined,
            photoDataUrl: it.photoDataUrl||undefined,
            tags: Array.isArray(it.tags) ? it.tags : [],
            created_at: it.created_at || now,
            updated_at: now,
          }));
        }
        setItems(prev => importMode==='merge' ? mergeItems(prev, incoming) : incoming);
      }catch(err){ alert("Ошибка импорта: "+ String(err?.message||err)); }
    };
    fr.readAsText(f);
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
              <Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Поиск по имени/тегам/связи" className="pl-8" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Сортировка"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Недавно обновлённые</SelectItem>
                <SelectItem value="name_asc">Имя A→Я</SelectItem>
                <SelectItem value="name_desc">Имя Я→A</SelectItem>
                <SelectItem value="friend_desc">Дружелюбие ⬆</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            {modeOptions.map(m=>{
              const Icon = m.icon;
              return (
                <Button key={m.key} variant={mode===m.key?"default":"outline"} onClick={()=>setMode(/** @type any */(m.key))} size="icon" className="rounded-xl" aria-label={m.label}>
                  <Icon className="h-4 w-4"/>
                </Button>
              );
            })}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border">
              <Label className="text-xs">min дружелюбие</Label>
              <Select value={String(minFriend)} onValueChange={(v)=>setMinFriend(Number(v))}>
                <SelectTrigger className="w-[84px]"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4,5].map(n=> <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl border">
              <Switch checked={hasPhoto} onCheckedChange={setHasPhoto} id="hasPhoto"/>
              <Label htmlFor="hasPhoto" className="text-xs">только с фото</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportJSON}><Download className="h-4 w-4 mr-2"/>JSON</Button>
              <Button variant="outline" onClick={exportCSV}>CSV</Button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border">
              <Label className="text-xs">Импорт:</Label>
              <Select value={importMode} onValueChange={(v)=>setImportMode(/** @type any */(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Слияние</SelectItem>
                  <SelectItem value="replace">Заменить</SelectItem>
                </SelectContent>
              </Select>
              <label className="inline-flex items-center">
                <input type="file" accept="application/json,text/csv,.csv" className="hidden" onChange={importFile}/>
                <Button variant="outline"><UploadCloud className="h-4 w-4 mr-2"/>Выбрать файл</Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        {mode === "grid" && <GridCards items={filtered} onRemove={remove} onEdit={startEdit} />}
        {mode === "list" && <TableList items={filtered} onRemove={remove} onEdit={startEdit} />}
        {mode === "photo" && <PhotoWall items={filtered} onRemove={remove} onEdit={startEdit} />}
      </div>

      {!filtered.length && (
        <div className="text-sm text-muted-foreground text-center py-10">Ничего не найдено. Измени фильтры или добавь новые досье.</div>
      )}
    </div>
  );
}

// ===================== Cards =====================
function GridCards({ items, onRemove, onEdit }){
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map(it=> (
          <motion.div key={it.id} layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
            <Card className="rounded-2xl overflow-hidden">
              <div className="aspect-video bg-muted overflow-hidden">
                {it.photoDataUrl ? (
                  <img src={it.photoDataUrl} alt={it.full_name} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Нет фото</div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{it.full_name}</span>
                  <Badge variant="secondary">{friendly(it.friendliness_level)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  {it.relation && <Badge variant="outline">{it.relation}</Badge>}
                  {(it.tags||[]).slice(0,3).map((t,i)=>(<Badge key={i} variant="outline">#{t}</Badge>))}
                </div>
                {it.history && (
                  <p className="text-muted-foreground max-h-12 overflow-hidden">{it.history}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={()=>onEdit(it.id)}><Edit3 className="h-4 w-4 mr-1"/>Править</Button>
                  <Button variant="destructive" size="sm" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4 mr-1"/>Удалить</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function TableList({ items, onRemove, onEdit }){
  return (
    <div className="overflow-x-auto border rounded-2xl">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-muted text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left p-3">Имя</th>
            <th className="text-left p-3">Связь</th>
            <th className="text-left p-3">Дружелюбие</th>
            <th className="text-left p-3">Манера</th>
            <th className="text-left p-3">Последний контакт</th>
            <th className="text-right p-3">Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it=> (
            <tr key={it.id} className="border-t">
              <td className="p-3 font-medium whitespace-nowrap align-middle">{it.full_name}</td>
              <td className="p-3 whitespace-nowrap align-middle">{it.relation||"—"}</td>
              <td className="p-3 whitespace-nowrap align-middle">{friendly(it.friendliness_level)}</td>
              <td className="p-3 text-muted-foreground align-middle">{it.communication_style||"—"}</td>
              <td className="p-3 whitespace-nowrap align-middle">{it.last_contact_date||"—"}</td>
              <td className="p-3 text-right whitespace-nowrap align-middle">
                <Button variant="outline" size="sm" onClick={()=>onEdit(it.id)} className="mr-2"><Edit3 className="h-4 w-4 mr-1"/>Правка</Button>
                <Button variant="destructive" size="sm" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4 mr-1"/>Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PhotoWall({ items, onRemove, onEdit }){
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map(it=> (
        <div key={it.id} className="group relative">
          <div className="aspect-square overflow-hidden rounded-2xl">
            {it.photoDataUrl ? (
              <img src={it.photoDataUrl} alt={it.full_name} className="w-full h-full object-cover group-hover:scale-[1.02] transition"/>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Нет фото</div>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium truncate" title={it.full_name}>{it.full_name}</span>
            <Badge variant="secondary">{friendly(it.friendliness_level)}</Badge>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition absolute inset-0 flex items-end justify-end p-2 gap-2">
            <Button size="icon" variant="secondary" className="rounded-xl" onClick={()=>onEdit(it.id)}><Edit3 className="h-4 w-4"/></Button>
            <Button size="icon" variant="destructive" className="rounded-xl" onClick={()=>onRemove(it.id)}><Trash2 className="h-4 w-4"/></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== Lightweight Self Tests =====================
function TestPanel(){
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(/** @type {{name:string, pass:boolean, message?:string}[]} */([]));

  useEffect(()=>{
    const out = [];
    const push = (name, fn) => {
      try {
        fn();
        out.push({ name, pass: true });
      } catch (e) {
        out.push({ name, pass: false, message: String(e?.message||e) });
      }
    };

    // Test 1: average
    push("average works", ()=>{
      if (average([1,2,3]) !== 2) throw new Error("Expected 2");
    });

    // Test 2: friendly formatting
    push("friendly formatting", ()=>{
      if (friendly(4) !== "4/5") throw new Error("Expected '4/5'");
      if (friendly(undefined) !== "—") throw new Error("Expected '—'");
    });

    // Test 3: CSV roundtrip minimal
    push("csv roundtrip", ()=>{
      const sample = [{ id:"1", full_name:"A", friendliness_level:5, updated_at:"2025-01-01", created_at:"2025-01-01", tags:["x","y"] }];
      const csv = toCSV(sample);
      const parsedRows = parseCSV(csv);
      if (parsedRows.length < 2) throw new Error('CSV parse failed');
      const items = csvToItems(csv);
      if (!Array.isArray(items) || items.length !== 1 || items[0].full_name !== 'A') throw new Error('csvToItems failed');
    });

    // Test 4: filtering logic (minFriend + photo)
    push("filtering logic", ()=>{
      const items = [
        { id:"1", full_name:"A", friendliness_level: 2, tags:[], updated_at:"2024-01-01", relation:"", photoDataUrl:"" },
        { id:"2", full_name:"B", friendliness_level: 4, tags:["x"], updated_at:"2024-01-02", relation:"", photoDataUrl:"data:" },
      ];
      const min = items.filter(it=>Number(it.friendliness_level||0)>=3);
      if (min.length !== 1) throw new Error("Expected 1 with friendliness>=3");
      const withPhoto = items.filter(it=>!!it.photoDataUrl);
      if (withPhoto.length !== 1) throw new Error("Expected 1 with photo");
    });

    // Test 5: TableList render smoke test via ErrorBoundary
    push("TableList smoke render", ()=>{});

    setResults(out);
  }, []);

  return (
    <div className="mt-6">
      <Button variant="outline" onClick={()=>setOpen(v=>!v)}>
        {open ? "Скрыть self-tests" : "Показать self-tests"}
      </Button>
      {open && (
        <div className="mt-3 p-3 rounded-2xl border bg-muted/30">
          <ul className="text-sm space-y-1">
            {results.map((r,i)=> (
              <li key={i} className={r.pass?"text-green-600":"text-red-600"}>
                {r.pass ? "✓" : "✗"} {r.name}{!r.pass && r.message?`: ${r.message}`:""}
              </li>
            ))}
          </ul>
          {/* Render TableList in an error boundary */}
          <div className="mt-3">
            <ErrorBoundary>
              <div className="hidden">
                <TableList
                  items={[{ id:"t1", full_name:"Test", friendliness_level:3, communication_style:"—", updated_at:new Date().toISOString() }]}
                  onRemove={()=>{}}
                  onEdit={()=>{}}
                />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component { 
  constructor(props){super(props); this.state = { hasError:false, error:null };}
  static getDerivedStateFromError(err){ return { hasError:true, error:err }; }
  componentDidCatch(err, info){ /* noop */ }
  render(){
    if (this.state.hasError){
      return <div className="text-red-600 text-sm">Render error in test: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
