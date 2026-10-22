import {useEffect,useState} from 'react'
const W={bekliyor:0,devam:.4,incelemede:.8,bitti:1}
const COL={bekliyor:'#4a3416',devam:'#8a561c',incelemede:'#d98324',bitti:'#f2943a'}
const GUN=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']
const P={ok:'M5 12l4 4 10-10',list:'M4 7l2 2 3-3M4 15l2 2 3-3M13 8h7M13 16h7',book:'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11',link:'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'}
const Ic=({d})=><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>

export default function Dash({sb,go,exp}){
 const[a,setA]=useState([])
 useEffect(()=>{
  const load=async()=>{const{data}=await sb.from('items').select('*');setA(data||[])}
  load()
  const c=sb.channel('dash').on('postgres_changes',{event:'*',schema:'public',table:'items'},load).subscribe()
  return()=>sb.removeChannel(c)
 },[sb])
 const of=k=>a.filter(x=>x.kind===k)
 const sec=of('section'),tk=of('task'),di=of('diary'),rf=of('ref')
 const pct=sec.length?Math.round(100*sec.reduce((s,x)=>s+(W[x.status]||0),0)/sec.length):0
 const done=sec.filter(x=>x.status==='bitti').length,tdone=tk.filter(x=>x.status==='bitti').length
 const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return{l:GUN[d.getDay()],n:di.filter(x=>new Date(x.created_at).toDateString()===d.toDateString()).length}})
 const mx=Math.max(1,...wk.map(x=>x.n))
 const nx=[...sec,...tk].filter(x=>x.due&&x.status!=='bitti').sort((p,q)=>p.due.localeCompare(q.due))[0]
 const gun=nx?Math.ceil((new Date(nx.due+'T23:59:00')-new Date())/864e5):null
 const msg=!sec.length?'Bölümler sekmesinden şablonu oluşturarak başla.':nx?(nx.title||'Görev')+(gun<0?' için süre geçti.':gun===0?' bugün teslim.':' için '+gun+' gün kaldı.'):'Yaklaşan son tarih yok.'
 const R=44,C=2*Math.PI*R
 const tiles=[['Biten bölüm',done+'/'+sec.length,sec.length?done/sec.length:0,P.ok,'bolum'],['Biten görev',tdone+'/'+tk.length,tk.length?tdone/tk.length:0,P.list,'gorev'],['Günlük kaydı',di.length,Math.min(1,di.length/20),P.book,'gunluk'],['Kaynak',rf.length,Math.min(1,rf.length/10),P.link,'kaynak']]
 const st=['bekliyor','devam','incelemede','bitti'].map(s=>[s,sec.filter(x=>x.status===s).length])
 return <>
  <div className="card hero2">
   <svg className="ring" viewBox="0 0 108 108">
    <circle className="rt" cx="54" cy="54" r={R} transform="rotate(-90 54 54)"/>
    <circle className="rf" cx="54" cy="54" r={R} transform="rotate(-90 54 54)" strokeDasharray={C} strokeDashoffset={C*(1-pct/100)} style={{'--c':C}}/>
    <text x="54" y="63" textAnchor="middle">{pct}</text>
   </svg>
   <div><span className="pill">Rapor ilerlemesi</span><h3>%{pct} tamamlandı</h3><div className="mut">{msg}</div></div>
  </div>
  <div className="grid2">{tiles.map(t=><button key={t[0]} className="tile" onClick={()=>go(t[4])}>
   <Ic d={t[3]}/><b>{t[1]}</b><span>{t[0]}</span><div className="meter"><i style={{width:Math.round(t[2]*100)+'%'}}/></div></button>)}</div>
  <div className="card"><h3>Son 7 günde günlük</h3>
   <div className="bars">{wk.map((x,i)=><div className="col" key={i}>{x.n>0&&<em>{x.n}</em>}<div className="bar" style={{height:(8+x.n/mx*80)+'%'}}/><span>{x.l}</span></div>)}</div></div>
  <div className="card"><h3>Bölüm durumu</h3>
   <div className="stack">{st.filter(s=>s[1]).map(s=><i key={s[0]} style={{flex:s[1],background:COL[s[0]]}}/>)}{!sec.length&&<i style={{flex:1,background:'#2a2118'}}/>}</div>
   <div className="legend">{st.map(s=><span key={s[0]}>{s[0]} {s[1]}</span>)}</div></div>
  <button style={{width:'100%'}} onClick={exp}>Raporu Word olarak indir</button>
 </>
}
