const $=id=>document.getElementById(id);
const video=$('video'), canvas=$('overlay'), ctx=canvas.getContext('2d');
const startBtn=$('startBtn'), stopBtn=$('stopBtn'), controlBtn=$('controlBtn');
const cursor=$('virtualCursor'), mascot=$('mascot'), speech=$('speech');
let camera=null,running=false,control=false,lastClick=0,lastT=performance.now(),fpsSmooth=0;
let xp=0,level=1,combo=0,lastGesture='',gestureSince=0,mission=0,missionProgress=0,soundOn=true;
const missions=[
  {key:'camera',title:'Activa la cámara',desc:'Comienza el entrenamiento mostrando tu mano.'},
  {key:'open',title:'Haz una mano abierta',desc:'Mantén la mano abierta durante unos segundos.'},
  {key:'pinch',title:'Haz una pinza',desc:'Une pulgar e índice para seleccionar.'},
  {key:'victory',title:'Cierra con victoria',desc:'Haz el gesto de victoria para completar el entrenamiento.'}
];
const gestureInfo={
  none:{emoji:'🖐️',name:'ESPERANDO',desc:'Muestra una mano',action:'Esperando gesto'},
  hand:{emoji:'🖐️',name:'MANO',desc:'Seguimiento activo',action:'Mano detectada'},
  point:{emoji:'☝️',name:'SEÑALAR',desc:'Mueve el cursor virtual',action:'Cursor'},
  pinch:{emoji:'🤏',name:'PINZA',desc:'Clic / Selección',action:'Seleccionar'},
  open:{emoji:'✋',name:'MANO ABIERTA',desc:'Confirmar / Pausa',action:'Confirmar'},
  fist:{emoji:'✊',name:'PUÑO',desc:'Cancelar / Cerrar',action:'Cancelar'},
  victory:{emoji:'✌️',name:'VICTORIA',desc:'Cambiar modo',action:'Cambiar modo'}
};
function log(msg,type=''){const d=document.createElement('div');d.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;if(type)d.className=type;$('log').prepend(d)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function fingerUp(lm,tip,pip){return lm[tip].y<lm[pip].y}
function classify(lm){const scale=Math.max(dist(lm[0],lm[9]),.001);if(dist(lm[4],lm[8])/scale<.32)return'pinch';const up=[fingerUp(lm,8,6),fingerUp(lm,12,10),fingerUp(lm,16,14),fingerUp(lm,20,18)],n=up.filter(Boolean).length;if(n===4)return'open';if(n===0)return'fist';if(up[0]&&up[1]&&!up[2]&&!up[3])return'victory';if(up[0]&&!up[1]&&!up[2]&&!up[3])return'point';return'hand'}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);
function addXP(n){xp+=n;if(xp>=100){xp-=100;level++;log(`Subiste al nivel ${level}`,'ok');speech.innerHTML=`⚡ ¡Nivel ${level}! Cada vez controlas mejor tus gestos.`}updateXP()}
function updateXP(){$('level').textContent=level;$('xpText').textContent=`${xp} / 100 XP`;$('xpBar').style.width=xp+'%';$('energyBar').style.width=Math.min(100,xp+20)+'%';$('energyText').textContent=Math.min(100,xp+20)+'%'}
function updateMission(){const m=missions[mission];$('missionIndex').textContent=`${mission+1}/${missions.length}`;$('missionTitle').textContent=m.title;$('missionDesc').textContent=m.desc;$('missionBar').style.width=missionProgress+'%'}
function completeMission(){if(mission>=missions.length)return;missionProgress=100;updateMission();addXP(20);log(`Misión completada: ${missions[mission].title}`,'ok');mascot.classList.add('happy');setTimeout(()=>mascot.classList.remove('happy'),900);if(mission<missions.length-1){mission++;missionProgress=0;setTimeout(updateMission,500)}else{speech.innerHTML='🏆 ¡Entrenamiento completado! Prueba ahora el modo demo.'}}
function setGesture(key){const g=gestureInfo[key]||gestureInfo.hand;$('gestureLabel').textContent=`${g.emoji} ${g.name}`;$('gestureAction').textContent=g.action;$('gestureEmoji').textContent=g.emoji;$('gestureName').textContent=g.name;$('gestureDesc').textContent=g.desc;document.querySelectorAll('.gesture-cards button').forEach(b=>b.classList.toggle('active',b.dataset.gesture===key));if(key!==lastGesture){lastGesture=key;gestureSince=Date.now();combo=key==='hand'?combo:combo+1;$('comboMetric').textContent='x'+combo;log(`Gesto: ${g.name}`,'ok');mascot.className='mascot power';speech.innerHTML=key==='pinch'?'✨ ¡Pinza detectada! Eso sirve como clic.':key==='open'?'✋ ¡Perfecto! Mano abierta reconocida.':key==='victory'?'✌️ ¡Victoria! Muy buen control.':key==='fist'?'✊ Puño detectado. Puedes usarlo para cerrar.':key==='point'?'☝️ Señala y mueve tu cursor virtual.':'Te estoy viendo 👀';setTimeout(()=>mascot.className='mascot idle',350)}if(missions[mission]?.key===key){missionProgress=Math.min(100,((Date.now()-gestureSince)/1200)*100);updateMission();if(missionProgress>=100)completeMission()}}
function moveCursor(lm,key){if(!control){cursor.style.display='none';return}const p=lm[8],x=(1-p.x)*innerWidth,y=p.y*innerHeight;cursor.style.display='block';cursor.style.left=x+'px';cursor.style.top=y+'px';cursor.classList.toggle('pinching',key==='pinch');if(key==='pinch'&&Date.now()-lastClick>700){lastClick=Date.now();const el=document.elementFromPoint(x,y);if(el&&['BUTTON','A'].includes(el.tagName)){el.click();log('Clic virtual ejecutado','ok')}}}
const hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:.65,minTrackingConfidence:.6});
hands.onResults(results=>{const now=performance.now(),dt=now-lastT;lastT=now;const fps=dt>0?1000/dt:0;fpsSmooth=fpsSmooth*.85+fps*.15;const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);const list=results.multiHandLandmarks||[],handed=results.multiHandedness||[];let conf=0,key='none';list.forEach((lm,i)=>{drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:'#42ddff',lineWidth:2});drawLandmarks(ctx,lm,{color:'#f7fbff',fillColor:'#1677ff',lineWidth:1,radius:3});const g=classify(lm);if(i===0){key=g;moveCursor(lm,g)}conf=Math.max(conf,(handed[i]?.score||0)*100)});if(!list.length){cursor.style.display='none';combo=0;$('comboMetric').textContent='x0'}setGesture(list.length?key:'none');$('handsPill').textContent=`MANOS: ${list.length}`;$('handsMetric').textContent=list.length;$('confidenceMetric').textContent=`${Math.round(conf)}%`;$('confidencePill').textContent=`CONFIANZA: ${Math.round(conf)}%`;$('fpsMetric').textContent=Math.round(fpsSmooth);$('fpsPill').textContent=`FPS: ${Math.round(fpsSmooth)}`;$('trackingState').textContent=list.length?'TRACKING LOCKED':'BUSCANDO';if(missions[mission]?.key==='camera'&&running)completeMission()});
async function start(){if(running)return;try{resize();camera=new Camera(video,{onFrame:async()=>{await hands.send({image:video})},width:1280,height:720});await camera.start();running=true;$('emptyState').classList.add('hidden');$('statusDot').classList.add('on');$('statusText').textContent='Cámara activa';startBtn.disabled=true;stopBtn.disabled=false;controlBtn.disabled=false;log('Cámara iniciada correctamente','ok');speech.innerHTML='👀 ¡Ya te veo! Muestra tu mano para empezar.';if(missions[mission]?.key==='camera')completeMission()}catch(e){log('No se pudo iniciar la cámara','warn');speech.innerHTML='⚠️ Necesito permiso de cámara para entrenar.';console.error(e)}}
function stop(){if(camera)camera.stop();running=false;control=false;cursor.style.display='none';$('emptyState').classList.remove('hidden');$('statusDot').classList.remove('on');$('statusText').textContent='Cámara detenida';startBtn.disabled=false;stopBtn.disabled=true;controlBtn.disabled=true;controlBtn.textContent='◎ Activar control';log('Cámara detenida');speech.innerHTML='😴 Cámara apagada. Avísame cuando quieras seguir.'}
startBtn.onclick=start;stopBtn.onclick=stop;controlBtn.onclick=()=>{control=!control;controlBtn.textContent=control?'◎ Desactivar control':'◎ Activar control';log(`Control virtual ${control?'activado':'desactivado'}`,'ok');speech.innerHTML=control?'☝️ Ahora tu índice mueve el cursor. Haz pinza para clicar.':'Control virtual desactivado.'};
$('trainingBtn').onclick=()=>{mission=0;missionProgress=0;updateMission();speech.innerHTML='🎮 Modo entrenamiento listo. Completa las 4 misiones.';log('Modo entrenamiento reiniciado')};
$('demoBtn').onclick=()=>{control=true;controlBtn.disabled=!running;controlBtn.textContent='◎ Desactivar control';speech.innerHTML='✨ Modo demo activo: señala, selecciona y prueba los gestos.';log('Modo demo activado','ok')};
$('clearLog').onclick=()=>{$('log').innerHTML='<div>Registro limpiado.</div>'};
$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'🔊':'🔇'};
$('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
updateXP();updateMission();