import {useEffect,useState,useContext} from 'react';
import {Routes,Route,Link,useNavigate,useParams,useSearchParams,useLocation} from 'react-router-dom';
import Admin from './Admin.jsx';
import {Cart,Auth,Checkout,OrderPage,Account} from './Account.jsx';
import {Ctx,Img,Price,logoOf,iconOf} from './shared.jsx';
import {api,wa,inr} from './api.js';
const FONTS={system:"system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif",serif:"Georgia,'Times New Roman',serif",verdana:"Verdana,Geneva,sans-serif",trebuchet:"'Trebuchet MS',Arial,sans-serif",mono:"ui-monospace,Consolas,monospace"};
const useC=()=>useContext(Ctx);
const catsOf=c=>[...new Set(c.products.map(p=>p.category).filter(Boolean))];
const Who=({f})=>f.photo?<img className="face" src={f.photo} alt={f.name}/>:<div className="face">{(f.name||'H')[0]}</div>;

function Header(){const {c,user,n}=useC(),nav=useNavigate(),[q,setQ]=useState('');
 return <header><div className="topbar"><div className="wrap"><span>{c.brand.topbar}</span><span>{c.contact.phone} · {c.contact.email}</span></div></div>
 <div className="mainbar"><div className="wrap mb"><Link to="/" className="logo"><img src={logoOf(c.brand)} alt={c.brand.name}/></Link>
 <form className="search" onSubmit={e=>{e.preventDefault();nav('/shop?q='+encodeURIComponent(q))}}><input placeholder="Search for products" value={q} onChange={e=>setQ(e.target.value)}/><button>Search</button></form>
 <div className="acts"><Link to={user?'/account':'/login'}><small>Hello, {user?user.name.split(' ')[0]:'Sign in'}</small><b>Account &amp; Orders</b></Link><Link to="/cart" className="cartl"><span>🛒</span><em>{n}</em><b>Cart</b></Link></div></div></div>
 <nav className="cats"><div className="wrap"><Link to="/">Home</Link><Link to="/shop">All Products</Link>{catsOf(c).map(x=><Link key={x} to={'/shop?cat='+encodeURIComponent(x)}>{x}</Link>)}<Link to="/about">About Us</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link></div></nav></header>}

function PCard({p}){const {add}=useC();return <div className="pc"><Link to={'/product/'+p.id} className="pimg"><Img p={p}/>{p.tag&&<span className="badge">{p.tag}</span>}</Link>
 <div className="pb"><Link to={'/product/'+p.id} className="pn">{p.name}</Link><div className="muted">{p.size}</div><Price p={p}/>
 {p.soldOut?<button className="btn" disabled>Out of stock</button>:<button className="btn" onClick={()=>add(p.id)}>Add to Cart</button>}</div></div>}

function Home(){const {c}=useC(),f=c.founder,cats=catsOf(c);
 return <><section className="hero"><div className="wrap hi"><div><span className="chip">{c.hero.chip}</span><h1>{c.hero.title}</h1><p>{c.hero.sub}</p><Link className="btn acc" to="/shop">{c.hero.cta}</Link> <Link className="btn out" to="/about">About Us</Link></div><div className="hart"><img src={c.hero.image||'/mark.png'} alt={c.brand.name}/></div></div></section>
 <section className="strip"><div className="wrap">{c.usps.map((u,i)=><div key={i}><span>{u.icon}</span><div><b>{u.t}</b><small>{u.d}</small></div></div>)}</div></section>
 {cats.length>1&&<section className="wrap sect"><h2>Shop by Category</h2><div className="cats2">{cats.map(x=><Link key={x} to={'/shop?cat='+encodeURIComponent(x)}>{x}</Link>)}</div></section>}
 <section className="wrap sect"><div className="shd"><h2>Featured Products</h2><Link to="/shop">View all →</Link></div><div className="pgrid">{c.products.slice(0,4).map(p=><PCard key={p.id} p={p}/>)}</div></section>
 <section className="band"><div className="wrap sect"><h2>How it works</h2><div className="g3">{c.steps.map((s,i)=><div key={i} className="box"><span className="num">{i+1}</span><h3>{s.t}</h3><p>{s.d}</p></div>)}</div></div></section>
 {c.testimonials.length>0&&<section className="wrap sect"><h2>Customer Reviews</h2><div className="g3">{c.testimonials.map((t,i)=><div key={i} className="box"><div>{'★'.repeat(+t.stars||5)}</div><p>"{t.text}"</p><b>{t.name}</b> <small>{t.city}</small></div>)}</div></section>}
 <section className="wrap sect"><div className="box about"><Who f={f}/><div><h2>{c.about.title}</h2><p>{c.about.text}</p><Link className="btn" to="/about">Know more</Link></div></div></section></>}

function Shop(){const {c}=useC(),[sp,setSp]=useSearchParams(),q=(sp.get('q')||'').toLowerCase(),cat=sp.get('cat')||'',sort=sp.get('sort')||'';
 let l=c.products.filter(p=>(!cat||p.category===cat)&&(!q||(p.name+p.desc+(p.category||'')).toLowerCase().includes(q)));
 if(sort==='lh')l=[...l].sort((a,b)=>a.price-b.price);if(sort==='hl')l=[...l].sort((a,b)=>b.price-a.price);
 const set=(k,v)=>{const n=new URLSearchParams(sp);v?n.set(k,v):n.delete(k);setSp(n)};
 return <div className="wrap sect shop"><aside className="side box"><h4>Category</h4><a className={!cat?'on':''} onClick={()=>set('cat','')}>All</a>{catsOf(c).map(x=><a key={x} className={cat===x?'on':''} onClick={()=>set('cat',x)}>{x}</a>)}<h4>Sort by</h4><select value={sort} onChange={e=>set('sort',e.target.value)}><option value="">Featured</option><option value="lh">Price: Low to High</option><option value="hl">Price: High to Low</option></select></aside>
 <div><h1>{q?`Results for "${sp.get('q')}"`:cat||'All Products'}</h1><p className="muted">{l.length} products</p>{l.length?<div className="pgrid">{l.map(p=><PCard key={p.id} p={p}/>)}</div>:<p>No products found.</p>}</div></div>}

function Product(){const {id}=useParams(),{c,add}=useC(),nav=useNavigate(),[k,setK]=useState(1),p=c.products.find(x=>x.id===id);
 if(!p)return <div className="wrap sect"><h1>Product not found</h1><Link className="btn" to="/shop">Back to shop</Link></div>;
 const max=Math.min(10,p.left??10),rel=c.products.filter(x=>x.id!==id&&x.category&&x.category===p.category).slice(0,4);
 return <div className="wrap sect"><p className="crumb"><Link to="/">Home</Link> › <Link to="/shop">Shop</Link> › {p.name}</p>
 <div className="pd"><div className="pdimg"><Img p={p}/></div><div><h1>{p.name}</h1><p className="muted">{p.size}{p.category&&` · ${p.category}`}</p><Price p={p}/><small className="muted">Inclusive of all taxes</small>
 <p className={p.soldOut?'err':'ok'}>{p.soldOut?'Out of stock':p.left<=10?`Only ${p.left} left in stock`:'In stock'}</p>
 {!p.soldOut&&<><label>Quantity<select value={k} onChange={e=>setK(+e.target.value)}>{[...Array(max)].map((_,i)=><option key={i}>{i+1}</option>)}</select></label>
 <button className="btn" onClick={()=>add(p.id,k)}>Add to Cart</button> <button className="btn acc" onClick={()=>{add(p.id,k);nav('/checkout')}}>Buy Now</button></>}
 <div className="box info"><b>Delivery</b><p>{inr(c.settings.deliveryFee)} delivery charge. Free delivery on orders above {inr(c.settings.freeAbove)}.</p></div>
 <h3>About this item</h3><p>{p.desc}</p><table className="spec"><tbody><tr><th>Brand</th><td>{c.brand.name}</td></tr><tr><th>Pack size</th><td>{p.size}</td></tr>{p.category&&<tr><th>Category</th><td>{p.category}</td></tr>}</tbody></table></div></div>
 {rel.length>0&&<><h2>Related products</h2><div className="pgrid">{rel.map(x=><PCard key={x.id} p={x}/>)}</div></>}</div>}

function About(){const {c}=useC(),a=c.about,f=c.founder;return <><section className="wrap sect"><h1>{a.title}</h1><p className="lead">{a.text}</p><div className="g3">{a.points.map((p,i)=><div key={i} className="box"><h3>✓ {p.t}</h3></div>)}</div></section>
 <section className="band"><div className="wrap sect"><h2>Our Founder</h2><div className="box about"><Who f={f}/><div><h3>{f.name}</h3><p className="muted">{f.role}</p><p>{f.bio}</p><p><i>"{f.quote}"</i></p></div></div></div></section></>}
const Faq=()=>{const {c}=useC();return <section className="wrap sect"><h1>Frequently Asked Questions</h1>{c.faqs.map((x,i)=><details key={i} className="faq box"><summary>{x.q}</summary><p>{x.a}</p></details>)}</section>};

function Contact(){const {c}=useC(),k=c.contact,[m,setM]=useState({name:'',phone:'',msg:''}),[s,setS]=useState('');
 const send=async()=>{const r=await api('inquiry',m).catch(()=>({error:'Network error'}));setS(r.ok?'Thank you. We have received your message and will contact you soon.':r.error);r.ok&&setM({name:'',phone:'',msg:''})};
 return <section className="wrap sect"><h1>Contact Us</h1><div className="g2"><div className="box"><p>📞 {k.phone}</p><p>✉️ {k.email}</p><p>📍 {k.address}</p><p>🕘 {k.hours}</p>{k.instagram&&<p><a href={k.instagram}>Instagram</a></p>}<a className="btn" href={wa(c,'Hello HoneyKey!')} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>
 <div className="box">{['name','phone'].map(x=><label key={x}>{x==='name'?'Name':'Phone'}<input value={m[x]} onChange={e=>setM({...m,[x]:e.target.value})}/></label>)}<label>Message<textarea rows="4" value={m.msg} onChange={e=>setM({...m,msg:e.target.value})}/></label><button className="btn" onClick={send}>Send Message</button><p>{s}</p></div></div></section>}

function Footer(){const {c}=useC(),[e,setE]=useState(''),[s,setS]=useState('');
 const sub=async()=>{const r=await api('subscribe',{email:e}).catch(()=>({error:'Network error'}));setS(r.ok?'Subscribed. Thank you!':r.error);r.ok&&setE('')};
 return <footer><div className="wrap fg"><div><div className="flogo"><img src={logoOf(c.brand)} alt={c.brand.name}/></div><p>{c.brand.footer}</p></div><div><h4>Shop</h4><Link to="/shop">All Products</Link>{catsOf(c).map(x=><Link key={x} to={'/shop?cat='+encodeURIComponent(x)}>{x}</Link>)}</div><div><h4>Company</h4><Link to="/about">About Us</Link><Link to="/faq">FAQ</Link><Link to="/contact">Contact</Link><Link to="/account">My Account</Link></div>
 <div><h4>Stay updated</h4><div className="sub"><input placeholder="Your email" value={e} onChange={x=>setE(x.target.value)}/><button className="btn acc" onClick={sub}>Subscribe</button></div><small>{s}</small><p>{c.contact.phone}<br/>{c.contact.email}</p></div></div>
 <div className="fbar"><div className="wrap">© {new Date().getFullYear()} {c.brand.name}. All rights reserved. · Pay by UPI or Cash on Delivery</div></div></footer>}

export default function App(){
 const [c,setC]=useState(null),[user,setUser]=useState(undefined),[toast,setToast]=useState(''),{pathname}=useLocation();
 const [cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('hk-cart'))||{}}catch{return{}}});
 const afterAuth=r=>{setCart(x=>{const m={...(r.cart||{})};Object.entries(x).forEach(([k,v])=>m[k]=Math.max(m[k]||0,v));return m});setUser(r.user)};
 useEffect(()=>{api('content').then(j=>j.products&&setC({...j,products:j.products.map(p=>({...p,price:+p.price,mrp:+p.mrp||0}))})).catch(()=>{});
  api('user/me').then(r=>r.user?afterAuth(r):setUser(null)).catch(()=>setUser(null))},[]);
 useEffect(()=>{if(!c)return;const t=c.theme||{},s=document.documentElement.style;
  [['--p',t.primary],['--a',t.accent],['--bg',t.bg],['--tx',t.text],['--card',t.card]].forEach(([k,v])=>v&&s.setProperty(k,v));
  s.setProperty('--r',(t.radius??6)+'px');s.setProperty('--font',FONTS[t.font]||FONTS.system);document.title=`${c.brand.name} – ${c.brand.tagline}`;
  let l=document.querySelector("link[rel='icon']");if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.type='image/png';l.href=iconOf(c.brand)},[c]);
 useEffect(()=>{try{localStorage.setItem('hk-cart',JSON.stringify(cart))}catch{}if(user)api('user/cart',{cart}).catch(()=>{})},[cart,user]);
 useEffect(()=>{window.scrollTo(0,0)},[pathname]);
 if(pathname.startsWith('/admin'))return <Admin/>;
 if(!c)return <div className="load"><img src="/icon.png" alt="HoneyKey" width="84"/></div>;
 const lines=c.products.filter(p=>cart[p.id]).map(p=>({...p,q:cart[p.id]})),sub=lines.reduce((s,p)=>s+p.price*p.q,0),fee=sub&&sub<+c.settings.freeAbove?+c.settings.deliveryFee:0,n=Object.values(cart).reduce((a,b)=>a+b,0);
 const add=(id,k=1)=>{const p=c.products.find(x=>x.id===id),m=Math.min(99,p?.left??99);setCart(x=>({...x,[id]:Math.min((x[id]||0)+k,m)}));setToast('Added to cart');setTimeout(()=>setToast(''),1800)};
 const setQty=(id,k)=>setCart(x=>{const m={...x};k>0?m[id]=Math.min(k,99):delete m[id];return m});
 const logout=async()=>{await api('user/logout',{});setUser(null)};
 return <Ctx.Provider value={{c,user,cart,setCart,lines,sub,fee,n,add,setQty,afterAuth,logout}}><Header/><main><Routes>
 <Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/product/:id" element={<Product/>}/><Route path="/cart" element={<Cart/>}/><Route path="/login" element={<Auth/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/order/:no" element={<OrderPage/>}/><Route path="/account" element={<Account/>}/>
 <Route path="/about" element={<About/>}/><Route path="/faq" element={<Faq/>}/><Route path="/contact" element={<Contact/>}/><Route path="*" element={<section className="wrap sect"><h1>Page not found</h1><Link className="btn" to="/">Go to Home</Link></section>}/></Routes></main><Footer/>
 {toast&&<div className="toast">{toast}</div>}<a className="wa" href={wa(c,'Hello HoneyKey!')} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a></Ctx.Provider>}