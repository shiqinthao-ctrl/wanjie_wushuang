/* ================= V2.2 ART UI & CINEMATICS ================= */
const V22_ASSET_MANIFEST={
 hero:{
  H001:{portrait:'assets/heroes/H001_portrait.webp',sheet:'assets/heroes/H001_sheet.webp',element:'fire'},
  H002:{portrait:'assets/heroes/H002_portrait.webp',sheet:'assets/heroes/H002_sheet.webp',element:'lightning'},
  H007:{portrait:'assets/heroes/H007_portrait.webp',sheet:'assets/heroes/H007_sheet.webp',element:'physical'},
  H010:{portrait:'assets/heroes/H010_portrait.webp',sheet:'assets/heroes/H010_sheet.webp',element:'fire'},
  H012:{portrait:'assets/heroes/H012_portrait.webp',sheet:'assets/heroes/H012_sheet.webp',element:'shadow'},
  H019:{portrait:'assets/heroes/H019_portrait.webp',sheet:'assets/heroes/H019_sheet.webp',element:'ki'}
 },
 bosses:Object.fromEntries(Object.keys(WW.config.boss).map(id=>[id,{portrait:'assets/bosses/'+id+'_portrait.webp',sheet:'assets/bosses/'+id+'_sheet.webp'}])),
 skills:{base:'assets/skills/{ID}.webp'},
 maps:{ST001:'assets/maps/ST001_thumb.webp',ST003:'assets/maps/ST003_thumb.webp',ST004:'assets/maps/ST004_thumb.webp'}
};
function v22Element(id){
 if(id.startsWith('P'))return'passive';
 if(['A011','A021','A027','A003','A042','A054','A019','S002','A063'].includes(id))return'fire';
 if(['A002','A013','A022','A041','A051','A062','S003'].includes(id))return'lightning';
 if(['A026','A045'].includes(id))return'wind';
 if(['A015','A053','A070','A072','A073','S001','A007'].includes(id))return'shadow';
 if(['A014','A030','A049','A060','A068','S018'].includes(id))return'ki';
 return'physical'
}
function v22SkillIconHTML(id,cls=''){
 const t=(id?.startsWith('E')||id?.startsWith('SE'))?'evo':id?.startsWith('F')?'fusion':v22Element(id);
 return '<div class="skillArtIcon '+t+' '+cls+'"><span>'+glyph(id)+'</span></div>'
}
function v22HeroAvatarHTML(id,size=''){
 const h=WW.config.hero[id],hair={H001:'#321c1d',H002:'#242638',H007:'#4a321c',H010:'#351b1b',H012:'#1e1a31',H019:'#1c3438'}[id]||'#27202a';
 return '<div class="heroAvatar '+size+'" style="--avatar-color:'+h.color+';--avatar-hair:'+hair+'"><div class="hair"></div><div class="mark">'+id.slice(1)+'</div></div>'
}
function v22RarityClass(r){return r==='gold'?'rarity-gold':r==='purple'?'rarity-purple':r==='mythic'?'rarity-mythic':'rarity-blue'}
function v22RarityName(r){return r==='gold'?'传说':r==='purple'?'史诗':r==='mythic'?'神话':'稀有'}

/* Scoped first-playable feedback consumes existing combat and result state only. */
function v336FirstPlayableFlowScope(){
 const stage=selectedStageInfo()?.stage;
 return save.mode==='story'&&save.hero==='H001'&&stage[0]==='ST001-01'
}
function v336FlowToast(kind,title,detail,mark){
 const group=document.getElementById('lootToast');if(!group)return false;
 const line=document.createElement('div');line.className='lootLine flowFeedback';line.dataset.kind=kind;line.dataset.glyph=mark;
 const heading=document.createElement('b'),copy=document.createElement('small');heading.textContent=title;copy.textContent=detail;line.append(heading,copy);group.appendChild(line);
 setTimeout(()=>line.remove(),2700);return true
}
function v336FlowOverlay(id){
 const overlay=document.getElementById(id);if(!overlay)return false;
 overlay.classList.remove('flow-slice-active');
 if(!v336FirstPlayableFlowScope())return false;
 overlay.classList.add('flow-slice-active');return overlay
}
function v336PresentXpPickup(amount){
 if(!v336FirstPlayableFlowScope())return false;
 if(!Number.isFinite(amount)||amount<=0)return false;
 const levelText='等级 '+run.level+' · '+Math.round(run.xp)+' / '+run.xpNeed+' XP';
 return v336FlowToast('xp','经验吸收 · +'+Math.round(amount)+' XP',levelText,'XP')
}
function v336PresentLevelChoices(opts){
 const overlay=v336FlowOverlay('levelOverlay');if(!overlay)return false;
 const step=document.getElementById('levelOverlayStep'),progress=document.getElementById('levelOverlayProgress');
 if(step)step.textContent='ST001-01 · COMBAT GROWTH';
 if(progress)progress.textContent='等级 '+run.level+' · '+opts.length+' 项可选';
 return true
}
function v336PresentLevelChoice(o){
 if(!v336FirstPlayableFlowScope())return false;
 if(!o?.id)return false;
 const level=o.kind==='active'?run.skills[o.id]:run.passives[o.id];
 return v336FlowToast('level','强化已确认',skillName(o.id)+' · Lv.'+level,glyph(o.id))
}
function v336PresentChestChoices(){
 const overlay=v336FlowOverlay('chestOverlay');if(!overlay)return false;
 const step=document.getElementById('chestOverlayStep'),progress=document.getElementById('chestOverlayProgress'),count=run.v29?.encounterEvidence?.chests?.length||1;
 if(step)step.textContent='ST001-01 · MILESTONE REWARD';
 if(progress)progress.textContent='宝箱节点 '+count+' · '+fmt(run.time);
 return true
}
let v336ChestChoiceSnapshot=null;
function v336PresentChestChoice(r){
 if(!v336FirstPlayableFlowScope())return false;
 if(!r||!v336ChestChoiceSnapshot)return false;
 const before=v336ChestChoiceSnapshot;v336ChestChoiceSnapshot=null;
 let title='节点奖励已确认',detail='奖励已写入当前构筑',mark='箱';
 if(r.type==='evo'||r.type==='fusion'){title=r.type==='fusion'?'融合已完成':'进化已完成';detail=skillName(r.id)+' · '+r.id;mark=glyph(r.id)}
 else if(r.type==='gear'){const drop=run.drops.slice(before.dropCount).at(-1);title='装备已获得';detail=drop?.name||'新装备';mark='装'}
 else{
  const active=Object.keys(run.skills).find(id=>(run.skills[id]||0)>(before.skills[id]||0)),passive=Object.keys(run.passives).find(id=>(run.passives[id]||0)>(before.passives[id]||0)),id=active||passive;
  if(id){title='技能强化已生效';detail=skillName(id)+' · Lv.'+(active?run.skills[id]:run.passives[id]);mark=glyph(id)}
 }
 return v336FlowToast('chest',title,detail,mark)
}
function v336PresentRunTransition(victory,reason){
 const overlay=document.getElementById('endCinematic');if(!overlay)return false;
 overlay.classList.remove('flow-slice-active');
 if(!v336FirstPlayableFlowScope())return false;
 if(lastResult?.victory===victory){
  const chapter=document.getElementById('endChapter'),seal=document.getElementById('endSealIcon'),eyebrow=document.getElementById('endEyebrow'),title=document.getElementById('endTitle'),copy=document.getElementById('endText'),next=document.getElementById('endNext');
  if(!chapter||!seal||!eyebrow||!title||!copy||!next)return false;
  overlay.classList.add('flow-slice-active');overlay.classList.toggle('defeat',!victory);overlay.dataset.outcome=victory?'victory':'defeat';
  chapter.textContent=lastResult.stage[0]+' · '+lastResult.stage[1];seal.textContent=victory?'胜':'败';eyebrow.textContent=victory?'FIRST RIFT SEALED':'EXPEDITION BROKEN';
  title.textContent=victory?'首战目标已完成':'本次讨伐中断';copy.textContent=victory?'Boss战利品与章节奖励已经结算并归档。':'本次章节星为 0；战斗记录已保留，可调整构筑后再次挑战。';
  next.textContent=victory?'结算完成 · 正在进入战果账册':'结算完成 · 正在进入恢复建议';
  overlay.classList.add('show');setTimeout(()=>overlay.classList.remove('show'),1450);
  const result=document.getElementById('result');if(result){result.classList.add('resultEntering');setTimeout(()=>result.classList.remove('resultEntering'),950)}
  return true
 }
 return false
}

/* Hero list: art identity replaces generic portrait feel */
const _v22_renderHeroes=renderHeroes;
renderHeroes=function(){
 const g=document.getElementById('heroGrid');g.innerHTML='';
 Object.entries(WW.config.hero).forEach(([id,h])=>{
   const s=save.heroes[id],st=heroStats(id),d=document.createElement('div');
   d.className='card heroCard '+(save.hero===id?'selected ':'')+(!s.unlocked?'locked':'');
   d.innerHTML='<div class="ornament tl"></div><div class="ornament br"></div><div class="heroIdentity">'+v22HeroAvatarHTML(id)+'<div><div class="eyebrow">'+id+'</div><h3>'+h.name+'</h3><small>'+h.skill+' · '+h.ult+'</small></div></div>'+
   '<div class="tags"><span class="tag">'+h.skill+'</span><span class="tag">'+h.ult+'</span></div>'+
   '<div class="heroStats"><div><small>HP</small><b>'+st.hp+'</b></div><div><small>ATK</small><b>'+st.atk+'</b></div><div><small>Lv.</small><b>'+s.level+'</b></div></div>'+
   '<div class="actions"><button class="btn '+(s.unlocked?'primary':'gold')+'" onclick="selectHero(\''+id+'\')">'+(s.unlocked?'选择':'解锁 '+h.unlock+'金')+'</button></div>';
   g.appendChild(d)
 })
};

/* Build slots now use visual skill icons */
renderBuildSlots=function(elId,arr,limit){
 const g=document.getElementById(elId);g.innerHTML='';
 for(let i=0;i<limit;i++){
   const id=arr[i],d=document.createElement('div');d.className='buildSlot '+(id?'filled':'')+(id&&reachableBuildEvos().some(e=>WW.config.evolution[e][1]===id)?' ready':'');
   d.innerHTML=id?v22SkillIconHTML(id)+'<b>'+skillName(id)+'</b><small>'+id+'</small>':'<div class="tiny">空槽</div>';
   if(id)d.onclick=()=>toggleBuild(id);g.appendChild(d)
 }
};

/* Loadout: rarity art frames */
const _v22_renderLoadout=renderLoadout;
renderLoadout=function(){
 _v22_renderLoadout();
 document.querySelectorAll('#gearGrid .itemCard').forEach(card=>{
   const id=card.querySelector('.eyebrow')?.textContent.trim(),g=WW.config.gear[id];if(!g)return;
   card.classList.add(v22RarityClass(g.rarity));card.style.position='relative';
   const rib=document.createElement('div');rib.className='rarityRibbon';rib.textContent=v22RarityName(g.rarity);card.appendChild(rib)
 });
};

/* World card gets visual thumbnails */
const _v22_renderStageList=renderStageList;
renderStageList=function(){
 _v22_renderStageList();
 const side=document.getElementById('worldChapterName')?.parentElement;if(!side)return;
 let old=side.querySelector('.mapThumb');if(old)old.remove();
 const cid=save.selectedChapter,thumb=document.createElement('div');thumb.className='mapThumb '+cid.toLowerCase();
 thumb.innerHTML='<div class="mapLabel">'+cid+' · '+WW.config.stage[cid].name+'</div>';
 const title=document.getElementById('worldChapterId');title.parentElement.insertBefore(thumb,title)
};

/* Run/build HUD art icons */
renderHudSlots=function(){
 const g=document.getElementById('hudSlots');if(!g)return;g.innerHTML='';
 Object.entries(run.skills).forEach(([id,lv])=>{
   const ev=Object.keys(run.evolved).find(e=>run.evolved[e]&&WW.config.evolution[e][1]===id),show=ev||id,d=document.createElement('div');
   d.className='hudSlot '+(ev?'evo':'');d.innerHTML=v22SkillIconHTML(show)+'<em>'+lv+'</em>';g.appendChild(d)
 });
 Object.keys(run.fused).filter(id=>run.fused[id]).forEach(id=>{const d=document.createElement('div');d.className='hudSlot fusion';d.innerHTML=v22SkillIconHTML(id)+'<em>F</em>';g.appendChild(d)})
};

/* Boss portrait beside boss bar */
function v22EnsureBossPortrait(){
 const bar=document.getElementById('bossBar');if(!bar||bar.querySelector('.bossPortrait'))return;
 const p=document.createElement('div');p.className='bossPortrait';p.innerHTML='<div class="horn"></div>';bar.insertBefore(p,bar.firstChild)
}
v22EnsureBossPortrait();

/* Evolution / fusion cinematic */
function v22PlayEvolution(id,type){
 const c=document.getElementById('evolutionCinematic'),core=document.getElementById('evoCore');if(!c)return;
 core.classList.toggle('fusion',type==='fusion');
 document.getElementById('evoIconBig').textContent=glyph(id);
 document.getElementById('evoEyebrow').textContent=type==='fusion'?'SKILL FUSION':'SKILL EVOLUTION';
 document.getElementById('evoTitle').textContent=skillName(id);
 let sub=id;
 if(type==='fusion'&&FUSIONS[id])sub=FUSIONS[id][1]+' + '+FUSIONS[id][2]+' → '+id;
 if(type==='evo'&&WW.config.evolution[id])sub=WW.config.evolution[id][1]+' + '+WW.config.evolution[id][2]+' → '+id;
 document.getElementById('evoSub').textContent=sub;
 c.classList.add('show');V21Audio.skill();setTimeout(()=>c.classList.remove('show'),1250)
}
const _v22_pickChest=pickChest;
pickChest=function(r){
 v336ChestChoiceSnapshot={skills:{...run.skills},passives:{...run.passives},dropCount:run.drops.length};
 const picked=_v22_pickChest(r);if(!picked)return false;
 if(r?.id&&(r.type==='evo'||r.type==='fusion'))v22PlayEvolution(r.id,r.type);
 if(r?.type==='gear')v22LootToast('装备获得 · '+(run.drops.at(-1)?.name||'新装备'));
 v336PresentChestChoice(r);return true
};

/* Boss intro cinematic */
function v22BossIntro(b){
 const cfg=WW.config.boss[b.id],el=document.getElementById('bossIntro');if(!el)return;
 document.getElementById('bossIntroTitle').textContent=b.id+' · '+cfg.name;
 document.getElementById('bossIntroStyle').textContent=cfg.style+' · '+cfg.skills.join(' / ');
 document.getElementById('bossIntroPortrait').style.setProperty('--boss-color',cfg.color);
 el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1350)
}
const _v22_spawnBoss=spawnBoss;
spawnBoss=function(){_v22_spawnBoss();if(run.boss){v22EnsureBossPortrait();const p=document.querySelector('#bossBar .bossPortrait');if(p)p.style.setProperty('--boss-color',run.boss.color);v22BossIntro(run.boss)}}

/* Loot feedback */
function v22LootToast(text){
 if(v336FirstPlayableFlowScope()&&String(text).startsWith('Boss战利品 · '))return v336FlowToast('boss','Boss战利品已确认',String(text).replace('Boss战利品 · ',''),'冠');
 const g=document.getElementById('lootToast');if(!g)return;const d=document.createElement('div');d.className='lootLine';d.textContent=text;g.appendChild(d);setTimeout(()=>d.remove(),2500)
}
const _v22_makeGearDrop=makeGearDrop;
makeGearDrop=function(source){const d=_v22_makeGearDrop(source);setTimeout(()=>v22LootToast(v22RarityName(d.rarity)+' · '+d.name),0);return d};

/* Result drops get rarity frames */
const _v22_renderResult=renderResult;
renderResult=function(){
 _v22_renderResult();
 document.querySelectorAll('#dropGrid .dropCard').forEach(card=>{
   const txt=card.textContent;const id=(txt.match(/EQ[WAX]\d+/)||[])[0],g=WW.config.gear[id];if(g)card.classList.add(v22RarityClass(g.rarity))
 })
};

/* Draw upgrades: more stylized silhouettes and weapon trails */
function v336DrawHeroAttack(){
 if(save.hero!=='H001'||v336StageId()!=='ST001-01')return false;
 const now=performance.now(),fx=V336_PRESENTATION;if(now>=fx.heroAttackUntil)return false;
 const life=Math.max(0,(fx.heroAttackUntil-now)/Math.max(1,fx.heroAttackUntil-fx.heroAttackStarted)),scale=.88+(1-life)*.24;
 return WW.assets?.drawRole('hero-attack',{stageId:'ST001-01',entityId:'H001',ctx,x:player.x,y:player.y-3,width:116*scale,height:116*scale,rotation:fx.heroAttackAngle,alpha:Math.min(1,life*1.55)})||false
}
const _v22_v21DrawHero=v21DrawHero;
v21DrawHero=function(){
 if(WW.assets?.drawRole('hero',{stageId:selectedStageInfo().stage[0],entityId:save.hero,ctx,x:player.x,y:player.y,filter:player.inv>0?'brightness(1.8) saturate(.6)':'none'})){v336DrawHeroAttack();return}
 const h=WW.config.hero[save.hero],x=player.x,y=player.y,c=h.color;v21Shadow(x,y,19,7,.36);ctx.save();ctx.translate(x,y);
 ctx.shadowBlur=player.inv>0?26:20;ctx.shadowColor=player.inv>0?'#fff5ce':c;
 // legs
 ctx.strokeStyle='#20232b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-4,9);ctx.lineTo(-7,18);ctx.moveTo(4,9);ctx.lineTo(7,18);ctx.stroke();
 // coat/body
 ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-10,-5);ctx.quadraticCurveTo(0,-10,10,-5);ctx.lineTo(13,10);ctx.lineTo(5,16);ctx.lineTo(0,12);ctx.lineTo(-5,16);ctx.lineTo(-13,10);ctx.closePath();ctx.fill();
 // head/hair
 ctx.fillStyle='#d7a477';ctx.beginPath();ctx.arc(0,-15,7,0,Math.PI*2);ctx.fill();ctx.fillStyle={H001:'#351d1e',H002:'#25263b',H007:'#51351e',H010:'#361c1c',H012:'#201a32',H019:'#18343a'}[save.hero];ctx.beginPath();ctx.arc(0,-18,8,Math.PI,Math.PI*2);ctx.fill();
 // weapon / energy
 ctx.strokeStyle='#ffe0a0';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(7,-1);ctx.lineTo(21,-14);ctx.stroke();
 ctx.globalAlpha=.28;ctx.strokeStyle=c;ctx.lineWidth=7;ctx.beginPath();ctx.arc(9,-2,20,-1.1,.3);ctx.stroke();ctx.globalAlpha=1;
 ctx.restore();v336DrawHeroAttack()
};
const _v22_v21DrawEnemy=v21DrawEnemy;
v21DrawEnemy=function(e){_v22_v21DrawEnemy(e);if(e.elite&&e.affixes?.length){ctx.save();ctx.font='700 7px Inter';ctx.textAlign='center';ctx.fillStyle='#f3c66c';ctx.fillText(e.affixes.map(x=>x[0].toUpperCase()).join('·'),e.x,e.y-e.r-9);ctx.restore()}};

/* Topbar current hero art badge */
function v22InjectTopAvatar(){
 const top=document.querySelector('.user');if(!top)return;let old=document.getElementById('v22TopHeroAvatar');if(old)old.remove();
 const w=document.createElement('div');w.id='v22TopHeroAvatar';w.style.display='flex';w.style.alignItems='center';w.innerHTML=v22HeroAvatarHTML(save.hero);
 top.insertBefore(w,top.firstChild)
}
const _v22_renderTop=renderTop;
renderTop=function(){_v22_renderTop();v22InjectTopAvatar()};

/* Improve start title mark */
const titleMark=document.querySelector('.titleMark');
if(titleMark){
 const deco=document.createElement('div');deco.style.cssText='margin-top:14px;display:flex;gap:8px;flex-wrap:wrap';
 deco.innerHTML='<span class="tag hot">国潮热血</span><span class="tag">Roguelite</span><span class="tag">跨世界Build</span><span class="tag">20分钟一局</span>';
 titleMark.appendChild(deco)
}

/* Boot refresh */
const _v22_v20Boot=v20Boot;
v20Boot=function(){_v22_v20Boot();v22InjectTopAvatar();v22EnsureBossPortrait()}
