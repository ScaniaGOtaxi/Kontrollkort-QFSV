import {accountRoles} from './public/access.js';
import {correctReport} from './public/report-edit.js';
import {meterStatus,meterReportError,validSchedule,stockholmDate} from './public/meter.js';
import {modelImages,defaultModelImage} from './public/vehicle-images.js';
import {normalizeFleet,vehicleUnit} from './public/fleet.js';
import {activeEquipment,validEquipment} from './public/equipment.js';
import {sectionsFor,questionsFor,validSections,visibleQuestions} from './public/forms.js';
import {validGroups,rulesFor,dailyFor,weeklyFor,cleanCard,snapshotFor} from './public/groups.js';
import {daily,weekly,equipment,statuses} from './public/data.js';
import {hashPassword,verifyPassword,digest,randomToken,equalToken} from './cloudflare-auth.js';
import assets from './cloudflare-assets.js';
import {validContent,validateImage} from './public/content.js';
export function adaptD1(binding){return {prepare(sql){return {get:(...args)=>binding.prepare(sql).bind(...args).first(),all:async(...args)=>(await binding.prepare(sql).bind(...args).all()).results,run:async(...args)=>{const r=await binding.prepare(sql).bind(...args).run();return {changes:r.meta.changes}}}}}}
export async function handleApi(request,env){
 const db=adaptD1(env.DB),url=new URL(request.url),path=url.pathname;
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 const json=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 const config=async()=>normalizeFleet(JSON.parse((await db.prepare('SELECT data FROM settings WHERE id=1').get()).data));
 try{

 if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')){const expected=url.origin;if(request.headers.get('Origin')!==expected)return json(403,{error:'Otillåtet ursprung.'})}
 let body={};if(!['GET','HEAD'].includes(request.method)){const reader=request.body?.getReader();let size=0,chunks=[];if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>(path.startsWith('/api/images/')?720000:65536)){await reader.cancel();return json(413,{error:'För stor begäran.'})}chunks.push(value)}}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}try{body=JSON.parse(new TextDecoder().decode(bytes)||'{}')}catch{return json(400,{error:'Ogiltig JSON.'})}if(!body||typeof body!=='object'||(Array.isArray(body)&&!path.startsWith('/api/forms/')&&!path.startsWith('/api/equipment/')&&path!=='/api/meter-schedule'))return json(400,{error:'Ogiltig JSON.'})}

 const now=Date.now();(await db.prepare('DELETE FROM sessions WHERE expires<?').run(now));(await db.prepare('DELETE FROM attempts WHERE expires<?').run(now));
 const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)qfsv_session=([^;]+)/)?.[1];
 const admin=token?(await db.prepare('SELECT admins.id,admins.email,admins.role FROM sessions JOIN admins ON admins.id=sessions.admin WHERE sessions.token=?').get(await digest(token))):null;

 if(path==='/api/setup'&&request.method==='POST'){
  if(!env.BOOTSTRAP_TOKEN||!await equalToken(String(body.token||''),env.BOOTSTRAP_TOKEN))return json(403,{error:'Ogiltig installationslänk.'});
  const email=String(body.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof body.password!=='string'||body.password.length<12||body.password.length>200)return json(400,{error:'Ange e-post och minst 12 tecken i lösenordet.'});
  const hash=await hashPassword(body.password);
  const result=await db.prepare('INSERT INTO admins(id,email,password,role) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM admins)').run(crypto.randomUUID(),email,hash,'superadmin');
  return json(result.changes?201:409,{ok:!!result.changes,error:result.changes?undefined:'Administratör finns redan. Logga in istället.'});
 }
 if(path.startsWith('/api/images/')&&request.method==='GET'){
  const id=path.split('/').pop();if(!(await config()).vehicles.some(v=>v[0]===id))return json(404,{error:'Fordonet finns inte.'});
  const image=await db.prepare('SELECT type,data FROM images WHERE id=?').get(id),asset=assets['/'+id+'.webp'];
  if(!image&&defaultModelImage(id,await config())){try{const illustration=await fetch(defaultModelImage(id,await config()),{cf:{cacheTtl:86400,cacheEverything:true}});if(illustration.ok){return new Response(illustration.body,{headers:{'Content-Type':'image/png','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}})}}catch(err){console.error(JSON.stringify({event:'model_image_fetch_failed',vehicle:id}))}}
  if(!image&&!asset)return json(404,{error:'Ingen bild ännu.'});
  return new Response(Uint8Array.from(atob(image?.data||asset.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':image?.type||asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
 }
 if(path==='/api/meter-status'&&request.method==='GET')return json(200,{today:stockholmDate(),rows:meterStatus(await config(),(await db.prepare("SELECT data FROM cards WHERE json_extract(data,'$.meter')=1").all()).map(r=>JSON.parse(r.data)))});
 if(path==='/api/config'&&request.method==='GET')return json(200,await config());
 if(path==='/api/login'&&request.method==='POST'){
 if(typeof body.password!=='string'||body.password.length>200)return json(400,{error:'Ogiltiga inloggningsuppgifter.'});
 const email=String(body.email||'').toLowerCase().trim(),ip=request.headers.get('CF-Connecting-IP')||'unknown',keys=['ip:'+ip,'email:'+email];
 if((await Promise.all(keys.map(async k=>(await db.prepare('SELECT count FROM attempts WHERE key=?').get(k))?.count||0))).some(n=>n>=10))return json(429,{error:'För många försök. Vänta 15 minuter.'});
 for(const k of keys)(await db.prepare('INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(k,now+900000));
 const user=(await db.prepare('SELECT * FROM admins WHERE email=?').get(email));
 if(!await verifyPassword(String(body.password||''),user?.password||'dummy:'+ '00'.repeat(32)))return json(401,{error:'Fel e-post eller lösenord.'});
 const value=randomToken();(await db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await digest(value),user.id,now+8*3600000));
 headers.set('Set-Cookie',`qfsv_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800; Secure`);return json(200,{email:user.email});
 }
 if(path==='/api/cards'&&request.method==='POST'){
 const cfg=await config(),v=cfg.vehicles.find(v=>v[0]===body.vehicle),c=v?cleanCard(body,v,cfg):body,name=c.name==='Övrigt'?c.otherName:c.name;
 if(Object.hasOwn(body,'meterOnly')&&typeof body.meterOnly!=='boolean')return json(400,{error:'Ogiltig rapporttyp.'});
 if(body.meterOnly===true){for(const k of Object.keys(c))if(!['id','vehicle','date','name','otherName','meterOnly','meter','meterPeriod','reading','unit'].includes(k))delete c[k]}
 if(!v||!cfg.names.includes(c.name)||typeof name!=='string'||!name.trim()||name.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||!Number.isFinite(Date.parse(c.date)))return json(400,{error:'Kontrollera fordon, förare och datum.'});
 if((cfg.hiddenVehicles||[]).includes(c.vehicle)||(c.extra&&(cfg.hiddenVehicles||[]).includes(c.extra)))return json(400,{error:'Fordonet är dolt och kan inte användas för nya kontroller. Välj ett aktivt fordon.'});
 if(c.meter){const unit=vehicleUnit(v,cfg);if(c.unit!==undefined&&c.unit!==unit)return json(400,{error:'Fordonets mätarställning ska rapporteras i '+unit+'.'});c.unit=unit}
 const rules=rulesFor(v,cfg);
 const checks=[...(rules.daily?questionsFor(v,cfg,'daily'):[]).map(q=>[q.id,statuses]),...(c.weekly?questionsFor(v,cfg,'weekly').map(q=>[q.id,statuses]):[])];
 const extra=cfg.vehicles.find(v=>v[0]===c.extra);if(c.extra&&!extra)return json(400,{error:'Okänd extrautrustning.'});
 if(extra)checks.push(...activeEquipment(extra,cfg).filter(q=>Object.hasOwn(c,q.id)).map(q=>[q.id,statuses.slice(0,2)]));
 if(rules.alcohol)checks.push(['alcohol',['OK','Service','Ej monterad','Annat']]);
 if(rules.vehicleStatus){checks.push(['carStatus',['OK','Fel']]);if(c.carStatus==='Fel')checks.push(...questionsFor(v,cfg,'vehicleStatus').map(q=>[q.id,['OK','Fel']]))}
 if(c.meterOnly)checks.length=0;
 const sections=sectionsFor(v,cfg);for(const section of sections)if(!c.meterOnly&&section.type==='custom'&&section.visible)checks.push(...visibleQuestions(section).map(q=>[q.id,statuses]));
 if(checks.some(([k,values])=>!values.includes(c[k])))return json(400,{error:'Alla kontrollpunkter måste besvaras.'});
 const required=[...(checks.some(([k])=>(k.startsWith('extra')||k.startsWith('e_'))&&c[k]==='Skall repareras')?['extraComment']:[]),...(['Service','Annat'].includes(c.alcohol)?['alcoholComment']:[]),...(c.carStatus==='Fel'?['carComment']:[]),...(c.service?['serviceComment']:[])];
 if(required.some(k=>typeof c[k]!=='string'||!c[k].trim())||(c.service&&!['Service','Inspektion','Reparation'].includes(c.serviceType))||(c.meter&&(!['km','timmar'].includes(c.unit)||c.reading===''||!Number.isFinite(Number(c.reading))||Number(c.reading)<0)))return json(400,{error:'Kommentar, service eller mätarställning saknas.'});
 if(Object.values(c).some(v=>!['string','boolean'].includes(typeof v))||Object.values(c).some(v=>typeof v==='string'&&v.length>5000))return json(400,{error:'Ogiltigt kontrollkort.'});
 const id=c.id;if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))return json(400,{error:'Ogiltigt kortnummer.'});
 const meterError=meterReportError(c,cfg,(await db.prepare("SELECT data FROM cards WHERE json_extract(data,'$.meter')=1").all()).map(r=>JSON.parse(r.data)));if(meterError)return json(400,{error:meterError});
 const snapshot={...snapshotFor(c,v,cfg),name:name.trim()};if(c.meterOnly)snapshot.sections=snapshot.sections.filter(s=>s.type==='meter');const card={...c,snapshot,savedAt:new Date().toISOString()};
 const prev=(await db.prepare('SELECT id FROM cards WHERE id=?').get(id));if(prev)return json(200,{id});
 const throttle='submit:'+(request.headers.get('CF-Connecting-IP')||'unknown');if(((await db.prepare('SELECT count FROM attempts WHERE key=?').get(throttle))?.count||0)>=60)return json(429,{error:'För många inskick. Försök igen senare.'});
 (await db.prepare('INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(throttle,now+600000));
 (await db.prepare('INSERT INTO cards(id,data,created) VALUES(?,?,?)').run(id,JSON.stringify(card),card.savedAt));return json(201,{id});
 }
 if(!admin)return json(401,{error:'Logga in som administratör.'});
 if(path.startsWith('/api/admins')&&admin.role!=='superadmin')return json(403,{error:'Endast Superadmin får hantera konton och roller.'});
 if(!['superadmin','admin'].includes(admin.role)&&!['GET','HEAD'].includes(request.method)&&path!=='/api/logout')return json(403,{error:'Ditt konto har endast läsbehörighet.'});
 if(path.startsWith('/api/meter-schedule/')&&request.method==='PATCH'){
  const date=path.split('/').pop();if(typeof body.comment!=='string'||body.comment.length>1000)return json(400,{error:'Kommentaren får vara högst 1000 tecken.'});
  const cfg=await config();if(!(cfg.meterSchedule||[]).some(row=>row.date===date))return json(404,{error:'Datumet finns inte. Spara datumlistan först.'});
  cfg.meterSchedule=cfg.meterSchedule.map(row=>row.date===date?{...row,comment:body.comment.trim()}:row);await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path==='/api/meter-schedule'&&request.method==='PUT'){
  if(!validSchedule(body))return json(400,{error:'Ange giltiga datum och högst en sista arbetsdag per månad. Kommentar får vara högst 1000 tecken.'});
  const cfg=await config();cfg.meterSchedule=body.map(r=>({date:r.date,comment:r.comment.trim()})).sort((a,b)=>a.date.localeCompare(b.date));await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path.startsWith('/api/image-defaults/')&&request.method==='PUT'){
  const cfg=await config(),id=path.split('/').pop();if(!cfg.vehicles.some(v=>v[0]===id))return json(404,{error:'Fordonet finns inte.'});
  if(typeof body.model!=='string'||body.model!==''&&!Object.hasOwn(modelImages,body.model))return json(400,{error:'Välj en tillgänglig standardbild.'});
  cfg.imageDefaults={...cfg.imageDefaults};if(body.model)cfg.imageDefaults[id]=body.model;else delete cfg.imageDefaults[id];await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path.startsWith('/api/equipment/')&&request.method==='PUT'){
  const cfg=await config(),id=path.split('/').pop();if(!cfg.vehicles.some(v=>v[0]===id))return json(404,{error:'Fordonet finns inte.'});
  if(!validEquipment(body))return json(400,{error:'Kontrollera utrustningsnamnen. Högst 100 poster och 500 tecken per namn.'});
  cfg.equipmentLists={...cfg.equipmentLists,[id]:body};await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path.startsWith('/api/forms/')&&request.method==='PUT'){
  const group=path.split('/').pop();if(!['hako','tractor','loader','forklift','car','truck'].includes(group)||!validSections(body))return json(400,{error:'Kontrollera sektioner och frågor. Namn får inte vara tomma.'});
  const cfg=await config();cfg.forms={...cfg.forms,[group]:body};await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path==='/api/groups'&&request.method==='PUT'){
  if(!validGroups(body))return json(400,{error:'Kontrollera gruppernas namn och menyval.'});
  const cfg=await config();cfg.groups=body;await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path==='/api/content'&&request.method==='PUT'){
  if(!validContent(body))return json(400,{error:'Kontrollera sidtexterna. Varje text får vara högst 1000 tecken.'});
  const cfg=await config();cfg.content={...cfg.content,...body};await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(cfg));return json(200,{ok:true});
 }
 if(path.startsWith('/api/images/')&&['PUT','DELETE'].includes(request.method)){
  const id=path.split('/').pop();if(!(await config()).vehicles.some(v=>v[0]===id))return json(404,{error:'Fordonet finns inte.'});
  if(request.method==='DELETE'){await db.prepare('DELETE FROM images WHERE id=?').run(id);return json(200,{ok:true})}
  if(!validateImage(body))return json(400,{error:'Välj en PNG-, JPEG- eller WebP-bild på högst 500 kB.'});
  await db.prepare('INSERT INTO images VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET type=excluded.type,data=excluded.data').run(id,body.type,body.data);return json(200,{ok:true});
 }
 if(path==='/api/me'&&request.method==='GET')return json(200,admin);
 if(path==='/api/logout'&&request.method==='POST'){(await db.prepare('DELETE FROM sessions WHERE token=?').run(await digest(token)));headers.set('Set-Cookie','qfsv_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(200,{ok:true})}
 if(path==='/api/cards'&&request.method==='GET')return json(200,(await db.prepare('SELECT * FROM cards ORDER BY created DESC').all()).map(r=>({...JSON.parse(r.data),resolved:!!r.resolved,note:r.note})));
 if(/^\/api\/cards\/[a-f0-9-]{36}$/i.test(path)&&request.method==='PUT'){const id=path.split('/').pop(),row=await db.prepare('SELECT * FROM cards WHERE id=?').get(id);if(!row)return json(404,{error:'Rapporten finns inte längre.'});const result=correctReport(JSON.parse(row.data),body,await config(),admin.email);if(result.error)return json(result.conflict?409:400,{error:result.error});if(!result.unchanged){const updated=await db.prepare('UPDATE cards SET data=? WHERE id=? AND data=?').run(JSON.stringify(result.value),id,row.data);if(!updated.changes)return json(409,{error:'Rapporten ändrades samtidigt. Ladda om och försök igen.'})}return json(200,{...result.value,resolved:!!row.resolved,note:row.note})}
 if(/^\/api\/cards\/[a-f0-9-]{36}$/i.test(path)&&request.method==='DELETE'){const id=path.split('/').pop();if(body.confirmId!==id)return json(400,{error:'Bekräfta vilken rapport som ska raderas.'});const r=await db.prepare('DELETE FROM cards WHERE id=?').run(id);return r.changes?json(200,{ok:true}):json(404,{error:'Rapporten finns inte längre.'})}
 if(path.startsWith('/api/cards/')&&request.method==='PATCH'){const id=path.split('/').pop();if(typeof body.resolved!=='boolean'||typeof body.note!=='string'||body.note.length>5000)return json(400,{error:'Ogiltig åtgärd.'});const r=(await db.prepare('UPDATE cards SET resolved=?,note=? WHERE id=?').run(+body.resolved,body.note,id));return json(r.changes?200:404,{ok:!!r.changes})}
 if(path==='/api/config'&&request.method==='PUT'){
 const {names,vehicles}=body;if(!Array.isArray(names)||!names.length||names.length>200||names.some(n=>typeof n!=='string'||!n.trim()||n.length>100)||!names.includes('Övrigt')||new Set(names).size!==names.length||!Array.isArray(vehicles)||!vehicles.length||vehicles.length>200||new Set(vehicles.map(v=>v[0])).size!==vehicles.length||vehicles.some(v=>!Array.isArray(v)||v.length!==4||v.some(x=>typeof x!=='string'||!x.trim()||x.length>150)||!/^[a-z0-9-]+$/.test(v[0])||!['hako','tractor','loader','forklift','car','truck'].includes(v[3])))return json(400,{error:'Kontrollera förare och fordon. Övrigt måste finnas.'});
 const current=await config(),hiddenVehicles=body.hiddenVehicles===undefined?(current.hiddenVehicles||[]):body.hiddenVehicles;
 if(!Array.isArray(hiddenVehicles)||hiddenVehicles.some(id=>typeof id!=='string'||!vehicles.some(v=>v[0]===id))||new Set(hiddenVehicles).size!==hiddenVehicles.length)return json(400,{error:'Ogiltig lista över dolda fordon.'});
 const handedOverVehicles=body.handedOverVehicles===undefined?(current.handedOverVehicles||[]).filter(id=>hiddenVehicles.includes(id)):body.handedOverVehicles;
 if(!Array.isArray(handedOverVehicles)||handedOverVehicles.some(id=>typeof id!=='string'||!hiddenVehicles.includes(id))||new Set(handedOverVehicles).size!==handedOverVehicles.length)return json(400,{error:'Överlämnade fordon ska vara giltiga fordon som inte visas för nya kontroller.'});
 const vehicleUnits=body.vehicleUnits===undefined?(current.vehicleUnits||{}):body.vehicleUnits;
 if(!vehicleUnits||typeof vehicleUnits!=='object'||Array.isArray(vehicleUnits)||Object.entries(vehicleUnits).some(([id,unit])=>!vehicles.some(v=>v[0]===id)||!['km','timmar'].includes(unit)))return json(400,{error:'Välj kilometer eller maskintimmar för varje fordon.'});
 if(current.vehicles.some(v=>!vehicles.some(next=>next[0]===v[0])))return json(400,{error:'Befintliga fordon får inte tas bort. Dölj överlämnade fordon för att behålla historiken.'});

 (await db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify({...current,names,vehicles,hiddenVehicles,handedOverVehicles,vehicleUnits,vehicleAddedOn:{...current.vehicleAddedOn,...Object.fromEntries(vehicles.filter(v=>!current.vehicles.some(old=>old[0]===v[0])).map(v=>[v[0],stockholmDate()]))}})));return json(200,{ok:true});
 }
 if(path.startsWith('/api/admins/')&&request.method==='PATCH'){const id=path.split('/').pop();if(!Object.hasOwn(accountRoles,body.role))return json(400,{error:'Ogiltig kontoroll.'});if(!(await db.prepare('SELECT id FROM admins WHERE id=?').get(id)))return json(404,{error:'Kontot finns inte.'});const result=await db.prepare("UPDATE admins SET role=? WHERE id=? AND (role<>'superadmin' OR ?='superadmin' OR (SELECT COUNT(*) FROM admins WHERE role='superadmin')>1)").run(body.role,id,body.role);if(!result.changes)return json(409,{error:'Den sista Superadmin måste behålla sin roll.'});return json(200,{ok:true})}
 if(path==='/api/admins'&&request.method==='GET')return json(200,(await db.prepare('SELECT id,email,role FROM admins').all()));
 if(path==='/api/admins'&&request.method==='POST'){const role=body.role||'admin';if(!Object.hasOwn(accountRoles,role))return json(400,{error:'Välj Superadmin, Admin eller User.'});const email=String(body.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof body.password!=='string'||body.password.length<12||body.password.length>200)return json(400,{error:'Ange e-post och lösenord med minst 12 tecken.'});if((await db.prepare('SELECT id FROM admins WHERE email=?').get(email)))return json(409,{error:'Kontot finns redan.'});(await db.prepare('INSERT INTO admins(id,email,password,role) VALUES(?,?,?,?)').run(crypto.randomUUID(),email,await hashPassword(body.password),role));return json(201,{ok:true})}
 return json(404,{error:'Hittades inte.'});
 }catch(err){console.error(JSON.stringify({event:'api_error',message:err.message}));return json(500,{error:'Ett serverfel uppstod. Försök igen.'})}
}
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return handleApi(request,env);
 const path=url.pathname==='/'?'/index.html':url.pathname;
 const asset=assets[path];if(!asset)return new Response('Hittades inte',{status:404});
 const body=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':`default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors ${url.searchParams.get('preview')==='1'&&['/','/index.html'].includes(url.pathname)?"'self'":"'none'"}; base-uri 'self'; form-action 'self'`,'Referrer-Policy':'no-referrer'}});
}};
