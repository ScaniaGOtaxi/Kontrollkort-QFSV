// Self-contained PDF export. Values come from the same calculations as the screen/CSV.
const width=1190.55,height=841.89,margin=32,maxColumns=12;
const colors={blue:[4,30,66],text:[28,34,43],muted:[83,95,112],line:[181,189,204],stripe:[243,244,247],total:[216,221,229],white:[255,255,255]};
const decimal=n=>Number(n.toFixed(3)).toString();
const number=n=>n===null||n===undefined?'—':new Intl.NumberFormat('sv-SE',{maximumFractionDigits:1}).format(n).replace(/[\u00a0\u202f]/g,' ');
const month=p=>new Intl.DateTimeFormat('sv-SE',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(p+'-01T12:00:00Z'));
function literal(value){return '('+[...String(value)].map(c=>{let n=c.charCodeAt(0);if(c==='—')n=151;if(c==='–')n=150;if(c==='\n'||c==='\r')n=32;if(n>255)n=63;return n<32||n>126?'\\'+n.toString(8).padStart(3,'0'):['(',')','\\'].includes(c)?'\\'+c:c}).join('')+')'}
function wrap(value,limit){const words=String(value).split(/\s+/),lines=[];let line='';for(let word of words){while(word.length>limit){if(line){lines.push(line);line=''}lines.push(word.slice(0,limit));word=word.slice(limit)}if((line+' '+word).trim().length>limit){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);return lines}
function pageContent(data,indices,{year,createdAt,page,pages}){
 let out='',y=94;const first=110,col=(width-2*margin-first)/indices.length;
 const fill=c=>colors[c].map(n=>decimal(n/255)).join(' ');
 const text=(value,x,top,size=9,bold=false,color='text')=>{out+=`BT /${bold?'F2':'F1'} ${size} Tf ${fill(color)} rg 1 0 0 1 ${decimal(x)} ${decimal(height-top-size)} Tm ${literal(value)} Tj ET\n`};
 const rect=(x,top,w,h,color)=>{out+=`${fill(color)} rg ${decimal(x)} ${decimal(height-top-h)} ${decimal(w)} ${decimal(h)} re f\n`};
 const line=(x,top,x2,top2)=>{out+=`${fill('line')} RG .45 w ${decimal(x)} ${decimal(height-top)} m ${decimal(x2)} ${decimal(height-top2)} l S\n`};
 const cell=(value,x,top,w,h,{bold=false,bg='white',size=9,color='text'}={})=>{rect(x,top,w,h,bg);line(x,top,x+w,top);line(x,top,x,top+h);text(value,x+6,top+(h-size)/2-1,size,bold,color)};
 const row=(label,values,h=20,options={})=>{cell(label,margin,y,first,h,{...options,bold:true});indices.forEach((index,j)=>cell(values[index]??'—',margin+first+j*col,y,col,h,options));line(width-margin,y,width-margin,y+h);y+=h;line(margin,y,width-margin,y)};
 const header=()=>{const lines=indices.map(i=>{const all=wrap(data.columns[i].name,Math.max(12,Math.floor((col-12)/5)));return all.length>4?[...all.slice(0,3),all[3].slice(0,-3)+'...']:all}),nameHeight=Math.max(3,...lines.map(l=>l.length))*11+12;rect(margin,y,width-2*margin,nameHeight,'total');text('Månad / datum',margin+6,y+12,9,true);indices.forEach((i,j)=>{const x=margin+first+j*col;lines[j].forEach((s,k)=>text(s,x+6,y+6+k*11,9,true));line(x,y,x,y+nameHeight)});y+=nameHeight;row('Registrering',data.columns.map(c=>c.registration),23,{bg:'blue',color:'white',bold:true});row('Enhet',data.columns.map(c=>c.unit==='km'?'Kilometer (km)':'Maskintimmar (h)'),18,{bg:'stripe',size:8})};
 text('QFSV · Mätarställningar och användning',margin,25,21,true,'blue');text(`År ${year} · ${data.columns.length} fordonskolumner · Skapad ${createdAt}`,margin,56,9,false,'muted');text('MÄTARSTÄLLNINGAR',margin,77,10,true,'blue');header();
 data.sheetReadings.forEach((r,i)=>{const sameDate=r.date&&r.date!=='Olika datum',label=month(r.period)+(r.baseline?' · start':'');const top=y;row(label,r.cells.map(c=>number(c?.value)),23,{bg:i%2?'stripe':'white'});if(sameDate)text(r.date,margin+6,top+16,6,false,'muted');else indices.forEach((index,j)=>{const c=r.cells[index];if(c)text(c.date,margin+first+j*col+6,top+16,6,false,'muted')})});
 y+=18;text('KÖRDA KILOMETER / MASKINTIMMAR PER MÅNAD',margin,y,10,true,'blue');y+=18;
 // Same columns and units as above; every month remains visible, including missing months.
 data.sheetConsumption.forEach((r,i)=>row(month(r.period),r.cells.map(c=>c.status==='decreased'?'—*':number(c.value)),16,{bg:i%2?'stripe':'white'}));
 row('TOTALT',data.sheetTotals.map(t=>number(t.sum)),21,{bg:'blue',color:'white',bold:true,size:10});row('MEDEL / MÅNAD',data.sheetTotals.map(t=>number(t.average)),21,{bg:'total',bold:true});
 y+=12;text('— = underlag saknas. * = mätaren har minskat; ingen användning har beräknats.',margin,y,8,false,'muted');text('Total och medel omfattar endast månader med två på varandra följande månadsavläsningar. Km och timmar hålls separata.',margin,y+13,8,false,'muted');text('Datum under mätarvärdena anger avläsningsdatum. En sen rapport hör till den rapporteringsmånad som visas på raden.',margin,y+26,8,false,'muted');
 // Demo marking is retained in exported reports without obscuring the table values.
 text('DEMOVERSION',margin,height-24,8,true,'muted');text(`QFSV · ${year} · Sida ${page} av ${pages} · Liggande A3`,width-320,height-24,8,false,'muted');
 return out;
}
export function statisticsPdf(data,{year,createdAt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm'}).format(new Date())}={}){
 if(!data.columns.length)throw new Error('Det finns inga fordon i urvalet att exportera.');
 const chunks=[];for(let i=0;i<data.columns.length;i+=maxColumns)chunks.push(Array.from({length:Math.min(maxColumns,data.columns.length-i)},(_,j)=>i+j));
 const objects=['','<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const kids=[];chunks.forEach((indices,i)=>{const id=objects.length,stream=pageContent(data,indices,{year:year||data.sheetConsumption[0].period.slice(0,4),createdAt,page:i+1,pages:chunks.length});kids.push(id+' 0 R');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)});
 objects[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}const start=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
 return Uint8Array.from(pdf,c=>c.charCodeAt(0));
}
