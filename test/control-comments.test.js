import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanCard,snapshotFor} from '../cloudflare-live/public/groups.js';
import {defaultSections} from '../cloudflare-live/public/forms.js';
import {cardLines} from '../cloudflare-live/public/card-report.js';
import {reportFields,correctReport,reportVersion} from '../cloudflare-live/public/report-edit.js';
const v=['loader','Test maskin','ABC123','loader'];
const sections=defaultSections(v);
sections.push({id:'section-test',type:'custom',title:'Egen kontroll',visible:true,questions:[{id:'q_test',text:'Egen fråga',visible:true}]});
const cfg={vehicles:[v],forms:{loader:sections}};
const input={vehicle:v[0],date:'2026-11-09',name:'Testförare',daily0:'Skall repareras',daily0_comment:'Oljeläckage <test>',weekly:true,week0:'Åtgärdat',week0_comment:'Kontrollerad',q_test:'Utan anmärkning',q_test_comment:'Egen notering'};
test('question comments survive cleaning, report summaries and admin corrections',()=>{
 const c=cleanCard(input,v,cfg);c.snapshot=snapshotFor(c,v,cfg);
 for(const key of ['daily0_comment','week0_comment','q_test_comment'])assert.equal(c[key],input[key]);
 const text=cardLines(c,cfg.vehicles).join('\n');for(const value of ['Oljeläckage <test>','Kontrollerad','Egen notering'])assert.ok(text.includes(value));
 const fields=reportFields(c,cfg);assert.equal(fields.find(f=>f.key==='q_test_comment').type,'textarea');assert.equal(fields.filter(f=>f.key==='q_test_comment').length,1);
 const result=correctReport(c,{baseVersion:reportVersion(c),reason:'Rättar kommentar',fields:{daily0_comment:'Tätning bytt'}},cfg,'admin@example.test');
 assert.equal(result.value.daily0_comment,'Tätning bytt');assert.ok(result.value.corrections[0].changes.daily0_comment);
});
test('hidden and inactive question comments are removed along with their answers',()=>{
 const config=structuredClone(cfg);config.forms.loader.find(s=>s.type==='daily').questions[0].visible=false;config.forms.loader.find(s=>s.type==='custom').visible=false;
 const c=cleanCard({...input,weekly:false,extra0_comment:'Utan svar'},v,config);
 for(const key of ['daily0_comment','week0_comment','q_test_comment','extra0_comment'])assert.equal(c[key],undefined);
});
test('older reports can receive comments without changing answer options',()=>{
 const c={...input};delete c.daily0_comment;delete c.q_test_comment;
 const fields=reportFields(c,cfg);assert.equal(fields.find(f=>f.key==='daily0_comment').value,'');assert.equal(fields.find(f=>f.key==='daily0_comment').options,undefined);
});
