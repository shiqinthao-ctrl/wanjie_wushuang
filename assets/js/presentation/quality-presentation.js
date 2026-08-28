/* ================= V2.1 QUALITY & PRESENTATION LAYER ================= */
if(!save.settings.audioEnabled && save.settings.audioEnabled!==false) save.settings.audioEnabled=true;
if(save.settings.masterVolume==null) save.settings.masterVolume=.60;
const V21_TIPS=[
 'Build不是越多越好，完整进化路线比零散技能更重要。',
 '闪避拥有短暂无敌时间，Boss大招预警出现时不要贪输出。',
 '精英怪的金色轮廓代表词缀单位，通常会提供更好的掉落。',
 '12分钟开始进入Boss节奏，15分钟宝箱是终局Build的重要机会。',
 '修罗和万界劫会提高收益，但同样显著提高精英密度和Boss生命。'
];

/* ---------- lightweight audio interface: no external files ---------- */
const V21Audio={
  ctx:null, master:null,
  ensure(){
    if(!save.settings.audioEnabled)return false;
    try{
      if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination)}
      this.master.gain.value=save.settings.masterVolume||.6;
      if(this.ctx.state==='suspended')this.ctx.resume();
      return true
    }catch(e){return false}
  },
  tone(freq=440,dur=.06,type='sine',gain=.06,slide=0){
    if(!this.ensure())return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;
    o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+dur);
    g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.connect(g);g.connect(this.master);o.start(now);o.stop(now+dur)
  },
  hit(){this.tone(180,.035,'square',.035,80)},
  crit(){this.tone(520,.055,'triangle',.045,260)},
  hurt(){this.tone(110,.09,'sawtooth',.05,-45)},
  skill(){this.tone(290,.11,'triangle',.05,360)},
  ult(){this.tone(120,.28,'sawtooth',.06,600);setTimeout(()=>this.tone(620,.16,'triangle',.05,-200),80)},
  boss(){this.tone(72,.34,'sawtooth',.06,45)},
  chest(){this.tone(420,.09,'triangle',.04,180);setTimeout(()=>this.tone(660,.12,'triangle',.04,220),65)},
  win(){[330,440,660].forEach((f,i)=>setTimeout(()=>this.tone(f,.22,'triangle',.045,110),i*120))},
  lose(){[260,190,125].forEach((f,i)=>setTimeout(()=>this.tone(f,.2,'sawtooth',.04,-35),i*120))}
};
function toggleAudio(){save.settings.audioEnabled=!save.settings.audioEnabled;persist();renderV21AudioSettings();if(save.settings.audioEnabled)V21Audio.tone(440,.08,'triangle',.04,100)}
function setMasterVolume(v){save.settings.masterVolume=Number(v)/100;persist();renderV21AudioSettings()}
function renderV21AudioSettings(){
 const t=document.getElementById('audioToggle'),enabled=!!save.settings.audioEnabled;if(t){t.classList.toggle('on',enabled);t.setAttribute('aria-checked',String(enabled))}
 const r=document.getElementById('masterVolume');if(r)r.value=Math.round((save.settings.masterVolume||0)*100);
 const tx=document.getElementById('masterVolumeText');if(tx)tx.textContent=Math.round((save.settings.masterVolume||0)*100)+'%'
}

/* ---------- loading ---------- */
let v21LoadingTimer=null;
const _v21_startBattle=startBattle;
startBattle=function(){
  if(v21LoadingTimer)return;
  const si=selectedStageInfo(),screen=document.getElementById('loadingScreen'),fill=document.getElementById('loadingFill');
  document.getElementById('loadingStage').textContent=WW.config.stage[si.chapter].name+' · '+si.stage[1];
  document.getElementById('loadingHero').textContent=WW.config.hero[save.hero].name+' · '+(V19_DIFFICULTIES?.[save.difficulty]?.name||'标准');
  document.getElementById('loadingTip').textContent=V21_TIPS[Math.floor(Math.random()*V21_TIPS.length)];
  fill.style.width='0%';document.getElementById('loadingProgress').textContent='0%';screen.classList.add('show');
  let p=0;
  v21LoadingTimer=setInterval(()=>{
    p=Math.min(100,p+14+Math.floor(Math.random()*12));fill.style.width=p+'%';document.getElementById('loadingProgress').textContent=p+'%';
    if(p>=100){
      clearInterval(v21LoadingTimer);v21LoadingTimer=null;
      setTimeout(()=>{screen.classList.remove('show');_v21_startBattle();V21Audio.tone(240,.1,'triangle',.035,160)},120)
    }
  },70)
};

/* ---------- silhouettes / combat drawing ---------- */
function v21Shadow(x,y,rx,ry,a=.28){
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y+10,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore()
}
const V336_PRESENTATION={runRef:null,seenShots:new WeakSet(),heroAttackStarted:0,heroAttackUntil:0,heroAttackAngle:0,bossRef:null,bossHp:null,bossEntranceStarted:0,bossEntranceUntil:0,bossHitStarted:0,bossHitUntil:0,bossDefeat:null};
function v336ResetPresentation(){
 V336_PRESENTATION.seenShots=new WeakSet();V336_PRESENTATION.heroAttackStarted=0;V336_PRESENTATION.heroAttackUntil=0;V336_PRESENTATION.heroAttackAngle=0;V336_PRESENTATION.bossRef=null;V336_PRESENTATION.bossHp=null;V336_PRESENTATION.bossEntranceStarted=0;V336_PRESENTATION.bossEntranceUntil=0;V336_PRESENTATION.bossHitStarted=0;V336_PRESENTATION.bossHitUntil=0;V336_PRESENTATION.bossDefeat=null
}
function v336StageId(){try{return selectedStageInfo().stage[0]}catch(error){return''}}
function v336ObserveCombatPresentation(){
 const now=performance.now();
 if(V336_PRESENTATION.runRef!==run){V336_PRESENTATION.runRef=run;v336ResetPresentation()}
 const stageId=v336StageId();
 if(stageId==='ST001-01'&&save.hero==='H001')for(const shot of shots){
  if(V336_PRESENTATION.seenShots.has(shot))continue;V336_PRESENTATION.seenShots.add(shot);
  if(Number.isFinite(shot.vx)&&Number.isFinite(shot.vy)){
   V336_PRESENTATION.heroAttackStarted=now;V336_PRESENTATION.heroAttackUntil=now+190;V336_PRESENTATION.heroAttackAngle=Math.atan2(shot.vy,shot.vx)
  }
 }
 const boss=run.boss,previous=V336_PRESENTATION.bossRef;
 if(boss!==previous){
  if(previous?.id==='B001'&&!boss&&run.bossDefeated&&stageId==='ST001-01')V336_PRESENTATION.bossDefeat={x:previous.x,y:previous.y,started:now,until:now+1050};
  V336_PRESENTATION.bossRef=boss;V336_PRESENTATION.bossHp=boss?.hp??null;
  if(boss?.id==='B001'&&stageId==='ST001-01'){V336_PRESENTATION.bossEntranceStarted=now;V336_PRESENTATION.bossEntranceUntil=now+1250}
 }else if(boss?.id==='B001'&&stageId==='ST001-01'&&Number.isFinite(V336_PRESENTATION.bossHp)&&boss.hp<V336_PRESENTATION.bossHp){
  V336_PRESENTATION.bossHitStarted=now;V336_PRESENTATION.bossHitUntil=now+150;V336_PRESENTATION.bossHp=boss.hp
 }
 if(V336_PRESENTATION.bossDefeat&&now>=V336_PRESENTATION.bossDefeat.until)V336_PRESENTATION.bossDefeat=null
}
function v336BossPresentationState(boss){
 const now=performance.now(),telegraphs=run.v25?.telegraphs||[];
 return{
  entrance:!!boss&&now<V336_PRESENTATION.bossEntranceUntil,
  telegraph:!!boss&&telegraphs.some(item=>!item.resolved),
  hit:!!boss&&now<V336_PRESENTATION.bossHitUntil,
  defeat:!boss&&V336_PRESENTATION.bossDefeat&&now<V336_PRESENTATION.bossDefeat.until
 }
}
function v336DrawEnemyImpact(e){
 if(e.id!=='EN001'||e.flash<=0||v336StageId()!=='ST001-01')return false;
 return WW.assets?.drawRole('enemy-hit',{stageId:'ST001-01',entityId:'EN001',ctx,x:e.x,y:e.y-4,alpha:Math.min(1,.28+e.flash*.72)})||false
}
function v336DrawBossOverlay(b){
 if(b.id!=='B001'||v336StageId()!=='ST001-01')return;
 const now=performance.now(),state=v336BossPresentationState(b);
 if(state.entrance){const life=Math.max(0,(V336_PRESENTATION.bossEntranceUntil-now)/Math.max(1,V336_PRESENTATION.bossEntranceUntil-V336_PRESENTATION.bossEntranceStarted)),scale=1+(1-life)*.28;WW.assets?.drawRole('boss-entrance',{stageId:'ST001-01',entityId:'B001',ctx,x:b.x,y:b.y,width:226*scale,height:226*scale,alpha:Math.min(1,life*1.8)})}
 if(state.telegraph){const pulse=1+Math.sin(now/70)*.055;WW.assets?.drawRole('boss-telegraph',{stageId:'ST001-01',entityId:'B001',ctx,x:b.x,y:b.y-4,width:210*pulse,height:210*pulse,alpha:.88})}
 if(state.hit){const life=Math.max(0,(V336_PRESENTATION.bossHitUntil-now)/Math.max(1,V336_PRESENTATION.bossHitUntil-V336_PRESENTATION.bossHitStarted));WW.assets?.drawRole('boss-hit',{stageId:'ST001-01',entityId:'B001',ctx,x:b.x,y:b.y-10,rotation:(1-life)*.14,alpha:life})}
}
function v336DrawBossDefeat(){
 const state=v336BossPresentationState(null),fx=V336_PRESENTATION.bossDefeat;if(!state.defeat||!fx)return;
 const now=performance.now(),life=Math.max(0,(fx.until-now)/Math.max(1,fx.until-fx.started)),scale=1+(1-life)*.42;
 WW.assets?.drawRole('boss-defeat',{stageId:'ST001-01',entityId:'B001',ctx,x:fx.x,y:fx.y-10,width:240*scale,height:240*scale,rotation:(1-life)*.22,alpha:life})
}
function v21DrawHero(){
  const h=WW.config.hero[save.hero],x=player.x,y=player.y,c=h.color;
  v21Shadow(x,y,18,7,.34);ctx.save();ctx.translate(x,y);
  if(player.inv>0){ctx.shadowBlur=22;ctx.shadowColor='#fff3c8'}
  else{ctx.shadowBlur=18;ctx.shadowColor=c}
  // cape/body
  ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(8,-5);ctx.lineTo(12,13);ctx.lineTo(0,18);ctx.lineTo(-12,13);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ead0a8';ctx.beginPath();ctx.arc(0,-12,6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#f9df9c';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(7,-2);ctx.lineTo(18,-13);ctx.stroke();
  if(save.hero==='H002'||save.hero==='H007'){ctx.beginPath();ctx.moveTo(-3,1);ctx.lineTo(-17,12);ctx.stroke()}
  if(save.hero==='H012'||save.hero==='H010'){ctx.strokeStyle='#d9c7ff';ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(17,5);ctx.stroke()}
  ctx.restore()
}
function v21DrawEnemy(e){
  const assetDrawn=WW.assets?.drawRole('enemy',{stageId:selectedStageInfo().stage[0],entityId:e.id,ctx,x:e.x,y:e.y,filter:e.flash>0?'brightness(2.2) saturate(.45)':'none'});
  if(assetDrawn){
   if(e.elite){ctx.save();ctx.strokeStyle='#f3c66c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,0,Math.PI*2);ctx.stroke();ctx.restore()}
  }else{
   v21Shadow(e.x,e.y,e.r*1.05,4,.25);
   ctx.save();ctx.translate(e.x,e.y);
   if(e.elite){ctx.shadowBlur=16;ctx.shadowColor='#f3c66c'}
   ctx.fillStyle=e.flash>0?'#fff4da':e.color;
   const s=e.r/10;
   if(['shield'].includes(e.ai)){
     ctx.fillRect(-5*s,-9*s,10*s,18*s);ctx.fillStyle='#a2a9b2';ctx.fillRect(5*s,-6*s,7*s,14*s)
   }else if(['ranged','aoe_ranged','poison'].includes(e.ai)){
     ctx.beginPath();ctx.moveTo(0,-10*s);ctx.lineTo(7*s,7*s);ctx.lineTo(-7*s,7*s);ctx.closePath();ctx.fill();
     ctx.strokeStyle='#d7b782';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(8*s,-1*s,6*s,-1.2,1.2);ctx.stroke()
   }else if(['charge','dash'].includes(e.ai)){
     ctx.fillRect(-7*s,-7*s,14*s,15*s);ctx.fillStyle='#d3c4a2';ctx.beginPath();ctx.moveTo(6*s,-2*s);ctx.lineTo(16*s,0);ctx.lineTo(6*s,3*s);ctx.fill()
   }else if(['fly'].includes(e.ai)){
     ctx.beginPath();ctx.arc(0,0,7*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.45;ctx.fillRect(-13*s,-3*s,8*s,5*s);ctx.fillRect(5*s,-3*s,8*s,5*s)
   }else if(['brute'].includes(e.ai)){
     ctx.beginPath();ctx.arc(0,0,10*s,0,Math.PI*2);ctx.fill();ctx.fillRect(-11*s,-2*s,22*s,9*s)
   }else{
     ctx.beginPath();ctx.arc(0,-5*s,5*s,0,Math.PI*2);ctx.fill();ctx.fillRect(-5*s,0,10*s,11*s)
   }
   if(e.elite){ctx.strokeStyle='#f3c66c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.r+4,0,Math.PI*2);ctx.stroke()}
   ctx.restore()
  }
  v336DrawEnemyImpact(e)
}
function v21DrawBoss(b){
  const assetDrawn=WW.assets?.drawRole('boss',{stageId:selectedStageInfo().stage[0],entityId:b.id,ctx,x:b.x,y:b.y});
  if(!assetDrawn){
   v21Shadow(b.x,b.y,b.r*1.2,10,.42);ctx.save();ctx.translate(b.x,b.y);ctx.shadowBlur=34;ctx.shadowColor=b.color;
   ctx.fillStyle=b.color;ctx.beginPath();ctx.moveTo(-22,-24);ctx.lineTo(22,-24);ctx.lineTo(30,18);ctx.lineTo(0,32);ctx.lineTo(-30,18);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e4bc8c';ctx.beginPath();ctx.arc(0,-31,12,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#f6d18b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(20,-5);ctx.lineTo(43,-25);ctx.stroke();
   ctx.restore()
  }
  v336DrawBossOverlay(b)
}
const _v21_drawRun=drawRun;
drawRun=function(){
 ctx.save();if((run.shake||0)>0){ctx.translate((Math.random()-.5)*run.shake,(Math.random()-.5)*run.shake);run.shake*=.88}
 v336ObserveCombatPresentation();
 const map=selectedStageInfo().chapter;
 const hasBattlefield=WW.assets?.drawRole('battlefield',{stageId:selectedStageInfo().stage[0],ctx,x:0,y:0,width:WORLD_W,height:WORLD_H});
 if(!hasBattlefield){
  // layered ground
  const grad=ctx.createLinearGradient(0,0,0,WORLD_H);
  if(map==='ST001'){grad.addColorStop(0,'#1a211b');grad.addColorStop(1,'#101713')}
  else if(map==='ST003'){grad.addColorStop(0,'#1c2519');grad.addColorStop(1,'#121811')}
  else{grad.addColorStop(0,'#171b25');grad.addColorStop(1,'#10131b')}
  ctx.fillStyle=grad;ctx.fillRect(0,0,WORLD_W,WORLD_H);
  // terrain decoration
  ctx.globalAlpha=.15;ctx.fillStyle='#9b8b68';for(let i=0;i<54;i++){let x=(i*193+77)%WORLD_W,y=(i*131+91)%WORLD_H;ctx.beginPath();ctx.ellipse(x,y,22+(i%3)*8,8,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 }
 run.mapHazards.forEach(h=>{if(h.type==='fireline'){ctx.globalAlpha=Math.max(.15,h.life/h.max*.45);ctx.fillStyle='#ef694e';ctx.fillRect(h.x,h.y-h.h/2,h.w,h.h);ctx.globalAlpha=1}});
 traps.forEach(t=>{const pulse=.65+.35*Math.sin(performance.now()/80);ctx.globalAlpha=.5;ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(t.x,t.y,t.r*pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#ffd0aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,Math.PI*2);ctx.stroke()});
 // depth-sort actors
 const actors=enemies.map(e=>({y:e.y,type:'e',o:e}));
 if(run.boss)actors.push({y:run.boss.y,type:'b',o:run.boss});
 actors.push({y:player.y,type:'p',o:player});
 actors.sort((a,b)=>a.y-b.y).forEach(a=>{if(a.type==='e')v21DrawEnemy(a.o);else if(a.type==='b')v21DrawBoss(a.o);else v21DrawHero()});
 v336DrawBossDefeat();
 for(const p of shots){ctx.save();ctx.shadowBlur=16;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r+(p.crit?2:0),0,Math.PI*2);ctx.fill();ctx.restore()}
 for(const p of enemyShots){ctx.save();ctx.shadowBlur=10;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore()}
 if(save.settings.particles)for(const e of effects){const a=Math.max(0,e.life/e.max);ctx.globalAlpha=a;if(e.type==='particle'){ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill()}else{ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r+(1-a)*(e.maxr||50),0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1}
 if(save.settings.numbers){ctx.textAlign='center';for(const n of numbers){ctx.globalAlpha=Math.max(0,n.life/n.max);ctx.font='800 '+n.size+'px Inter';ctx.fillStyle=n.color;ctx.fillText(n.text,n.x,n.y)}ctx.globalAlpha=1}
 if(map==='ST003'&&run.fog>0){ctx.fillStyle='rgba(74,88,64,'+(run.fog*.30)+')';ctx.fillRect(0,0,WORLD_W,WORLD_H)}
 ctx.restore()
};

/* ---------- impact feedback ---------- */
function v21Pulse(id){const e=document.getElementById(id);if(!e)return;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),70)}
const _v21_damageEnemy=damageEnemy;
damageEnemy=function(e,dmg,crit=false,source='AUTO'){
 const before=e.hp;
 const xpBefore=run.xp,levelBefore=run.level,xpNeedBefore=run.xpNeed;
 _v21_damageEnemy(e,dmg,crit,source);
 if(before>0){v21Pulse('hitFlash');crit?V21Audio.crit():V21Audio.hit();if(save.settings.particles)effects.push({type:'ring',x:e.x,y:e.y,r:3,life:.12,max:.12,color:crit?'#ffe47d':'#fff0d6',maxr:18})}
 if(before>0&&e.hp<=0&&typeof v336PresentXpPickup==='function'){
  const amount=run.level>levelBefore?Math.max(0,xpNeedBefore-xpBefore+run.xp):Math.max(0,run.xp-xpBefore);
  if(amount>0)v336PresentXpPickup(amount)
 }
}
const _v21_hurtPlayer=hurtPlayer;
hurtPlayer=function(dmg){const hp=player.hp;_v21_hurtPlayer(dmg);if(player.hp<hp){v21Pulse('damageFlash');V21Audio.hurt()}}
const _v21_castHeroSkill=castHeroSkill;
castHeroSkill=function(){const ready=run?.active&&!run.paused&&player.skillCd<=0;_v21_castHeroSkill();if(ready)V21Audio.skill()}
const _v21_castUltimate=castUltimate;
castUltimate=function(){const ready=run?.active&&!run.paused&&player.ult>=100;_v21_castUltimate();if(ready)V21Audio.ult()}
const _v21_showChest=showChest;
showChest=function(){V21Audio.chest();_v21_showChest();if(typeof v336PresentChestChoices==='function')v336PresentChestChoices()}

/* ---------- Boss telegraph / cast banner ---------- */
let v21LastBossCast=0;
function v21BossCastName(id,phase){
 const maps={
  B001:['蛮王冲阵','震岳裂地','旋风断军'],
  B002:['妖火祭阵','万符天降','妖兵唤魂'],
  B003:['混沌突骑','枪阵封路','下马狂战'],
  B006:['裂地重锤','山崩岩爆','霸体冲撞'],
  B008:['魔猿跃击','棍影万重','狂暴连砸'],
  B009:['炎墙封界','爆符天雨','炎龙突袭'],
  B010:['雷瞬绝杀','雷牢封域','天雷审判'],
  B011:['万影分身','暗影扇刃','影界处刑']
 };
 return (maps[id]||['首领技能'])[(Math.max(1,phase)-1)%3]
}
function v21ShowBossCast(text){
 const e=document.getElementById('bossCastBanner');if(!e)return;e.textContent=text;e.classList.add('show');clearTimeout(v21ShowBossCast.t);v21ShowBossCast.t=setTimeout(()=>e.classList.remove('show'),950)
}
const _v21_spawnBoss=spawnBoss;
spawnBoss=function(){_v21_spawnBoss();if(run.boss){V21Audio.boss();v21ShowBossCast(WW.config.boss[run.boss.id].name+' · 登场')}}
const _v21_bossAI=bossAI;
bossAI=function(dt){
 if(run.boss){
   const b=run.boss,cd=Math.max(.9,2.8-b.phase*.35),remain=cd-b.skill;
   if(remain<.48&&remain>0&&performance.now()-v21LastBossCast>800){
      v21LastBossCast=performance.now();v21ShowBossCast(v21BossCastName(b.id,b.phase));
      effects.push({type:'ring',x:b.x,y:b.y,r:20,life:.45,max:.45,color:'#ef7958',maxr:95})
   }
 }
 _v21_bossAI(dt)
};

/* ---------- end cinematic ---------- */
const _v21_finishRun=finishRun;
finishRun=function(victory,reason){
 if(!run?.active)return;
 const firstPlayable=typeof v336FirstPlayableFlowScope==='function'&&v336FirstPlayableFlowScope();
 _v21_finishRun(victory,reason);
 if(firstPlayable&&typeof v336PresentRunTransition==='function'&&v336PresentRunTransition(victory,reason)){victory?V21Audio.win():V21Audio.lose();return}
 const e=document.getElementById('endCinematic');e.classList.remove('flow-slice-active');e.dataset.outcome='pending';e.classList.toggle('defeat',!victory);
 document.getElementById('endSealIcon').textContent=victory?'胜':'败';
 document.getElementById('endEyebrow').textContent=victory?'RIFT SEALED':'RIFT COLLAPSED';
 document.getElementById('endTitle').textContent=victory?'万界裂隙已封印':'本次讨伐失败';
 document.getElementById('endText').textContent=victory?'永久奖励、章节星与掉落已经写入当前存档。':'调整Build、装备或难度后再次挑战。';
 e.classList.add('show');victory?V21Audio.win():V21Audio.lose();
 setTimeout(()=>e.classList.remove('show'),1450)
};

/* ---------- settings and boot ---------- */
const _v21_renderGlobalSettings=renderGlobalSettings;
renderGlobalSettings=function(){_v21_renderGlobalSettings();renderV21AudioSettings()}
const _v21_v20Boot=v20Boot;
v20Boot=function(){_v21_v20Boot();renderV21AudioSettings()}
window.addEventListener('pointerdown',()=>V21Audio.ensure(),{once:true});

/* title-screen copy polish */
const chip=document.querySelector('.versionChip');if(chip)chip.textContent='三界十二关 · 七大挑战模式';
