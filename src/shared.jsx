import {createContext} from 'react';
import {Pack} from './Art.jsx';
import {inr} from './api.js';
export const Ctx=createContext(null);
export const off=p=>p.mrp>p.price?Math.round((p.mrp-p.price)/p.mrp*100):0;
export const Img=({p})=>p.image?<img src={p.image} alt={p.name}/>:<Pack c={p.color}/>;
export const Price=({p})=><div className="price"><b>{inr(p.price)}</b>{p.mrp>p.price&&<><s>{inr(p.mrp)}</s><em>{off(p)}% off</em></>}</div>;
const STEPS=['New','Confirmed','Packed','Shipped','Delivered'];
export const Timeline=({s})=>s==='Cancelled'?<p className="err">This order was cancelled.</p>:<div className="tl">{STEPS.map((x,i)=><span key={x} className={i<=STEPS.indexOf(s)?'on':''}>{x}</span>)}</div>;