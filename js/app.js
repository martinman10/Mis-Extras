var KEY='mis_extras_v1',MES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],S,cur,tab='ca';
var Q=function(s){return document.querySelector(s)};
var mo=function(n){return '$ '+Math.round(n).toLocaleString('es-UY')};
var fh=function(n){return String(Math.round(n*100)/100).replace('.',',')+' h'};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var num=function(v){return parseFloat(String(v).replace(',','.'))||0};
var tm=function(s){var a=s.split(':');return +a[0]+ +a[1]/60};
var hrs=function(e){var a=tm(e.f),b=tm(e.t);return (b<a?b+24:b)-a};
var dl=function(d){return new Date(d+'T12:00').toLocaleDateString('es-UY',{weekday:'short',day:'numeric',month:'short'})};
function seed(){
 var t=function(x){var h=Math.floor(x),m=Math.round((x-h)*60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')};
 var E=function(a){return a.map(function(r){return {d:r[0],f:t(r[1]),t:t(r[2]),ok:1}})};
 var G=function(a){return a.map(function(r){return {n:r[0],v:r[1],p:0}})};
 var fx=[['ALQUILER',11500],['GASTOS COMUNES',1850],['WIFI',866],['LUZ',1553]];
 return {cfg:{rate:333,base:30842,nrate:35.99,frate:41.69},cur:'2026-12',m:{
 '2026-10':{ex:[],ga:G(fx.concat([['CELU 14 de 18',4008],['Passcard',5700],['PS5 5 de 10',4483],['PILAR PRESTAMO',2000],['CASH 17 de 18',2700],['Billetera Virtual',900],['FUTBOL',1000],['Adelanto',3000],['Tributos',824]])),in:[{n:'MAMA',v:4000},{n:'ADELANTO',v:6000}],obj:40,min:12,noc:0,fin:0},
 '2026-11':{ex:E([['',9,12],['',9,12],['2026-10-08',18,19.5],['2026-10-05',9,12],['2026-10-07',9,12],['2026-10-13',9,12],['2026-10-15',18,21],['2026-10-20',9,12],['2026-10-21',9,12],['2026-10-22',9,12]]),ga:G(fx.concat([['CELU 15 de 18',4198],['Passcard',5700],['PS5 6 de 10',4483],['PILAR PRESTAMO 2 de 12',2500],['CASH 18 de 18',2700],['Billetera Virtual',900],['FUTBOL',1000],['Adelanto',6000]])),in:[{n:'MAMA',v:0},{n:'ADELANTO',v:4000}],obj:40,min:28,noc:0,fin:0},
 '2026-12':{ex:E([['2026-10-28',9,12],['2026-10-29',10,12],['2026-10-31',12,18],['2026-11-07',12,18],['2026-11-14',12,18]]),ga:G(fx.concat([['CELU 16 de 18',4198],['Passcard',5700],['PS5 7 de 10',4600],['PILAR PRESTAMO 3 de 12',2500],['Billetera Virtual 3 de 5',900],['Tributos',824],['ADELANTO',4000]])),in:[{n:'MAMA',v:0},{n:'ADELANTO',v:0},{n:'AGUINALDO',v:18000}],obj:40,min:30,noc:0,fin:0}}};
}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}if(!S)S=seed();cur=S.cur||'2026-12'}
function save(){S.cur=cur;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function M(key){key=key||cur;var m=S.m[key];if(!m){var ks=Object.keys(S.m).filter(function(x){return x<key}).sort(),p=S.m[ks[ks.length-1]];m=S.m[key]={ex:[],ga:p?p.ga.map(function(g){return {n:g.n,v:g.v,p:0}}):[],in:[],obj:p?p.obj:40,min:p?p.min:30,noc:0,fin:0}}return m}
function payKey(d){var p=d.split('-').map(Number),y=p[0],m=p[1]+(p[2]>25?2:1);while(m>12){m-=12;y++}return y+'-'+String(m).padStart(2,'0')}
function sum(a,f){return a.reduce(function(s,x){return s+f(x)},0)}
function calc(m){var c=S.cfg,o={};o.h=sum(m.ex,hrs);o.hd=sum(m.ex.filter(function(e){return e.ok}),hrs);o.vd=o.hd*c.rate;o.total=c.base+o.vd;o.bruto=o.total+m.noc*c.nrate+m.fin*c.frate;o.g=sum(m.ga,function(x){return x.v});o.gp=sum(m.ga.filter(function(x){return !x.p}),function(x){return x.v});o.i=sum(m.in,function(x){return x.v});o.left=o.bruto+o.i-o.g;o.cons=o.bruto+o.i>0?o.g/(o.bruto+o.i):0;return o}
function nav(d){if(tab==='ca')cmv(d);else mv(d)}
function mv(d){var p=cur.split('-').map(Number),y=p[0],m=p[1]+d;if(m>12){m=1;y++}if(m<1){m=12;y--}cur=y+'-'+String(m).padStart(2,'0');save();render()}
function go(t){tab=t;render()}
function toast(s){var t=Q('#toast');t.textContent=s;t.style.display='block';setTimeout(function(){t.style.display='none'},2200)}
function closeSh(){Q('#sh').classList.remove('on')}
function sheet(title,fields,onSave,onDel){
 Q('#sh').innerHTML='<div class="bk" onclick="closeSh()"></div><div class="pn"><h3>'+title+'</h3>'+fields.map(function(f){return '<label>'+f.l+'<input id="f_'+f.k+'" type="'+f.t+'" value="'+esc(f.v==null?'':f.v)+'"'+(f.t==='number'?' inputmode="decimal" step="any"':'')+'></label>'}).join('')+'<div class="row">'+(onDel?'<button class="b2" id="fdel">Borrar</button>':'')+'<button class="b1" id="fok">Guardar</button></div></div>';
 Q('#sh').classList.add('on');
 Q('#fok').onclick=function(){var o={};fields.forEach(function(f){o[f.k]=Q('#f_'+f.k).value});onSave(o);save();closeSh();render()};
 if(onDel)Q('#fdel').onclick=function(){onDel();save();closeSh();render()};
}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function exFields(e){return [{k:'d',l:'Fecha',t:'date',v:e.d},{k:'f',l:'Desde',t:'time',v:e.f},{k:'t',l:'Hasta',t:'time',v:e.t}]}
function ad(d0){sheet('Nueva extra',exFields({d:d0||today(),f:'09:00',t:'12:00'}),function(o){var d=o.d||today(),k=payKey(d);M(k).ex.push({d:d,f:o.f||'09:00',t:o.t||'12:00',ok:0});if(tab==='ex')cur=k})}
function ed(i,k){var m=M(k),e=m.ex[i];sheet('Editar extra',exFields(e),function(o){e.d=o.d;e.f=o.f||e.f;e.t=o.t||e.t},function(){m.ex.splice(i,1)})}
function tg(i,k){var e=M(k).ex[i];e.ok=e.ok?0:1;save();render()}
function pg(i){var g=M().ga[i];g.p=g.p?0:1;save();render()}
function eg(k,i){var m=M(),a=m[k],x=i<0?{n:'',v:''}:a[i];sheet(i<0?(k==='ga'?'Nuevo gasto':'Nuevo ingreso'):'Editar',[{k:'n',l:'Concepto',t:'text',v:x.n},{k:'v',l:'Valor en $',t:'number',v:x.v}],function(o){if(i<0)a.push({n:o.n,v:num(o.v),p:0});else{x.n=o.n;x.v=num(o.v)}},i<0?null:function(){a.splice(i,1)})}
function eh(){var m=M();sheet('Horas extra de pago',[{k:'noc',l:'Horas nocturnas',t:'number',v:m.noc},{k:'fin',l:'Horas de fin de semana',t:'number',v:m.fin}],function(o){m.noc=num(o.noc);m.fin=num(o.fin)})}
function cf(){var m=M(),c=S.cfg;sheet('Valores',[{k:'rate',l:'Valor por hora extra ($)',t:'number',v:c.rate},{k:'base',l:'Sueldo base ($)',t:'number',v:c.base},{k:'nrate',l:'Valor hora nocturna ($)',t:'number',v:c.nrate},{k:'frate',l:'Valor hora fin de semana ($)',t:'number',v:c.frate},{k:'obj',l:'Objetivo de este mes (horas)',t:'number',v:m.obj},{k:'min',l:'Mínimo de este mes (horas)',t:'number',v:m.min}],function(o){c.rate=num(o.rate);c.base=num(o.base);c.nrate=num(o.nrate);c.frate=num(o.frate);m.obj=num(o.obj)||1;m.min=num(o.min)})}
function bk(){navigator.clipboard.writeText(JSON.stringify(S)).then(function(){toast('Respaldo copiado')}).catch(function(){toast('No se pudo copiar')})}
function rs(){sheet('Restaurar respaldo',[{k:'j',l:'Pegá acá el respaldo copiado',t:'text',v:''}],function(o){try{var j=JSON.parse(o.j);if(j&&j.m&&j.cfg){S=j;cur=S.cur||cur;toast('Respaldo restaurado')}else toast('Respaldo inválido')}catch(e){toast('Respaldo inválido')}})}
var calY=new Date().getFullYear(),calM=new Date().getMonth(),selD=today();
function allEx(){var r=[];Object.keys(S.m).forEach(function(k){S.m[k].ex.forEach(function(e,i){if(e.d)r.push({k:k,i:i,e:e})})});return r}
function cmv(d){calM+=d;if(calM>11){calM=0;calY++}if(calM<0){calM=11;calY--}render()}
function vCa(){
 var by={};allEx().forEach(function(r){(by[r.e.d]=by[r.e.d]||[]).push(r)});
 var off=(new Date(calY,calM,1).getDay()+6)%7,n=new Date(calY,calM+1,0).getDate(),g='';
 ['L','M','M','J','V','S','D'].forEach(function(x){g+='<i class="dn0">'+x+'</i>'});
 for(var i=0;i<off;i++)g+='<span></span>';
 for(var d=1;d<=n;d++){var ds=calY+'-'+String(calM+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),l=by[ds]||[],st=l.length?(l.every(function(r){return r.e.ok})?' ok':' pe'):'';
  g+='<button class="dc'+st+(ds===today()?' td':'')+(ds===selD?' sl':'')+'" onclick="selD=\''+ds+'\';render()">'+d+'</button>'}
 var L=by[selD]||[],hh=sum(L,function(r){return hrs(r.e)});
 var rows=L.map(function(r){var e=r.e,h=hrs(e);return '<div class="rw'+(e.ok?' dn':'')+'"><button class="ck" onclick="tg('+r.i+',\''+r.k+'\')">'+(e.ok?'✓':'')+'</button><div class="gr" onclick="ed('+r.i+',\''+r.k+'\')"><b>'+e.f+' – '+e.t+'</b><small>Se cobra en '+MES[+r.k.slice(5)-1]+'</small></div><div class="rt"><b>'+fh(h)+'</b><small>'+mo(h*S.cfg.rate)+'</small></div></div>'}).join('')||'<p class="em">Sin extras este día.</p>';
 return '<div class="cal">'+g+'</div><div class="chips"><span><b style="color:var(--ac)">■</b> Hecha</span><span><b style="color:var(--am)">▢</b> Pendiente</span></div><h3 class="sec">'+dl(selD)+(L.length?' · '+fh(hh):'')+'<button onclick="ad(selD)">+ Agregar</button></h3>'+rows;
}
function csv(){var m=M(),r=['Fecha;Desde;Hasta;Horas;Valor;Hecha'];m.ex.forEach(function(e){r.push([e.d,e.f,e.t,hrs(e),hrs(e)*S.cfg.rate,e.ok?'Sí':'No'].join(';'))});var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+r.join('\n')],{type:'text/csv'}));a.download='extras-'+cur+'.csv';a.click()}
function ap(){var c='auto';try{c=localStorage.getItem('mx_th')||'auto'}catch(e){}if(c==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',c)}
function th(){var o=['auto','light','dark'],c='auto';try{c=localStorage.getItem('mx_th')||'auto';localStorage.setItem('mx_th',o[(o.indexOf(c)+1)%3])}catch(e){}ap();render()}
function vEx(m,c){
 var pct=Math.min(100,c.h/m.obj*100),mp=Math.min(100,m.min/m.obj*100),fal=Math.max(0,m.obj-c.h);
 var rows=m.ex.map(function(e,i){return {e:e,i:i}}).sort(function(a,b){return (a.e.d||'9')>(b.e.d||'9')?1:-1}).map(function(r){var e=r.e,h=hrs(e);return '<div class="rw'+(e.ok?' dn':'')+'"><button class="ck" onclick="tg('+r.i+')" aria-label="Marcar hecha">'+(e.ok?'✓':'')+'</button><div class="gr" onclick="ed('+r.i+')"><b>'+(e.d?dl(e.d):'Sin fecha')+'</b><small>'+e.f+' – '+e.t+'</small></div><div class="rt"><b>'+fh(h)+'</b><small>'+mo(h*S.cfg.rate)+'</small></div></div>'}).join('')||'<p class="em">Todavía no cargaste extras este mes.</p>';
 return '<section class="hero"><small>A cobrar en '+MES[+cur.slice(5)-1]+'</small><h2>'+mo(c.total)+'</h2><p>Sueldo base + '+mo(c.vd)+' de extras hechas</p><div class="bar"><i style="width:'+pct+'%"></i><u style="left:'+mp+'%"></u></div><div class="bl"><span>'+fh(c.h)+' de '+fh(m.obj)+'</span><span>'+(fal?'Faltan '+fh(fal):'Objetivo cumplido')+'</span></div></section>'
 +'<div class="chips"><span>Hechas <b>'+fh(c.hd)+'</b></span><span>Mínimo <b>'+fh(m.min)+'</b>'+(c.h>=m.min?' ✓':'')+'</span>'+(fal?'<span>≈ <b>'+Math.ceil(fal/3)+'</b> días de 3 h · <b>'+Math.ceil(fal/6)+'</b> de 6 h</span>':'')+'</div>'
 +'<h3 class="sec">Extras del mes</h3>'+rows;
}
function vPl(m,c){
 var L=function(k){return m[k].map(function(x,i){return '<div class="rw">'+(k==='ga'?'<button class="ck'+(x.p?' on':'')+'" onclick="pg('+i+')" aria-label="Marcar pagado">'+(x.p?'✓':'')+'</button>':'')+'<div class="gr" onclick="eg(\''+k+'\','+i+')"><b>'+esc(x.n||'Sin nombre')+'</b></div><div class="rt"><b>'+mo(x.v)+'</b></div></div>'}).join('')||'<p class="em">Vacío</p>'};
 var col=c.cons>.6?'var(--bad)':c.cons>=.4?'var(--am)':'var(--ac)';
 return '<div class="card"><div class="kv"><span>Sueldo base</span><b>'+mo(S.cfg.base)+'</b></div><div class="kv"><span>Extras hechas ('+fh(c.hd)+')</span><b>'+mo(c.vd)+'</b></div><div class="kv tap" onclick="eh()"><span>Nocturnas ('+fh(m.noc)+')</span><b>'+mo(m.noc*S.cfg.nrate)+'</b></div><div class="kv tap" onclick="eh()"><span>Fin de semana ('+fh(m.fin)+')</span><b>'+mo(m.fin*S.cfg.frate)+'</b></div><div class="kv t"><span>Total del mes</span><b>'+mo(c.bruto)+'</b></div></div>'
 +'<div class="big"><div><small>Me quedan</small><h2 style="color:'+(c.left<0?'var(--bad)':'var(--ink)')+'">'+mo(c.left)+'</h2></div><small>Consumo '+Math.round(c.cons*100)+'%</small></div><div class="mb"><i style="width:'+Math.min(100,c.cons*100)+'%;background:'+col+'"></i></div>'
 +'<h3 class="sec">Ingresos · '+mo(c.i)+'<button onclick="eg(\'in\',-1)">+ Agregar</button></h3>'+L('in')
 +'<h3 class="sec">Gastos · '+mo(c.g)+'<button onclick="eg(\'ga\',-1)">+ Agregar</button></h3>'+L('ga')
 +'<p class="em">Por pagar todavía: <b>'+mo(c.gp)+'</b></p>';
}
function vAj(){var c=S.cfg;return '<div class="card"><div class="kv"><span>Valor por hora extra</span><b>'+mo(c.rate)+'</b></div><div class="kv"><span>Sueldo base</span><b>'+mo(c.base)+'</b></div><div class="kv"><span>Hora nocturna</span><b>'+mo(c.nrate)+'</b></div><div class="kv"><span>Hora fin de semana</span><b>'+mo(c.frate)+'</b></div><div class="kv"><span>Objetivo / mínimo del mes</span><b>'+fh(M().obj)+' / '+fh(M().min)+'</b></div></div><button class="b1" onclick="cf()">Editar valores</button><h3 class="sec">Respaldo</h3><p class="em" style="padding-top:0;text-align:left">Tus datos se guardan en este navegador. Copiá un respaldo de vez en cuando para no perderlos.</p><button class="b2" onclick="bk()">Copiar respaldo</button><button class="b2" onclick="rs()">Restaurar respaldo</button><button class="b2" onclick="csv()">Exportar mes a CSV</button><button class="b2" onclick="th()">Tema: '+(localStorage.getItem("mx_th")||"auto")+'</button>'}
function render(){
 var m=M(),c=calc(m);
 var ca=tab==='ca';Q('#ml').textContent=ca?MES[calM]:MES[+cur.slice(5)-1];Q('#my').textContent=ca?calY:cur.slice(0,4);
 Q('#v').innerHTML=tab==='ca'?vCa():tab==='ex'?vEx(m,c):tab==='pl'?vPl(m,c):vAj();
 document.querySelectorAll('nav button').forEach(function(b){b.classList.toggle('on',b.dataset.t===tab)});
 Q('#fab').style.display=(tab==='ex'||tab==='ca')?'flex':'none';
}
ap();load();if(location.hash==='#add')tab='ex';save();render();if(location.hash==='#add')ad();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(function(){});