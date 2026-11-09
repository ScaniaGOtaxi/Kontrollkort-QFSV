import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monthlyStatistics,spreadsheetStatistics,spreadsheetCsvRows} from '../cloudflare-live/public/statistics.js';
import {statisticsPdf} from '../cloudflare-live/public/statistics-pdf.js';
const config={vehicles:[['truck-a','Truck A','AAA 111','truck'],['loader-b','Loader B','BBB 222','loader'],['car-c','Car C','CCC 333','car']]};
const cards=config.vehicles.flatMap((v,i)=>[{id:v[0]+'-base',vehicle:v[0],date:'2025-12-31',meterPeriod:'2025-12',reading:1000,meter:true,unit:i===1?'timmar':'km'},
 {id:v[0]+'-jan',vehicle:v[0],date:'2026-01-31',meterPeriod:'2026-01',reading:1100+i*10,meter:true,unit:i===1?'timmar':'km'}]);
test('multiple individually chosen vehicles drive screen, totals, CSV and PDF together',()=>{
 const data=spreadsheetStatistics(cards,config,{year:2026,today:'2026-11-09',vehicles:['truck-a','loader-b']});
 assert.deepEqual(data.fleet.map(v=>v[0]),['truck-a','loader-b']);
 assert.equal(data.totals.km,100);assert.equal(data.totals.hours,110);
 const csv=JSON.stringify(spreadsheetCsvRows(data));assert.ok(csv.includes('Truck A'));assert.ok(csv.includes('Loader B'));assert.ok(!csv.includes('Car C'));
 const pdf=new TextDecoder().decode(statisticsPdf(data,{year:2026}));
 assert.ok(pdf.startsWith('%PDF'));assert.ok(pdf.includes('Truck A'));assert.ok(!pdf.includes('Car C'));
});
test('empty checkbox selection means no vehicles; unspecified selection keeps all',()=>{
 assert.equal(spreadsheetStatistics(cards,config,{year:2026,vehicles:[]}).columns.length,0);
 assert.equal(spreadsheetStatistics(cards,config,{year:2026}).columns.length,3);
 assert.equal(monthlyStatistics(cards,config,{year:2026,vehicle:'car-c'}).fleet.length,1);
});
test('selection intersects group and ignores unknown or repeated vehicle IDs',()=>{
 const data=monthlyStatistics(cards,config,{year:2026,group:'truck',vehicles:['truck-a','loader-b','missing','truck-a']});
 assert.deepEqual(data.fleet.map(v=>v[0]),['truck-a']);
 assert.equal(monthlyStatistics(cards,config,{year:2026,group:'car',vehicles:['truck-a']}).fleet.length,0);
});
