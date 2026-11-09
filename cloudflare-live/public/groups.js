import {activeEquipment} from './equipment.js';
import {sectionsFor,questionsFor} from './forms.js';
import {daily,weekly,base,equipment} from './data.js';
export const menuOptions={daily:'Daglig tillsyn',weekly:'Veckokontroll',equipment:'Extrautrustning',alcohol:'Alkolås',vehicleStatus:'Fordonsstatus / belysning',service:'Service, reparation och inspektion',meter:'Mätarställning'};
const machine={daily:true,weekly:true,equipment:true,alcohol:false,vehicleStatus:false,service:true,meter:true};
const road={daily:false,weekly:false,equipment:true,alcohol:true,vehicleStatus:true,service:true,meter:true};
export const defaultGroups={hako:{name:'Sopmaskiner',...machine},tractor:{name:'Traktorer',...machine},loader:{name:'Hjullastare',...machine},forklift:{name:'Truckar',...machine},car:{name:'Bilar',...road},truck:{name:'Lastbilar',...road}};
export const groupsFor=config=>Object.fromEntries(Object.entries(defaultGroups).map(([id,rules])=>[id,{...rules,...config?.groups?.[id]}]));
export function rulesFor(vehicle,config){const rules={...(groupsFor(config)[vehicle?.[3]]||defaultGroups.loader)};if(vehicle)for(const section of sectionsFor(vehicle,config))if(section.type!=='custom'&&!section.visible)rules[section.type]=false;return rules}
export function validGroups(groups){return groups&&typeof groups==='object'&&!Array.isArray(groups)&&Object.keys(groups).length===Object.keys(defaultGroups).length&&Object.keys(groups).every(id=>Object.hasOwn(defaultGroups,id)&&groups[id]&&typeof groups[id].name==='string'&&groups[id].name.trim().length>0&&groups[id].name.length<=100&&Object.keys(groups[id]).length===Object.keys(menuOptions).length+1&&Object.keys(menuOptions).every(key=>typeof groups[id][key]==='boolean'))}
export const dailyFor=(vehicle,config)=>rulesFor(vehicle,config).daily?questionsFor(vehicle,config,'daily').map(q=>q.text):[];
export const weeklyFor=(vehicle,config)=>rulesFor(vehicle,config).weekly?questionsFor(vehicle,config,'weekly').map(q=>q.text):[];
export function cleanCard(input,vehicle,config){const card={...input},rules=rulesFor(vehicle,config);const drop=pattern=>Object.keys(card).filter(k=>pattern.test(k)).forEach(k=>delete card[k]);
 if(!rules.daily)drop(/^daily\d+$/);
 if(!rules.weekly){delete card.weekly;drop(/^week\d+$/)}
 if(!card.weekly)drop(/^week\d+$/);
 if(!rules.equipment){drop(/^extra(?:\d+|Comment)?$/);drop(/^e_/)}
 if(!rules.alcohol){delete card.alcohol;delete card.alcoholComment}
 if(!rules.vehicleStatus){delete card.carStatus;delete card.carComment;drop(/^light\d+$/)}
 if(card.carStatus!=='Fel'){delete card.carComment;drop(/^light\d+$/)}
 if(!rules.service){delete card.service;delete card.serviceType;delete card.serviceComment}
 if(!card.service){delete card.serviceType;delete card.serviceComment}
 if(!rules.meter){delete card.meter;delete card.reading;delete card.unit}
 if(!card.meter){delete card.reading;delete card.unit;delete card.meterPeriod}
 const sections=sectionsFor(vehicle,config);const allowed=new Set(sections.filter(s=>s.visible&&(s.type==='custom'||rules[s.type])&&(s.type!=='weekly'||card.weekly)&&(s.type!=='vehicleStatus'||card.carStatus==='Fel')).flatMap(s=>s.questions.filter(q=>q.visible).map(q=>q.id)));
 Object.keys(card).filter(k=>/^(?:daily|week|light)\d+$/.test(k)||k.startsWith('q_')).forEach(k=>{if(!allowed.has(k.endsWith('_comment')?k.slice(0,-8):k))delete card[k]});
 const selected=config.vehicles.find(v=>v[0]===card.extra),equipmentIds=new Set(rules.equipment?activeEquipment(selected,config).map(q=>q.id):[]);
 Object.keys(card).filter(k=>/^extra\d+$/.test(k)||k.startsWith('e_')).forEach(k=>{if(!equipmentIds.has(k.endsWith('_comment')?k.slice(0,-8):k)||card[k]==='')delete card[k]});
 if(![...equipmentIds].some(id=>Object.hasOwn(card,id))){delete card.extra;delete card.extraComment}
 for(const key of Object.keys(card).filter(k=>k.endsWith("_comment"))){const id=key.slice(0,-8);if(!Object.hasOwn(card,id))delete card[key]}
 return card;
}
export function snapshotFor(card,vehicle,config){const extra=config.vehicles.find(v=>v[0]===card.extra);return {vehicle:[...vehicle],name:card.name==='Övrigt'?card.otherName:card.name,group:{...rulesFor(vehicle,config)},sections:sectionsFor(vehicle,config).map(s=>({...s,visible:s.visible&&(s.type==='custom'||rulesFor(vehicle,config)[s.type]),questions:s.questions.map(q=>({...q}))})),equipmentQuestions:extra?activeEquipment(extra,config).filter(q=>Object.hasOwn(card,q.id)).map(q=>({...q})):[],checks:{daily:dailyFor(vehicle,config),weekly:weeklyFor(vehicle,config),extra:extra?activeEquipment(extra,config).filter(q=>Object.hasOwn(card,q.id)).map(q=>q.text):[]},extraVehicle:extra?[...extra]:null}}
