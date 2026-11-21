import {useEffect,useRef,useState} from 'react';
import {Routes,Route,NavLink,Link,useLocation} from 'react-router-dom';
import Admin from './Admin.jsx';
import {Mark,Pack,Drip} from './Art.jsx';
import {api,wa,inr} from './api.js';

function Reveal({children}){const r=useRef();useEffect(()=>{const o=new IntersectionObserver(e=>e.forEach(x=>x.isIntersecting&&x.target.classList.add('in')),{threshold:.12});o.observe(r.current);return()=>o.disconnect()},[]);return <div ref={r} className="rev">{children}</div>}
const Bees=()=><>{[0,1,2].map(i=><span key={i} className="bee" style={{top:`${15+i*25}%`,animationDelay:`${-i*4}s`,animationDuration:`${11+i*3}s`}}>🐝</span>)}</>;
const Who=({f})=>f.photo?<img className="face" src={f.photo} alt={f.name}/>:<div className="face">{(f.name||'H')[0]}</div>;

function Nav({n,open}){return <nav className="top"><div className="awning"/><div className="sign"><div className="wrap bar">
<Link to="/" className="brand"><Mark s={40}/><b>Honey<i>Key</i></b></Link>
<div className="links">{[['/','Home'],['/products','Shop'],['/track','Track'],['/about','About'],['/faq','FAQ'],['/contact','Contact']].map(([t,l])=><NavLink key={t} to={t} end={t==='/'}>{l}</NavLink>)}
<button className="cartb" onClick={open} aria-label="Cart">🛒{n>0&&<em>{n}</em>}</button></div></div></div></nav>}

function Card({p,c,add}){return <div className="item">{p.tag&&<span className="ribbon">{p.tag}</span>}
<div className="art">{p.image?<img src={p.image} alt={p.name}/>:<Pack c={p.color}/>}</div>
<h3>{p.name}</h3><p className="muted">{p.size} · <b>{inr(p.price)}</b></p><p>{p.desc}</p>
{p.soldOut?<button className="btn sm" disabled>Sold out</button>:<button className="btn sm" onClick={()=>add(p.id)}>🛒 Cart mein daalo</button>}<div className="plank"/></div>}

function Cart({c,cart,setCart,close}){
 const st=c.settings,lines=c.products.filter(p=>cart[p.id]).map(p=>({...p,q:cart[p.id]}));
 const sub=lines.reduce((s,p)=>s+p.price*p.q,0),fee=sub&&sub<+st.freeAbove?+st.deliveryFee:0;
 const [step,setStep]=useState(0),[f,setF]=useState({name:'',phone:'',address:'',pin:'',note:'',pay:'COD'}),[err,setErr]=useState(''),[done,setDone]=useState(null),[busy,setBusy]=useState(false);
 const chg=(id,d)=>setCart(x=>{const q=(x[id]||0)+d,n={...x};q>0?n[id]=Math.min(q,99):delete n[id];return n});
 const go=async()=>{setBusy(true);setErr('');const r=await api('order',{...f,items:lines.map(p=>({id:p.id,qty:p.q}))}).catch(()=>({error:'Network error'}));setBusy(false);if(r.no){setDone(r);setCart({})}else setErr(r.error||'Error')};
 const inp=(k,l,t)=><label key={k}>{l}{t?<textarea rows="2" value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>:<input value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>}</label>;
 return <div className="ov" onClick={close}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="x" onClick={close}>✕</button>
 {done?<div style={{textAlign:'center'}}><h2>🎉 Order mil gaya!</h2><p>Order No: <b>{done.no}</b></p><p>Total: <b>{inr(done.total)}</b> ({f.pay==='UPI'?'UPI':'Cash on Delivery'})</p>
  {f.pay==='UPI'&&st.upi&&<p>UPI ID: <b>{st.upi}</b> par pay karke WhatsApp pe screenshot bhejo.</p>}
  <a className="btn" href={wa(c,`Hi HoneyKey! Mera order ${done.no} hai (${f.name}).`)} target="_blank" rel="noreferrer">WhatsApp pe confirm</a>
  <p><Link className="btn ghost" to="/track" onClick={close}>Order track karo</Link></p></div>
 :!lines.length?<p>Cart khaali hai 🍯</p>
 :<><h2>Aapka Cart</h2>{lines.map(p=><div className="ln" key={p.id}><div><b>{p.name}</b><br/><small>{inr(p.price)} · {p.size}</small></div><div className="qty"><button onClick={()=>chg(p.id,-1)}>−</button>{p.q}<button onClick={()=>chg(p.id,1)}>+</button></div></div>)}
  <p className="tot">Subtotal {inr(sub)}<br/>Delivery {fee?inr(fee):'FREE'}<br/><b>Total {inr(sub+fee)}</b></p>{!fee&&sub>0||<small>{inr(st.freeAbove)} se upar delivery free</small>}
  {step===0?<button className="btn" onClick={()=>setStep(1)}>Checkout →</button>:<>{inp('name','Naam')}{inp('phone','Phone (10 digit)')}{inp('address','Poora address',1)}{inp('pin','Pincode')}{inp('note','Note (optional)')}
   <label>Payment<select value={f.pay} onChange={e=>setF({...f,pay:e.target.value})}><option value="COD">Cash on Delivery</option><option value="UPI">UPI</option></select></label>
   {err&&<p className="err">{err}</p>}<button className="btn" disabled={busy} onClick={go}>{busy?'Ruko…':'Order karo'}</button></>}</>}</aside></div>}

function Home({c,add}){const f=c.founder;return <>
<section className="hero"><Bees/><div className="wrap hero-in"><div><span className="chip">{c.hero.chip}</span><h1>{c.hero.title}</h1><p>{c.hero.sub}</p>
<Link className="btn" to="/products">{c.hero.cta}</Link> <Link className="btn ghost" to="/about">Hamari kahani</Link></div>
<div className="hero-art"><Pack className="float big"/><Pack c="#C77700" className="float b2"/></div></div><Drip/></section>
<div className="marquee"><div>{[...c.usps,...c.usps].map((u,i)=><span key={i}>{u.icon} {u.t}</span>)}</div></div>
<section className="wrap sect"><Reveal><h2>Humari Shelf 🍯</h2><div className="grid">{c.products.slice(0,3).map(p=><Card key={p.id} p={p} c={c} add={add}/>)}</div>
<p style={{textAlign:'center'}}><Link className="btn ghost" to="/products">Poori shop dekho →</Link></p></Reveal></section>
<section className="band"><div className="wrap sect"><Reveal><h2>3 second mein honey</h2><div className="grid">{c.steps.map((s,i)=><div key={i} className="step"><span>{i+1}</span><h3>{s.t}</h3><p>{s.d}</p></div>)}</div></Reveal></div></section>
<section className="wrap sect"><Reveal><div className="grid">{c.usps.map((u,i)=><div key={i} className="usp"><div>{u.icon}</div><h3>{u.t}</h3><p>{u.d}</p></div>)}</div></Reveal></section>
{c.testimonials.length>0&&<section className="band"><div className="wrap sect"><Reveal><h2>Customers kya kehte hain</h2><div className="grid">{c.testimonials.map((t,i)=><div key={i} className="usp"><div>{'⭐'.repeat(+t.stars||5)}</div><p>"{t.text}"</p><b>{t.name}</b> <small>{t.city}</small></div>)}</div></Reveal></div></section>}
<section className="wrap sect"><Reveal><div className="quote"><Who f={f}/><div><h2>"{f.quote}"</h2><p>– {f.name}, {f.role}</p><Link className="btn" to="/about">Founder se milo</Link></div></div></Reveal></section></>}

const Products=({c,add})=><section className="wrap sect"><Reveal><h1>HoneyKey Shop</h1><p className="muted">Har pack easy to use, easy to carry. {inr(c.settings.freeAbove)} se upar delivery free.</p><div className="grid">{c.products.map(p=><Card key={p.id} p={p} c={c} add={add}/>)}</div></Reveal></section>;
const About=({c})=>{const a=c.about,f=c.founder;return <><section className="wrap sect"><Reveal><h1>{a.title}</h1><p className="lead">{a.text}</p><div className="grid">{a.points.map((p,i)=><div key={i} className="usp"><div>🐝</div><h3>{p.t}</h3></div>)}</div></Reveal></section>
<section className="band"><div className="wrap sect"><Reveal><div className="quote"><Who f={f}/><div><h2>{f.name}</h2><p className="muted">{f.role}</p><p>{f.bio}</p></div></div></Reveal></div></section></>};
const Faq=({c})=><section className="wrap sect"><h1>Aksar puchhe jaane wale sawal</h1>{c.faqs.map((x,i)=><details key={i} className="faq"><summary>{x.q}</summary><p>{x.a}</p></details>)}</section>;

function Track(){const [q,setQ]=useState({no:'',phone:''}),[r,setR]=useState(null);const S=['New','Confirmed','Packed','Shipped','Delivered'];
 const go=async e=>{e.preventDefault();setR(await api(`track?no=${encodeURIComponent(q.no)}&phone=${encodeURIComponent(q.phone)}`).catch(()=>({error:'Network error'})))};
 return <section className="wrap sect" style={{maxWidth:560}}><h1>Order Track karo</h1><form onSubmit={go}><label>Order No (e.g. HK1001)<input value={q.no} onChange={e=>setQ({...q,no:e.target.value})}/></label><label>Phone number<input value={q.phone} onChange={e=>setQ({...q,phone:e.target.value})}/></label><button className="btn">Track</button></form>
 {r&&(r.error?<p className="err">{r.error}</p>:<div className="item" style={{marginTop:20,textAlign:'left'}}><p><b>{r.no}</b> · {r.date.slice(0,10)} · {inr(r.total)} · Payment: {r.payStatus}</p><p>{r.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</p>
 {r.status==='Cancelled'?<p className="err">Order cancel ho gaya.</p>:<div className="tl">{S.map((s,i)=><span key={s} className={i<=S.indexOf(r.status)?'on':''}>{s}</span>)}</div>}<div className="plank"/></div>)}</section>}

function Contact({c}){const k=c.contact,[m,setM]=useState({name:'',phone:'',msg:''}),[s,setS]=useState('');
 const send=async()=>{const r=await api('inquiry',m).catch(()=>({error:'Network error'}));setS(r.ok?'✅ Message mil gaya, hum jaldi contact karenge.':r.error);r.ok&&setM({name:'',phone:'',msg:''})};
 return <section className="wrap sect"><Reveal><h1>Humse baat karo</h1><div className="grid2"><div className="item" style={{textAlign:'left'}}>
<p>📞 {k.phone}</p><p>✉️ {k.email}</p><p>📍 {k.address}</p><p>🕘 {k.hours}</p>{k.instagram&&<p>📸 <a href={k.instagram}>Instagram</a></p>}<a className="btn sm" href={wa(c,'Hi HoneyKey!')} target="_blank" rel="noreferrer">WhatsApp</a><div className="plank"/></div>
<div className="item" style={{textAlign:'left'}}>{['name','phone'].map(x=><label key={x}>{x==='name'?'Naam':'Phone'}<input value={m[x]} onChange={e=>setM({...m,[x]:e.target.value})}/></label>)}<label>Message<textarea rows="4" value={m.msg} onChange={e=>setM({...m,msg:e.target.value})}/></label>
<button className="btn" onClick={send}>Bhejo</button><p>{s}</p><div className="plank"/></div></div></Reveal></section>}

function Footer({c}){const [e,setE]=useState(''),[s,setS]=useState('');
 const sub=async()=>{const r=await api('subscribe',{email:e}).catch(()=>({error:'Network error'}));setS(r.ok?'✅ Subscribe ho gaya!':r.error);r.ok&&setE('')};
 return <footer><Drip/><div className="wrap"><Mark s={44}/><h3>{c.brand.name}</h3><p>{c.brand.footer}</p>
 <div className="sub"><input placeholder="Email daalo – offers aur naye packs" value={e} onChange={x=>setE(x.target.value)}/><button className="btn sm" onClick={sub}>Subscribe</button></div><small>{s}</small>
 <p className="muted">© {new Date().getFullYear()} {c.brand.name} · {c.contact.email} · {c.contact.phone}</p></div></footer>}

export default function App(){
 const [c,setC]=useState(null),[open,setOpen]=useState(false),{pathname}=useLocation();
 const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('hk-cart'))||{}}catch{return{}}});
 useEffect(()=>{api('content').then(j=>j.products&&setC({...j,products:j.products.map(p=>({...p,price:+p.price}))})).catch(()=>{})},[]);
 useEffect(()=>{try{localStorage.setItem('hk-cart',JSON.stringify(cart))}catch{}},[cart]);
 useEffect(()=>{window.scrollTo(0,0)},[pathname]);
 if(pathname.startsWith('/admin'))return <Admin/>;
 if(!c)return <div className="load"><Mark s={80}/></div>;
 const add=id=>{setCart(x=>({...x,[id]:Math.min((x[id]||0)+1,99)}));setOpen(true)};
 const n=Object.values(cart).reduce((a,b)=>a+b,0);
 return <><Nav n={n} open={()=>setOpen(true)}/><Routes><Route path="/" element={<Home c={c} add={add}/>}/><Route path="/products" element={<Products c={c} add={add}/>}/><Route path="/track" element={<Track/>}/><Route path="/about" element={<About c={c}/>}/><Route path="/faq" element={<Faq c={c}/>}/><Route path="/contact" element={<Contact c={c}/>}/><Route path="*" element={<section className="wrap sect"><h1>404 – yahan honey nahi hai 🍯</h1><Link className="btn" to="/">Home</Link></section>}/></Routes>
 <Footer c={c}/>{open&&<Cart c={c} cart={cart} setCart={setCart} close={()=>setOpen(false)}/>}
 <a className="wa" href={wa(c,'Hi HoneyKey!')} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a></>}