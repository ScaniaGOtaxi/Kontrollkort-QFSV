export function normalizeFleet(input){const config={...input,vehicles:input.vehicles.map(v=>[...v])};if(config.fleetGroupsVersion===1)return config;
 config.vehicles=config.vehicles.map(v=>['linde','kalmar'].includes(v[0])&&v[3]==='loader'?[...v.slice(0,3),'forklift']:v);
 if(input.groups){config.groups={...input.groups};if(!config.groups.forklift)config.groups.forklift={...input.groups.loader,name:'Truckar'};if(config.groups.loader?.name==='Hjullastare / truckar')config.groups.loader={...config.groups.loader,name:'Hjullastare'}}
 if(input.forms?.loader&&!input.forms.forklift)config.forms={...input.forms,forklift:structuredClone(input.forms.loader)};
 config.fleetGroupsVersion=1;return config;
}
export function vehicleIdentity(vehicle){let text=vehicle[1].replace(/^Truck\s+\d+\s+ton\s+/i,'');const match=text.match(/^(New Holland|Volvo|Scania|Valtra|Hako|JCB|VW|Volkswagen|Linde|Kalmar|LMW)\s+(.+)$/i);if(!match)return {brand:text,model:''};return {brand:match[1],model:match[2]}}

export const vehicleStatusLabels={active:'Aktivt',hidden:'Dolt','handed-over':'Överlämnat'};
export function vehicleStatus(id,config){return !(config.hiddenVehicles||[]).includes(id)?'active':(config.handedOverVehicles||[]).includes(id)?'handed-over':'hidden'}

export const vehicleUnitNames={km:'Kilometer (km)',timmar:'Maskintimmar (h)'};
export function vehicleUnit(vehicle,config={}){const v=Array.isArray(vehicle)?vehicle:config.vehicles?.find(v=>v[0]===vehicle),id=Array.isArray(vehicle)?vehicle[0]:vehicle,unit=config.vehicleUnits?.[id];return ['km','timmar'].includes(unit)?unit:['car','truck'].includes(v?.[3])?'km':'timmar'}
