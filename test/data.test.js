import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicles,daily,weekly,equipment} from '../public/data.js';
test('alla elva fordon har unika identiteter och registreringar',()=>{assert.equal(vehicles.length,11);assert.equal(new Set(vehicles.map(v=>v[0])).size,11);assert.equal(new Set(vehicles.map(v=>v[2])).size,11)});
test('dagliga kontroller följer fordonsgrupperna i underlaget',()=>{for(const v of vehicles){assert.equal(daily(v).length,({hako:8,tractor:9,loader:8,car:0,truck:0})[v[3]]);assert.equal(weekly(v).length,({hako:2,tractor:2,loader:3,car:0,truck:0})[v[3]])}});
test('utrustningslistor är separerade för respektive fordonstyp',()=>{assert.equal(equipment.hako.length,4);assert.equal(equipment.valtra.length,10);assert.equal(equipment.newholland.length,12);assert.equal(equipment.loader.length,8);assert.equal(equipment.scania.length,13)});
