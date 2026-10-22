import {useEffect,useState,useCallback} from 'react'
import {createClient} from '@supabase/supabase-js'
const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY)
const SECTIONS=['Özet','Giriş','Yöntem','Bulgular','Sonuç']
const HINT={Özet:'Amaç, yöntem ve sonuç, kısaca',Giriş:'Problem, motivasyon, literatür',Yöntem:'Ne yaptınız, hangi araçları kullandınız',Bulgular:'Sonuçlar, grafikler, ölçümler',Sonuç:'Çıkarımlar ve gelecek çalışma'}
const ST=['bekliyor','devam','incelemede','bitti']
const norm=u=>u.trim().toLowerCase().replace(/[^a-z0-9_.]/g,'')
const esc=t=>(t||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>')
const notify=(t,b)=>{try{Notification.permission==='granted'&&navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:b}))}catch{}}
const fmt=d=>new Date(d).toLocaleString('tr-TR',{dateStyle:'short',timeStyle:'short'})

function useItems(kind){
 const[l,setL]=useState([])
 const load=useCallback(async()=>{const{data}=await sb.from('items').select('*').eq('kind',kind).order('created_at',{ascending:false});setL(data||[])},[kind])
 useEffect(()=>{load();const c=sb.channel('i'+kind).on('postgres_changes',{event:'*',schema:'public',table:'items'},load).subscribe();return()=>sb.removeChannel(c)},[load,kind])
 return l
}
const up=(id,v)=>sb.from('items').update(v).eq('id',id)
const del=id=>sb.from('items').delete().eq('id',id)

function Auth(){
 const[u,setU]=useState(''),[p,setP]=useState(''),[e,setE]=useState('')
 const go=async reg=>{
  setE('');const em=norm(u)+'@takim.app'
  if(norm(u).length<3)return setE('Kullanıcı adı en az 3 harf/rakam olmalı')
  if(reg){
   const{data,error}=await sb.auth.signUp({email:em,password:p})
   if(error)return setE(error.message)
   if(data.user){await sb.from('profiles').insert({id:data.user.id,username:norm(u)});location.reload()}
  }else{
   const{error}=await sb.auth.signInWithPassword({email:em,password:p})
   if(error)setE('Kullanıcı adı veya şifre hatalı')
  }}
 return <div className="box"><h2>Rapor Asistanı</h2>
  <input placeholder="Kullanıcı adı (harf, rakam)" value={u} onChange={x=>setU(x.target.value)}/>
  <input type="password" placeholder="Şifre (en az 6 karakter)" value={p} onChange={x=>setP(x.target.value)}/>
  <button onClick={()=>go(false)}>Giriş yap</button><button className="alt" onClick={()=>go(true)}>Hesap oluştur</button>
  <p className="err">{e}</p></div>
}

function Sections({users}){
 const l=useItems('section')
 const rows=[...l].sort((a,b)=>SECTIONS.indexOf(a.title)-SECTIONS.indexOf(b.title))
 if(!rows.length)return <div className="card"><p>Rapor bölümleri henüz yok.</p><button onClick={()=>sb.from('items').insert(SECTIONS.map(t=>({kind:'section',title:t,status:'bekliyor'})))}>Bölüm şablonunu oluştur</button></div>
 return rows.map(r=><div className="card" key={r.id}>
  <h3>{r.title}</h3><div className="mut">{HINT[r.title]}</div>
  <div className="row">
   <select value={r.status||'bekliyor'} onChange={e=>up(r.id,{status:e.target.value})}>{ST.map(s=><option key={s}>{s}</option>)}</select>
   <select value={r.assignee||''} onChange={e=>up(r.id,{assignee:e.target.value})}><option value="">Sorumlu yok</option>{users.map(x=><option key={x.id}>{x.username}</option>)}</select>
   <input type="date" value={r.due||''} onChange={e=>up(r.id,{due:e.target.value||null})}/>
  </div>
  <textarea defaultValue={r.body||''} placeholder="Taslak metin" onBlur={e=>e.target.value!==(r.body||'')&&up(r.id,{body:e.target.value})}/>
 </div>)
}

function Tasks({me,users}){
 const l=useItems('task'),[t,setT]=useState(''),[a,setA]=useState(''),[d,setD]=useState('')
 const add=async()=>{if(!t.trim())return;await sb.from('items').insert({kind:'task',title:t,assignee:a||null,due:d||null,author:me.username,status:'bekliyor'});setT('')}
 return <>
  <div className="card"><input placeholder="Yeni görev" value={t} onChange={e=>setT(e.target.value)}/>
   <div className="row"><select value={a} onChange={e=>setA(e.target.value)}><option value="">Sorumlu yok</option>{users.map(x=><option key={x.id}>{x.username}</option>)}</select>
   <input type="date" value={d} onChange={e=>setD(e.target.value)}/></div><button onClick={add}>Görev ekle</button></div>
  {l.map(r=><div className="card" key={r.id}><b>{r.title}</b><div className="mut">{r.assignee||'Sorumlu yok'} {r.due&&'· son tarih '+r.due}</div>
   <select value={r.status} onChange={e=>up(r.id,{status:e.target.value})}>{ST.map(s=><option key={s}>{s}</option>)}</select>
   <button className="alt" onClick={()=>del(r.id)}>Sil</button></div>)}
 </>
}

function Feed({kind,me,ph}){
 const l=useItems(kind),[t,setT]=useState('')
 const add=async()=>{if(!t.trim())return;await sb.from('items').insert({kind,body:t,author:me.username});setT('')}
 return <>
  <div className="card"><textarea placeholder={ph} value={t} onChange={e=>setT(e.target.value)}/><button onClick={add}>Ekle</button></div>
  {l.map(r=><div className="card" key={r.id}><div style={{whiteSpace:'pre-wrap'}}>{r.body}</div>
   <div className="mut">{r.author} · {fmt(r.created_at)}</div>{r.author===me.username&&<button className="alt" onClick={()=>del(r.id)}>Sil</button>}</div>)}
 </>
}

function Msgs({me,users}){
 const[l,setL]=useState([]),[to,setTo]=useState(''),[k,setK]=useState('mesaj'),[b,setB]=useState(''),[at,setAt]=useState('')
 const load=useCallback(async()=>{const{data}=await sb.from('messages').select('*').order('created_at',{ascending:false}).limit(100);setL(data||[])},[])
 useEffect(()=>{load();const c=sb.channel('m').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},p=>{load();const m=p.new;if(m.sender!==me.id&&m.kind!=='hatırlatıcı')notify(m.sender_name+' · '+m.kind,m.body)}).subscribe();return()=>sb.removeChannel(c)},[load,me])
 const send=async()=>{if(!b.trim())return;await sb.from('messages').insert({sender:me.id,sender_name:me.username,to_id:to||null,kind:k,body:b,remind_at:k==='hatırlatıcı'&&at?new Date(at).toISOString():null});setB('');setAt('')}
 return <>
  <div className="card">
   <div className="row"><select value={to} onChange={e=>setTo(e.target.value)}><option value="">Herkese</option>{users.filter(x=>x.id!==me.id).map(x=><option key={x.id} value={x.id}>{x.username}</option>)}</select>
   <select value={k} onChange={e=>setK(e.target.value)}><option>mesaj</option><option>öneri</option><option>hatırlatıcı</option></select></div>
   {k==='hatırlatıcı'&&<input type="datetime-local" value={at} onChange={e=>setAt(e.target.value)}/>}
   <textarea placeholder="Yaz..." value={b} onChange={e=>setB(e.target.value)}/><button onClick={send}>Gönder</button>
   <button className="alt" onClick={()=>Notification.requestPermission()}>Bildirimlere izin ver</button></div>
  {l.map(m=><div className="card" key={m.id}><div className="mut">{m.sender_name} → {users.find(x=>x.id===m.to_id)?.username||'herkes'} · {m.kind}{m.remind_at&&' · '+fmt(m.remind_at)}</div>
   <div style={{whiteSpace:'pre-wrap'}}>{m.body}</div><div className="mut">{fmt(m.created_at)}</div></div>)}
 </>
}

export default function App(){
 const[s,setS]=useState(undefined),[me,setMe]=useState(null),[users,setUsers]=useState([]),[tab,setTab]=useState('bolum')
 useEffect(()=>{sb.auth.getSession().then(({data})=>setS(data.session));const{data:{subscription}}=sb.auth.onAuthStateChange((_,x)=>setS(x));return()=>subscription.unsubscribe()},[])
 useEffect(()=>{if(!s)return;sb.from('profiles').select('*').then(({data})=>{setUsers(data||[]);setMe((data||[]).find(x=>x.id===s.user.id)||null)})},[s])
 useEffect(()=>{
  if(!me)return
  const t=setInterval(async()=>{
   const since=new Date(Date.now()-864e5).toISOString()
   const{data}=await sb.from('messages').select('*').eq('kind','hatırlatıcı').lte('remind_at',new Date().toISOString()).gte('remind_at',since)
   const done=JSON.parse(localStorage.getItem('done')||'[]')
   ;(data||[]).filter(m=>!done.includes(m.id)).forEach(m=>{notify('Hatırlatıcı',m.body);done.push(m.id)})
   localStorage.setItem('done',JSON.stringify(done))
  },30000)
  return()=>clearInterval(t)
 },[me])
 const exp=async()=>{
  const{data}=await sb.from('items').select('*').eq('kind','section')
  const refs=(await sb.from('items').select('*').eq('kind','ref').order('created_at')).data||[]
  const h=SECTIONS.map(n=>`<h2>${n}</h2><p>${esc((data||[]).find(x=>x.title===n)?.body)}</p>`).join('')+'<h2>Kaynakça</h2>'+refs.map(r=>`<p>${esc(r.body)}</p>`).join('')
  const a=document.createElement('a')
  a.href=URL.createObjectURL(new Blob(['<html><meta charset="utf-8"><body>'+h+'</body></html>'],{type:'application/msword'}))
  a.download='rapor.doc';a.click()
 }
 if(s===undefined)return null
 if(!s)return <Auth/>
 if(!me)return <div className="box"><p>Profil yükleniyor...</p><button onClick={()=>sb.auth.signOut()}>Çıkış</button></div>
 const T=[['bolum','Bölümler'],['gorev','Görevler'],['gunluk','Günlük'],['mesaj','Mesajlar'],['kaynak','Kaynakça']]
 return <><nav>{T.map(([k,n])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{n}</button>)}
  <button onClick={exp}>Word</button><button onClick={()=>sb.auth.signOut()}>Çıkış ({me.username})</button></nav>
  <div className="wrap">
   {tab==='bolum'&&<Sections users={users}/>}
   {tab==='gorev'&&<Tasks me={me} users={users}/>}
   {tab==='gunluk'&&<Feed kind="diary" me={me} ph="Bugün ne yaptınız?"/>}
   {tab==='mesaj'&&<Msgs me={me} users={users}/>}
   {tab==='kaynak'&&<Feed kind="ref" me={me} ph="Kaynağı yazın (yazar, başlık, yıl, bağlantı)"/>}
  </div></>
}
