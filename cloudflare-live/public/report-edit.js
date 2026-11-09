import {validDate,stockholmDate} from './meter.js';
import {statuses} from './data.js';
const driver=c=>c.snapshot?.name||(c.name==='Övrigt'?c.otherName:c.name)||'';
export const reportVersion=c=>c.editRevision?'revision:'+c.editRevision:c.savedAt||'';
export function reportFields(c,config){
 const fleet=[...config.vehicles];if(!fleet.some(v=>v[0]===c.vehicle))fleet.push(c.snapshot?.vehicle||[c.vehicle,c.vehicle,'','']);
 const fields=[{key:'vehicle',label:'Fordon / maskin',options:fleet.map(v=>[v[0],v[1]+' · '+v[2]]),value:c.vehicle},{key:'date',label:'Avläsnings- / kontrolldatum',type:'date',value:c.date},{key:'driver',label:'Förare',value:driver(c)}];
 const add=(key,label,options,type='text')=>fields.push({key,label,options:options?.map(x=>[x,x]),type,value:c[key]??''});
 if(c.meter){add('reading','Mätarställning',null,'number');add('unit','Enhet',['km','timmar']);add('meterPeriod','Rapporteringsmånad (tomt = datumets månad)',null,'month')}
 if(c.service){add('serviceType','Underhållstyp',['Service','Reparation','Inspektion']);add('serviceComment','Service / reparation – kommentar',null,'textarea')}
 const labels=new Map();for(const section of c.snapshot?.sections||[])for(const q of section.questions||[])labels.set(q.id,q.text);
 for(const q of c.snapshot?.equipmentQuestions||[])labels.set(q.id,q.text);
 for(const [kind,list] of Object.entries(c.snapshot?.checks||{}))list.forEach((label,i)=>{if(!labels.has((kind==='weekly'?'week':kind)+i))labels.set((kind==='weekly'?'week':kind)+i,label)});
 for(const key of Object.keys(c))if(!key.endsWith('_comment')&&(/^(daily|week|extra|light)\d+$/.test(key)||key.startsWith('q_')||key.startsWith('e_')))add(key,labels.get(key)||key,[...new Set([...statuses,'Fel',c[key]].filter(Boolean))]);
 for(const f of [...fields])if(labels.has(f.key)||/^(daily|week|extra|light)\d+$/.test(f.key)||f.key.startsWith('q_')||f.key.startsWith('e_'))add(f.key+'_comment','Kommentar – '+f.label,null,'textarea');
 if(c.alcohol!==undefined)add('alcohol','Alkolås',['Utan anmärkning','Service','Annat',c.alcohol]);
 if(c.carStatus!==undefined)add('carStatus','Fordonsstatus',['Utan anmärkning','Fel',c.carStatus]);
 for(const [key,label] of [['comment','Övrig kommentar'],['extraComment','Utrustningskommentar'],['alcoholComment','Alkolås – kommentar'],['carComment','Fordonsfel – beskrivning']])if(key==='comment'||c[key]!==undefined)add(key,label,null,'textarea');
 return fields;
}
export function correctReport(original,body,config,email,now=new Date().toISOString()){
 if(!body||!body.fields||typeof body.fields!=='object'||Array.isArray(body.fields))return {error:'Ogiltiga rapportuppgifter.'};
 if(body.baseVersion!==reportVersion(original))return {error:'Rapporten har ändrats av någon annan. Ladda om och försök igen.',conflict:true};
 if(typeof body.reason!=='string'||!body.reason.trim()||body.reason.length>1000)return {error:'Ange en kort orsak till rättningen (högst 1 000 tecken).'};
 const definitions=reportFields(original,config),allowed=new Map(definitions.map(f=>[f.key,f]));
 for(const [key,value] of Object.entries(body.fields)){const f=allowed.get(key);if(!f||typeof value!=='string'||value.length>(f.type==='textarea'?5000:500)||f.options&&!f.options.some(([id])=>id===value))return {error:'Ogiltigt värde för '+(f?.label||'rapportfält')+'.'}}
 const values=Object.fromEntries(definitions.map(f=>[f.key,f.value]));Object.assign(values,body.fields);
 if(!validDate(values.date)||values.date>stockholmDate(new Date(now))||!values.driver.trim())return {error:'Kontrollera datum och förarnamn.'};
 if(original.meter&&(!/^\d+(\.\d+)?$/.test(values.reading)||!Number.isFinite(Number(values.reading))||Number(values.reading)<0))return {error:'Ange en giltig, positiv mätarställning eller noll.'};
 if(original.meter&&values.meterPeriod&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.meterPeriod)||values.meterPeriod>values.date.slice(0,7)))return {error:'Rapporteringsmånaden får inte ligga efter avläsningsdatumet.'};
 values.driver=values.driver.trim();const changes={};for(const f of definitions)if(String(f.value)!==values[f.key])changes[f.key]={label:f.label,from:f.value,to:values[f.key]};
 if(!Object.keys(changes).length)return {value:original,unchanged:true};
 const next={...original,snapshot:{...original.snapshot},editedAt:now,editRevision:(original.editRevision||0)+1};
 for(const key of Object.keys(changes))if(key!=='driver')next[key]=values[key];
 if(changes.driver){next.name='Övrigt';next.otherName=values.driver.trim();next.snapshot.name=values.driver.trim()}
 if(changes.vehicle)next.snapshot.vehicle=[...config.vehicles.find(v=>v[0]===values.vehicle)];
 if(next.meterPeriod==='')delete next.meterPeriod;
 next.corrections=[...(original.corrections||[]),{at:now,by:email,reason:body.reason.trim(),changes}];
 return {value:next};
}
