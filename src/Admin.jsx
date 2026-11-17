import {useState,useEffect} from 'react';
import {API} from './api.js';
import {Mark} from './Art.jsx';
const post=(a,b)=>fetch(API+'?action='+a,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})}).then(r=>r.json());
const TABS=['Site','Home','Products','About','Founder','Contact'];
export default function Admin({content,setContent}){
 const [ok,setOk]=useState(null),[pw,setPw]=useState(''),[d,setD]=useState(content),[tab,setTab]=useState('Site'),[msg,setMsg]=useState('');
 useEffect(()=>{fetch(API+'?action=check').then(r=>r.json()).then(j=>setOk(!!j.ok)).catch(()=>setOk(false))},[]);
 useEffect(()=>setD(content),[content]);
 const login=async e=>{e.preventDefault();const j=await post('login',{password:pw}).catch(()=>({}));j.ok?setOk(true):setMsg('Galat password')};
 const get=p=>p.reduce((o,k)=>o?.[k],d);
 const set=(p,v)=>{const n=JSON.parse(JSON.stringify(d));let o=n;p.slice(0,-1).forEach(k=>o=o[k]);o[p[p.length-1]]=v;setD(n)};
 const field=(p,l,area)=>{const P=area?'textarea':'input';return <label key={p.join('.')}>{l}<P value={get(p)??''} onChange={e=>set(p,e.target.value)}/></label>};
 const img=(p,l)=><label key={p.join('.')}>{l}{get(p)&&<img src={get(p)} style={{maxHeight:70,display:'block'}}/>}<input type="file" accept="image/*" onChange={async e=>{const fd=new FormData();fd.append('file',e.target.files[0]);const j=await fetch(API+'?action=upload',{method:'POST',body:fd}).then(r=>r.json());j.url?set(p,j.url):setMsg('Upload fail (max 3MB, jpg/png/webp)')}}/></label>;
 const list=(p,tpl,fs)=>{const arr=get(p);return <div>{arr.map((it,i)=><div className="card" key={i}>{fs.map(([k,l,a,im])=>im?img([...p,i,k],l):field([...p,i,k],l,a))}<button className="btn sm" onClick={()=>set(p,arr.filter((_,j)=>j!==i))}>Delete</button></div>)}<button className="btn sm" onClick={()=>set(p,[...arr,{...tpl,id:Date.now()+''}])}>+ Add</button></div>};
 const save=async()=>{const j=await post('save',{content:d}).catch(()=>({}));if(j.ok){setContent(d);setMsg('✅ Save ho gaya')}else setMsg('❌ Save fail – dubara login karo')};
 if(ok===null)return <div className="adm">Loading…</div>;
 if(!ok)return <form className="adm login" onSubmit={login}><Mark s={64}/><h2>HoneyKey Admin</h2><input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)}/><button className="btn">Login</button><p>{msg}</p></form>;
 const T={
  Site:<>{field(['brand','name'],'Brand name')}{field(['brand','tagline'],'Tagline')}{field(['brand','footer'],'Footer text')}</>,
  Home:<>{field(['hero','chip'],'Chip text')}{field(['hero','title'],'Hero title')}{field(['hero','sub'],'Hero sub-text',1)}{field(['hero','cta'],'Button text')}<h3>Highlights</h3>{list(['usps'],{icon:'🍯',t:'',d:''},[['icon','Icon (emoji)'],['t','Title'],['d','Detail']])}<h3>Steps</h3>{list(['steps'],{t:'',d:''},[['t','Title'],['d','Detail']])}</>,
  Products:list(['products'],{name:'New product',size:'7 g',price:'0',tag:'',color:'#F5A400',image:'',desc:''},[['name','Name'],['size','Size'],['price','Price (₹)'],['tag','Ribbon (e.g. New)'],['color','Honey color (#hex)'],['desc','Description',1],['image','Image (optional)',0,1]]),
  About:<>{field(['about','title'],'Title')}{field(['about','text'],'Story',1)}<h3>Points</h3>{list(['about','points'],{t:''},[['t','Point']])}</>,
  Founder:<>{field(['founder','name'],'Name')}{field(['founder','role'],'Role')}{field(['founder','quote'],'Quote')}{field(['founder','bio'],'Bio',1)}{img(['founder','photo'],'Photo')}</>,
  Contact:<>{['phone','whatsapp','email','address','hours','instagram'].map(k=>field(['contact',k],k))}<small>WhatsApp: country code ke saath, bina + ke (e.g. 919876543210)</small></>};
 return <div className="adm"><div className="admtop"><b><Mark s={30}/> Admin</b><span>{msg}</span><button className="btn sm" onClick={save}>💾 Save</button><a className="btn sm ghost" href="/">Site dekho</a><button className="btn sm ghost" onClick={()=>post('logout').then(()=>setOk(false))}>Logout</button></div>
 <div className="tabs">{TABS.map(t=><button key={t} className={t===tab?'on':''} onClick={()=>setTab(t)}>{t}</button>)}</div>{T[tab]}</div>}
