import {rulesFor} from './groups.js';
export const stockholmDate=(now=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function validDate(value){try{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value}catch{return false}}
export function validSchedule(rows){try{return Array.isArray(rows)&&rows.length<=120&&new Set(rows.map(r=>r.date?.slice(0,7))).size===rows.length&&rows.every(r=>r&&Object.keys(r).every(k=>['date','comment'].includes(k))&&validDate(r.date)&&typeof r.comment==='string'&&r.comment.length<=1000)}catch{return false}}
export function validReading(card){return card.meter===true&&card.reading!==''&&card.reading!==undefined&&Number.isFinite(Number(card.reading))&&Number(card.reading)>=0&&['km','timmar'].includes(card.unit)}
export function meterStatus(config,cards,today=stockholmDate()){
 const eligible=config.vehicles.filter(v=>!(config.hiddenVehicles||[]).includes(v[0])&&rulesFor(v,config).meter);
 return (config.meterSchedule||[]).map(row=>{const period=row.date.slice(0,7),targets=eligible.filter(v=>!config.vehicleAddedOn?.[v[0]]||config.vehicleAddedOn[v[0]]<=row.date);
 const complete=targets.filter(v=>cards.some(c=>{if(c.vehicle!==v[0]||!validReading(c)||!c.savedAt)return false;let received;try{received=stockholmDate(new Date(c.savedAt))}catch{return false}return received>=row.date&&received<=today&&c.date>=row.date&&c.date<=today&&(c.meterPeriod?c.meterPeriod===period:c.date.slice(0,7)===period)})).map(v=>v[0]);
 return {period,date:row.date,comment:row.comment,due:row.date<=today,overdue:row.date<today,complete,missing:targets.filter(v=>!complete.includes(v[0])).map(v=>v[0])};
 }).sort((a,b)=>a.date.localeCompare(b.date));
}
export const pendingFor=(status,vehicle)=>status.filter(r=>r.due&&r.missing.includes(vehicle));
export function meterReportError(card,config,cards,today=stockholmDate()){
 const pending=pendingFor(meterStatus(config,cards,today),card.vehicle);
 if(pending.length&&!validReading(card))return 'Mätarställning saknas för fordonet. Rapportera km eller timmar innan du skickar kontrollkortet.';
 if(pending.length&&!card.meterPeriod)return 'Välj vilken månads mätarställning du rapporterar.';
 if(card.meterPeriod){const row=(config.meterSchedule||[]).find(r=>r.date.slice(0,7)===card.meterPeriod);if(!validReading(card)||!row||row.date>today||card.date<row.date||card.date>today)return 'Kontrollera månad och avläsningsdatum. Avläsningen ska göras på eller efter månadens sista arbetsdag.'}
 if(card.meterOnly&&!validReading(card))return 'Ange en giltig mätarställning och enhet.';
 return null;
}
