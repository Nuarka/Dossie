'use client';
import { useEffect, useState } from 'react';

function Badge({ v }){ return <span className="badge">🤝 {v ?? 0}</span>; }
function Meter({ v=0 }){ const pct = Math.max(0, Math.min(100, (Number(v)||0)*10)); return <div style={{width:'100%',height:10,borderRadius:999,background:'linear-gradient(180deg,#f1f5f9,#e2e8f0)',overflow:'hidden',border:'1px solid var(--border)'}}><span style={{display:'block',height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#22d3ee,#60a5fa,#a78bfa)'}} /></div>; }

async function api(path, opts={}){
  const res = await fetch(path, { headers:{'Content-Type':'application/json'}, cache:'no-store', ...opts });
  if (!res.ok) throw new Error((await res.json()).error || 'api_error');
  return await res.json();
}

export default function Page(){
  const [list,setList] = useState([]);
  const [q,setQ] = useState('');
  const [sort,setSort] = useState('updatedDesc');
  const [open,setOpen] = useState(false);
  const [cur,setCur] = useState(null);
  const [facts,setFacts] = useState([]);
  const [stories,setStories] = useState([]);
  const [photoPreview,setPhotoPreview] = useState('');

  async function load(){ setList(await api('/api/people')); }
  useEffect(()=>{ load(); },[]);

  const filtered = list
    .filter(p => (p.name + ' ' + (p.tags||'') + ' ' + (p.bio||'')).toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=> sort==='nameAsc' ? (a.name||'').localeCompare(b.name||'') : sort==='friendlinessDesc' ? (b.friendliness||0)-(a.friendliness||0) : 0);

  function newPerson(){ setCur({friendliness:5}); setFacts([]); setStories([]); setPhotoPreview(''); setOpen(true); }
  async function openPerson(id){
    const data = await api('/api/people/'+id);
    setCur(data.person); setFacts(data.facts); setStories(data.stories); setPhotoPreview(data.person.photo_url || ''); setOpen(true);
  }
  async function save(e){
    e.preventDefault();
    const f = e.currentTarget;
    const payload = {
      name: f.name.value.trim(), nickname: f.nickname.value.trim(), dob: f.dob.value || null,
      friendliness: Number(f.friendliness.value||0), family: f.family.value.trim(), relationship: f.relationship.value.trim(),
      bio: f.bio.value.trim(), events: f.events.value.trim(), traumas: f.traumas.value.trim(), habits: f.habits.value.trim(),
      tags: f.tags.value.trim(), photo_url: f.photo_url.value || null, photo_caption: f.photo_caption.value.trim() || null
    };
    if (cur?.id) await api('/api/people/'+cur.id, { method:'PUT', body: JSON.stringify(payload) });
    else await api('/api/people', { method:'POST', body: JSON.stringify(payload) });
    setOpen(false); await load();
  }
  async function del(){
    if (!cur?.id) return;
    if (confirm('Удалить досье?')){ await api('/api/people/'+cur.id, { method:'DELETE' }); setOpen(false); await load(); }
  }

  async function uploadFile(file){
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method:'POST', body: fd });
    if (!res.ok){ alert('Ошибка загрузки'); return; }
    const { url } = await res.json();
    setPhotoPreview(url);
    const hidden = document.querySelector('input[name="photo_url"]'); if (hidden) hidden.value = url;
  }

  async function addFact(){
    const date = prompt('Дата (YYYY-MM-DD)',''); const title=prompt('Заголовок факта',''); const note=prompt('Примечание','');
    if (!cur?.id) return; setFacts(await api(`/api/people/${cur.id}/facts`, { method:'POST', body: JSON.stringify({ date, title, note }) }));
  }
  async function addStory(){
    const date = prompt('Дата (YYYY-MM-DD)',''); const title=prompt('Заголовок истории',''); const content=prompt('Текст истории','');
    if (!cur?.id) return; setStories(await api(`/api/people/${cur.id}/stories`, { method:'POST', body: JSON.stringify({ date, title, content }) }));
  }
  async function rmFact(id){ await api('/api/facts/'+id, { method:'DELETE' }); setFacts(await api('/api/people/'+cur.id+'/facts')); }
  async function rmStory(id){ await api('/api/stories/'+id, { method:'DELETE' }); setStories(await api('/api/people/'+cur.id+'/stories')); }

  return (
    <>
      <header>
        <div className="container" style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0'}}>
          <div className="brand"><span className="dot"></span><b>Dossier</b></div>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            {/* theme toggle could be added here if needed */}
          </div>
        </div>
      </header>

      <main className="container" style={{padding:'16px 0'}}>
        <section className="hero fade-in">
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:24,fontWeight:600,marginBottom:4}}>Каталог с серверной БД</div>
              <div style={{color:'var(--muted)'}}>Vercel Postgres + Blob. Фото, подписи, факты и истории.</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn-primary" onClick={newPerson}>+ Новое досье</button>
              <button className="btn" onClick={load}>Обновить</button>
            </div>
          </div>
        </section>

        <section className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:12}}>
          <input className="input" placeholder="Поиск…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="updatedDesc">Сначала новые</option>
            <option value="nameAsc">По имени (А→Я)</option>
            <option value="friendlinessDesc">Дружелюбие (высок→низ)</option>
          </select>
          <div></div>
        </section>

        <section id="cards" className="grid grid-3" style={{marginTop:12}}>
          {filtered.length===0 && <div style={{color:'var(--muted)'}}>Пусто. Добавьте первое досье.</div>}
          {filtered.map(p => (
            <div key={p.id} className="card fade-in">
              {p.photo_url && <img src={p.photo_url} className="photo" alt="Фото"/>}
              <div className="caption">{p.photo_caption || ''}</div>
              <div style={{display:'flex',justifyContent:'space-between', gap:12, marginTop:8}}>
                <div>
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div style={{color:'var(--muted)'}}>{p.nickname || ''}</div>
                </div>
                <Badge v={p.friendliness}/>
              </div>
              <div className="mt-2 text-sm" style={{color:'var(--muted)'}}>{(p.bio||'').slice(0,160)}</div>
              <div style={{marginTop:8}}><Meter v={p.friendliness}/></div>
              <div style={{marginTop:8}}>{(p.tags||'').split(',').filter(Boolean).slice(0,6).map((t,i)=> <span key={i} className="tag">#{t.trim()}</span>)}</div>
              <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
                <button className="btn" onClick={()=>openPerson(p.id)}>Открыть</button>
                <button className="btn-secondary" onClick={async()=>{ if(confirm('Удалить досье?')){ await api('/api/people/'+p.id, { method:'DELETE' }); load(); } }}>Удалить</button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {open && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{width:'min(720px, 95vw)',borderRadius:16,background:'var(--card)',padding:0,border:'1px solid var(--border)',boxShadow:'var(--shadow)'}}>
            <div className="head">
              <b>{cur?.id?'Редактирование досье':'Новое досье'}</b>
              <button className="icon-btn" onClick={()=>setOpen(false)}>✕</button>
            </div>
            <div className="body">
              <form onSubmit={save} className="grid" style={{gap:12}}>
                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><div className="footer-note">Имя / ФИО</div><input name="name" className="input" defaultValue={cur?.name||''} required/></div>
                  <div><div className="footer-note">Ник</div><input name="nickname" className="input" defaultValue={cur?.nickname||''}/></div>
                  <div><div className="footer-note">Дата рождения</div><input name="dob" type="date" className="input" defaultValue={cur?.dob||''}/></div>
                  <div><div className="footer-note">Дружелюбность (0—10)</div><input name="friendliness" type="number" min="0" max="10" step="1" className="input" defaultValue={cur?.friendliness ?? 5}/></div>
                </div>

                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><div className="footer-note">Родители / семья</div><textarea name="family" className="textarea" defaultValue={cur?.family||''}/></div>
                  <div><div className="footer-note">Отношения к вам</div><textarea name="relationship" className="textarea" defaultValue={cur?.relationship||''}/></div>
                </div>

                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><div className="footer-note">История / био</div><textarea name="bio" className="textarea" defaultValue={cur?.bio||''}/></div>
                  <div><div className="footer-note">События</div><textarea name="events" className="textarea" defaultValue={cur?.events||''}/></div>
                </div>

                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><div className="footer-note">Чувствительные темы</div><textarea name="traumas" className="textarea" defaultValue={cur?.traumas||''}/></div>
                  <div><div className="footer-note">Привычки и манера общения</div><textarea name="habits" className="textarea" defaultValue={cur?.habits||''}/></div>
                </div>

                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><div className="footer-note">Теги (запятая)</div><input name="tags" className="input" defaultValue={cur?.tags||''}/></div>
                  <div><div className="footer-note">Подпись к фото</div><input name="photo_caption" className="input" defaultValue={cur?.photo_caption||''}/></div>
                </div>

                <div>
                  <div className="footer-note" style={{marginBottom:6}}>Фото</div>
                  <div className="dropzone">
                    <input type="hidden" name="photo_url" defaultValue={cur?.photo_url||''} />
                    <div className="dz-preview">
                      {photoPreview ? <img alt="preview" className="preview-img" src={photoPreview}/> :
                        <>Перетащи фото сюда или <label className="dz-choose"><input type="file" onChange={e=> e.target.files?.[0] && uploadFile(e.target.files[0])} style={{display:'none'}}/> выбери файл</label></>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="footer-note" style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                    <input type="checkbox" required/> Этично: есть согласие / не распространяю
                  </label>
                </div>

                <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <button className="btn-primary" type="submit">Сохранить</button>
                  <button className="btn" type="button" onClick={del} disabled={!cur?.id}>Удалить</button>
                </div>

                {!!cur?.id && <>
                  <div className="card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <b>Факты</b>
                      <button className="btn" type="button" onClick={addFact}>+ Факт</button>
                    </div>
                    <ul className="timeline">{facts.map(f => <li key={f.id}><div className="dot"></div><div><div className="item-title">{f.title||'Факт'}</div><div className="item-date">{f.date||''}</div><div>{f.note||''}</div><button className="btn" style={{height:30, marginTop:6}} type="button" onClick={()=>rmFact(f.id)}>Удалить</button></div></li>)}</ul>
                  </div>
                  <div className="card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <b>Истории</b>
                      <button className="btn" type="button" onClick={addStory}>+ История</button>
                    </div>
                    <ul className="timeline">{stories.map(s => <li key={s.id}><div className="dot"></div><div><div className="item-title">{s.title||'История'}</div><div className="item-date">{s.date||''}</div><div>{s.content||''}</div><button className="btn" style={{height:30, marginTop:6}} type="button" onClick={()=>rmStory(s.id)}>Удалить</button></div></li>)}</ul>
                  </div>
                </>}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
