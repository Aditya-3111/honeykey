import {useEffect,useState,useContext} from 'react';
import {Link,Navigate,useNavigate,useLocation,useParams} from 'react-router-dom';
import {Ctx,Img,Price,Timeline} from './shared.jsx';
import {api,inr} from './api.js';
const EMPTY={name:'',phone:'',line:'',city:'',state:'',pin:''};
const AddrForm=({f,setF})=><div className="g2">{[['name','Full name'],['phone','Mobile number (10 digit)'],['line','Flat, house no., street, area'],['city','City'],['state','State'],['pin','Pincode (6 digit)']].map(([k,l])=><label key={k} className={k==='line'?'span2':''}>{l}<input value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}</div>;

export function Cart(){const {c,user,lines,sub,fee,setQty}=useContext(Ctx);
 if(!lines.length)return <div className="wrap sect"><div className="box center"><h2>Your cart is empty</h2><Link className="btn" to="/shop">Continue shopping</Link></div></div>;
 return <div className="wrap sect cartp"><div><h1>Shopping Cart</h1>{lines.map(p=><div className="cl box" key={p.id}><div className="ci"><Img p={p}/></div><div className="cd"><Link to={'/product/'+p.id}><b>{p.name}</b></Link><div className="muted">{p.size}</div><Price p={p}/>
 <div className="qr"><select value={p.q} onChange={e=>setQty(p.id,+e.target.value)}>{[...Array(Math.max(10,p.q))].map((_,i)=><option key={i}>{i+1}</option>)}</select><button className="lk" onClick={()=>setQty(p.id,0)}>Delete</button></div></div><b>{inr(p.price*p.q)}</b></div>)}</div>
 <aside className="box sum"><h3>Order Summary</h3><p>Items subtotal <b>{inr(sub)}</b></p><p>Delivery <b>{fee?inr(fee):'FREE'}</b></p><p className="tot">Total <b>{inr(sub+fee)}</b></p>{fee>0&&<small>Add {inr(c.settings.freeAbove-sub)} more for free delivery</small>}
 <Link className="btn acc full" to={user?'/checkout':'/login'} state={{from:'/checkout'}}>Proceed to Checkout</Link></aside></div>}

export function Auth(){const {afterAuth}=useContext(Ctx),nav=useNavigate(),loc=useLocation(),[reg,setReg]=useState(false),[f,setF]=useState({name:'',email:'',phone:'',password:''}),[err,setErr]=useState('');
 const go=async e=>{e.preventDefault();setErr('');const r=await api(reg?'user/register':'user/login',f).catch(()=>({error:'Network error'}));if(r.error)return setErr(r.error);afterAuth(r);nav(loc.state?.from||'/account',{replace:true})};
 const set=k=>e=>setF({...f,[k]:e.target.value});
 return <div className="wrap sect"><form className="box auth" onSubmit={go}><h2>{reg?'Create account':'Sign in'}</h2>
 {reg&&<><label>Full name<input value={f.name} onChange={set('name')}/></label><label>Mobile number<input value={f.phone} onChange={set('phone')}/></label></>}
 <label>Email<input type="email" value={f.email} onChange={set('email')}/></label><label>Password{reg&&' (min 6 characters)'}<input type="password" value={f.password} onChange={set('password')}/></label>
 {err&&<p className="err">{err}</p>}<button className="btn acc full">{reg?'Create your account':'Sign in'}</button>
 <p className="center">{reg?'Already a customer?':'New to us?'} <a className="lk" onClick={()=>{setReg(!reg);setErr('')}}>{reg?'Sign in':'Create your account'}</a></p></form></div>}

export function Checkout(){const {c,user,lines,sub,fee,setCart}=useContext(Ctx),nav=useNavigate();
 const [ads,setAds]=useState([]),[sel,setSel]=useState(null),[nw,setNw]=useState(false),[f,setF]=useState(EMPTY),[pay,setPay]=useState(c.settings.upiOn?'UPI':'COD'),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(user)api('user/addresses').then(j=>{const a=j.addresses||[];setAds(a);setSel(a[0]?.id||null);setNw(!a.length)})},[user]);
 if(user===undefined)return <div className="wrap sect">Loading…</div>;
 if(!user)return <Navigate to="/login" state={{from:'/checkout'}} replace/>;
 if(!lines.length)return <div className="wrap sect"><div className="box center"><h2>Your cart is empty</h2><Link className="btn" to="/shop">Continue shopping</Link></div></div>;
 const place=async()=>{setBusy(true);setErr('');let id=sel;
  if(nw){const a=await api('user/address',f).catch(()=>({error:'Network error'}));if(a.error){setBusy(false);return setErr(a.error)}id=a.id}
  const r=await api('user/order',{items:lines.map(p=>({id:p.id,qty:p.q})),addressId:id,pay}).catch(()=>({error:'Network error'}));setBusy(false);
  if(r.error)return setErr(r.error);setCart({});nav('/order/'+r.no)};
 return <div className="wrap sect cartp"><div><h1>Checkout</h1>
 <div className="box"><h3>1. Delivery address</h3>{ads.map(a=><label key={a.id} className="rad"><input type="radio" checked={!nw&&sel===a.id} onChange={()=>{setSel(a.id);setNw(false)}}/><span><b>{a.name}</b> · {a.phone}<br/>{a.line}, {a.city}, {a.state} – {a.pin}</span></label>)}
 <label className="rad"><input type="radio" checked={nw} onChange={()=>setNw(true)}/><b>Add a new address</b></label>{nw&&<AddrForm f={f} setF={setF}/>}</div>
 <div className="box"><h3>2. Payment method</h3>{c.settings.upiOn&&<label className="rad"><input type="radio" checked={pay==='UPI'} onChange={()=>setPay('UPI')}/><span><b>UPI</b> – scan QR code with any UPI app (shown after placing order)</span></label>}
 <label className="rad"><input type="radio" checked={pay==='COD'} onChange={()=>setPay('COD')}/><span><b>Cash on Delivery</b></span></label></div>
 <div className="box"><h3>3. Review items</h3>{lines.map(p=><p key={p.id}>{p.name} × {p.q} — <b>{inr(p.price*p.q)}</b></p>)}</div></div>
 <aside className="box sum"><h3>Order Summary</h3><p>Items <b>{inr(sub)}</b></p><p>Delivery <b>{fee?inr(fee):'FREE'}</b></p><p className="tot">Order total <b>{inr(sub+fee)}</b></p>{err&&<p className="err">{err}</p>}<button className="btn acc full" disabled={busy||(!nw&&!sel)} onClick={place}>{busy?'Placing order…':'Place your order'}</button></aside></div>}

export function OrderPage(){const {no}=useParams(),{user}=useContext(Ctx),[o,setO]=useState(null),[txn,setTxn]=useState(''),[m,setM]=useState('');
 const load=()=>api('user/order?no='+no).then(setO).catch(()=>setO({error:'Network error'}));
 useEffect(()=>{if(user!==undefined)load()},[no,user]);
 if(o===null)return <div className="wrap sect">Loading…</div>;
 if(o.error)return <div className="wrap sect"><p className="err">{o.error}</p><Link className="btn" to="/login" state={{from:'/order/'+no}}>Sign in</Link></div>;
 const pay=async()=>{const r=await api('user/pay',{no,txn}).catch(()=>({error:'Network error'}));r.error?setM(r.error):(setM(''),load())};
 return <div className="wrap sect" style={{maxWidth:900}}><div className="box center"><h1>{o.pay==='UPI'&&o.payStatus==='Pending'?'Order placed – complete your payment':'Thank you! Your order is placed ✓'}</h1><p>Order No: <b>{o.no}</b> · {o.date.slice(0,10)}</p></div>
 {o.upi&&<div className="box payb"><div><h3>Scan &amp; pay {inr(o.total)}</h3><img src={o.upi.qr} alt="UPI QR code" width="240"/></div><div><p>Scan with any UPI app (GPay, PhonePe, Paytm, BHIM) or pay to UPI ID:</p><p><b>{o.upi.id}</b></p><a className="btn acc" href={o.upi.link}>Pay with UPI app (mobile)</a><hr/>
 <label>After paying, enter the UTR / Transaction ID<input value={txn} onChange={e=>setTxn(e.target.value)}/></label><button className="btn" onClick={pay}>Submit payment details</button>{m&&<p className="err">{m}</p>}</div></div>}
 {o.payStatus==='Verifying'&&<div className="box"><b>Payment verification in progress.</b> UTR: {o.txn}. We will confirm it shortly.</div>}
 {o.pay==='UPI'&&o.payStatus==='Paid'&&<div className="box ok">Payment received ✓</div>}
 <div className="box"><h3>Order status</h3><Timeline s={o.status}/></div>
 <div className="box"><h3>Items</h3>{o.items.map((i,k)=><p key={k}>{i.name} × {i.qty} — {inr(i.price*i.qty)}</p>)}<p>Delivery: {o.fee?inr(o.fee):'FREE'}</p><p><b>Total: {inr(o.total)}</b> ({o.pay==='UPI'?'UPI':'Cash on Delivery'})</p></div>
 <div className="box"><h3>Delivering to</h3><p>{o.name} · {o.phone}<br/>{o.address} – {o.pin}</p></div></div>}

export function Account(){const {user,logout}=useContext(Ctx),[tab,setTab]=useState('orders'),[os,setOs]=useState(null),[ads,setAds]=useState([]),[f,setF]=useState(EMPTY),[err,setErr]=useState('');
 const loadA=()=>api('user/addresses').then(j=>setAds(j.addresses||[]));
 useEffect(()=>{if(user){api('user/orders').then(j=>setOs(j.orders||[]));loadA()}},[user]);
 if(user===undefined)return <div className="wrap sect">Loading…</div>;
 if(!user)return <Navigate to="/login" replace/>;
 const add=async()=>{const r=await api('user/address',f).catch(()=>({error:'Network error'}));r.error?setErr(r.error):(setErr(''),setF(EMPTY),loadA())};
 return <div className="wrap sect"><div className="shd"><h1>Your Account</h1><button className="btn" onClick={logout}>Sign out</button></div>
 <div className="tabs2">{[['orders','Your Orders'],['addr','Addresses'],['prof','Login & Details']].map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
 {tab==='orders'&&(os===null?<p>Loading…</p>:!os.length?<div className="box center"><p>You have not placed any orders yet.</p><Link className="btn" to="/shop">Start shopping</Link></div>:os.map(o=><div className="box" key={o.no}><div className="shd"><div><b>Order {o.no}</b><br/><small className="muted">{o.date.slice(0,10)} · {inr(o.total)} · {o.pay}</small></div><Link className="btn" to={'/order/'+o.no}>{o.pay==='UPI'&&o.payStatus==='Pending'?'Pay now':'View details'}</Link></div><p>{o.items.map(i=>`${i.name} × ${i.qty}`).join(', ')}</p><Timeline s={o.status}/></div>))}
 {tab==='addr'&&<><div className="g2">{ads.map(a=><div className="box" key={a.id}><b>{a.name}</b><br/>{a.line}, {a.city}, {a.state} – {a.pin}<br/>{a.phone}<br/><button className="lk" onClick={async()=>{await api('user/address/del',{id:a.id});loadA()}}>Remove</button></div>)}</div>
 <div className="box"><h3>Add a new address</h3><AddrForm f={f} setF={setF}/>{err&&<p className="err">{err}</p>}<button className="btn" onClick={add}>Save address</button></div></>}
 {tab==='prof'&&<div className="box"><p><b>Name:</b> {user.name}</p><p><b>Email:</b> {user.email}</p><p><b>Mobile:</b> {user.phone}</p></div>}</div>}