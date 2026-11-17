import {useEffect,useRef,useState} from 'react';
import {Routes,Route,NavLink,Link,useLocation} from 'react-router-dom';
import Admin from './Admin.jsx';
import {Mark,Pack,Drip} from './Art.jsx';
import {API,wa} from './api.js';
import fallback from './default-content.json';

function Reveal({children}){const r=useRef();useEffect(()=>{const o=new IntersectionObserver(e=>e.forEach(x=>x.isIntersecting&&x.target.classList.add('in')),{threshold:.12});o.observe(r.current);return()=>o.disconnect()},[]);return <div ref={r} className="rev">{children}</div>}
const Bees=()=><>{[0,1,2].map(i=><span key={i} className="bee" style={{top:`${15+i*25}%`,animationDelay:`${-i*4}s`,animationDuration:`${11+i*3}s`}}>🐝</span>)}</>;

function Nav({c}){return <nav className="top"><div className="awning"/><div className="sign"><div className="wrap bar">
<Link to="/" className="brand"><Mark s={40}/><b>Honey<i>Key</i></b></Link>
<div className="links">{[['/','Home'],['/products','Products'],['/about','About'],['/contact','Contact']].map(([t,l])=><NavLink key={t} to={t} end={t==='/'}>{l}</NavLink>)}</div></div></div></nav>}

function Card({p,c}){return <div className="item">{p.tag&&<span className="ribbon">{p.tag}</span>}
<div className="art">{p.image?<img src={p.image} alt={p.name}/>:<Pack c={p.color}/>}</div>
<h3>{p.name}</h3><p className="muted">{p.size} · <b>₹{p.price}</b></p><p>{p.desc}</p>
<a className="btn sm" href={wa(c,`Hi HoneyKey! Mujhe "${p.name}" order karna hai.`)} target="_blank" rel="noreferrer">WhatsApp pe order</a><div className="plank"/></div>}

function Home({c}){const f=c.founder;return <>
<section className="hero"><Bees/><div className="wrap hero-in"><div><span className="chip">{c.hero.chip}</span><h1>{c.hero.title}</h1><p>{c.hero.sub}</p>
<Link className="btn" to="/products">{c.hero.cta}</Link> <Link className="btn ghost" to="/about">Hamari kahani</Link></div>
<div className="hero-art"><Pack className="float big"/><Pack c="#C77700" className="float b2"/></div></div><Drip/></section>
<div className="marquee"><div>{[...c.usps,...c.usps].map((u,i)=><span key={i}>{u.icon} {u.t}</span>)}</div></div>
<section className="wrap sect"><Reveal><h2>Humari Shelf 🍯</h2><div className="grid">{c.products.slice(0,3).map(p=><Card key={p.id} p={p} c={c}/>)}</div>
<p style={{textAlign:'center'}}><Link className="btn ghost" to="/products">Poori shop dekho →</Link></p></Reveal></section>
<section className="band"><div className="wrap sect"><Reveal><h2>3 second mein honey</h2><div className="grid">{c.steps.map((s,i)=><div key={i} className="step"><span>{i+1}</span><h3>{s.t}</h3><p>{s.d}</p></div>)}</div></Reveal></div></section>
<section className="wrap sect"><Reveal><div className="grid">{c.usps.map((u,i)=><div key={i} className="usp"><div>{u.icon}</div><h3>{u.t}</h3><p>{u.d}</p></div>)}</div></Reveal></section>
<section className="wrap sect"><Reveal><div className="quote"><Who f={f}/><div><h2>"{f.quote}"</h2><p>– {f.name}, {f.role}</p><Link className="btn" to="/about">Founder se milo</Link></div></div></Reveal></section></>}

const Who=({f})=>f.photo?<img className="face" src={f.photo} alt={f.name}/>:<div className="face">{(f.name||'H')[0]}</div>;

function Products({c}){return <section className="wrap sect"><Reveal><h1>HoneyKey Shop</h1><p className="muted">Har pack easy to use, easy to carry.</p><div className="grid">{c.products.map(p=><Card key={p.id} p={p} c={c}/>)}</div></Reveal></section>}
function About({c}){const a=c.about,f=c.founder;return <><section className="wrap sect"><Reveal><h1>{a.title}</h1><p className="lead">{a.text}</p><div className="grid">{a.points.map((p,i)=><div key={i} className="usp"><div>🐝</div><h3>{p.t}</h3></div>)}</div></Reveal></section>
<section className="band"><div className="wrap sect"><Reveal><div className="quote"><Who f={f}/><div><h2>{f.name}</h2><p className="muted">{f.role}</p><p>{f.bio}</p></div></div></Reveal></div></section></>}
function Contact({c}){const k=c.contact;const [m,setM]=useState({n:'',t:''});return <section className="wrap sect"><Reveal><h1>Humse baat karo</h1><div className="grid2"><div className="item" style={{textAlign:'left'}}>
<p>📞 {k.phone}</p><p>✉️ {k.email}</p><p>📍 {k.address}</p><p>🕘 {k.hours}</p>{k.instagram&&<p>📸 <a href={k.instagram}>Instagram</a></p>}<div className="plank"/></div>
<div className="item" style={{textAlign:'left'}}><label>Naam<input value={m.n} onChange={e=>setM({...m,n:e.target.value})}/></label><label>Message<textarea rows="4" value={m.t} onChange={e=>setM({...m,t:e.target.value})}/></label>
<a className="btn" href={wa(c,`Hi, main ${m.n}. ${m.t}`)} target="_blank" rel="noreferrer">WhatsApp pe bhejo</a><div className="plank"/></div></div></Reveal></section>}

export default function App(){
 const [c,setC]=useState(fallback);const {pathname}=useLocation();
 useEffect(()=>{fetch(API+'?action=content').then(r=>r.json()).then(j=>j&&setC({...fallback,...j})).catch(()=>{})},[]);
 useEffect(()=>{window.scrollTo(0,0)},[pathname]);
 if(pathname.startsWith('/admin'))return <Admin content={c} setContent={setC}/>;
 return <><Nav c={c}/><Routes><Route path="/" element={<Home c={c}/>}/><Route path="/products" element={<Products c={c}/>}/><Route path="/about" element={<About c={c}/>}/><Route path="/contact" element={<Contact c={c}/>}/></Routes>
 <footer><Drip/><div className="wrap"><Mark s={44}/><h3>{c.brand.name}</h3><p>{c.brand.footer}</p><p className="muted">© {new Date().getFullYear()} {c.brand.name} · {c.contact.email}</p></div></footer>
 <a className="wa" href={wa(c,'Hi HoneyKey!')} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a></>}
