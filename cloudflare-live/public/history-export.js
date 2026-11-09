import {cardLines} from './card-report.js';
const safeCell=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'};
export function historyCsv(cards,vehicles){
 const rows=[['Datum','Fordon','Registrering','Förare','Rapportuppgift']];
 for(const card of cards){const v=card.snapshot?.vehicle||vehicles.find(v=>v[0]===card.vehicle)||[card.vehicle,card.vehicle,''];const name=card.snapshot?.name||(card.name==='Övrigt'?card.otherName:card.name);
 for(const line of cardLines(card,vehicles).slice(3).filter(line=>line.trim()))rows.push([card.date,v[1],v[2],name,line]);}
 return '\ufeff'+rows.map(row=>row.map(safeCell).join(';')).join('\r\n');
}
export const historyText=(cards,vehicles)=>cards.map(card=>cardLines(card,vehicles).join('\n')).join('\n\n'+'─'.repeat(60)+'\n\n');
