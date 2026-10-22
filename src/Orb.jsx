import {useEffect,useRef,useState} from 'react'

export function Orb({size=120}){
 const c=useRef(null)
 useEffect(()=>{
  const cv=c.current,x=cv.getContext('2d');let st=0,raf
  const draw=()=>{
   st+=.03
   const v=.25+.2*Math.sin(st*1.7)+.1*Math.sin(st*.7)
   x.clearRect(0,0,200,200);x.globalCompositeOperation='screen'
   const g=x.createRadialGradient(100,100,0,100,100,80)
   g.addColorStop(0,'rgba(255,235,59,.95)');g.addColorStop(.4,'rgba(255,140,0,.85)')
   g.addColorStop(.7,'rgba(245,124,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)')
   x.fillStyle=g;x.beginPath();x.arc(100,100,80,0,7);x.fill()
   for(let i=0;i<3;i++){
    const a=st+i*2.1,px=100+Math.cos(a)*(18+v*20),py=100+Math.sin(a*1.3)*(18+v*20)
    const r=50+Math.sin(st*1.2+i)*12+v*15
    const w=x.createRadialGradient(px,py,0,px,py,r)
    w.addColorStop(0,i?'rgba(255,180,0,.7)':'rgba(255,255,255,.8)')
    w.addColorStop(.6,i?'rgba(255,100,0,.3)':'rgba(255,160,0,.5)')
    w.addColorStop(1,'rgba(0,0,0,0)')
    x.fillStyle=w;x.beginPath();x.arc(px,py,r,0,7);x.fill()
   }
   cv.style.transform='scale('+(1+v*.2)+')'
   raf=requestAnimationFrame(draw)
  }
  draw();return()=>cancelAnimationFrame(raf)
 },[])
 return <div className="orb" style={{width:size,height:size}}><div className="aura"/><canvas ref={c} width="200" height="200"/></div>
}

export function Quick({onSend}){
 const[o,setO]=useState(false),[t,setT]=useState(''),[ok,setOk]=useState(false)
 const send=async()=>{
  if(!t.trim())return
  await onSend(t);setT('');setOk(true);setTimeout(()=>setOk(false),1500)
 }
 return <div className={'quick'+(o?' open':'')}>
  <button className="qorb" onClick={()=>setO(true)} aria-label="Günlüğe hızlı not"><Orb size={64}/></button>
  <div className="qbar">
   <input placeholder="Günlüğe hızlı not..." value={t} onChange={e=>setT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
   <button onClick={send}>{ok?'✓':'Ekle'}</button>
   <button className="alt" onClick={()=>setO(false)}>×</button>
  </div>
 </div>
}
