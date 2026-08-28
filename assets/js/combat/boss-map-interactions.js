/* ================= V2.5 BOSS MECHANICS & MAP INTERACTIONS ================= */
window.WW.config.bossInteractions=window.WW.config.bossInteractions||{};
window.WW.config.bossInteractions.bosses={
 B001:{name:'黄巾巨将',phase:['巨斧压境','蛮王狂怒','震岳绝境'],shield:0,shrink:false,skills:[['circle','震地斩'],['line','蛮王冲锋'],['cone','旋风断军']]},
 B002:{name:'乱世妖师',phase:['妖火祭阵','唤魂护法','万符焚界'],shield:.22,shrink:false,skills:[['multiCircle','妖火祭阵'],['summon','妖兵唤魂'],['ring','万符焚界']]},
 B003:{name:'混沌骑将',phase:['铁骑冲阵','下马枪阵','混沌狂战'],shield:0,shrink:true,skills:[['line','混沌突骑'],['cone','枪阵封路'],['circle','狂战震地']]},
 B006:{name:'牛魔妖王',phase:['裂地重锤','岩甲霸体','山崩绝杀'],shield:.18,shrink:true,skills:[['cone','裂地重锤'],['multiCircle','山崩岩爆'],['ring','大地震荡']]},
 B008:{name:'混世魔猿',phase:['魔猿跃击','棍影分身','斗战狂潮'],shield:0,shrink:false,skills:[['circle','魔猿跃击'],['summon','棍影分身'],['multiCircle','狂暴连砸']]},
 B009:{name:'炎狱忍王',phase:['炎遁封路','爆符炼狱','炎界收缩'],shield:0,shrink:true,skills:[['line','炎墙封界'],['multiCircle','爆符天雨'],['ring','炎狱禁界']]},
 B010:{name:'雷瞬忍王',phase:['雷瞬突袭','雷牢护体','天雷审判'],shield:.17,shrink:false,skills:[['line','雷瞬绝杀'],['ring','雷牢封域'],['multiCircle','天雷审判']]},
 B011:{name:'万影忍王',phase:['万影初现','影盾分身','影界处刑'],shield:.24,shrink:true,skills:[['summon','万影分身'],['cone','暗影扇刃'],['circle','影界处刑']]}
};
window.WW.config.bossInteractions.interactionNames={
 ST001:{barrel:'火药桶',heal:'军医补给',altar:'战旗祭坛',mechanism:'弩炮机关',supply:'遗失军箱'},
 ST003:{barrel:'妖火石',heal:'灵桃',altar:'斗战祭坛',mechanism:'镇妖石阵',supply:'猴王宝箱'},
 ST004:{barrel:'爆符桶',heal:'医疗卷轴',altar:'忍印祭坛',mechanism:'雷符机关',supply:'忍具补给'}
};
window.WW.config.bossInteractions.interactionDescriptions={
 barrel:'引爆后对周围怪物与Boss造成巨额伤害。',
 heal:'恢复35%最大生命。',
 altar:'最大生命-10%，本局攻击+22%。',
 mechanism:'清除当前地图危险，并压制地图机制25秒。',
 supply:'获得本局额外金币，并补充大量经验。'
};
function v25Ensure(){
 if(!run?.active)return null;
 if(!run.v25){
   run.v25={telegraphs:[],interactables:[],used:0,bonusGold:0,hazardSuppress:0,safe:null,bossPhaseMax:1,bossTransitions:0};
   v338ClearFirstBossCast();
   v25SpawnInteractables();v25RenderInteractLegend()
 }
 return run.v25
}
function v25SpawnInteractables(){
 if(!run?.v25)return;
 const map=selectedStageInfo().chapter,names=WW.config.bossInteractions.interactionNames[map]||WW.config.bossInteractions.interactionNames.ST001;
 const layout=[
   ['barrel',.19,.28],['heal',.79,.25],['altar',.22,.73],['mechanism',.76,.70],['supply',.51,.82],['barrel',.55,.25]
 ];
 run.v25.interactables=layout.map(([type,px,py],i)=>({id:'I'+i,type,name:names[type],x:WORLD_W*px,y:WORLD_H*py,used:false,pulse:Math.random()*6.28}))
}
function v25RenderInteractLegend(){
 const g=document.getElementById('v25InteractLegend');if(!g)return;
 const map=selectedStageInfo().chapter,n=WW.config.bossInteractions.interactionNames[map]||WW.config.bossInteractions.interactionNames.ST001;
 g.innerHTML=['barrel','heal','altar','mechanism','supply'].map(type=>'<div class="mapInteractItem"><b>'+n[type]+'</b><small>'+WW.config.bossInteractions.interactionDescriptions[type]+'</small></div>').join('')
}
function v25NearestInteract(){
 const v=v25Ensure();if(!v)return null;let best=null,bd=99999;
 for(const x of v.interactables){if(x.used)continue;let d=Math.hypot(player.x-x.x,player.y-x.y);if(d<bd){best=x;bd=d}}
 return best&&bd<=74?best:null
}
function v25UseInteractable(){
 if(!run?.active||run.paused)return;const v=v25Ensure(),it=v25NearestInteract();if(!it){hint('附近没有可交互物');return}
 it.used=true;v.used++;recordBattleOnboarding('interact');V21Audio.chest();const D=player.atk;
 if(it.type==='barrel'){
   effects.push({type:'ring',x:it.x,y:it.y,r:8,life:.38,max:.38,color:'#ef7958',maxr:165});
   enemies.slice().forEach(e=>{if(Math.hypot(e.x-it.x,e.y-it.y)<165)damageEnemy(e,D*7.5,true,'MAP_BARREL')});
   if(run.boss&&Math.hypot(run.boss.x-it.x,run.boss.y-it.y)<205)damageBoss(D*9.5,'MAP_BARREL');
   hint(it.name+' · 引爆');shake(9)
 }else if(it.type==='heal'){
   player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.35);hint(it.name+' · 恢复生命')
 }else if(it.type==='altar'){
   player.maxHp*=.90;player.hp=Math.min(player.hp,player.maxHp);player.atk*=1.22;hint(it.name+' · 攻击强化')
 }else if(it.type==='mechanism'){
   v.hazardSuppress=25;run.mapHazards=[];traps.splice(0,traps.length);
   enemies.slice().sort((a,b)=>(b.elite?1:0)-(a.elite?1:0)).slice(0,10).forEach(e=>damageEnemy(e,D*2.1,false,'MAP_MECHANISM'));
   if(run.boss)damageBoss(D*4.0,'MAP_MECHANISM');hint(it.name+' · 地图机制压制25秒')
 }else if(it.type==='supply'){
   v.bonusGold+=180;run.xp+=Math.ceil(run.xpNeed*.75);checkLevel();hint(it.name+' · 经验与战利金')
 }
 log('地图交互：'+it.name);v25UpdateInteractUI()
}
window.addEventListener('keydown',e=>{if(!v32InteractiveKeyTarget(e.target)&&e.key.toLowerCase()==='f')performBattleAction('interact',v25UseInteractable)});

/* map mechanism suppression */
const _v25_oldMapMechanic=updateMapMechanic;
updateMapMechanic=function(dt){
 const v=v25Ensure();
 if(v&&v.hazardSuppress>0){v.hazardSuppress=Math.max(0,v.hazardSuppress-dt);run.mapHazards=[];run.fog=0;return}
 _v25_oldMapMechanic(dt)
};

/* ---------- telegraph primitives ---------- */
function v25AddTelegraph(o){
 const v=v25Ensure();if(!v)return;v.telegraphs.push(Object.assign({life:.85,max:.85,color:'#ef5d58',damage:18,resolved:false},o))
}
function v25PointLineDistance(px,py,x1,y1,x2,y2){
 const vx=x2-x1,vy=y2-y1,l2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((px-x1)*vx+(py-y1)*vy)/l2));
 return Math.hypot(px-(x1+t*vx),py-(y1+t*vy))
}
function v25Resolve(t){
 if(t.resolved)return;t.resolved=true;let hit=false;
 if(t.type==='circle')hit=Math.hypot(player.x-t.x,player.y-t.y)<=t.r;
 else if(t.type==='line')hit=v25PointLineDistance(player.x,player.y,t.x,t.y,t.x2,t.y2)<=t.width/2;
 else if(t.type==='cone'){
   let dx=player.x-t.x,dy=player.y-t.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),dd=Math.abs(Math.atan2(Math.sin(a-t.angle),Math.cos(a-t.angle)));hit=d<=t.range&&dd<=t.arc/2
 }else if(t.type==='ring'){let d=Math.hypot(player.x-t.x,player.y-t.y);hit=d>=t.inner&&d<=t.outer}
 if(hit)hurtPlayer(t.damage*(typeof v19Difficulty==='function'?v19Difficulty().dmg:1));
 if(t.moveBoss&&run.boss){run.boss.x=Math.max(45,Math.min(WORLD_W-45,t.x2));run.boss.y=Math.max(45,Math.min(WORLD_H-45,t.y2))}
 effects.push({type:'ring',x:t.type==='line'?t.x2:t.x,y:t.type==='line'?t.y2:t.y,r:8,life:.22,max:.22,color:t.color,maxr:t.type==='circle'?t.r:70})
}
function v25Circle(name,x,y,r,damage,delay=.9,color='#ef5d58',cue=''){v25ShowCast(name,cue);v25AddTelegraph({type:'circle',name,x,y,r,damage,life:delay,max:delay,color})}
function v25Line(name,b,width,range,damage,delay=.75,color='#ef5d58',moveBoss=false,cue=''){
 let a=Math.atan2(player.y-b.y,player.x-b.x),x2=b.x+Math.cos(a)*range,y2=b.y+Math.sin(a)*range;
 v25ShowCast(name,cue);v25AddTelegraph({type:'line',name,x:b.x,y:b.y,x2,y2,width,damage,life:delay,max:delay,color,moveBoss})
}
function v25Cone(name,b,range,arc,damage,delay=.82,color='#ef5d58',cue=''){
 let a=Math.atan2(player.y-b.y,player.x-b.x);v25ShowCast(name,cue);v25AddTelegraph({type:'cone',name,x:b.x,y:b.y,range,arc,angle:a,damage,life:delay,max:delay,color})
}
function v25Ring(name,x,y,inner,outer,damage,delay=1.0,color='#ef5d58'){v25ShowCast(name);v25AddTelegraph({type:'ring',name,x,y,inner,outer,damage,life:delay,max:delay,color})}
function v25MultiCircle(name,count,r,damage,delay=.9,color='#ef5d58'){
 v25ShowCast(name);for(let i=0;i<count;i++){let x=player.x+(Math.random()-.5)*230,y=player.y+(Math.random()-.5)*190;v25AddTelegraph({type:'circle',name,x,y,r,damage,life:delay+i*.08,max:delay+i*.08,color})}
}
function v25ShowCast(name,cue=''){const message=[name,cue].filter(Boolean).join(' · ');if(typeof v21ShowBossCast==='function')v21ShowBossCast(message);if(run.boss)run.boss.v25Next=message}

function v337FirstCampaignTelegraph(type,delay){
 if(run?.v29?.rule?.firstCampaign===true&&run?.boss?.id==='B001'&&Number.isFinite(run.v29.rule.telegraphScale)){
   const cues={circle:'离开红圈',line:'横向闪避',cone:'绕至侧后'};
   return{delay:delay*run.v29.rule.telegraphScale,cue:cues[type]||''}
 }
 return{delay,cue:''}
}

function v338FirstBossGuideTarget(){
 if(run?.v29?.rule?.firstCampaign!==true||run?.boss?.id!=='B001')return null;
 const items=run?.v25?.interactables;if(!Array.isArray(items))return null;
 const barrelReady=items.find(item=>!item.used&&item.type==='barrel'&&Math.hypot(run.boss.x-item.x,run.boss.y-item.y)<205);
 const mechanism=items.find(item=>!item.used&&item.type==='mechanism');
 const barrel=items.find(item=>!item.used&&item.type==='barrel');
 return barrelReady||mechanism||barrel||null
}
function v338FirstBossGuideDirection(item){
 const dx=item.x-player.x,dy=item.y-player.y,angle=Math.atan2(dy,dx),step=Math.round(angle/(Math.PI/4)),directions=['右','右下','下','左下','左','左上','上','右上'];
 return directions[(step+8)%8]
}
function v338ClearFirstBossCast(){
 if(run?.v29?.rule?.firstCampaign!==true)return false;
 const banner=document.getElementById('bossCastBanner');if(!banner)return false;
 banner.classList.remove('show');banner.textContent='';
 if(typeof v21ShowBossCast==='function'){clearTimeout(v21ShowBossCast.t);v21ShowBossCast.t=null}
 return true
}

/* ---------- Boss lifecycle ---------- */
function v25PhaseFor(b){let r=b.hp/Math.max(1,b.maxHp);return r<=.35?3:r<=.70?2:1}
function v25PhaseCinematic(b,phase){
 const cfg=WW.config.bossInteractions.bosses[b.id],el=document.getElementById('phaseCinematic');if(!el)return;
 document.getElementById('phaseNum').textContent='PHASE '+phase;
 document.getElementById('phaseTitle').textContent=cfg.phase[phase-1];
 document.getElementById('phaseDesc').textContent=phase===2?'Boss机制升级，注意新的攻击模式。':'终局阶段：首领狂暴，场地规则可能改变。';
 el.classList.add('show');clearTimeout(v25PhaseCinematic.t);v25PhaseCinematic.t=setTimeout(()=>el.classList.remove('show'),1050)
}
function v25BeginShrink(targetRatio=.34){
 const v=v25Ensure();if(!v)return;let maxR=Math.min(AW,AH)*.47;
 v.safe={x:run.boss?.x||player.x,y:run.boss?.y||player.y,r:v.safe?.r||maxR,target:Math.min(AW,AH)*targetRatio,active:true}
}
function v25PhaseTransition(b,phase){
 const cfg=WW.config.bossInteractions.bosses[b.id];b.v25Phase=phase;b.phase=phase;b.v25CastCd=1.2;b.castLock=1.05;run.v25.bossPhaseMax=Math.max(run.v25.bossPhaseMax,phase);run.v25.bossTransitions++;
 v25PhaseCinematic(b,phase);V21Audio.boss();shake(10);
 if(phase===2&&cfg.shield>0){b.shieldMax=b.maxHp*cfg.shield;b.shield=b.shieldMax;for(let i=0;i<2+(b.id==='B011'?2:0);i++)spawnEnemy({elite:i===0})}
 if(phase===3){for(let i=0;i<3;i++)spawnEnemy({elite:i===0});if(cfg.shrink)v25BeginShrink(b.id==='B011'?.29:.33)}
}
const _v25_oldSpawnBoss=spawnBoss;
spawnBoss=function(){
 if(run?.bossDefeated)return;
 _v25_oldSpawnBoss();
 if(run.boss){
   const b=run.boss;b.v25Phase=1;b.phase=1;b.v25CastCd=1.7;b.castLock=.7;b.shield=0;b.shieldMax=0;b.v25SkillIndex=0;b.v25Next='准备攻击';
   const cfg=WW.config.bossInteractions.bosses[b.id];if(cfg)v25PhaseCinematic(b,1);v25UpdateBossUI()
 }
};

/* shield-aware damage + fixes repeated Boss respawn */
const _v25_oldDamageBoss=damageBoss;
damageBoss=function(dmg,source='AUTO'){
 if(!run.boss)return;const b=run.boss;
 if(b.shield>0){
   const applied=Math.min(b.shield,dmg);b.shield-=dmg;recordDamage(source,applied);
   if(save.settings.numbers)numbers.push({x:b.x,y:b.y-52,text:'盾 '+Math.round(applied),life:.55,max:.55,color:'#9fd8ff',size:13});
   if(b.shield<=0){b.shield=0;hint('Boss护盾已击破');shake(7);V21Audio.crit()}
   v25UpdateBossUI();return
 }
 const beforeId=b.id;_v25_oldDamageBoss(dmg,source);
 if(!run.boss&&beforeId){run.bossDefeated=true;run.v25&&(run.v25.bossKilled=true)}
};

/* full V2.5 boss AI: all damaging skills are telegraphed before resolving */
bossAI=function(dt){
 const b=run.boss;if(!b)return;const cfg=WW.config.bossInteractions.bosses[b.id]||WW.config.bossInteractions.bosses.B001;
 const phase=v25PhaseFor(b);if(phase>b.v25Phase)v25PhaseTransition(b,phase);
 b.castLock=Math.max(0,(b.castLock||0)-dt);b.v25CastCd=(b.v25CastCd||0)-dt;
 let dx=player.x-b.x,dy=player.y-b.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;
 if(b.castLock<=0&&d>155){let sp=(38+b.v25Phase*7)*(typeof v19Difficulty==='function'?v19Difficulty().speed:1);b.x+=nx*sp*dt;b.y+=ny*sp*dt}
 if(d<b.r+player.r+4&&player.inv<=0)hurtPlayer((11+b.v25Phase*3)*(typeof v19Difficulty==='function'?v19Difficulty().dmg:1));
 if(b.v25CastCd<=0&&b.castLock<=0){
   b.v25SkillIndex=(b.v25SkillIndex+1)%3;let skill=cfg.skills[(b.v25SkillIndex+b.v25Phase-1)%cfg.skills.length],type=skill[0],name=skill[1];
   let base=13+b.v25Phase*4,delay=Math.max(.55,.95-b.v25Phase*.08);
   let warning=v337FirstCampaignTelegraph(type,delay);delay=warning.delay;
   if(type==='circle')v25Circle(name,player.x,player.y,b.v25Phase===3?86:70,base*1.25,delay,'#ef5d58',warning.cue);
   else if(type==='line')v25Line(name,b,b.v25Phase===3?54:44,Math.max(AW,AH)*.92,base*1.15,delay,b.id==='B010'?'#70a9ff':'#ef5d58',true,warning.cue);
   else if(type==='cone')v25Cone(name,b,230+b.v25Phase*25,Math.PI*(b.v25Phase===3?.72:.55),base*1.22,delay,'#ef5d58',warning.cue);
   else if(type==='ring')v25Ring(name,b.x,b.y,60+b.v25Phase*8,165+b.v25Phase*18,base*1.18,delay,b.id==='B010'?'#70a9ff':'#ef5d58');
   else if(type==='multiCircle')v25MultiCircle(name,3+b.v25Phase*2,b.v25Phase===3?46:39,base,delay,b.id==='B010'?'#70a9ff':'#ef5d58');
   else if(type==='summon'){
     v25ShowCast(name);for(let i=0;i<2+b.v25Phase;i++)spawnEnemy({id:b.id==='B008'?'EN014':b.id==='B011'?'EN025':undefined,elite:i===0&&b.v25Phase>=2})
   }
   b.castLock=delay+.12;b.v25CastCd=Math.max(.9,(3.0-b.v25Phase*.38)/(typeof v19Difficulty==='function'?v19Difficulty().speed:1))
 }
 v25UpdateBossUI()
};

/* ---------- update/draw telegraphs, safe zone, interactions ---------- */
function v25Update(dt){
 const v=v25Ensure();if(!v)return;
 if(!run.boss)v338ClearFirstBossCast();
 for(let i=v.telegraphs.length-1;i>=0;i--){let t=v.telegraphs[i];t.life-=dt;if(t.life<=0){v25Resolve(t);v.telegraphs.splice(i,1)}}
 if(v.safe?.active){
   v.safe.r+=(v.safe.target-v.safe.r)*Math.min(1,dt*.45);
   if(Math.hypot(player.x-v.safe.x,player.y-v.safe.y)>v.safe.r&&player.inv<=0)hurtPlayer(9*dt*(typeof v19Difficulty==='function'?v19Difficulty().dmg:1))
 }
 for(const x of v.interactables)x.pulse+=dt*2;
 v25UpdateInteractUI();v25UpdateBossUI()
}
function v25UpdateInteractUI(){
 const v=run?.v25;if(!v)return;const near=v25NearestInteract(),guide=near?null:v338FirstBossGuideTarget(),p=document.getElementById('interactPrompt'),text=document.getElementById('interactPromptText');
 if(p){p.classList.toggle('show',!!near||!!guide);p.classList.toggle('bossGuide',!!guide&&!near);if(text){if(near)text.textContent=near.name+' · '+WW.config.bossInteractions.interactionDescriptions[near.type];else if(guide)text.textContent='BOSS对策 · '+v338FirstBossGuideDirection(guide)+'方 '+guide.name+' · 靠近按 F'}}
 const rem=v.interactables.filter(x=>!x.used).length,er=document.getElementById('v25InteractRemain'),eu=document.getElementById('v25InteractUsed');if(er)er.textContent=rem;if(eu)eu.textContent=v.used
}
function v25UpdateBossUI(){
 const box=document.getElementById('v25BossMechanics');if(!box)return;
 const b=run?.boss;
 if(!b){box.innerHTML=run?.bossDefeated?'<div class="bossMechRow"><span>状态</span><b>Boss已击败</b></div>':'<div class="tiny">Boss尚未登场。</div>';return}
 const cfg=WW.config.bossInteractions.bosses[b.id],phase=b.v25Phase||1,shieldPct=b.shieldMax?Math.round(b.shield/b.shieldMax*100):0,safe=run.v25?.safe;
 box.innerHTML='<div class="bossMechRow"><span>阶段</span><b>P'+phase+' · '+cfg.phase[phase-1]+'</b></div>'+
 '<div class="bossMechRow"><span>护盾</span><b>'+(b.shield>0?shieldPct+'%':'无')+'</b></div>'+
 '<div class="bossMechRow"><span>下一技能</span><b>'+(b.v25Next||'观察中')+'</b></div>'+
 '<div class="bossMechRow"><span>场地</span><b>'+(safe?.active?'缩圈 '+Math.round(safe.r)+'px':'正常')+'</b></div>'+
 '<div class="bossMechSkill">'+cfg.skills.map(x=>'<i>'+x[1]+'</i>').join('')+'</div>';
 const sh=document.getElementById('bossShieldTrack'),sf=document.getElementById('bossShieldFill');if(sh)sh.classList.toggle('show',b.shield>0);if(sf)sf.style.width=(b.shieldMax?Math.max(0,b.shield/b.shieldMax*100):0)+'%';
 [1,2,3].forEach(i=>{let e=document.getElementById('bossPhase'+i);if(e)e.classList.toggle('on',i<=phase)})
}
function v25DrawTelegraph(t){
 let p=Math.max(0,t.life/t.max),pulse=.72+.28*Math.sin(performance.now()/75);ctx.save();ctx.globalAlpha=.10+.14*(1-p);ctx.fillStyle=t.color;ctx.strokeStyle='#ffb2a0';ctx.lineWidth=2;
 if(t.type==='circle'){ctx.beginPath();ctx.arc(t.x,t.y,t.r*pulse,0,6.28);ctx.fill();ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,6.28);ctx.stroke()}
 else if(t.type==='line'){ctx.lineCap='round';ctx.lineWidth=t.width;ctx.globalAlpha=.12;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.strokeStyle=t.color;ctx.stroke();ctx.globalAlpha=.85;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x2,t.y2);ctx.strokeStyle='#ffb2a0';ctx.stroke()}
 else if(t.type==='cone'){ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.arc(t.x,t.y,t.range,t.angle-t.arc/2,t.angle+t.arc/2);ctx.closePath();ctx.fill();ctx.globalAlpha=.8;ctx.stroke()}
 else if(t.type==='ring'){ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(t.x,t.y,t.outer,0,6.28);ctx.arc(t.x,t.y,t.inner,0,6.28,true);ctx.fill('evenodd');ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(t.x,t.y,t.outer,0,6.28);ctx.stroke();ctx.beginPath();ctx.arc(t.x,t.y,t.inner,0,6.28);ctx.stroke()}
 ctx.restore()
}
function v25DrawInteractable(x,bossGuide=false){
 if(x.used)return;const color={barrel:'#ef7958',heal:'#64d59f',altar:'#f3c66c',mechanism:'#70a9ff',supply:'#a47dff'}[x.type],bob=Math.sin(x.pulse)*2;
 ctx.save();ctx.translate(x.x,x.y+bob);ctx.shadowBlur=14;ctx.shadowColor=color;ctx.fillStyle=color;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.3;
 if(x.type==='barrel'){ctx.fillRect(-9,-12,18,24);ctx.strokeRect(-9,-12,18,24);ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(9,-5);ctx.moveTo(-9,5);ctx.lineTo(9,5);ctx.stroke()}
 else if(x.type==='heal'){ctx.fillRect(-4,-13,8,26);ctx.fillRect(-13,-4,26,8)}
 else if(x.type==='altar'){ctx.rotate(Math.PI/4);ctx.fillRect(-10,-10,20,20)}
 else if(x.type==='mechanism'){ctx.fillRect(-12,-12,24,24);ctx.fillStyle='#172230';ctx.beginPath();ctx.arc(0,0,6,0,6.28);ctx.fill()}
 else {ctx.fillRect(-13,-8,26,17);ctx.fillStyle='#f3c66c';ctx.fillRect(-2,-8,4,17)}
 ctx.restore();
 if(bossGuide){const pulse=24+Math.sin(performance.now()/120)*3;ctx.save();ctx.strokeStyle='#ffd36f';ctx.fillStyle='#fff0bd';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(x.x,x.y,pulse,0,6.28);ctx.stroke();ctx.setLineDash([]);ctx.font='700 9px Inter';ctx.textAlign='center';ctx.fillText('BOSS对策 · F',x.x,x.y-31);ctx.restore()}
 if(Math.hypot(player.x-x.x,player.y-x.y)<125){ctx.save();ctx.font='700 7px Inter';ctx.textAlign='center';ctx.fillStyle='#dce4ec';ctx.fillText(x.name,x.x,x.y-22);ctx.restore()}
}
function v25Draw(){
 const v=run?.v25;if(!run?.active||!v)return;ctx.save();
 if(v.safe?.active){ctx.fillStyle='rgba(126,22,31,.14)';ctx.beginPath();ctx.rect(0,0,WORLD_W,WORLD_H);ctx.arc(v.safe.x,v.safe.y,v.safe.r,0,6.28,true);ctx.fill('evenodd');ctx.strokeStyle='rgba(239,105,78,.65)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(v.safe.x,v.safe.y,v.safe.r,0,6.28);ctx.stroke()}
 v.telegraphs.forEach(v25DrawTelegraph);const guide=v338FirstBossGuideTarget();v.interactables.forEach(x=>v25DrawInteractable(x,x===guide));ctx.restore()
}
const _v25_oldDraw=drawRun;drawRun=function(){_v25_oldDraw();v25Draw()};
const _v25_oldUpdate=updateRun;updateRun=function(dt){_v25_oldUpdate(dt);v25Update(dt)};

/* ---------- world preview ---------- */
function v25RenderWorldBossPreview(){
 const el=document.getElementById('v25WorldBossPreview');if(!el)return;const stageId=selectedStageInfo().stage[0],contract=storyStageContract(stageId),encounter=storyStageEncounter(stageId),ids=contract?.bosses||[],encounterCopy='<p>'+encounter.name+' · '+encounter.hazard.name+'：'+encounter.hazard.desc+'</p><div class="phases"><div>事件 '+encounter.eventAt.map(fmt).join(' / ')+' · 宝箱 '+encounter.chestAt.map(fmt).join(' / ')+'</div></div>';
 if(!ids.length){el.innerHTML='<div class="eyebrow">SURVIVAL ROUTE</div><h4>普通关卡 · '+encounter.name+'</h4><p>'+contract.objective+' · '+fmt(contract.duration)+'内不会生成剧情Boss。</p>'+encounterCopy;return}
 const configs=ids.map(id=>[id,WW.config.bossInteractions.bosses[id]]).filter(([,cfg])=>cfg);el.innerHTML='<div class="eyebrow">'+ids.join(' → ')+' BOSS ROUTE</div><h4>'+configs.map(([,cfg])=>cfg.name).join(' → ')+'</h4><p>'+contract.objective+'</p>'+encounterCopy+'<div class="phases">'+configs.map(([id,cfg])=>'<div>'+id+' · '+cfg.phase.join(' / ')+(cfg.shield>0?' · 护盾阶段':'')+(cfg.shrink?' · 场地缩圈':'')+'</div>').join('')+'</div>'
}
const _v25_oldStageList=renderStageList;renderStageList=function(){_v25_oldStageList();v25RenderWorldBossPreview()};

/* ---------- settlement additions ---------- */
const _v25_oldFinish=finishRun;
finishRun=function(victory,reason){
 if(!run?.active)return;const used=run.v25?.used||0,bonus=run.v25?.bonusGold||0,phases=run.v25?.bossPhaseMax||1;
 v338ClearFirstBossCast();
 _v25_oldFinish(victory,reason);
 if(lastResult){lastResult.interactionsUsed=used;lastResult.bonusGold=bonus;lastResult.bossPhaseMax=phases;if(bonus){save.gold+=bonus;lastResult.gold+=bonus;localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(typeof snapshotActiveSlot==='function')snapshotActiveSlot()}renderResult()}
};
const _v25_oldResult=renderResult;
renderResult=function(){
 _v25_oldResult();if(!lastResult)return;const rows=document.getElementById('resultRows'),showBossPhase=!lastResult.storyReward||(storyStageContract(lastResult.stage?.[0])?.bosses.length||0)>0;if(rows)rows.innerHTML+='<div class="resultRow"><span>地图交互</span><b>'+((lastResult.interactionsUsed||0))+' 次</b></div>'+(showBossPhase?'<div class="resultRow"><span>Boss最高阶段</span><b>P'+(lastResult.bossPhaseMax||1)+'</b></div>':'')+'<div class="resultRow"><span>场地额外金币</span><b>+'+(lastResult.bonusGold||0)+'</b></div>';
 const rg=document.getElementById('resGold');if(rg)rg.textContent='+'+lastResult.gold
};

/* damage report labels */
window.WW.config.bossInteractions.damageNames={MAP_BARREL:'地图炸药桶',MAP_MECHANISM:'地图机关'};
const _v25_oldSkillName=skillName;skillName=function(id){return WW.config.bossInteractions.damageNames[id]||_v25_oldSkillName(id)};

/* initialize once delayed V2.4 loading actually enters combat */
const _v25_oldRunSide=renderRunSide;renderRunSide=function(){_v25_oldRunSide();v25Ensure();v25UpdateBossUI();v25UpdateInteractUI()};
const _v25_oldBoot=v20Boot;v20Boot=function(){_v25_oldBoot();v25RenderWorldBossPreview()}
