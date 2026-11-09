import {daily,weekly,equipment} from './data.js';
export function cardLines(card,vehicles){const v=card.snapshot?.vehicle||vehicles.find(v=>v[0]===card.vehicle)||[card.vehicle,card.vehicle,'','loader'],lines=['KONTROLLKORT QFSV',`${card.date} · ${card.snapshot?.name||(card.name==='Övrigt'?card.otherName:card.name)}`,`${v[1]} · ${v[2]}`];
 const add=(label,value)=>{if(value!==undefined&&value!=='')lines.push(`${label}: ${value}`)};
 const questions=items=>items.filter(q=>q.visible).forEach(q=>add(q.text,card[q.id]||'Ej besvarat'));
 const extra=()=>{const e=card.snapshot?.extraVehicle||vehicles.find(v=>v[0]===card.extra);if(e&&card.extra){lines.push(e[1]);if(card.snapshot?.equipmentQuestions)card.snapshot.equipmentQuestions.forEach(q=>add(q.text,card[q.id]||'Ej besvarat'));else (card.snapshot?.checks?.extra||equipment[e[0]]||equipment[e[3]]||[]).forEach((label,i)=>add(label,card['extra'+i]||'Ej besvarat'));add('Kommentar',card.extraComment)}};
 if(card.meterPeriod)lines.push('Rapporteringsmånad: '+card.meterPeriod);
 const section=s=>{if(!s.visible||s.type==='weekly'&&!card.weekly||s.type==='equipment'&&!card.extra||s.type==='service'&&!card.service||s.type==='meter'&&!card.meter)return;
 lines.push('\n'+s.title);
 if(['daily','weekly','custom'].includes(s.type))questions(s.questions);
 if(s.type==='equipment')extra();
 if(s.type==='alcohol'){add('Status',card.alcohol);add('Kommentar',card.alcoholComment)}
 if(s.type==='vehicleStatus'){add('Status',card.carStatus);if(card.carStatus==='Fel')questions(s.questions);add('Beskrivning',card.carComment)}
 if(s.type==='service'){add('Typ',card.serviceType);add('Information',card.serviceComment)}
 if(s.type==='meter')add('Mätarställning',card.reading+' '+card.unit);
 };
 if(card.snapshot?.sections)card.snapshot.sections.forEach(section);else{
 (card.snapshot?.checks?.daily||daily(v)).forEach((label,i)=>add(label,card['daily'+i]||'Ej besvarat'));
 if(card.weekly)(card.snapshot?.checks?.weekly||weekly(v)).forEach((label,i)=>add(label,card['week'+i]||'Ej besvarat'));
 extra();add('Alkolås',card.alcohol);add('Kommentar alkolås',card.alcoholComment);add('Fordonsstatus',card.carStatus);
 if(card.carStatus==='Fel')['Lampor höger/vänster','Blinkers höger/vänster','Bromslampor','Registreringslampor'].forEach((label,i)=>add(label,card['light'+i]));
 add('Fordonsfel',card.carComment);if(card.service){add('Typ av arbete',card.serviceType);add('Information',card.serviceComment)}if(card.meter)add('Mätarställning',card.reading+' '+card.unit);
 }
 add('Övrigt',card.comment);return lines;
}
