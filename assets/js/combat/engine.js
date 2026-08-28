/* battle engine */
const canvas=document.getElementById('arenaCanvas'),ctx=canvas.getContext('2d');let DPR=Math.min(devicePixelRatio||1,2),AW=900,AH=740,last=performance.now();
const BATTLE_WORLD_MIN_W=3600,BATTLE_WORLD_MIN_H=2400,BATTLE_WORLD_VIEW_SCALE=2.2,BATTLE_CAMERA_LOOK_AHEAD=.17;
let WORLD_W=BATTLE_WORLD_MIN_W,WORLD_H=BATTLE_WORLD_MIN_H;
const battleCamera={x:0,y:0,targetX:0,targetY:0,anchorX:0,anchorY:0,lookX:0,lookY:0};
function clampValue(value,min,max){return Math.max(min,Math.min(max,value))}
function resetBattleWorld(){WORLD_W=Math.max(BATTLE_WORLD_MIN_W,Math.ceil(AW*BATTLE_WORLD_VIEW_SCALE));WORLD_H=Math.max(BATTLE_WORLD_MIN_H,Math.ceil(AH*BATTLE_WORLD_VIEW_SCALE))}
function ensureBattleWorld(){WORLD_W=Math.max(WORLD_W,BATTLE_WORLD_MIN_W,Math.ceil(AW*BATTLE_WORLD_VIEW_SCALE));WORLD_H=Math.max(WORLD_H,BATTLE_WORLD_MIN_H,Math.ceil(AH*BATTLE_WORLD_VIEW_SCALE))}
function clampWorldPoint(point,margin=0){if(!point)return point;if(Number.isFinite(point.x))point.x=clampValue(point.x,margin,WORLD_W-margin);if(Number.isFinite(point.y))point.y=clampValue(point.y,margin,WORLD_H-margin);return point}
function clampBattleCamera(){const maxX=Math.max(0,WORLD_W-AW),maxY=Math.max(0,WORLD_H-AH);battleCamera.anchorX=clampValue(battleCamera.anchorX,0,maxX);battleCamera.anchorY=clampValue(battleCamera.anchorY,0,maxY);battleCamera.targetX=clampValue(battleCamera.targetX,0,maxX);battleCamera.targetY=clampValue(battleCamera.targetY,0,maxY);battleCamera.x=clampValue(battleCamera.x,0,maxX);battleCamera.y=clampValue(battleCamera.y,0,maxY)}
function snapBattleCamera(){battleCamera.anchorX=player.x-AW/2;battleCamera.anchorY=player.y-AH/2;battleCamera.lookX=0;battleCamera.lookY=0;battleCamera.targetX=battleCamera.anchorX;battleCamera.targetY=battleCamera.anchorY;clampBattleCamera();battleCamera.x=battleCamera.targetX;battleCamera.y=battleCamera.targetY}
function updateBattleCamera(dt,instant=false){ensureBattleWorld();const elapsed=Math.max(0,Number.isFinite(dt)?dt:0),safeX=Math.min(AW*.2,210),safeY=Math.min(AH*.2,170),intent=v34CameraIntent(),lookAlpha=instant?1:1-Math.exp(-5.2*elapsed),lookDistance=Math.min(AW,AH)*BATTLE_CAMERA_LOOK_AHEAD;battleCamera.lookX+=(intent.x*lookDistance-battleCamera.lookX)*lookAlpha;battleCamera.lookY+=(intent.y*lookDistance-battleCamera.lookY)*lookAlpha;const screenX=player.x-battleCamera.anchorX,screenY=player.y-battleCamera.anchorY;if(screenX<safeX)battleCamera.anchorX=player.x-safeX;else if(screenX>AW-safeX)battleCamera.anchorX=player.x-(AW-safeX);if(screenY<safeY)battleCamera.anchorY=player.y-safeY;else if(screenY>AH-safeY)battleCamera.anchorY=player.y-(AH-safeY);battleCamera.targetX=battleCamera.anchorX+battleCamera.lookX;battleCamera.targetY=battleCamera.anchorY+battleCamera.lookY;clampBattleCamera();if(instant){battleCamera.x=battleCamera.targetX;battleCamera.y=battleCamera.targetY}else{const alpha=1-Math.exp(-8.5*elapsed);battleCamera.x+=(battleCamera.targetX-battleCamera.x)*alpha;battleCamera.y+=(battleCamera.targetY-battleCamera.y)*alpha;clampBattleCamera()}}
function resizeArena(){const r=canvas.getBoundingClientRect(),nextW=Math.max(320,r.width),nextH=Math.max(240,r.height);AW=nextW;AH=nextH;canvas.width=Math.floor(AW*DPR);canvas.height=Math.floor(AH*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);ensureBattleWorld();clampBattleCamera()}
function v331QueueArenaResize(){resizeArena();setTimeout(resizeArena,120)}
window.addEventListener('resize',v331QueueArenaResize);window.visualViewport?.addEventListener('resize',v331QueueArenaResize);window.addEventListener('orientationchange',()=>setTimeout(resizeArena,120));
function setBattleDossierOpen(open){const expanded=!!open,stage=document.getElementById('battleStage'),dossier=document.getElementById('battleDossier'),toggle=document.getElementById('battleDossierToggle'),label=document.getElementById('battleDossierToggleText');stage?.classList.toggle('dossierOpen',expanded);dossier?.setAttribute('aria-hidden',String(!expanded));toggle?.setAttribute('aria-expanded',String(expanded));if(label)label.textContent=expanded?'收起卷宗':'展开卷宗';return expanded}
function toggleBattleDossier(){const toggle=document.getElementById('battleDossierToggle');return setBattleDossierOpen(toggle?.getAttribute('aria-expanded')!=='true')}
function v32InteractiveKeyTarget(target){return target instanceof Element&&!!target.closest('button,input,select,textarea,[role="button"],[role="switch"]')}
const keys={};window.addEventListener('keydown',e=>{if(v32InteractiveKeyTarget(e.target)&&e.key!=='Escape')return;keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();if(e.key===' ')performBattleAction('dodge',tryDodge);if(e.key.toLowerCase()==='e')performBattleAction('skill',castHeroSkill);if(e.key.toLowerCase()==='r')performBattleAction('ult',castUltimate);if(e.key==='Escape')performBattleAction('pause',togglePause)});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

let run={active:false,paused:false,time:0,kills:0,spawn:0,attack:0,level:1,xp:0,xpNeed:26,chests:[false,false,false],events:[false,false,false],evolved:{},fused:{},skills:{},passives:{},boss:null,totalDamage:0,lastDps:0,dpsClock:0,dps:0,damageBy:{},combo:0,comboTimer:0,maxCombo:0,mapHazards:[],drops:[],eliteKills:0,shopBuff:0,altarBuff:0,riftActive:false};
let player={x:450,y:370,r:15,hp:620,maxHp:620,atk:110,speed:240,aspd:1,crit:.08,inv:0,dodgeCd:0,skillCd:0,ult:0};
let enemies=[],shots=[],enemyShots=[],effects=[],numbers=[],traps=[];
let dodgeDirection={x:0,y:-1};
function movementVector(){const x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),length=Math.hypot(x,y);if(length)return{x:x/length,y:y/length};return typeof v331JoystickVector==='function'?v331JoystickVector():null}
function v34CameraIntent(){const input=movementVector(),length=input?Math.hypot(input.x,input.y):0;return length?{x:input.x/length,y:input.y/length}:{x:0,y:0}}
let movementResponse={x:0,y:0};
function resetMovementResponse(){movementResponse.x=0;movementResponse.y=0}
function responsiveMovementVector(dt){const target=movementVector(),tx=target?.x||0,ty=target?.y||0,rate=target?56:72,alpha=1-Math.exp(-rate*Math.max(0,Number.isFinite(dt)?dt:0));movementResponse.x+=(tx-movementResponse.x)*alpha;movementResponse.y+=(ty-movementResponse.y)*alpha;let length=Math.hypot(movementResponse.x,movementResponse.y);if(!target&&length<.015){resetMovementResponse();return null}if(length>1){movementResponse.x/=length;movementResponse.y/=length;length=1}return length?{x:movementResponse.x,y:movementResponse.y}:null}
let tutorialStep=0;
const TUTORIAL=[['移动','使用 WASD 或方向键移动角色。'],['闪避','按 Space 向移动方向短冲，并获得短暂无敌时间。'],['英雄技','按 E 使用英雄专属技能。'],['终极','击杀敌人积累终极能量，100%后按 R。'],['Build','升级时三选一；宝箱会在关键战斗节点触发进化或融合。']];

function startBattle(){
 const si=selectedStageInfo(),h=WW.config.hero[save.hero],st=heroStats(save.hero),bossCfg=WW.config.boss[si.stage[4]];
 go('battle');setBattleDossierOpen(false);resizeArena();resetBattleWorld();document.getElementById('battleTitle').textContent=si.stage[0]+' · '+si.stage[1];document.getElementById('battleLog').innerHTML='';
 run={active:true,paused:false,time:0,kills:0,spawn:0,attack:0,level:1,xp:0,xpNeed:26,chests:[false,false,false],events:[false,false,false],evolved:{},fused:{},skills:{},passives:{},boss:null,totalDamage:0,lastDps:0,dpsClock:0,dps:0,damageBy:{},combo:0,comboTimer:0,maxCombo:0,mapHazards:[],drops:[],eliteKills:0,shopBuff:0,altarBuff:0,riftActive:false};
 player={x:WORLD_W/2,y:WORLD_H/2,r:15,hp:st.hp,maxHp:st.hp,atk:st.atk*(1+gearScore()/5000),speed:h.move*50,aspd:h.aspd,crit:h.crit/100,inv:0,dodgeCd:0,skillCd:0,ult:0};dodgeDirection={x:0,y:-1};resetMovementResponse();snapBattleCamera();enemies=[];shots=[];enemyShots=[];effects=[];numbers=[];traps=[];
 save.build.active.slice(0,2).forEach(id=>run.skills[id]=1);save.build.passive.slice(0,1).forEach(id=>run.passives[id]=1);
 document.getElementById('bossBar').classList.remove('show');log('进入 '+si.stage[0]+' · '+si.stage[1]);renderRunSide();updateHud();
 if(!save.settings.tutorialSeen)showTutorial()
}
function mapEnemyIds(map){return Object.entries(ENEMIES).filter(([id,e])=>e.map===map).map(([id])=>id)}
function weightedEnemyId(map){
 const profile=run?.v29?.id==='story'?run.v29.rule?.storyEncounter:null;
 if(profile?.enemies?.length){let total=profile.enemies.reduce((sum,row)=>sum+row[1],0),roll=Math.random()*total;for(const [id,weight] of profile.enemies){roll-=weight;if(roll<=0)return id}return profile.enemies.at(-1)[0]}
 const ids=mapEnemyIds(map),t=run.time/60;let pool=ids.slice(0,Math.min(ids.length,2+Math.floor(t/3)));if(t>10)pool=ids;return pool[Math.floor(Math.random()*pool.length)]
}
function spawnEnemy(opts={}){
 const map=selectedStageInfo().chapter,id=opts.id||weightedEnemyId(map),cfg=ENEMIES[id],a=Math.random()*Math.PI*2,d=Math.max(AW,AH)*.55+60;
 const e=clampWorldPoint({id,name:cfg.name,ai:cfg.ai,x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:10+(cfg.ai==='brute'||cfg.ai==='shield'?4:0),hp:cfg.hp*(1+run.time/1200),maxHp:cfg.hp*(1+run.time/1200),speed:cfg.speed,damage:cfg.damage,color:cfg.color,attack:Math.random()*2,skill:Math.random()*2,elite:false,affixes:[],flash:0},30);
 if(opts.elite||Math.random()<.035+run.time/120000){e.elite=true;e.r*=1.25;e.hp*=3.5;e.maxHp=e.hp;e.damage*=1.45;const aff=ELITE_AFFIXES.slice().sort(()=>Math.random()-.5).slice(0,run.time>600?2:1);aff.forEach(a=>{a.apply(e);e.affixes.push(a.id)});e.color='#d5a254'}
 enemies.push(e)
}
function nearest(){if(!enemies.length)return null;let b=enemies[0],bd=(b.x-player.x)**2+(b.y-player.y)**2;for(const e of enemies){const d=(e.x-player.x)**2+(e.y-player.y)**2;if(d<bd){b=e;bd=d}}return b}
function shootAuto(){
 const owned=Object.keys(run.skills);if(!owned.length)return;const t=nearest();if(!t)return;const primary=owned[0],base=Math.atan2(t.y-player.y,t.x-player.x),lv=run.skills[primary],count=1+(save.hero==='H012'?1:0)+(run.passives.P021?1:0);
 for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.12;shots.push({source:primary,x:player.x,y:player.y,vx:Math.cos(a)*500,vy:Math.sin(a)*500,r:5,life:1.7,dmg:player.atk*(1+.16*(lv-1))*(1+run.shopBuff),color:WW.config.hero[save.hero].color,crit:Math.random()<player.crit,pierce:save.hero==='H019'?1:0})}
}
function recordDamage(source,dmg){run.totalDamage+=dmg;run.damageBy[source]=(run.damageBy[source]||0)+dmg}
function damageEnemy(e,dmg,crit=false,source='AUTO'){
 e.hp-=dmg;recordDamage(source,dmg);e.flash=1;if(save.settings.numbers)numbers.push({x:e.x,y:e.y-12,text:Math.round(dmg),life:.55,max:.55,color:crit?'#ffe27e':'#fff0d6',size:crit?17:11});
 if(e.hp<=0){const idx=enemies.indexOf(e);if(idx>=0)enemies.splice(idx,1);run.kills++;run.combo++;run.comboTimer=2;run.maxCombo=Math.max(run.maxCombo,run.combo);run.xp+=(e.elite?18:4)*(typeof v19Difficulty==='function'?v19Difficulty().xp:1);player.ult=Math.min(100,player.ult+(e.elite?8:1.4));if(e.elite)run.eliteKills++;
   if(save.settings.particles)for(let i=0;i<(e.elite?10:4);i++)effects.push({type:'particle',x:e.x,y:e.y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,r:2+Math.random()*3,life:.5,max:.5,color:e.color});
   if(e.volatile)spawnExplosion(e.x,e.y,58,e.damage*1.2);if(e.split){spawnEnemy({id:e.id});spawnEnemy({id:e.id})}
   if(e.elite&&Math.random()<.45)run.drops.push(makeGearDrop('elite'));
   checkLevel()
 }}
function checkLevel(){if(run.xp>=run.xpNeed&&!run.paused){run.xp-=run.xpNeed;run.level++;run.xpNeed=Math.round(26+run.level*11);showLevelChoices()}}
function validOptions(){
 const opts=[];save.build.active.forEach(id=>{const lv=run.skills[id]||0;if(lv>0&&lv<5)opts.push({kind:'active',id,label:skillName(id)+' Lv.'+(lv+1)});else if(lv===0&&Object.keys(run.skills).length<6)opts.push({kind:'active',id,label:'解锁 '+skillName(id)})});
 save.build.passive.forEach(id=>{const lv=run.passives[id]||0;if(lv>0&&lv<5)opts.push({kind:'passive',id,label:skillName(id)+' Lv.'+(lv+1)});else if(lv===0&&Object.keys(run.passives).length<6)opts.push({kind:'passive',id,label:'解锁 '+skillName(id)})});return opts.sort(()=>Math.random()-.5)
}
function showLevelChoices(){run.paused=true;const opts=validOptions().slice(0,3),g=document.getElementById('choiceGrid');g.innerHTML='';if(!opts.length){run.paused=false;return}opts.forEach(o=>{const d=document.createElement('button');d.type='button';d.className='choice';d.innerHTML='<div class="skillIcon">'+glyph(o.id)+'</div><div class="eyebrow">'+o.id+'</div><h3>'+o.label+'</h3><p>'+(o.kind==='active'?'主动/召唤':'被动')+'</p>';d.onclick=()=>pickLevel(o);g.appendChild(d)});v32OpenLayer('levelOverlay');if(typeof v336PresentLevelChoices==='function')v336PresentLevelChoices(opts)}
function pickLevel(o){if(o.kind==='active')run.skills[o.id]=(run.skills[o.id]||0)+1;else run.passives[o.id]=(run.passives[o.id]||0)+1;v32CloseLayer('levelOverlay');run.paused=false;hint('获得 '+skillName(o.id));log('升级 '+o.id+' '+skillName(o.id));renderRunSide();checkLevel();if(typeof v336PresentLevelChoice==='function')v336PresentLevelChoice(o)}
function runReadyEvos(){return Object.entries(WW.config.evolution).filter(([id,[n,a,p]])=>!run.evolved[id]&&(run.skills[a]||0)>=5&&(run.passives[p]||0)>=5).map(([id])=>id)}
function runReadyFusions(){return Object.entries(FUSIONS).filter(([id,[n,a,b]])=>!run.fused[id]&&run.evolved[a]&&run.evolved[b]).map(([id])=>id)}
function showChest(){run.paused=true;if(run.v29?.encounterEvidence)run.v29.encounterEvidence.chests.push({at:Math.floor(run.time)});const rewards=[];runReadyFusions().forEach(id=>rewards.push({type:'fusion',id}));runReadyEvos().forEach(id=>rewards.push({type:'evo',id}));while(rewards.length<3)rewards.push({type:rewards.length===2?'gear':'upgrade',id:null});const g=document.getElementById('chestChoices');g.innerHTML='';rewards.slice(0,3).forEach(r=>{const d=document.createElement('button');d.type='button';d.className='choice';const title=r.id?skillName(r.id):(r.type==='gear'?'随机装备掉落':'随机技能升级');d.innerHTML='<div class="skillIcon">'+(r.id?glyph(r.id):r.type==='gear'?'装':'箱')+'</div><div class="eyebrow">'+r.type.toUpperCase()+'</div><h3>'+title+'</h3><p>'+(r.id?r.id:'宝箱奖励')+'</p>';d.onclick=()=>pickChest(r);g.appendChild(d)});v32OpenLayer('chestOverlay')}
function pickChest(r){if(r.type==='evo'){run.evolved[r.id]=true;hint('进化 · '+skillName(r.id));log('进化 '+r.id+' '+skillName(r.id))}else if(r.type==='fusion'){run.fused[r.id]=true;hint('融合 · '+skillName(r.id));log('融合 '+r.id+' '+skillName(r.id))}else if(r.type==='gear'){const d=makeGearDrop('chest');run.drops.push(d);hint('获得装备 · '+d.name)}else{const o=validOptions().find(x=>(x.kind==='active'?(run.skills[x.id]||0)>0:(run.passives[x.id]||0)>0));if(o){if(o.kind==='active')run.skills[o.id]=(run.skills[o.id]||0)+1;else run.passives[o.id]=(run.passives[o.id]||0)+1}}v32CloseLayer('chestOverlay');run.paused=false;renderRunSide()}
function forceLevel(){if(!run.active)return;run.xp=run.xpNeed;checkLevel()}
function forceChest(){if(!run.active)return;showChest()}
function fastForward(m){if(!run.active)startBattle();run.time=m*60-1;hint('跳转到 '+m+'分钟')}

function tryDodge(){if(!run.active||run.paused||player.dodgeCd>0)return;const input=movementVector(),length=input?Math.hypot(input.x,input.y):0,move=length?{x:input.x/length,y:input.y/length}:dodgeDirection,startX=player.x,startY=player.y,distance=Math.min(90,player.speed*.34,Math.min(AW,AH)*.16);dodgeDirection=move;player.x=Math.max(18,Math.min(WORLD_W-18,player.x+move.x*distance));player.y=Math.max(18,Math.min(WORLD_H-18,player.y+move.y*distance));player.dodgeCd=4.5;player.inv=.35;if(save.settings.particles)effects.push({type:'ring',x:startX,y:startY,r:16,life:.3,max:.3,color:'#70a9ff',maxr:70})}
function castHeroSkill(){if(!run.active||run.paused||player.skillCd>0)return;const h=WW.config.hero[save.hero];player.skillCd=6;hint(h.skill);if(save.hero==='H002'){const t=nearest();if(t){const a=Math.atan2(t.y-player.y,t.x-player.x);player.x+=Math.cos(a)*130;player.y+=Math.sin(a)*130;clampWorldPoint(player,18)}}enemies.slice().forEach(e=>{if((e.x-player.x)**2+(e.y-player.y)**2<145*145)damageEnemy(e,player.atk*2.2,false,'HERO_SKILL')});if(run.boss&&dist(player,run.boss)<170)damageBoss(player.atk*2.5,'HERO_SKILL');effects.push({type:'ring',x:player.x,y:player.y,r:18,life:.4,max:.4,color:h.color,maxr:130})}
function castUltimate(){if(!run.active||run.paused||player.ult<100)return;player.ult=0;const h=WW.config.hero[save.hero];hint(h.ult);enemies.slice().forEach(e=>damageEnemy(e,player.atk*7,true,'ULT'));if(run.boss)damageBoss(player.atk*20,'ULT');effects.push({type:'ring',x:player.x,y:player.y,r:20,life:.8,max:.8,color:h.color,maxr:230});shake(12)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function spawnExplosion(x,y,r,dmg){effects.push({type:'ring',x,y,r:8,life:.35,max:.35,color:'#ef694e',maxr:r});if(Math.hypot(player.x-x,player.y-y)<r&&player.inv<=0)hurtPlayer(dmg)}
function hurtPlayer(dmg){if(player.inv>0)return;player.hp-=Math.max(1,dmg-WW.config.hero[save.hero].def*.08);player.inv=.28;shake(5)}

function spawnEnemyShot(x,y,tx,ty,dmg,color='#a47dff',speed=220,r=5){const a=Math.atan2(ty-y,tx-x);enemyShots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,dmg,color,r,life:5})}
function enemyAI(e,dt){
 e.attack+=dt;e.skill+=dt;e.flash=Math.max(0,e.flash-dt*5);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;
 if(e.aura&&d<140)run.v30AuraNear=true;
 switch(e.ai){
  case 'melee':e.x+=nx*e.speed*dt;e.y+=ny*e.speed*dt;break;
  case 'ranged':
    if(d>300){e.x+=nx*e.speed*.6*dt;e.y+=ny*e.speed*.6*dt}else if(d<190){e.x-=nx*e.speed*.5*dt;e.y-=ny*e.speed*.5*dt}
    if(e.attack>1.8){e.attack=0;spawnEnemyShot(e.x,e.y,player.x,player.y,e.damage,e.color,235,5)}break;
  case 'shield':e.x+=nx*e.speed*.65*dt;e.y+=ny*e.speed*.65*dt;break;
  case 'charge':
    if(e.skill>2.4){e.skill=0;e.charge=.6;e.cdx=nx;e.cdy=ny}
    if(e.charge>0){e.charge-=dt;e.x+=e.cdx*e.speed*3*dt;e.y+=e.cdy*e.speed*3*dt}else{e.x+=nx*e.speed*.55*dt;e.y+=ny*e.speed*.55*dt}break;
  case 'aoe_ranged':
    if(d>280){e.x+=nx*e.speed*.45*dt;e.y+=ny*e.speed*.45*dt}
    if(e.attack>2.7){e.attack=0;traps.push({x:player.x+(Math.random()-.5)*70,y:player.y+(Math.random()-.5)*70,r:42,life:1.1,dmg:e.damage,color:'#ef694e'})}break;
  case 'brute':e.x+=nx*e.speed*dt;e.y+=ny*e.speed*dt;if(e.attack>3&&d<140){e.attack=0;spawnExplosion(e.x,e.y,95,e.damage*1.2)}break;
  case 'flank':{const px=-ny,py=nx;e.x+=(nx*.7+px*.6)*e.speed*dt;e.y+=(ny*.7+py*.6)*e.speed*dt}break;
  case 'poison':e.x+=nx*e.speed*.8*dt;e.y+=ny*e.speed*.8*dt;if(e.attack>2.2){e.attack=0;spawnEnemyShot(e.x,e.y,player.x,player.y,e.damage,'#6bc76a',190,6)}break;
  case 'fly':e.x+=nx*e.speed*.65*dt;e.y+=ny*e.speed*.65*dt;if(e.attack>1.9){e.attack=0;spawnEnemyShot(e.x,e.y,player.x,player.y,e.damage,'#9d84d8',260,4)}break;
  case 'summoner':
    if(d>320){e.x+=nx*e.speed*.35*dt;e.y+=ny*e.speed*.35*dt}
    if(e.skill>4){e.skill=0;for(let i=0;i<2;i++)spawnEnemy({id:selectedStageInfo().chapter==='ST003'?'EN014':weightedEnemyId(selectedStageInfo().chapter)})}break;
  case 'dash':
    if(e.skill>1.7){e.skill=0;e.dash=.24;e.cdx=nx;e.cdy=ny}
    if(e.dash>0){e.dash-=dt;e.x+=e.cdx*e.speed*4*dt;e.y+=e.cdy*e.speed*4*dt}else{e.x+=nx*e.speed*.5*dt;e.y+=ny*e.speed*.5*dt}break;
  case 'clone':
    e.x+=nx*e.speed*.75*dt;e.y+=ny*e.speed*.75*dt;if(e.skill>4.5){e.skill=0;spawnEnemy({id:'EN025'})}break;
  case 'trap':
    e.x+=nx*e.speed*.55*dt;e.y+=ny*e.speed*.55*dt;if(e.attack>2.5){e.attack=0;traps.push({x:player.x+(Math.random()-.5)*100,y:player.y+(Math.random()-.5)*100,r:38,life:.9,dmg:e.damage,color:'#f0a14e'})}break;
  case 'healer':
    if(d<240){e.x-=nx*e.speed*.4*dt;e.y-=ny*e.speed*.4*dt}
    if(e.skill>3.5){e.skill=0;enemies.forEach(o=>{if(dist(e,o)<160)o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.12)})}break;
 }
 if(d<e.r+player.r+2)hurtPlayer(e.damage);
 if(e.vamp&&d<e.r+player.r+2)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.05)
}

function spawnBoss(){
 const si=selectedStageInfo(),id=si.stage[4],cfg=WW.config.boss[id];run.boss={id,name:cfg.name,x:clampValue(player.x+AW*.28,45,WORLD_W-45),y:clampValue(player.y-AH*.16,45,WORLD_H-45),r:42,hp:cfg.hp*(1+WW.config.stage[si.chapter].stages.indexOf(si.stage)*.12),maxHp:cfg.hp*(1+WW.config.stage[si.chapter].stages.indexOf(si.stage)*.12),color:cfg.color,phase:1,attack:0,skill:0,state:'idle'};run.boss.maxHp=run.boss.hp;document.getElementById('bossBar').classList.add('show');document.getElementById('bossLabel').textContent=id+' '+cfg.name+' · '+cfg.style;hint('Boss登场 · '+cfg.name);log('Boss登场：'+id+' '+cfg.name);shake(10)
}
function damageBoss(dmg,source='AUTO'){if(!run.boss)return;run.boss.hp-=dmg;recordDamage(source,dmg);if(save.settings.numbers)numbers.push({x:run.boss.x,y:run.boss.y-45,text:Math.round(dmg),life:.55,max:.55,color:'#ffe27e',size:16});if(run.boss.hp<=0){const id=run.boss.id,name=run.boss.name;run.boss=null;document.getElementById('bossBar').classList.remove('show');run.drops.push(makeGearDrop('boss'));hint('Boss击败 · '+name);log('击败 '+id+' '+name);shake(12)}}
function bossAI(dt){
 const b=run.boss;if(!b)return;b.attack+=dt;b.skill+=dt;b.phase=b.hp/b.maxHp<.35?3:b.hp/b.maxHp<.7?2:1;const dx=player.x-b.x,dy=player.y-b.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;const cfg=WW.config.boss[b.id];
 if(d>180){b.x+=nx*(46+b.phase*7)*dt;b.y+=ny*(46+b.phase*7)*dt}
 const cd=Math.max(.9,2.8-b.phase*.35);
 if(b.skill>cd){b.skill=0;
   if(['B001','B006'].includes(b.id)){spawnExplosion(b.x,b.y,110+b.phase*18,18+b.phase*4)}
   else if(b.id==='B002'){for(let i=0;i<3+b.phase;i++){const a=Math.random()*Math.PI*2;traps.push({x:player.x+Math.cos(a)*80,y:player.y+Math.sin(a)*80,r:36,life:1.1,dmg:14+b.phase*3,color:'#a47dff'})};if(b.phase>=2)spawnEnemy({elite:true})}
   else if(b.id==='B003'){b.dash=.5;b.cdx=nx;b.cdy=ny}
   else if(b.id==='B008'){for(let i=0;i<2+b.phase;i++)spawnEnemy({id:'EN014'});traps.push({x:player.x,y:player.y,r:60,life:.8,dmg:18,color:'#d6a05d'})}
   else if(b.id==='B009'){for(let i=0;i<5;i++)traps.push({x:clampValue(player.x-AW/2+Math.random()*AW,34,WORLD_W-34),y:clampValue(player.y-AH/2+Math.random()*AH,34,WORLD_H-34),r:34,life:1.1,dmg:15,color:'#ef694e'})}
   else if(b.id==='B010'){for(let i=0;i<3+b.phase;i++){const a=i/(3+b.phase)*Math.PI*2;enemyShots.push({x:b.x,y:b.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,dmg:13,color:'#70a9ff',r:5,life:4})}}
   else if(b.id==='B011'){for(let i=0;i<4+b.phase;i++)spawnEnemy({id:'EN025'});for(let i=0;i<5;i++)spawnEnemyShot(b.x,b.y,player.x+(Math.random()-.5)*150,player.y+(Math.random()-.5)*150,14,'#a47dff',280,5)}
 }
 if(b.dash>0){b.dash-=dt;b.x+=b.cdx*320*dt;b.y+=b.cdy*320*dt}
 if(d<b.r+player.r+4)hurtPlayer(18+b.phase*4)
 document.getElementById('bossHpFill').style.width=Math.max(0,b.hp/b.maxHp*100)+'%'
}

function updateMapMechanic(dt){
 const map=selectedStageInfo().chapter;
 const profile=run?.v29?.id==='story'?run.v29.rule?.storyEncounter:null,hazard=profile?.hazard,evidence=run?.v29?.encounterEvidence;
 if(hazard){
   if(evidence&&!evidence.hazardUsed){evidence.hazardUsed=true;log('场地机制生效 → '+hazard.name)}
   if(hazard.type==='fireline'){
      if(Math.floor(run.time/hazard.interval)!==Math.floor((run.time-dt)/hazard.interval)){const y=Math.max(80,Math.min(WORLD_H-80,player.y-AH/2+80+Math.random()*(AH-160)));run.mapHazards.push({type:'fireline',x:0,y,w:WORLD_W,h:hazard.size,life:hazard.life,max:hazard.life,damage:hazard.damage});if(evidence)evidence.hazardTriggers++}
     run.mapHazards.forEach(h=>{h.life-=dt;if(h.type==='fireline'&&Math.abs(player.y-h.y)<h.h/2)hurtPlayer((h.damage||hazard.damage)*dt)})
   }else if(hazard.type==='fog'){
     const fog=(Math.sin(run.time*hazard.frequency)+1)/2;run.fog=Math.max(0,Math.min(1,(fog-(1-hazard.density))*(1.15+hazard.density)));if(evidence)evidence.hazardPeak=Math.max(evidence.hazardPeak||0,run.fog)
   }else if(hazard.type==='blast'&&Math.floor(run.time/hazard.interval)!==Math.floor((run.time-dt)/hazard.interval)){
      traps.push({x:Math.max(80,Math.min(WORLD_W-80,player.x-AW/2+80+Math.random()*(AW-160))),y:Math.max(80,Math.min(WORLD_H-80,player.y-AH/2+80+Math.random()*(AH-160))),r:hazard.size,life:hazard.life,dmg:hazard.damage,color:'#ef9f4c'});if(evidence)evidence.hazardTriggers++
   }
   run.mapHazards=run.mapHazards.filter(h=>h.life>0);return
 }
 if(map==='ST001'){
    if(Math.floor(run.time/18)!==Math.floor((run.time-dt)/18)){const y=Math.max(80,Math.min(WORLD_H-80,player.y-AH/2+80+Math.random()*(AH-160)));run.mapHazards.push({type:'fireline',x:0,y,w:WORLD_W,h:42,life:5,max:5})}
   run.mapHazards.forEach(h=>{h.life-=dt;if(h.type==='fireline'&&Math.abs(player.y-h.y)<h.h/2)hurtPlayer(10*dt)})
 } else if(map==='ST003'){
   const fog=(Math.sin(run.time*.22)+1)/2;run.fog=Math.max(0,Math.min(1,(fog-.35)*1.5));
 } else if(map==='ST004'){
    if(Math.floor(run.time/6)!==Math.floor((run.time-dt)/6)){traps.push({x:Math.max(80,Math.min(WORLD_W-80,player.x-AW/2+80+Math.random()*(AW-160))),y:Math.max(80,Math.min(WORLD_H-80,player.y-AH/2+80+Math.random()*(AH-160))),r:44,life:1.3,dmg:16,color:'#ef9f4c'})}
 }
 run.mapHazards=run.mapHazards.filter(h=>h.life>0)
}

function showEvent(){
 run.paused=true;const profile=run?.v29?.id==='story'?run.v29.rule?.storyEncounter:null,pool=profile?.eventPool?.length?MAP_EVENTS.filter(ev=>profile.eventPool.includes(ev.id)):MAP_EVENTS,ev=pool[Math.floor(Math.random()*pool.length)];if(run.v29?.encounterEvidence)run.v29.encounterEvidence.events.push({at:Math.floor(run.time),id:ev.id,name:ev.name});document.getElementById('eventTitle').textContent=ev.name;const g=document.getElementById('eventChoices');g.innerHTML='';
 let opts=[];
 if(ev.id==='merchant')opts=[['购买火力','-250金币；本局伤害 +18%','merchantAtk'],['购买回复','-180金币；恢复40%生命','merchantHeal'],['离开','不购买','skip']];
 if(ev.id==='altar')opts=[['战神之血','最大HP -15%；伤害 +28%','altarAtk'],['疾风契约','受到伤害 +15%；攻速 +24%','altarSpeed'],['拒绝','不接受代价','skip']];
 if(ev.id==='goldChest')opts=[['打开黄金宝箱','获得装备 + 技能升级','goldOpen'],['换成金币','直接获得500金币','goldCash'],['离开','不处理','skip']];
 if(ev.id==='rift')opts=[['进入裂缝','召唤3只精英；胜利高品质掉落','riftFight'],['稳定裂缝','获得经验并直接升级','riftXp'],['离开','忽略裂缝','skip']];
 opts.forEach(([n,d,code])=>{const x=document.createElement('button');x.type='button';x.className='eventCard';x.innerHTML='<div class="eyebrow">'+ev.id.toUpperCase()+'</div><h3>'+n+'</h3><p>'+d+'</p>';x.onclick=()=>pickEvent(code,ev);g.appendChild(x)});v32OpenLayer('eventOverlay')
}
function pickEvent(code,ev){
 if(code==='merchantAtk'){if(save.gold>=250){save.gold-=250;run.shopBuff+=.18;hint('游商：伤害提升')}else toast('金币不足')}
 if(code==='merchantHeal'){if(save.gold>=180){save.gold-=180;player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.4);hint('游商：生命恢复')}else toast('金币不足')}
 if(code==='altarAtk'){player.maxHp*=.85;player.hp=Math.min(player.hp,player.maxHp);run.altarBuff+=.28;player.atk*=1.28;hint('祭坛：战神之血')}
 if(code==='altarSpeed'){player.aspd*=1.24;run.incomingMul=1.15;hint('祭坛：疾风契约')}
 if(code==='goldOpen'){run.drops.push(makeGearDrop('gold'));const o=validOptions().find(x=>(x.kind==='active'?(run.skills[x.id]||0)>0:(run.passives[x.id]||0)>0));if(o){if(o.kind==='active')run.skills[o.id]=(run.skills[o.id]||0)+1;else run.passives[o.id]=(run.passives[o.id]||0)+1}}
 if(code==='goldCash'){save.gold+=500}
 if(code==='riftFight'){run.riftActive=true;for(let i=0;i<3;i++)spawnEnemy({elite:true})}
 if(code==='riftXp'){run.xp=run.xpNeed;checkLevel()}
 v32CloseLayer('eventOverlay');run.paused=false;persist();log('事件：'+ev.name+' → '+code)
}

function makeGearDrop(source){
 const ids=Object.keys(WW.config.gear),weights=ids.filter(id=>!save.inventory.gear.includes(id));const pool=weights.length?weights:ids;const id=pool[Math.floor(Math.random()*pool.length)],g=WW.config.gear[id];
 return {id,name:g.name,rarity:g.rarity,score:g.score,source}
}
function finalizeDrops(){
 run.drops.forEach(d=>{if(WW.config.gear[d.id]&&!save.inventory.gear.includes(d.id))save.inventory.gear.push(d.id)})
}

function updateProjectiles(dt){
 for(let i=shots.length-1;i>=0;i--){const p=shots[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;let hit=null;for(const e of enemies){if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){hit=e;break}}if(hit){damageEnemy(hit,p.dmg*(p.crit?1.5:1),p.crit,p.source);if(p.pierce>0){p.pierce--}else{shots.splice(i,1);continue}}if(run.boss&&Math.hypot(run.boss.x-p.x,run.boss.y-p.y)<run.boss.r+p.r){damageBoss(p.dmg*(p.crit?1.5:1),p.source);if(p.pierce>0)p.pierce--;else{shots.splice(i,1);continue}}if(p.life<=0)shots.splice(i,1)}
 for(let i=enemyShots.length-1;i>=0;i--){const p=enemyShots[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(Math.hypot(player.x-p.x,player.y-p.y)<player.r+p.r){hurtPlayer(p.dmg*(run.incomingMul||1));enemyShots.splice(i,1);continue}if(p.life<=0)enemyShots.splice(i,1)}
 for(let i=traps.length-1;i>=0;i--){const t=traps[i];t.life-=dt;if(t.life<=0){if(Math.hypot(player.x-t.x,player.y-t.y)<t.r)hurtPlayer(t.dmg*(run.incomingMul||1));spawnExplosion(t.x,t.y,t.r,t.dmg);traps.splice(i,1)}}
}
function updateEffects(dt){
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;if(e.vx!=null){e.x+=e.vx*dt;e.y+=e.vy*dt}if(e.life<=0)effects.splice(i,1)}
 numbers.forEach(n=>{n.life-=dt;n.y-=20*dt});numbers=numbers.filter(n=>n.life>0)
}
function v34MinimapSnapshot(){
 const interactions=Array.isArray(run?.v25?.interactables)?run.v25.interactables.filter(item=>!item.used).map(item=>({id:item.id,type:item.type,x:item.x,y:item.y})):[];
 const activeObjective=Array.isArray(run?.objectives)?run.objectives.find(objective=>!objective.complete):null;
 let objective=null;
 if(activeObjective?.kind==='boss'&&run?.boss)objective={id:activeObjective.id,x:run.boss.x,y:run.boss.y};
 else if(activeObjective?.kind==='interaction'&&interactions.length)objective={id:activeObjective.id,x:interactions[0].x,y:interactions[0].y};
 return{world:{width:WORLD_W,height:WORLD_H},player:{x:player.x,y:player.y},boss:run?.boss?{id:run.boss.id,x:run.boss.x,y:run.boss.y}:null,interactions:interactions,objective:objective,viewport:{x:battleCamera.x,y:battleCamera.y,width:AW,height:AH}};
}
function v34DrawTacticalMinimap(){const minimap=document.getElementById('tacticalMinimap');if(!minimap||!run?.active)return;const rect=minimap.getBoundingClientRect(),width=Math.max(120,Math.round(rect.width)),height=Math.max(76,Math.round(rect.height)),dpr=Math.min(devicePixelRatio||1,2);if(minimap.width!==Math.round(width*dpr)||minimap.height!==Math.round(height*dpr)){minimap.width=Math.round(width*dpr);minimap.height=Math.round(height*dpr)}const mini=minimap.getContext('2d'),snapshot=v34MinimapSnapshot(),scaleX=width/snapshot.world.width,scaleY=height/snapshot.world.height;mini.setTransform(dpr,0,0,dpr,0,0);mini.clearRect(0,0,width,height);mini.fillStyle='rgba(3,12,12,.9)';mini.fillRect(0,0,width,height);mini.strokeStyle='rgba(228,195,125,.55)';mini.lineWidth=1;mini.strokeRect(.5,.5,width-1,height-1);mini.strokeStyle='rgba(111,148,139,.6)';mini.strokeRect(snapshot.viewport.x*scaleX,snapshot.viewport.y*scaleY,Math.max(4,snapshot.viewport.width*scaleX),Math.max(4,snapshot.viewport.height*scaleY));snapshot.interactions.forEach(item=>{mini.fillStyle=item.type==='barrel'?'#dc6747':'#73bfa1';mini.fillRect(item.x*scaleX-1.5,item.y*scaleY-1.5,3,3)});if(snapshot.objective){mini.strokeStyle='#f2c36b';mini.lineWidth=1.5;mini.beginPath();mini.arc(snapshot.objective.x*scaleX,snapshot.objective.y*scaleY,4,0,Math.PI*2);mini.stroke()}if(snapshot.boss){mini.fillStyle='#dd513f';mini.beginPath();mini.arc(snapshot.boss.x*scaleX,snapshot.boss.y*scaleY,3.5,0,Math.PI*2);mini.fill()}mini.fillStyle='#f4e7b8';mini.beginPath();mini.arc(snapshot.player.x*scaleX,snapshot.player.y*scaleY,3,0,Math.PI*2);mini.fill()}
function v34UpdateWorldEdgeCue(){const cue=document.getElementById('worldEdgeCue');if(!cue||!run?.active)return;const edges=[['西侧边界',player.x,'west'],['东侧边界',WORLD_W-player.x,'east'],['北侧边界',player.y,'north'],['南侧边界',WORLD_H-player.y,'south']],nearest=edges.sort((a,b)=>a[1]-b[1])[0],threshold=Math.max(150,Math.min(AW,AH)*.24),visible=nearest[1]<threshold;cue.classList.toggle('show',visible);cue.dataset.edge=visible?nearest[2]:'';cue.textContent=visible?nearest[0]+' · '+Math.max(0,Math.round(nearest[1]))+'m':''}
function updateRun(dt){
 if(!run.active||run.paused)return;run.time+=dt;player.inv=Math.max(0,player.inv-dt);player.dodgeCd=Math.max(0,player.dodgeCd-dt);player.skillCd=Math.max(0,player.skillCd-dt);run.comboTimer-=dt;if(run.comboTimer<=0)run.combo=0;
 const move=responsiveMovementVector(dt);if(move){const length=Math.hypot(move.x,move.y)||1;dodgeDirection={x:move.x/length,y:move.y/length};player.x+=move.x*player.speed*dt;player.y+=move.y*player.speed*dt}player.x=Math.max(18,Math.min(WORLD_W-18,player.x));player.y=Math.max(18,Math.min(WORLD_H-18,player.y));
 run.spawn+=dt;const spawnInterval=Math.max(.12,.34-run.time/5000);while(run.spawn>spawnInterval){run.spawn-=spawnInterval;spawnEnemy()}if(enemies.length>260)enemies.splice(0,enemies.length-260);
 run.attack+=dt;if(run.attack>1/Math.max(.6,player.aspd)){run.attack=0;shootAuto()}
 enemies.slice().forEach(e=>enemyAI(e,dt));bossAI(dt);updateProjectiles(dt);updateMapMechanic(dt);updateEffects(dt);
 [5,10,15].forEach((m,i)=>{if(run.time>=m*60&&!run.chests[i]){run.chests[i]=true;showChest()}});
 [3,8,13].forEach((m,i)=>{if(run.time>=m*60&&!run.events[i]){run.events[i]=true;showEvent()}});
 if(!run.boss&&run.time>=12*60&&selectedStageInfo().stage[2]&&!run.bossDefeated){spawnBoss()}
 if(run.riftActive&&run.eliteKills>=(run.riftEliteTarget??3)){run.riftActive=false;const d=makeGearDrop('rift');run.drops.push(d);hint('裂缝完成 · '+d.name)}
 run.dpsClock+=dt;if(run.dpsClock>=1){run.dps=Math.round(run.totalDamage-run.lastDps);run.lastDps=run.totalDamage;run.dpsClock=0}
 if(player.hp<=0){finishRun(false,'生命归零');return}
 if(run.time>=20*60&&(save.mode||'story')!=='story'){
   if(selectedStageInfo().stage[2]&&run.boss){finishRun(false,'20分钟到达但Boss仍存活');return}
   finishRun(true,'坚持20分钟并完成Boss目标');return
 }
 updateHud()
}
function shake(n){if(!save.settings.shake)return;run.shake=Math.max(run.shake||0,n)}
function drawRun(){
 ctx.save();if((run.shake||0)>0){ctx.translate((Math.random()-.5)*run.shake,(Math.random()-.5)*run.shake);run.shake*=.88}
 const map=selectedStageInfo().chapter;ctx.fillStyle=map==='ST001'?'#172019':map==='ST003'?'#1a2116':'#151b22';ctx.fillRect(0,0,WORLD_W,WORLD_H);
 ctx.strokeStyle='rgba(255,255,255,.02)';for(let x=0;x<WORLD_W;x+=55){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_H);ctx.stroke()}for(let y=0;y<WORLD_H;y+=55){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_W,y);ctx.stroke()}
 run.mapHazards.forEach(h=>{if(h.type==='fireline'){ctx.globalAlpha=Math.max(.15,h.life/h.max*.45);ctx.fillStyle='#ef694e';ctx.fillRect(h.x,h.y-h.h/2,h.w,h.h);ctx.globalAlpha=1}});
 traps.forEach(t=>{ctx.globalAlpha=Math.max(.2,1-t.life/1.3);ctx.strokeStyle=t.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1});
 for(const e of enemies){ctx.beginPath();ctx.fillStyle=e.flash>0?'#fff5dd':e.color;ctx.shadowBlur=e.elite?16:0;ctx.shadowColor=e.color;ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();if(e.elite){ctx.strokeStyle='#f3c66c';ctx.lineWidth=2;ctx.stroke()}ctx.shadowBlur=0}
 for(const p of shots){ctx.beginPath();ctx.fillStyle=p.color;ctx.shadowBlur=10;ctx.shadowColor=p.color;ctx.arc(p.x,p.y,p.r+(p.crit?2:0),0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;
 for(const p of enemyShots){ctx.beginPath();ctx.fillStyle=p.color;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}
 if(run.boss){ctx.beginPath();ctx.fillStyle=run.boss.color;ctx.shadowBlur=30;ctx.shadowColor=run.boss.color;ctx.arc(run.boss.x,run.boss.y,run.boss.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 if(save.settings.particles)for(const e of effects){const a=Math.max(0,e.life/e.max);ctx.globalAlpha=a;if(e.type==='particle'){ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill()}else{ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r+(1-a)*(e.maxr||50),0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1}
 ctx.beginPath();ctx.fillStyle=player.inv>0?'#fff0c0':WW.config.hero[save.hero].color;ctx.shadowBlur=22;ctx.shadowColor=WW.config.hero[save.hero].color;ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 if(save.settings.numbers){ctx.textAlign='center';for(const n of numbers){ctx.globalAlpha=Math.max(0,n.life/n.max);ctx.font='800 '+n.size+'px Inter';ctx.fillStyle=n.color;ctx.fillText(n.text,n.x,n.y)}ctx.globalAlpha=1}
 if(map==='ST003'&&run.fog>0){ctx.fillStyle='rgba(82,94,70,'+(run.fog*.35)+')';ctx.fillRect(0,0,WORLD_W,WORLD_H)}
 ctx.restore()
}
function drawBattleFrame(dt){updateBattleCamera(dt);ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,AW,AH);ctx.translate(-battleCamera.x,-battleCamera.y);drawRun();ctx.restore();v34DrawTacticalMinimap();v34UpdateWorldEdgeCue()}
function setMobileActionState(id,state,unavailable,label){const button=document.getElementById(id),text=document.getElementById(id+'State');if(!button||!text)return;text.textContent=state;button.classList.toggle('unavailable',unavailable);button.setAttribute('aria-disabled',String(unavailable));button.setAttribute('aria-label',label+' · '+state)}
function updateMobileControlsHud(){const near=typeof v25NearestInteract==='function'&&!!v25NearestInteract();setMobileActionState('mobileSkill',player.skillCd>0?player.skillCd.toFixed(1)+'s':'技能',player.skillCd>0,'英雄技能');setMobileActionState('mobileDodge',player.dodgeCd>0?player.dodgeCd.toFixed(1)+'s':'就绪',player.dodgeCd>0,'闪避');setMobileActionState('mobileUlt',Math.floor(player.ult)+'%',player.ult<100,'终极技能');setMobileActionState('mobileInteract',near?'可互动':'互动',!near,'地图互动')}
function setDesktopActionState(id,textId,state,unavailable,label,shortcut){const button=document.getElementById(id),text=document.getElementById(textId);if(!button||!text)return;text.textContent=state;button.classList.toggle('unavailable',unavailable);button.setAttribute('aria-disabled',String(unavailable));button.setAttribute('aria-label',label+' · '+shortcut+' · '+state)}
function updateDesktopActionsHud(){setDesktopActionState('heroSkillAction','skillCdText',player.skillCd>0?'冷却 '+player.skillCd.toFixed(1)+'秒':'就绪',player.skillCd>0,'英雄技能','E');setDesktopActionState('dodgeAction','dodgeCdText',player.dodgeCd>0?'冷却 '+player.dodgeCd.toFixed(1)+'秒':'就绪',player.dodgeCd>0,'闪避','Space');setDesktopActionState('ultAction','ultText','能量 '+Math.floor(player.ult)+'%',player.ult<100,'终极技能','R')}
function updateHud(){
 document.getElementById('hudHero').textContent=WW.config.hero[save.hero].name;document.getElementById('runLevel').textContent=run.level;document.getElementById('hudHp').textContent=Math.max(0,Math.round(player.hp))+'/'+Math.round(player.maxHp);document.getElementById('runTime').textContent=fmt(run.time);document.getElementById('runKills').textContent=run.kills;document.getElementById('runDps').textContent=run.dps;updateDesktopActionsHud();updateMobileControlsHud();
 const combo=document.getElementById('comboText');combo.textContent=run.combo;combo.innerHTML=run.combo+'<small>'+(run.combo>=100?'无双':run.combo>=60?'狂潮':run.combo>=30?'压制':'COMBO')+'</small>';combo.classList.toggle('show',run.combo>=10);
 document.getElementById('lowHp').classList.toggle('show',save.settings.vignette&&player.hp/player.maxHp<.3);
 renderHudSlots();renderDamageList('damageList')
}
function renderHudSlots(){const g=document.getElementById('hudSlots');g.innerHTML='';Object.entries(run.skills).forEach(([id,lv])=>{const ev=Object.keys(run.evolved).find(e=>run.evolved[e]&&WW.config.evolution[e][1]===id),d=document.createElement('div');d.className='hudSlot '+(ev?'evo':'');d.innerHTML='<strong>'+glyph(ev||id)+'</strong><em>'+lv+'</em>';g.appendChild(d)});Object.keys(run.fused).filter(id=>run.fused[id]).forEach(id=>{const d=document.createElement('div');d.className='hudSlot fusion';d.innerHTML='<strong>'+glyph(id)+'</strong><em>F</em>';g.appendChild(d)})}
function renderRunSide(){
 document.getElementById('sideRunHero').textContent=WW.config.hero[save.hero].name;document.getElementById('runStats').innerHTML='<div class="battleStat"><span>战力</span><b>'+combatPower()+'</b></div><div class="battleStat"><span>地图机制</span><b>'+WW.config.stage[selectedStageInfo().chapter].mechanic.split('：')[0]+'</b></div><div class="battleStat"><span>精英击杀</span><b>'+run.eliteKills+'</b></div><div class="battleStat"><span>最大连击</span><b>'+run.maxCombo+'</b></div>';
 const rb=document.getElementById('runBuild');rb.innerHTML='';Object.entries(run.skills).forEach(([id,lv])=>rb.innerHTML+='<div class="runSkill"><b>'+skillName(id)+'</b><small>'+id+' Lv.'+lv+'</small></div>');Object.entries(run.passives).forEach(([id,lv])=>rb.innerHTML+='<div class="runSkill"><b>'+skillName(id)+'</b><small>'+id+' Lv.'+lv+'</small></div>');
 const ready=[...runReadyEvos(),...runReadyFusions()],r=document.getElementById('readyList');r.innerHTML=ready.length?ready.map(id=>'<div class="resultRow"><span>'+id+'</span><b>'+skillName(id)+'</b></div>').join(''):'<div class="tiny">暂无可进化节点</div>';renderHudSlots();renderDamageList('damageList')
}
function renderDamageList(elId,data=run.damageBy){
 const el=document.getElementById(elId);if(!el)return;const arr=Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,8),max=arr[0]?.[1]||1;el.innerHTML=arr.length?arr.map(([id,dmg])=>'<div class="damageRow"><div><span>'+skillName(id)+'</span><div class="damageTrack"><i style="width:'+(dmg/max*100)+'%"></i></div></div><b>'+Math.round(dmg)+'</b></div>').join(''):'<div class="tiny">暂无伤害数据</div>'
}
