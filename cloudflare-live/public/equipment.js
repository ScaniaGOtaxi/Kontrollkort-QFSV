import {equipment} from './data.js';
export function equipmentFor(vehicle,config){if(!vehicle)return [];return config?.equipmentLists?.[vehicle[0]]||(equipment[vehicle[0]]||equipment[vehicle[3]]||[]).map((text,i)=>({id:'extra'+i,text,visible:true}))}
export const activeEquipment=(vehicle,config)=>equipmentFor(vehicle,config).filter(q=>q.visible);
export function validEquipment(items){if(!Array.isArray(items)||items.length>100)return false;const ids=new Set();return items.every(q=>{if(!q||typeof q!=='object'||!Object.keys(q).every(k=>['id','text','visible'].includes(k))||typeof q.id!=='string'||!(/^(extra\d{1,3}|e_[a-f0-9-]{36})$/.test(q.id))||ids.has(q.id)||typeof q.text!=='string'||!q.text.trim()||q.text.length>500||typeof q.visible!=='boolean')return false;ids.add(q.id);return true})}
