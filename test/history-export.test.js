import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historyCsv,historyText} from '../cloudflare-live/public/history-export.js';
const vehicles=[['a','Ny fordonsbenämning','NEW','loader']];
const card={vehicle:'a',date:'2026-11-09',name:'Original',comment:'Rad 1; "åäö"\nRad 2',daily0:'Skall repareras',daily0_comment:'Oljeläckage',snapshot:{vehicle:['a','Historiskt namn','OLD','loader'],name:'=SUM(1)',sections:[{visible:true,title:'Daglig tillsyn',type:'daily',questions:[{id:'daily0',text:'Oljenivå',visible:true}]}]}};
test('CSV preserves historical identity, multiline comments and Swedish text with safe spreadsheet cells',()=>{
 const csv=historyCsv([card],vehicles);assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"Historiskt namn";"OLD";"\'=SUM(1)"'));assert.ok(csv.includes('Rad 1; ""åäö""\nRad 2'));assert.ok(csv.includes('Oljeläckage'));assert.ok(!csv.includes('Ny fordonsbenämning'));
});
test('text export includes every report and its question comments without modifying cards',()=>{
 const before=JSON.stringify(card);const text=historyText([card,{...card,date:'2026-11-10'}],vehicles);assert.ok(text.includes('2026-11-09'));assert.ok(text.includes('2026-11-10'));assert.ok(text.includes('Kommentar – Oljenivå: Oljeläckage'));assert.equal(JSON.stringify(card),before);assert.equal(historyText([],vehicles),'');
});
