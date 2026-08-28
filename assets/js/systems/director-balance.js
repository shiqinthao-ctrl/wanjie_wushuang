/* ================= V1.9 DIRECTOR & BALANCE LAYER ================= */
const V19_DIFFICULTIES = {
  easy:     {name:'休闲', hp:0.82, dmg:0.78, speed:0.94, budget:0.82, elite:0.65, gold:0.90, drop:0.90, xp:1.08, desc:'适合首次体验'},
  normal:   {name:'标准', hp:1.00, dmg:1.00, speed:1.00, budget:1.00, elite:1.00, gold:1.00, drop:1.00, xp:1.00, desc:'推荐默认难度'},
  hard:     {name:'修罗', hp:1.38, dmg:1.28, speed:1.07, budget:1.22, elite:1.45, gold:1.28, drop:1.18, xp:0.98, desc:'高密度高收益'},
  nightmare:{name:'万界劫',hp:1.85, dmg:1.58, speed:1.13, budget:1.48, elite:2.00, gold:1.60, drop:1.40, xp:0.95, desc:'终局挑战'}
};
const V19_WAVES = [
 {t:0,  id:'W01',name:'热身怪潮',type:'normal',budget:1.00,elite:0.45, note:'基础近战/远程'},
 {t:2,  id:'W02',name:'远程混编',type:'normal',budget:1.12,elite:0.60, note:'增加远程单位'},
 {t:3,  id:'W03',name:'事件窗口',type:'event', budget:0.86,elite:0.45, note:'降低压力，触发事件'},
 {t:4,  id:'W04',name:'第一波精英',type:'elite', budget:1.22,elite:1.45, note:'至少1只精英'},
 {t:5,  id:'W05',name:'宝箱节点',type:'chest', budget:0.92,elite:0.70, note:'短暂回落'},
 {t:6,  id:'W06',name:'混合推进',type:'normal',budget:1.28,elite:0.90, note:'盾/冲锋加入'},
 {t:8,  id:'W07',name:'超级怪潮Ⅰ',type:'horde', budget:1.90,elite:1.10, note:'高密度90秒'},
 {t:10, id:'W08',name:'中场压迫',type:'elite', budget:1.38,elite:1.65, note:'精英+地图机制'},
 {t:12, id:'W09',name:'区域Boss',type:'boss', budget:0.82,elite:0.35, note:'Boss登场'},
 {t:13, id:'W10',name:'事件缓冲',type:'event', budget:0.88,elite:0.55, note:'第二次资源选择'},
 {t:14, id:'W11',name:'Boss后反扑',type:'normal',budget:1.42,elite:1.15, note:'密度再次上升'},
 {t:15, id:'W12',name:'终局宝箱',type:'chest', budget:1.00,elite:0.80, note:'最后一次进化机会'},
 {t:16, id:'W13',name:'高阶混编',type:'elite', budget:1.55,elite:1.75, note:'双词缀精英概率提升'},
 {t:18, id:'W14',name:'超级怪潮Ⅱ',type:'horde', budget:2.18,elite:1.55, note:'终局压力峰值'},
 {t:19, id:'W15',name:'终局压缩',type:'boss', budget:1.38,elite:1.00, note:'清场与Boss竞速'},
 {t:20, id:'W16',name:'结算节点',type:'end', budget:0,elite:0, note:'胜负判定'}
];
if (!save.difficulty) save.difficulty = 'normal';

function v19Difficulty(){ return V19_DIFFICULTIES[save.difficulty] || V19_DIFFICULTIES.normal; }
function v19StoryEncounter(){ return run?.v29?.id==='story'?(run.v29.rule?.storyEncounter||null):null; }
function v19WavePlan(){ return v19StoryEncounter()?.waves||V19_WAVES; }
function v19WaveSecond(wave){ return Number.isFinite(wave?.at)?wave.at:(wave?.t||0)*60; }
function v19WaveKey(wave){ const plan=v19WavePlan(),index=Math.max(0,plan.indexOf(wave));return wave?.id||'SE'+String(index+1).padStart(2,'0'); }
function v19WaveAt(sec){
  const plan=v19WavePlan();
  let w=plan[0];
  for(const x of plan)if(sec>=v19WaveSecond(x))w=x;else break;
  return w;
}
function v19NextWave(sec){
  const plan=v19WavePlan();
  return plan.find(x=>v19WaveSecond(x)>sec)||plan[plan.length-1];
}
function v19Pressure(){
  if (!run || !run.active) return 0;
  const diff = v19Difficulty(), wave = v19WaveAt(run.time);
  const hpStress = 1 - Math.max(0, player.hp / Math.max(1,player.maxHp));
  const killPerf = Math.min(1.5, run.kills / Math.max(1, run.time * 0.78));
  const dpsPerf = Math.min(1.5, run.dps / Math.max(90, player.atk*1.35));
  const buildMaturity = Math.min(1, (Object.keys(run.evolved||{}).length*0.16 + Object.keys(run.fused||{}).length*0.3 + run.level/80));
  // Director eases slightly if HP is very low, pushes harder if player is over-performing.
  let p = 0.38 + wave.budget*0.23 + (killPerf-0.55)*0.18 + (dpsPerf-0.55)*0.12 + buildMaturity*0.14 - hpStress*0.24;
  p *= diff.budget;
  return Math.max(.22, Math.min(1.45, p));
}
function setDifficulty(id){
  if (!V19_DIFFICULTIES[id]) return;
  save.difficulty=id; persist(); toast('难度：'+V19_DIFFICULTIES[id].name);
}
function renderDifficulty(){
  const bar=document.getElementById('difficultyBar'); if(!bar) return;
  bar.innerHTML='';
  Object.entries(V19_DIFFICULTIES).forEach(([id,d])=>{
    const x=document.createElement('div'); x.className='diffBtn '+(save.difficulty===id?'active':'');
    x.innerHTML='<b>'+d.name+'</b><small>'+d.desc+'<br>敌HP '+d.hp.toFixed(2)+'x · 金币 '+d.gold.toFixed(2)+'x</small>';
    x.onclick=()=>setDifficulty(id); bar.appendChild(x);
  });
  const s=document.getElementById('difficultySummary'); if(s) s.textContent=v19Difficulty().name+' · 推荐战力 '+Math.round(combatPower()*({easy:.75,normal:1,hard:1.25,nightmare:1.55}[save.difficulty]||1));
}
function renderWaveTable(){
  const el=document.getElementById('waveTable'); if(!el) return;
  const plan=v19WavePlan(),active=v19WaveAt(run?.time||0),activeIndex=plan.indexOf(active);
  el.innerHTML='';
  plan.forEach((w,index)=>{
    const d=document.createElement('div');
    d.className='waveRow '+(active===w?'active ':'')+(index<activeIndex?'past':'');
    d.innerHTML='<b>'+fmt(v19WaveSecond(w))+'</b><div><strong>'+w.name+'</strong><br><small>'+w.note+'</small></div><div class="waveBadge '+(w.type==='horde'?'horde':w.type==='boss'?'boss':'')+'">'+w.type+'</div>';
    el.appendChild(d);
  });
}
function renderDirector(){
  const plan=v19WavePlan(),w=v19WaveAt(run?.time||0),n=v19NextWave(run?.time||0),p=v19Pressure(),diff=v19Difficulty(),encounter=v19StoryEncounter();
  const budget=Math.round(100*w.budget*diff.budget*p);
  const e=document.getElementById('directorWave'); if(e)e.textContent='第 '+(plan.indexOf(w)+1)+' 阶段 · '+w.name;
  const b=document.getElementById('directorBudget'); if(b)b.textContent=budget;
  const em=document.getElementById('directorElite'); if(em)em.textContent=(w.elite*diff.elite*(encounter?.elite||1)).toFixed(2)+'x';
  const pt=document.getElementById('directorPressureText'); if(pt)pt.textContent=Math.round(Math.min(1,p)*100)+'%';
  const pf=document.getElementById('directorPressure'); if(pf)pf.style.width=Math.round(Math.min(1,p)*100)+'%';
  const nx=document.getElementById('directorNext'); if(nx)nx.textContent=fmt(v19WaveSecond(n))+' '+n.name;
  renderWaveTable();
}
function v19SpawnInterval(){
  const diff=v19Difficulty(),w=v19WaveAt(run.time),p=v19Pressure();
  const base=Math.max(.11,.36-run.time/5600);
  return Math.max(.07, base/(w.budget*diff.budget*Math.max(.65,p)));
}
function v19EliteChance(){
  const diff=v19Difficulty(),w=v19WaveAt(run.time),p=v19Pressure(),encounter=v19StoryEncounter();
  return Math.min(.28,(.026+run.time/150000)*w.elite*diff.elite*(encounter?.elite||1)*(.82+p*.35));
}
function v19StatCurve(sec){
  const m=sec/60;
  return {
    hp: 1 + .07*m + .012*m*m,
    dmg:1 + .045*m + .006*m*m,
    speed:1 + Math.min(.22,.007*m)
  };
}

/* Wrap spawnEnemy so V1.9 owns enemy scaling and elite rate. */
const _v18_spawnEnemy = spawnEnemy;
spawnEnemy = function(opts={}){
  const map=selectedStageInfo().chapter,id=opts.id||weightedEnemyId(map),cfg=ENEMIES[id],a=Math.random()*Math.PI*2,d=Math.max(AW,AH)*.55+60;
  const curve=v19StatCurve(run.time),diff=v19Difficulty();
  const eliteByDirector = opts.elite || Math.random()<v19EliteChance();
  const e=clampWorldPoint({id,name:cfg.name,ai:cfg.ai,x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:10+(cfg.ai==='brute'||cfg.ai==='shield'?4:0),
    hp:cfg.hp*curve.hp*diff.hp,maxHp:cfg.hp*curve.hp*diff.hp,speed:cfg.speed*curve.speed*diff.speed,damage:cfg.damage*curve.dmg*diff.dmg,color:cfg.color,
    attack:Math.random()*2,skill:Math.random()*2,elite:false,affixes:[],flash:0},30);
  if(eliteByDirector){
    e.elite=true;e.r*=1.25;e.hp*=3.25;e.maxHp=e.hp;e.damage*=1.38;
    const affixCount=(run.time>16*60||save.difficulty==='nightmare')?2:1;
    ELITE_AFFIXES.slice().sort(()=>Math.random()-.5).slice(0,affixCount).forEach(ax=>{ax.apply(e);e.affixes.push(ax.id)});
    e.color='#d5a254';
  }
  enemies.push(e);
};

/* More meaningful gold / drop economy by difficulty + source. */
const _v18_makeGearDrop = makeGearDrop;
makeGearDrop = function(source){
  const d=_v18_makeGearDrop(source),diff=v19Difficulty();
  const bonus={elite:0.03,chest:0.08,boss:0.16,rift:0.22,gold:0.12}[source]||0;
  if(Math.random() < Math.min(.55, .10*(diff.drop-1)+bonus)){
    // Try to promote to a gold item if the pool contains one.
    const goldIds=Object.keys(WW.config.gear).filter(id=>WW.config.gear[id].rarity==='gold');
    const id=goldIds[Math.floor(Math.random()*goldIds.length)];
    if(id){d.id=id;d.name=WW.config.gear[id].name;d.rarity=WW.config.gear[id].rarity;d.score=WW.config.gear[id].score}
  }
  return d;
};

/* Wrap startBattle: director state + boss scaling + tutorial unaffected. */
const _v18_startBattle = startBattle;
startBattle = function(){
  _v18_startBattle();
  if(!run.active) return;
  run.director={lastWave:v19WaveAt(0).id,superHorde:false,bossPhaseBonus:0};
  run.incomingMul=run.incomingMul||1;
  hint('难度 '+v19Difficulty().name+' · '+v19WaveAt(0).name);
  renderDirector();
};

/* Director milestones: super hordes + mandatory elites + pacing relief. */
function v19DirectorMilestones(dt){
  const w=v19WaveAt(run.time),encounter=v19StoryEncounter(),waveKey=v19WaveKey(w);
  if(run.director && run.director.lastWave!==waveKey){
    run.director.lastWave=waveKey;
    hint(w.name);
    log('怪潮升级 → '+w.name);
    if(run.v29?.encounterEvidence)run.v29.encounterEvidence.waves.push({at:Math.floor(run.time),name:w.name,type:w.type});
    if(w.type==='elite'){for(let i=0;i<(save.difficulty==='nightmare'?2:1);i++)spawnEnemy({elite:true})}
    if(w.type==='horde'){
      run.director.superHorde=true;
      const baseBurst=save.difficulty==='easy'?10:save.difficulty==='normal'?16:save.difficulty==='hard'?23:30,burst=Math.max(1,Math.round(baseBurst*(encounter?.horde||1)));
      for(let i=0;i<burst;i++)spawnEnemy();
      shake(8); log('超级怪潮启动：额外 '+burst+' 敌人');
    } else run.director.superHorde=false;
    if(!encounter&&w.type==='boss'&&!run.boss&&selectedStageInfo().stage[2])spawnBoss();
  }
  // In final horde, inject more elites if player is clearly over-performing.
  if(w.type==='horde' && v19Pressure()>1.05 && Math.random()<dt*.20) spawnEnemy({elite:true});
}

/* Wrap updateRun by temporarily controlling old spawn accumulator behavior.
   We reproduce V1.8 update logic with Director interval replacing static interval. */
updateRun = function(dt){
 if(!run.active||run.paused)return;
 run.time+=dt;player.inv=Math.max(0,player.inv-dt);player.dodgeCd=Math.max(0,player.dodgeCd-dt);player.skillCd=Math.max(0,player.skillCd-dt);run.comboTimer-=dt;if(run.comboTimer<=0)run.combo=0;
 const moveStartX=player.x,moveStartY=player.y;const move=responsiveMovementVector(dt);if(move){const length=Math.hypot(move.x,move.y)||1;dodgeDirection={x:move.x/length,y:move.y/length};player.x+=move.x*player.speed*dt;player.y+=move.y*player.speed*dt}
 player.x=Math.max(18,Math.min(WORLD_W-18,player.x));player.y=Math.max(18,Math.min(WORLD_H-18,player.y));if(player.x!==moveStartX||player.y!==moveStartY)recordBattleOnboarding('move');
 run.spawn+=dt;const spawnInterval=v19SpawnInterval();
 while(run.spawn>spawnInterval){run.spawn-=spawnInterval;spawnEnemy()}
 const cap={easy:190,normal:250,hard:320,nightmare:380}[save.difficulty]||250;
 if(enemies.length>cap)enemies.splice(0,enemies.length-cap);
 run.attack+=dt;if(run.attack>1/Math.max(.6,player.aspd)){run.attack=0;shootAuto()}
 enemies.slice().forEach(e=>enemyAI(e,dt));bossAI(dt);updateProjectiles(dt);updateMapMechanic(dt);updateEffects(dt);
 v19DirectorMilestones(dt);
 if(!v19StoryEncounter()){
   [5,10,15].forEach((m,i)=>{if(run.time>=m*60&&!run.chests[i]){run.chests[i]=true;showChest()}});
   [3,8,13].forEach((m,i)=>{if(run.time>=m*60&&!run.events[i]){run.events[i]=true;showEvent()}});
   if(!run.boss&&run.time>=12*60&&selectedStageInfo().stage[2]&&!run.bossDefeated)spawnBoss();
 }
 if(run.riftActive&&run.eliteKills>=(run.riftEliteTarget??3)){run.riftActive=false;const d=makeGearDrop('rift');run.drops.push(d);hint('裂缝完成 · '+d.name)}
 run.dpsClock+=dt;if(run.dpsClock>=1){run.dps=Math.round(run.totalDamage-run.lastDps);run.lastDps=run.totalDamage;run.dpsClock=0}
 if(player.hp<=0){finishRun(false,'生命归零');return}
 if(run.time>=20*60&&(save.mode||'story')!=='story'){
   if(selectedStageInfo().stage[2]&&run.boss){finishRun(false,'20分钟到达但Boss仍存活');return}
   finishRun(true,'坚持20分钟并完成Boss目标');return
 }
 updateHud();renderDirector()
};

/* Boss curve + difficulty. */
const _v18_spawnBoss = spawnBoss;
spawnBoss = function(){
 const si=selectedStageInfo(),id=si.stage[4],cfg=WW.config.boss[id],diff=v19Difficulty(),curve=v19StatCurve(run.time);
 run.boss={id,name:cfg.name,x:clampValue(player.x+AW*.28,45,WORLD_W-45),y:clampValue(player.y-AH*.16,45,WORLD_H-45),r:42,
  hp:cfg.hp*(1+WW.config.stage[si.chapter].stages.indexOf(si.stage)*.12)*diff.hp*(.85+curve.hp*.22),
  maxHp:1,color:cfg.color,phase:1,attack:0,skill:0,state:'idle'};
 run.boss.maxHp=run.boss.hp;
 document.getElementById('bossBar').classList.add('show');document.getElementById('bossLabel').textContent=id+' '+cfg.name+' · '+cfg.style+' · '+diff.name;
 hint('Boss登场 · '+cfg.name);log('Boss登场：'+id+' '+cfg.name);shake(10)
};

/* Reward economy tuned by difficulty and performance. */
const _v18_finishRun = finishRun;
finishRun = function(victory,reason){
 if(!run.active)return;
 const diff=v19Difficulty(), si=selectedStageInfo();
 const oldGold=save.gold, oldRuns=save.stats.runs;
 // Let original settlement handle persistence and result object.
 _v18_finishRun(victory,reason);
 if(lastResult && save.stats.runs>oldRuns){
   const base=lastResult.gold;
   const perf=Math.min(1.35,.85 + (lastResult.maxCombo||0)/300 + (lastResult.eliteKills||0)*.015);
   const tuned=Math.round(base*diff.gold*perf);
   save.gold += tuned-base;
   lastResult.gold=tuned;
   lastResult.directorGoldDelta=tuned-base;
   lastResult.difficulty=diff.name;
   lastResult.directorScore=Math.round((run.maxCombo||0)*1.2+(run.eliteKills||0)*65+(run.kills||0)*.18);
   localStorage.setItem(SAVE_KEY,JSON.stringify(save));
   renderAll();renderResult()
 }
};

/* Extend result with director data after original renderer. */
const _v18_renderResult = renderResult;
renderResult = function(){
 _v18_renderResult();
 if(!lastResult)return;
 const rows=document.getElementById('resultRows');
 if(rows){
   rows.innerHTML += '<div class="resultRow"><span>难度</span><b>'+(lastResult.difficulty||v19Difficulty().name)+'</b></div>'+
   '<div class="resultRow"><span>难度/表现金币</span><b>'+((lastResult.directorGoldDelta||0)>=0?'+':'')+(lastResult.directorGoldDelta||0)+'</b></div>'+
   '<div class="resultRow"><span>战斗评分</span><b>'+(lastResult.directorScore||0)+'</b></div>';
 }
 const resGold=document.getElementById('resGold');if(resGold)resGold.textContent='+'+lastResult.gold;
};

/* Extend world/home rendering. */
const _v18_renderWorld = renderWorld;
renderWorld=function(){_v18_renderWorld();renderDifficulty()};
const _v18_renderTop = renderTop;
renderTop=function(){_v18_renderTop(); const p=document.getElementById('topPower'); if(p)p.title='当前难度：'+v19Difficulty().name};

/* Home V1.9 balance snapshot */
const homeFeatureGrid = document.querySelector('#home .featureGrid');
if(homeFeatureGrid){
  homeFeatureGrid.innerHTML =
  '<div class="card feature"><div class="featureIcon">势</div><h4>动态战场态势</h4><p>怪潮会根据战斗时间、生命状态、击杀效率与构筑强度改变攻势。</p></div>'+
  '<div class="card feature"><div class="featureIcon">浪</div><h4>渐进怪潮</h4><p>热身、事件、精英、宝箱、首领与超级怪潮构成完整战斗节奏。</p></div>'+
  '<div class="card feature"><div class="featureIcon">难</div><h4>4档难度</h4><p>休闲 / 标准 / 修罗 / 万界劫，同时改变敌方属性、精英密度与收益。</p></div>'+
  '<div class="card feature"><div class="featureIcon">衡</div><h4>收益平衡</h4><p>难度、表现、精英与Boss共同影响金币与高品质装备掉落。</p></div>';
}

/* Initialize. */
renderAll(); renderDifficulty(); renderWaveTable(); renderDirector();
