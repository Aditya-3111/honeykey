export const api=(p,b)=>fetch('/api/'+p,{method:b?'POST':'GET',headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify(b):undefined}).then(r=>r.json());
export const wa=(c,t)=>`https://wa.me/${(c.contact.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(t)}`;
export const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN');