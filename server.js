import express from 'express';import fs from 'fs';import path from 'path';import crypto from 'crypto';import {fileURLToPath} from 'url';
const __d=path.dirname(fileURLToPath(import.meta.url));
const DATA=process.env.DATA_DIR||path.join(__d,'data'),UP=path.join(DATA,'uploads');
fs.mkdirSync(UP,{recursive:true});
const PASS=process.env.ADMIN_PASSWORD||'honeykey@123',SECRET=process.env.SESSION_SECRET||'hk-'+PASS;
const DEF=JSON.parse(fs.readFileSync(path.join(__d,'default-content.json'),'utf8'));
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(path.join(DATA,f),'utf8'))}catch{return d}};
const wr=(f,v)=>{const p=path.join(DATA,f);fs.writeFileSync(p+'.tmp',JSON.stringify(v,null,1));fs.renameSync(p+'.tmp',p)};
const content=()=>({...DEF,...rd('content.json',{})});
const getdb=()=>rd('db.json',null)||{seq:1000,orders:[],expenses:[],inquiries:[],subscribers:[],stock:{1:500,2:100,3:50}};
const S=(v,n)=>String(v??'').trim().slice(0,n);
const pub=c=>({...c,products:c.products.filter(p=>p.active!==false).map(({cost,...p})=>({...p,soldOut:(getdb().stock[p.id]||0)<=0}))});
const hits=new Map();const limited=(k,max,ms)=>{const n=Date.now(),h=(hits.get(k)||[]).filter(t=>n-t<ms);h.push(n);hits.set(k,h);return h.length>max};
const sign=s=>crypto.createHmac('sha256',SECRET).update(s).digest('hex');
const authed=q=>{const m=/(?:^|; )hk=([^;]+)/.exec(q.headers.cookie||'');if(!m)return false;const[e,s]=m[1].split('.');return !!s&&s.length===64&&Date.now()<+e&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sign(e)))};
const auth=(q,r,n)=>authed(q)?n():r.status(401).json({error:'login chahiye'});

function mkOrder(b,source){
  const c=content(),d=getdb(),m={};
  for(const it of (Array.isArray(b.items)?b.items:[]).slice(0,20)){const q=Math.min(99,parseInt(it.qty)||0);if(q>0)m[it.id]=Math.min(99,(m[it.id]||0)+q)}
  const items=[];
  for(const id of Object.keys(m)){const p=c.products.find(x=>x.id===id&&x.active!==false);if(!p)continue;
    if((d.stock[id]||0)<m[id])return{error:`${p.name}: itna stock nahi hai`};
    items.push({id,name:p.name,qty:m[id],price:+p.price||0,cost:+p.cost||0})}
  if(!items.length)return{error:'Cart khaali hai'};
  const sub=items.reduce((s,i)=>s+i.price*i.qty,0),st=c.settings||{};
  const fee=source==='Website'&&sub<(+st.freeAbove||0)?(+st.deliveryFee||0):0;
  items.forEach(i=>d.stock[i.id]-=i.qty);
  const off=source!=='Website';
  const o={no:'HK'+(++d.seq),date:new Date().toISOString(),source,name:S(b.name,60),phone:S(b.phone,15),address:S(b.address,300),pin:S(b.pin,10),note:S(b.note,200),items,subtotal:sub,fee,total:sub+fee,pay:S(b.pay,10)||'COD',payStatus:off?'Paid':'Pending',status:off?'Delivered':'New'};
  d.orders.unshift(o);wr('db.json',d);return{o};
}

const app=express();app.set('trust proxy',1);app.use(express.json({limit:'8mb'}));
const ip=q=>q.ip||'x';
app.get('/api/content',(q,r)=>r.json(pub(content())));
app.post('/api/order',(q,r)=>{
  if(limited('o'+ip(q),10,36e5))return r.status(429).json({error:'Thodi der baad try karo'});
  const b=q.body||{};
  if(S(b.name,60).length<2||S(b.phone,15).replace(/\D/g,'').length<10||S(b.address,300).length<6)return r.status(400).json({error:'Naam, 10-digit phone aur address zaroori hai'});
  const x=mkOrder(b,'Website');x.error?r.status(400).json(x):r.json({no:x.o.no,total:x.o.total});
});
app.get('/api/track',(q,r)=>{
  if(limited('t'+ip(q),30,36e5))return r.status(429).json({error:'Bahut requests'});
  const o=getdb().orders.find(x=>x.no===S(q.query.no,12).toUpperCase());
  const l=s=>String(s).replace(/\D/g,'').slice(-10);
  if(!o||l(o.phone)!==l(q.query.phone)||l(q.query.phone).length<10)return r.json({error:'Order nahi mila. Number check karo.'});
  r.json({no:o.no,date:o.date,status:o.status,payStatus:o.payStatus,total:o.total,items:o.items.map(i=>({name:i.name,qty:i.qty}))});
});
app.post('/api/inquiry',(q,r)=>{
  if(limited('i'+ip(q),8,36e5))return r.status(429).json({error:'Thodi der baad try karo'});
  const b=q.body||{},d=getdb();if(S(b.msg,500).length<3)return r.status(400).json({error:'Message likho'});
  d.inquiries.unshift({id:Date.now().toString(36),date:new Date().toISOString(),name:S(b.name,60),phone:S(b.phone,15),msg:S(b.msg,500)});wr('db.json',d);r.json({ok:1});
});
app.post('/api/subscribe',(q,r)=>{
  if(limited('s'+ip(q),8,36e5))return r.status(429).json({error:'Thodi der baad try karo'});
  const e=S(q.body?.email,100).toLowerCase(),d=getdb();if(!/^\S+@\S+\.\S+$/.test(e))return r.status(400).json({error:'Sahi email daalo'});
  if(!d.subscribers.find(x=>x.email===e)){d.subscribers.unshift({id:Date.now().toString(36),date:new Date().toISOString(),email:e});wr('db.json',d)}r.json({ok:1});
});
app.post('/api/login',(q,r)=>{
  if(limited('l'+ip(q),8,9e5))return r.status(429).json({error:'Bahut attempts, 15 min baad try karo'});
  const a=Buffer.from(S(q.body?.password,200)),b=Buffer.from(PASS);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return r.status(401).json({error:'Galat password'});
  const e=Date.now()+6048e5;r.setHeader('Set-Cookie',`hk=${e}.${sign(''+e)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${q.secure?'; Secure':''}`);r.json({ok:1});
});
app.get('/api/me',(q,r)=>r.json({ok:authed(q)}));
app.post('/api/logout',(q,r)=>{r.setHeader('Set-Cookie','hk=; HttpOnly; Path=/; Max-Age=0');r.json({ok:1})});

app.get('/api/admin/all',auth,(q,r)=>r.json({content:content(),db:getdb()}));
app.post('/api/admin/:a',auth,(q,r)=>{
  const b=q.body||{},a=q.params.a,d=getdb();
  if(a==='content'){if(typeof b.content!=='object')return r.status(400).json({error:'bad'});wr('content.json',b.content);return r.json({ok:1})}
  if(a==='stock'){d.stock[b.id]=Math.max(0,parseInt(b.qty)||0);wr('db.json',d);return r.json({ok:1})}
  if(a==='sale'){const x=mkOrder({...b,address:'Offline sale'},'Offline');return x.error?r.status(400).json(x):r.json({ok:1})}
  if(a==='order'){
    const o=d.orders.find(x=>x.no===b.no);if(!o)return r.status(404).json({error:'nahi mila'});
    if(b.status&&b.status!==o.status&&['New','Confirmed','Packed','Shipped','Delivered','Cancelled'].includes(b.status)){
      if(b.status==='Cancelled')o.items.forEach(i=>d.stock[i.id]=(d.stock[i.id]||0)+i.qty);
      else if(o.status==='Cancelled')o.items.forEach(i=>d.stock[i.id]=(d.stock[i.id]||0)-i.qty);
      o.status=b.status}
    if(['Pending','Paid'].includes(b.payStatus))o.payStatus=b.payStatus;
    wr('db.json',d);return r.json({ok:1});
  }
  if(a==='expense'){const n=+b.amount;if(!(n>0)||!S(b.title,80))return r.status(400).json({error:'Title aur amount daalo'});
    d.expenses.unshift({id:Date.now().toString(36),date:S(b.date,10)||new Date().toISOString().slice(0,10),title:S(b.title,80),cat:S(b.cat,30),amount:n});wr('db.json',d);return r.json({ok:1})}
  if(a==='del'){if(!['expenses','inquiries','subscribers'].includes(b.col))return r.status(400).json({error:'bad'});d[b.col]=d[b.col].filter(x=>x.id!==b.id);wr('db.json',d);return r.json({ok:1})}
  if(a==='upload'){const m=/^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(b.data||'');if(!m)return r.status(400).json({error:'Sirf jpg/png/webp'});
    const buf=Buffer.from(m[2],'base64');if(buf.length>4e6)return r.status(400).json({error:'Max 4MB'});
    const n=crypto.randomBytes(6).toString('hex')+'.'+m[1].replace('jpeg','jpg');fs.writeFileSync(path.join(UP,n),buf);return r.json({url:'/uploads/'+n})}
  r.status(404).json({error:'unknown'});
});
app.use('/uploads',express.static(UP,{maxAge:'7d'}));
app.use(express.static(path.join(__d,'dist')));
app.get('*',(q,r)=>r.sendFile(path.join(__d,'dist/index.html')));
app.listen(process.env.PORT||3000,()=>console.log('HoneyKey running'));