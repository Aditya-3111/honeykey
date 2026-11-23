import express from 'express';import fs from 'fs';import path from 'path';import crypto from 'crypto';import {fileURLToPath} from 'url';
import mysql from 'mysql2/promise';import QRCode from 'qrcode';
const __d=path.dirname(fileURLToPath(import.meta.url)),E=process.env;
const PASS=E.ADMIN_PASSWORD||'honeykey@123',SECRET=E.SESSION_SECRET||'hk-'+PASS;
const DEF=(()=>{for(const f of ['default-content.json','server/default-content.json']){try{return JSON.parse(fs.readFileSync(path.join(__d,f),'utf8'))}catch{}}throw new Error('default-content.json missing')})();
const pool=mysql.createPool({host:E.DB_HOST||'localhost',user:E.DB_USER,password:E.DB_PASS,database:E.DB_NAME,connectionLimit:5,charset:'utf8mb4'});
const db=(s,a)=>pool.query(s,a).then(r=>r[0]);
const SCHEMA=[
'CREATE TABLE IF NOT EXISTS kv(k VARCHAR(40) PRIMARY KEY,v MEDIUMTEXT)',
'CREATE TABLE IF NOT EXISTS stock(id VARCHAR(40) PRIMARY KEY,qty INT NOT NULL DEFAULT 0)',
'CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80),email VARCHAR(120) UNIQUE,phone VARCHAR(20),pw VARCHAR(200),created DATETIME DEFAULT CURRENT_TIMESTAMP)',
'CREATE TABLE IF NOT EXISTS addresses(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,name VARCHAR(80),phone VARCHAR(20),line VARCHAR(300),city VARCHAR(60),state VARCHAR(60),pin VARCHAR(10),INDEX(user_id))',
'CREATE TABLE IF NOT EXISTS carts(user_id INT PRIMARY KEY,data TEXT)',
'CREATE TABLE IF NOT EXISTS orders(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,name VARCHAR(80),phone VARCHAR(20),address TEXT,pin VARCHAR(10),note VARCHAR(200),items TEXT,subtotal INT,fee INT,total INT,pay VARCHAR(10),pay_status VARCHAR(12),status VARCHAR(12),source VARCHAR(10),txn VARCHAR(40),created DATETIME DEFAULT CURRENT_TIMESTAMP,INDEX(user_id))',
'CREATE TABLE IF NOT EXISTS rec(id INT AUTO_INCREMENT PRIMARY KEY,col VARCHAR(16),data TEXT,created DATETIME DEFAULT CURRENT_TIMESTAMP,INDEX(col))',
'CREATE TABLE IF NOT EXISTS files(id VARCHAR(20) PRIMARY KEY,mime VARCHAR(30),data MEDIUMBLOB)'];
(async()=>{try{for(const s of SCHEMA)await db(s);
  if(!(await db('SELECT COUNT(*) c FROM stock'))[0].c)await pool.query('INSERT INTO stock(id,qty) VALUES ?',[[['1',500],['2',100],['3',50]]]);
  console.log('DB ready')}catch(e){console.error('DB init failed:',e.message)}})();

const S=(v,n)=>String(v??'').trim().slice(0,n);
const hits=new Map();const limited=(k,max,ms)=>{const n=Date.now(),h=(hits.get(k)||[]).filter(t=>n-t<ms);h.push(n);hits.set(k,h);return h.length>max};
const sign=s=>crypto.createHmac('sha256',SECRET).update(s).digest('hex');
const mk=(k,id)=>{const e=Date.now()+(k==='a'?6048e5:2592e6),b=`${k}.${id}.${e}`;return b+'.'+sign(b)};
const who=(rq,k)=>{const m=new RegExp(`(?:^|; )${k==='a'?'hk':'hu'}=([^;]+)`).exec(rq.headers.cookie||'');if(!m)return null;const[t,id,e,s]=m[1].split('.');if(t!==k||!s||s.length!==64||Date.now()>+e)return null;return crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sign(`${t}.${id}.${e}`)))?id:null};
const cookie=(rq,rs,n,v,age)=>rs.append('Set-Cookie',`${n}=${v}; HttpOnly; Path=/; Max-Age=${age}; SameSite=Lax${rq.secure?'; Secure':''}`);
const hash=p=>{const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,32).toString('hex')};
const check=(p,h)=>{const[s,x]=String(h).split(':');if(!s||!x)return false;const y=crypto.scryptSync(p,s,32).toString('hex');return x.length===y.length&&crypto.timingSafeEqual(Buffer.from(x),Buffer.from(y))};
const h=f=>(rq,rs)=>f(rq,rs).catch(e=>{console.error(e.message);rs.status(500).json({error:'Server/database error. Thodi der baad try karo.'})});
const A=(rq,rs,n)=>who(rq,'a')?n():rs.status(401).json({error:'login chahiye'});
const U=(rq,rs,n)=>{const id=who(rq,'u');if(!id)return rs.status(401).json({error:'Please login first'});rq.uid=+id;n()};

const content=async()=>{let c={};try{const r=await db("SELECT v FROM kv WHERE k='content'");if(r[0])c=JSON.parse(r[0].v)}catch{}
  return{...DEF,...c,theme:{...DEF.theme,...c.theme},settings:{...DEF.settings,...c.settings}}};
const stockMap=async()=>Object.fromEntries((await db('SELECT id,qty FROM stock')).map(r=>[r.id,r.qty]));
const pub=async()=>{const c=await content();let s={},ok=true;try{s=await stockMap()}catch{ok=false}
  return{...c,settings:{...c.settings,upiOn:!!E.UPI_ID},products:c.products.filter(p=>p.active!==false).map(({cost,...p})=>({...p,soldOut:ok&&(s[p.id]??0)<=0,left:s[p.id]}))}};
const oo=r=>({no:'HK'+(1000+r.id),id:r.id,userId:r.user_id,date:new Date(r.created).toISOString(),source:r.source,name:r.name,phone:r.phone,address:r.address,pin:r.pin,note:r.note,items:JSON.parse(r.items),subtotal:r.subtotal,fee:r.fee,total:r.total,pay:r.pay,payStatus:r.pay_status,status:r.status,txn:r.txn});
const uo=r=>{const o=oo(r);delete o.userId;o.items=o.items.map(({cost,...i})=>i);return o};
const upiInfo=async o=>{if(!E.UPI_ID)return null;const link=`upi://pay?pa=${encodeURIComponent(E.UPI_ID)}&pn=${encodeURIComponent(E.UPI_NAME||'HoneyKey')}&am=${o.total}.00&cu=INR&tn=${o.no}`;return{id:E.UPI_ID,link,qr:await QRCode.toDataURL(link,{margin:1,width:280})}};

async function mkOrder(b,source,uid){
  const c=await content(),m={};
  for(const it of (Array.isArray(b.items)?b.items:[]).slice(0,20)){const k=Math.min(99,parseInt(it.qty)||0);if(k>0)m[it.id]=Math.min(99,(m[it.id]||0)+k)}
  const items=[];
  for(const id of Object.keys(m)){const p=c.products.find(x=>x.id===id&&x.active!==false);if(p)items.push({id,name:p.name,qty:m[id],price:+p.price||0,cost:+p.cost||0})}
  if(!items.length)return{error:'Cart is empty'};
  const sub=items.reduce((s,i)=>s+i.price*i.qty,0),st=c.settings,off=source!=='Website';
  const fee=!off&&sub<(+st.freeAbove||0)?(+st.deliveryFee||0):0;
  const cn=await pool.getConnection();
  try{await cn.beginTransaction();
    for(const i of items){const[r]=await cn.query('UPDATE stock SET qty=qty-? WHERE id=? AND qty>=?',[i.qty,i.id,i.qty]);if(!r.affectedRows){await cn.rollback();return{error:`${i.name}: not enough stock`}}}
    const[r]=await cn.query('INSERT INTO orders(user_id,name,phone,address,pin,note,items,subtotal,fee,total,pay,pay_status,status,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[uid||null,S(b.name,80),S(b.phone,20),S(b.address,300),S(b.pin,10),S(b.note,200),JSON.stringify(items),sub,fee,sub+fee,S(b.pay,10)||'COD',off?'Paid':'Pending',off?'Delivered':'New',source]);
    await cn.commit();return{no:'HK'+(1000+r.insertId),total:sub+fee};
  }catch(e){await cn.rollback();throw e}finally{cn.release()}
}

const app=express();app.set('trust proxy',1);app.use(express.json({limit:'8mb'}));
app.get('/api/content',h(async(rq,rs)=>rs.json(await pub())));
app.post('/api/inquiry',h(async(rq,rs)=>{
  if(limited('i'+rq.ip,8,36e5))return rs.status(429).json({error:'Please try again later'});
  const b=rq.body||{};if(S(b.msg,500).length<3)return rs.status(400).json({error:'Please write a message'});
  await db('INSERT INTO rec(col,data) VALUES(?,?)',['inquiries',JSON.stringify({name:S(b.name,60),phone:S(b.phone,15),msg:S(b.msg,500)})]);rs.json({ok:1})}));
app.post('/api/subscribe',h(async(rq,rs)=>{
  if(limited('s'+rq.ip,8,36e5))return rs.status(429).json({error:'Please try again later'});
  const e=S(rq.body?.email,100).toLowerCase();if(!/^\S+@\S+\.\S+$/.test(e))return rs.status(400).json({error:'Enter a valid email'});
  const x=(await db("SELECT id,data FROM rec WHERE col='subscribers'")).find(r=>JSON.parse(r.data).email===e);
  if(!x)await db('INSERT INTO rec(col,data) VALUES(?,?)',['subscribers',JSON.stringify({email:e})]);rs.json({ok:1})}));

/* ---- customer accounts ---- */
const udata=async id=>{const[u]=await db('SELECT id,name,email,phone FROM users WHERE id=?',[id]);if(!u)return{user:null,cart:{}};const[c]=await db('SELECT data FROM carts WHERE user_id=?',[id]);let cart={};try{cart=JSON.parse(c?.data||'{}')}catch{}return{user:u,cart}};
app.post('/api/user/register',h(async(rq,rs)=>{
  if(limited('r'+rq.ip,10,36e5))return rs.status(429).json({error:'Too many attempts'});
  const b=rq.body||{},name=S(b.name,80),email=S(b.email,120).toLowerCase(),phone=S(b.phone,20).replace(/\D/g,'').slice(-10),pw=String(b.password||'').slice(0,100);
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||phone.length<10||pw.length<6)return rs.status(400).json({error:'Enter valid name, email, 10-digit phone and a password of 6+ characters'});
  if((await db('SELECT id FROM users WHERE email=?',[email]))[0])return rs.status(400).json({error:'An account with this email already exists'});
  const[r]=await pool.query('INSERT INTO users(name,email,phone,pw) VALUES(?,?,?,?)',[name,email,phone,hash(pw)]);
  cookie(rq,rs,'hu',mk('u',r.insertId),2592000);rs.json(await udata(r.insertId))}));
app.post('/api/user/login',h(async(rq,rs)=>{
  if(limited('ul'+rq.ip,15,9e5))return rs.status(429).json({error:'Too many attempts. Try after 15 minutes'});
  const b=rq.body||{},[u]=await db('SELECT id,pw FROM users WHERE email=?',[S(b.email,120).toLowerCase()]);
  if(!u||!check(String(b.password||''),u.pw))return rs.status(401).json({error:'Incorrect email or password'});
  cookie(rq,rs,'hu',mk('u',u.id),2592000);rs.json(await udata(u.id))}));
app.get('/api/user/me',h(async(rq,rs)=>{const id=who(rq,'u');rs.json(id?await udata(id):{user:null,cart:{}})}));
app.post('/api/user/logout',(rq,rs)=>{cookie(rq,rs,'hu','',0);rs.json({ok:1})});
app.post('/api/user/cart',U,h(async(rq,rs)=>{const c={};for(const[k,v]of Object.entries(rq.body?.cart||{}))if(parseInt(v)>0)c[S(k,40)]=Math.min(99,parseInt(v));
  const j=JSON.stringify(c);await db('INSERT INTO carts(user_id,data) VALUES(?,?) ON DUPLICATE KEY UPDATE data=?',[rq.uid,j,j]);rs.json({ok:1})}));
app.get('/api/user/addresses',U,h(async(rq,rs)=>rs.json({addresses:await db('SELECT * FROM addresses WHERE user_id=? ORDER BY id DESC',[rq.uid])})));
app.post('/api/user/address',U,h(async(rq,rs)=>{
  const b=rq.body||{},a=[S(b.name,80),S(b.phone,20).replace(/\D/g,'').slice(-10),S(b.line,300),S(b.city,60),S(b.state,60),S(b.pin,10)];
  if(a[0].length<2||a[1].length<10||a[2].length<5||!a[3]||!a[4]||!/^\d{6}$/.test(a[5]))return rs.status(400).json({error:'Fill name, 10-digit phone, address, city, state and 6-digit pincode'});
  const[r]=await pool.query('INSERT INTO addresses(user_id,name,phone,line,city,state,pin) VALUES(?,?,?,?,?,?,?)',[rq.uid,...a]);rs.json({id:r.insertId})}));
app.post('/api/user/address/del',U,h(async(rq,rs)=>{await db('DELETE FROM addresses WHERE id=? AND user_id=?',[+rq.body?.id||0,rq.uid]);rs.json({ok:1})}));
app.get('/api/user/orders',U,h(async(rq,rs)=>rs.json({orders:(await db('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC',[rq.uid])).map(uo)})));
app.get('/api/user/order',U,h(async(rq,rs)=>{
  const id=parseInt(S(rq.query.no,12).slice(2))-1000,[r]=await db('SELECT * FROM orders WHERE id=? AND user_id=?',[id,rq.uid]);
  if(!r)return rs.status(404).json({error:'Order not found'});const o=uo(r);if(o.pay==='UPI'&&o.payStatus==='Pending')o.upi=await upiInfo(o);rs.json(o)}));
app.post('/api/user/order',U,h(async(rq,rs)=>{
  if(limited('o'+rq.uid,10,36e5))return rs.status(429).json({error:'Too many orders. Try later'});
  const b=rq.body||{},[ad]=await db('SELECT * FROM addresses WHERE id=? AND user_id=?',[+b.addressId||0,rq.uid]);
  if(!ad)return rs.status(400).json({error:'Please select a delivery address'});
  const pay=b.pay==='UPI'?'UPI':'COD';if(pay==='UPI'&&!E.UPI_ID)return rs.status(400).json({error:'UPI is not available right now'});
  const x=await mkOrder({items:b.items,name:ad.name,phone:ad.phone,address:`${ad.line}, ${ad.city}, ${ad.state}`,pin:ad.pin,note:S(b.note,200),pay},'Website',rq.uid);
  x.error?rs.status(400).json(x):rs.json(x)}));
app.post('/api/user/pay',U,h(async(rq,rs)=>{
  const id=parseInt(S(rq.body?.no,12).slice(2))-1000,t=S(rq.body?.txn,40);if(t.length<6)return rs.status(400).json({error:'Enter the UTR / Transaction ID from your UPI app'});
  const[r]=await pool.query("UPDATE orders SET txn=?,pay_status='Verifying' WHERE id=? AND user_id=? AND pay='UPI' AND pay_status IN ('Pending','Verifying')",[t,id,rq.uid]);
  r.affectedRows?rs.json({ok:1}):rs.status(400).json({error:'Cannot update this order'})}));

/* ---- admin ---- */
app.post('/api/login',(rq,rs)=>{
  if(limited('l'+rq.ip,8,9e5))return rs.status(429).json({error:'Too many attempts, try after 15 minutes'});
  const a=Buffer.from(S(rq.body?.password,200)),b=Buffer.from(PASS);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return rs.status(401).json({error:'Galat password'});
  cookie(rq,rs,'hk',mk('a',1),604800);rs.json({ok:1})});
app.post('/api/logout',(rq,rs)=>{cookie(rq,rs,'hk','',0);rs.json({ok:1})});
const recs=async col=>(await db('SELECT id,data,created FROM rec WHERE col=? ORDER BY id DESC',[col])).map(r=>({id:String(r.id),date:new Date(r.created).toISOString(),...JSON.parse(r.data)}));
app.get('/api/admin/all',A,h(async(rq,rs)=>rs.json({content:await content(),db:{
  orders:(await db('SELECT * FROM orders ORDER BY id DESC')).map(oo),expenses:await recs('expenses'),inquiries:await recs('inquiries'),subscribers:await recs('subscribers'),stock:await stockMap(),
  users:(await db('SELECT id,name,email,phone,created FROM users ORDER BY id DESC LIMIT 500')).map(u=>({...u,date:new Date(u.created).toISOString()}))}})));
app.post('/api/admin/:a',A,h(async(rq,rs)=>{
  const b=rq.body||{},a=rq.params.a;
  if(a==='content'){if(typeof b.content!=='object')return rs.status(400).json({error:'bad'});const j=JSON.stringify(b.content);await db("INSERT INTO kv(k,v) VALUES('content',?) ON DUPLICATE KEY UPDATE v=?",[j,j]);return rs.json({ok:1})}
  if(a==='stock'){await db('INSERT INTO stock(id,qty) VALUES(?,?) ON DUPLICATE KEY UPDATE qty=?',[S(b.id,40),Math.max(0,parseInt(b.qty)||0),Math.max(0,parseInt(b.qty)||0)]);return rs.json({ok:1})}
  if(a==='sale'){const x=await mkOrder({...b,address:'Offline sale'},'Offline',null);return x.error?rs.status(400).json(x):rs.json({ok:1})}
  if(a==='order'){
    const id=parseInt(S(b.no,12).slice(2))-1000,[o]=await db('SELECT * FROM orders WHERE id=?',[id]);if(!o)return rs.status(404).json({error:'Order not found'});
    if(b.status&&b.status!==o.status&&['New','Confirmed','Packed','Shipped','Delivered','Cancelled'].includes(b.status)){
      const items=JSON.parse(o.items);
      if(b.status==='Cancelled')for(const i of items)await db('UPDATE stock SET qty=qty+? WHERE id=?',[i.qty,i.id]);
      else if(o.status==='Cancelled')for(const i of items)await db('UPDATE stock SET qty=GREATEST(qty-?,0) WHERE id=?',[i.qty,i.id]);
      await db('UPDATE orders SET status=? WHERE id=?',[b.status,id])}
    if(['Pending','Verifying','Paid'].includes(b.payStatus))await db('UPDATE orders SET pay_status=? WHERE id=?',[b.payStatus,id]);
    return rs.json({ok:1})}
  if(a==='expense'){const n=+b.amount;if(!(n>0)||!S(b.title,80))return rs.status(400).json({error:'Title aur amount daalo'});
    await db('INSERT INTO rec(col,data) VALUES(?,?)',['expenses',JSON.stringify({date:S(b.date,10)||new Date().toISOString().slice(0,10),title:S(b.title,80),cat:S(b.cat,30),amount:n})]);return rs.json({ok:1})}
  if(a==='del'){if(!['expenses','inquiries','subscribers'].includes(b.col))return rs.status(400).json({error:'bad'});await db('DELETE FROM rec WHERE id=? AND col=?',[+b.id||0,b.col]);return rs.json({ok:1})}
  if(a==='upload'){const m=/^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(b.data||'');if(!m)return rs.status(400).json({error:'Only jpg/png/webp'});
    const buf=Buffer.from(m[2],'base64');if(buf.length>4e6)return rs.status(400).json({error:'Max 4MB'});
    const id=crypto.randomBytes(8).toString('hex'),ext=m[1].replace('jpeg','jpg');await db('INSERT INTO files(id,mime,data) VALUES(?,?,?)',[id,'image/'+m[1].replace('jpg','jpeg'),buf]);return rs.json({url:`/uploads/${id}.${ext}`})}
  rs.status(404).json({error:'unknown'})}));
app.get('/uploads/:f',h(async(rq,rs)=>{const id=rq.params.f.split('.')[0].replace(/\W/g,''),[x]=await db('SELECT mime,data FROM files WHERE id=?',[id]);if(!x)return rs.status(404).end();rs.set('Content-Type',x.mime).set('Cache-Control','public,max-age=604800').send(x.data)}));
app.use(express.static(path.join(__d,'dist')));
app.get('*',(rq,rs)=>rs.sendFile(path.join(__d,'dist/index.html')));
app.listen(E.PORT||3000,()=>console.log('HoneyKey running'));