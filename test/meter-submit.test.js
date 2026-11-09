import {test} from 'node:test';
import assert from 'node:assert/strict';
import {meterStatus,pendingFor,meterReportError} from '../cloudflare-live/public/meter.js';
const config={vehicles:[['a','Maskin A','AAA','loader'],['b','Bil B','BBB','car']],meterSchedule:[{date:'2026-10-30',comment:'Oktober'},{date:'2026-11-30',comment:'November'}]};
const today='2026-11-09';
const reading={vehicle:'a',meter:true,reading:'0',unit:'timmar',date:today,meterPeriod:'2026-10',savedAt:'2026-11-09T12:00:00Z'};
test('receipt status is scoped to vehicle and period, including late zero readings',()=>{
 const status=meterStatus(config,[reading],today);assert.equal(pendingFor(status,'a').length,0);assert.equal(pendingFor(status,'b').length,1);assert.deepEqual(status[0].complete,['a']);assert.equal(status[1].due,false);
 assert.equal(meterReportError({vehicle:'a',date:today},config,[reading],today),null);assert.match(meterReportError({vehicle:'b',date:today},config,[reading],today),/Mätarställning saknas/);
});
test('server keeps enforcing a valid reading and reporting period before receipt',()=>{
 assert.match(meterReportError({vehicle:'a'},config,[],today),/Mätarställning saknas/);assert.equal(meterReportError(reading,config,[],today),null);assert.match(meterReportError({...reading,meterPeriod:undefined},config,[],today),/Välj vilken/);
 assert.equal(pendingFor(meterStatus(config,[{...reading,meterPeriod:'2026-11'}],today),'a').length,1);
});
