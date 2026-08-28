/* ================= V2.9 SEVEN PLAYABLE MODES ================= */
window.WW=window.WW||{};
window.WW.config=window.WW.config||{};
window.WW.config.gameModes=window.WW.config.gameModes||{};
window.WW.config.mode={
 story:{name:'剧情模式',icon:'章',desc:'标准章节推进。20分钟内成长、进化、融合并完成区域Boss目标。',duration:1200,reward:1.00,tokens:2,spawn:1.00,hp:1.00,dmg:1.00,speed:1.00,bossAt:720,tags:['章节星','剧情推进','标准规则']},
 clear:{name:'通关模式',icon:'破',desc:'15分钟压缩战斗。刷怪更快，Boss提前登场，适合快速刷装备。',duration:900,reward:1.22,tokens:5,spawn:1.18,hp:1.08,dmg:1.06,speed:1.03,bossAt:600,tags:['15分钟','加速刷图','奖励+22%']},
 endless:{name:'无尽模式',icon:'∞',desc:'没有自动终点。敌人持续增强，每10分钟迎来一名Boss；10分钟后可主动撤离。',duration:null,reward:1.12,tokens:0,spawn:1.15,hp:1.06,dmg:1.05,speed:1.02,bossAt:600,tags:['无限生存','周期Boss','最佳时间']},
 bossrush:{name:'Boss Rush',icon:'王',desc:'连续挑战8名首领。普通怪物大幅减少，每名Boss保留三阶段机制与专属掉落。',duration:1080,reward:1.80,tokens:22,spawn:.18,hp:1.10,dmg:1.08,speed:1.04,bossAt:2,tags:['8 Boss','连续首领','专属掉落']},
 tower:{name:'万界塔',icon:'塔',desc:'按当前层数进行6分钟挑战。层数越高，敌人与Boss倍率持续成长。',duration:360,reward:1.35,tokens:4,spawn:1.12,hp:1.05,dmg:1.04,speed:1.02,bossAt:270,tags:['6分钟','逐层强化','永久层数']},
 daily:{name:'每日挑战',icon:'日',desc:'每天固定一套挑战词缀，12分钟完成；记录当天最高分。',duration:720,reward:1.55,tokens:10,spawn:1.22,hp:1.16,dmg:1.12,speed:1.05,bossAt:540,tags:['每日词缀','12分钟','每日记录']},
 abyss:{name:'深渊挑战',icon:'渊',desc:'15分钟高压终局模式。怪潮攻势更激进，治疗效率降低，Boss与精英更强。',duration:900,reward:2.00,tokens:18,spawn:1.48,hp:1.55,dmg:1.38,speed:1.10,bossAt:600,tags:['高压终局','治疗削弱','奖励×2']}
};
window.WW.config.gameModes.bossOrder=['B001','B002','B003','B006','B008','B009','B010','B011'];
window.WW.config.gameModes.bossStages={B001:'ST001-01',B002:'ST001-03',B003:'ST001-04',B006:'ST003-03',B008:'ST003-04',B009:'ST004-01',B010:'ST004-03',B011:'ST004-04'};
window.WW.config.gameModes.firstCampaign={stage:'ST001-01',bossId:'B001',duration:360,bossAt:270,eventAt:[45,150],chestAt:[90,210],spawn:.88,hp:.90,dmg:.82,speed:.96,incoming:.44,recoveryAt:[75,165,255,300,330],recoveryRatio:.22,telegraphScale:1.65,bossHp:3.00,desc:'首战保护已启用：敌潮与承伤更平缓，战意会按战斗节拍恢复。保持移动、及时施放技能，在6分钟内击败黄巾巨将并领取战利品。',tags:['6分钟首战','首战保护','Boss战利品'],target:'在 06:00 前击败黄巾巨将并领取战利品'};
function v337FirstCampaignRecovery(r){
 if(!r?.firstCampaign||!Array.isArray(r.recoveryAt))return false;
 const recoveries=run.v29.recoveries||(run.v29.recoveries=r.recoveryAt.map(()=>false));
 for(let i=0;i<r.recoveryAt.length;i++){
   if(run.time>=r.recoveryAt[i]&&!recoveries[i]){
     recoveries[i]=true;const before=player.hp,amount=player.maxHp*(Number.isFinite(r.recoveryRatio)?r.recoveryRatio:0);
     player.hp=Math.min(player.maxHp,player.hp+amount);const restored=Math.max(0,Math.round(player.hp-before));
     hint('首战恢复 · 战意回稳 +'+restored+' 生命');log('首战恢复 · '+fmt(r.recoveryAt[i])+' · +'+restored+' 生命');return true
   }
 }
 return false
}
window.WW.config.gameModes.dailyChallenges=[
 {name:'雷暴日',desc:'敌人移动更快，雷系Build获得强化；奖励额外+8%。',spawn:1.05,hp:1,dmg:1.05,speed:1.12,player:{lightning:.18},reward:.08},
 {name:'精英潮',desc:'精英密度显著提高，Boss伤害+10%；奖励额外+12%。',spawn:1.12,hp:1.06,dmg:1.08,speed:1.03,elite:1.8,player:{boss:.10},reward:.12},
 {name:'玻璃神兵',desc:'玩家攻击+28%，最大生命-25%，战斗更偏向快速击杀。',spawn:1.08,hp:1.10,dmg:1.12,speed:1.03,player:{atk:.28,hp:-.25},reward:.10},
 {name:'丰收怪潮',desc:'刷怪速度提高，金币与高品质掉落倾向增加。',spawn:1.32,hp:1.04,dmg:1.04,speed:1.02,player:{gold:.18,drop:.10},reward:.08}
];
function v29DateKey(){let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function v29Daily(){let d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/86400000);return WW.config.gameModes.dailyChallenges[n%WW.config.gameModes.dailyChallenges.length]}
function v29Ensure(){
 v28Ensure();if(!WW.config.mode[save.mode])save.mode='story';if(save.modeTokens==null)save.modeTokens=0;save.modeStats=save.modeStats||{};
 for(const id of Object.keys(WW.config.mode))save.modeStats[id]=save.modeStats[id]||{runs:0,wins:0,bestTime:0,bestKills:0,bestScore:0};
 if(save.modeStats.tower.floor==null)save.modeStats.tower.floor=1;if(save.modeStats.tower.bestFloor==null)save.modeStats.tower.bestFloor=1;if(save.modeStats.bossrush.bestBosses==null)save.modeStats.bossrush.bestBosses=0;if(save.modeStats.daily.lastDate==null)save.modeStats.daily.lastDate=''
}
function v29IsFirstCampaign(id=save.mode,stage=save.selectedStage){return id==='story'&&stage===WW.config.gameModes.firstCampaign.stage}
function v29Rule(id=save.mode){
 let base={...WW.config.mode[id]},floor=save.modeStats?.tower?.floor||1;
 if(id==='story'){let contract=storyStageContract(save.selectedStage),encounter=storyStageEncounter(save.selectedStage),curve=WW.config.storyCurve?.[save.selectedStage]||null,bosses=storyBossNames(save.selectedStage);if(contract)base={...base,...(curve||{}),duration:contract.duration,bossAt:contract.bossAt,target:contract.objective,storyContract:contract,storyEncounter:encounter,storyCurve:curve,spawn:encounter?.spawn??base.spawn,desc:contract.objective+'。'+(encounter?encounter.name+'：'+encounter.hazard.desc:bosses.length?'Boss路线：'+bosses.join(' → ')+'。':'本关为怪潮与地图机制生存突破。'),tags:[fmt(contract.duration),encounter?.name||(bosses.length?'Boss目标':'生存突破'),curve?.beat||'章节星']}}
 if(v29IsFirstCampaign(id)){base={...base,...WW.config.gameModes.firstCampaign,firstCampaign:true}}
 if(id==='tower'){base.hp*=1+(floor-1)*.075;base.dmg*=1+(floor-1)*.05;base.speed*=1+Math.min(.25,(floor-1)*.008);base.spawn*=1+Math.min(.45,(floor-1)*.025);base.reward+=Math.min(1.2,(floor-1)*.035);base.tokens+=Math.floor((floor-1)/3)}
 if(id==='daily'){let d=v29Daily();base.spawn*=d.spawn;base.hp*=d.hp;base.dmg*=d.dmg;base.speed*=d.speed;base.reward+=d.reward||0;base.daily=d}
 return base
}
function v29Unlocked(id){
 recomputeWorldUnlocks();let stars=totalStars();
 if(id==='story')return[true,'默认开放'];if(id==='clear')return[stars>=3,'需要章节星 ≥ 3'];if(id==='endless')return[stars>=5,'需要章节星 ≥ 5'];
 if(id==='bossrush')return[(save.stats?.bossKills||0)>=3||save.accountLv>=8,'击败3个Boss或账号Lv.8'];if(id==='tower')return[save.accountLv>=10,'账号Lv.10'];
 if(id==='daily')return[save.accountLv>=15,'账号Lv.15'];if(id==='abyss')return[!!WW.config.stage.ST004.unlock&&save.accountLv>=20,'解锁忍界战场 + 账号Lv.20'];return[false,'未开放']
}
function v29RecordRows(id){let s=save.modeStats[id],rows=[['挑战次数',s.runs||0],['胜利次数',s.wins||0]];if(id==='endless')rows.push(['最佳生存',s.bestTime?fmt(s.bestTime):'—'],['最高击杀',s.bestKills||0]);else if(id==='bossrush')rows.push(['最快通关',s.bestTime?fmt(s.bestTime):'—'],['最多Boss',s.bestBosses||0]);else if(id==='tower')rows.push(['当前层',s.floor||1],['最高层',s.bestFloor||1]);else if(id==='daily')rows.push(['今日最高分',s.lastDate===v29DateKey()?(s.bestScore||0):0],['记录日期',s.lastDate||'—']);else rows.push(['最佳时间',s.bestTime?fmt(s.bestTime):'—'],['最高评分',s.bestScore||0]);return rows}
function v29RenderCampaignCopy(){let first=v29IsFirstCampaign(),label=document.getElementById('homeCampaignLabel'),time=document.getElementById('homeCampaignTime');if(label)label.textContent=first?'首战闭环':'标准征途';if(time)time.textContent=first?'06 MIN':'20 MIN'}
function v29RenderModes(){
 v29Ensure();v29RenderCampaignCopy();let id=save.mode,r=v29Rule(id),cm=document.getElementById('v29CurrentMode');if(!cm)return;let info=selectedStageInfo(),hero=WW.config.hero[save.hero],bosses=storyBossNames(info.stage[0]),[currentOk,currentWhy]=v29Unlocked(id),root=document.querySelector('[data-mission-board]');
 if(root){root.dataset.mode=id;root.style.setProperty('--mission-accent',hero.color)}
 cm.textContent=r.name;document.getElementById('v29CurrentDesc').textContent=r.desc;document.getElementById('missionTargetText').textContent=r.target||r.desc;document.getElementById('v29CurrentTime').textContent=r.duration?fmt(r.duration):'无限';document.getElementById('v29CurrentReward').textContent='×'+r.reward.toFixed(2);document.getElementById('v29Tokens').textContent=save.modeTokens;document.getElementById('v29CurrentDiff').textContent=v19Difficulty().name;
 document.getElementById('missionStageCode').textContent=info.stage[0];document.getElementById('missionStageName').textContent=info.stage[1];document.getElementById('missionHeroName').textContent=hero.name;document.getElementById('missionBossName').textContent=bosses.join(' · ')||'持续怪潮信号';document.getElementById('v29StartMode').textContent=r.name;
 let launch=document.querySelector('[data-mission-start]'),ready=document.getElementById('missionReadyText');launch.disabled=!currentOk;launch.setAttribute('aria-label',currentOk?'查看'+r.name+'出战简报':'当前规则未解锁：'+currentWhy);ready.textContent=currentOk?'任务规则可执行 · 可进入简报':currentWhy;ready.parentElement.classList.toggle('locked',!currentOk);
 let mb=document.getElementById('v29MutatorBox');mb.style.display=id==='daily'?'block':'none';if(id==='daily'){let d=v29Daily();document.getElementById('v29MutatorName').textContent='今日词缀 · '+d.name;document.getElementById('v29MutatorDesc').textContent=d.desc}
 document.getElementById('v29RecordRows').innerHTML=v29RecordRows(id).map(([a,b])=>'<div class="modeRecordRow"><span>'+a+'</span><b>'+b+'</b></div>').join('');
 let g=document.getElementById('v29ModeGrid');g.innerHTML='';for(const [mid,m] of Object.entries(WW.config.mode)){let [ok,why]=v29Unlocked(mid),rr=v29Rule(mid),d=document.createElement('button');d.type='button';d.className='modeCard '+(mid===id?'selected ':'')+(ok?'':'locked');d.dataset.modeId=mid;d.setAttribute('aria-pressed',String(mid===id));d.setAttribute('aria-label',m.name+'，'+(ok?(mid===id?'当前规则':'选择规则'):'锁定，'+why));d.disabled=!ok;d.onclick=()=>v29SelectMode(mid);d.innerHTML='<span class="modeIcon">'+m.icon+'</span><span class="modeProjectionCopy"><span class="eyebrow">'+mid.toUpperCase()+'</span><strong>'+m.name+'</strong><small>'+(ok?(rr.duration?fmt(rr.duration):'无限')+' · ×'+rr.reward.toFixed(2):why)+'</small></span><span class="modeState">'+(mid===id?'已同步':ok?'选择':'锁定')+'</span>';g.appendChild(d)}
}
function v29SelectMode(id){let [ok,why]=v29Unlocked(id);if(!ok)return toast(why);save.mode=id;persist();v29RenderModes();renderTop();toast('模式：'+WW.config.mode[id].name)}
let v29BriefingContext=null,v29BriefingLaunching=false;
const V29_BRIEFING_EDITORS={heroes:'briefingEditHero',loadout:'briefingEditLoadout',build:'briefingEditBuild'};

function v29BriefingStatus(){
 const blockers=[],block=(text,target,label)=>blockers.push({text,target,label}),mode=WW.config.mode?.[save.mode]||null,stageEntry=storyStageEntry(save.selectedStage),hero=WW.config.hero?.[save.hero]||null,heroSave=save.heroes?.[save.hero]||null;
 if(!mode)block('当前任务规则不存在，请返回任务台重新选择。','modes','调整规则');
 else{const [unlocked,why]=v29Unlocked(save.mode);if(!unlocked)block('任务规则尚未解锁：'+why+'。','modes','调整规则')}
 if(!stageEntry)block('当前任务关卡不存在，请返回地图重新选择。','world','调整关卡');
 else if(save.mode==='story'&&!storyStageUnlocked(save.selectedStage))block('剧情关卡尚未解锁：需要先完成前置关卡。','world','调整关卡');
 if(!hero)block('当前英雄不存在，请重新选择守界者。','heroes','调整英雄');
 else if(!heroSave)block('当前英雄缺少存档记录，请重新选择守界者。','heroes','调整英雄');
 else if(!heroSave.unlocked)block('当前英雄尚未解锁，无法出征。','heroes','调整英雄');

 const active=Array.isArray(save.build?.active)?[...save.build.active]:[],passive=Array.isArray(save.build?.passive)?[...save.build.passive]:[];
 if(!active.length)block('主动术式为空，请至少配置一项主动术式。','build','调整构筑');
 else{const invalid=active.filter(id=>!WW.config.skill?.[id]||String(id).startsWith('P'));if(invalid.length)block('主动术式包含无效配置：'+invalid.join('、')+'。','build','调整构筑')}
 if(!passive.length)block('被动心法为空，请至少配置一项被动心法。','build','调整构筑');
 else{const invalid=passive.filter(id=>!WW.config.skill?.[id]||!String(id).startsWith('P'));if(invalid.length)block('被动心法包含无效配置：'+invalid.join('、')+'。','build','调整构筑')}

 const slotLabels={weapon:'武器',armor:'防具',accessory:'饰品'},gear=Object.entries(slotLabels).map(([slot,label])=>{const id=save.equip?.[slot],item=WW.config.gear?.[id],valid=!!item&&item.slot===slot;if(!id)block(label+'尚未装备。','loadout','调整军械');else if(!valid)block(label+'配置无效：'+id+'。','loadout','调整军械');return{slot,label,id,item,valid}});
 const runes=Array.isArray(save.runes)?[...save.runes]:[];
 if(!runes.length)block('符文回路为空，请至少装备一枚符文。','loadout','调整军械');
 else{const invalid=runes.filter(id=>!WW.config.rune?.[id]);if(invalid.length)block('符文回路包含无效配置：'+invalid.join('、')+'。','loadout','调整军械')}
 const pet=WW.config.pet?.[save.pet]||null;if(!save.pet)block('尚未指定伴战主宠。','loadout','调整军械');else if(!pet)block('伴战主宠配置无效：'+save.pet+'。','loadout','调整军械');
 return{ready:blockers.length===0,blockers,mode,stageEntry,hero,heroSave,active,passive,gear,runes,pet}
}

function v29BriefingList(id,items,emptyText){
 const list=document.getElementById(id);if(!list)return;list.innerHTML='';
 (items.length?items:[emptyText]).forEach((text,index)=>{const item=document.createElement('li');item.textContent=text;if(!items.length||String(text).includes('无效')||String(text).includes('缺失'))item.className='blocked';item.dataset.index=String(index+1);list.appendChild(item)})
}

function v29RenderBriefing(){
 const root=document.querySelector('[data-expedition-briefing]');if(!root)return;const status=v29BriefingStatus(),stage=status.stageEntry?.stage||null,hero=status.hero,heroSave=status.heroSave;
 let rule=status.mode||{},difficulty='—',power='—';try{if(status.mode)rule=v29Rule(save.mode)}catch(e){}try{difficulty=v19Difficulty().name}catch(e){}try{if(hero&&heroSave)power=combatPower()}catch(e){}
 root.style.setProperty('--briefing-accent',hero?.color||'#e69d48');
 document.getElementById('briefingModeName').textContent=status.mode?.name||'任务规则无效';document.getElementById('briefingStageCode').textContent=stage?.[0]||String(save.selectedStage||'未选择');document.getElementById('briefingStageName').textContent=stage?.[1]||'未找到任务关卡';document.getElementById('briefingObjective').textContent=rule.target||rule.desc||stage?.[5]?.objective||'请返回任务台重新选择任务。';
 document.getElementById('briefingDuration').textContent=rule.duration==null?(status.mode?'无限':'—'):fmt(rule.duration);document.getElementById('briefingReward').textContent=status.mode?'×'+Number(rule.reward||1).toFixed(2):'—';document.getElementById('briefingDifficulty').textContent=difficulty;document.getElementById('briefingBosses').textContent=stage?storyBossNames(stage[0]).join(' · ')||'持续怪潮信号':'—';
 document.getElementById('briefingHeroId').textContent=save.hero||'未选择';document.getElementById('briefingHeroName').textContent=hero?.name||'英雄配置无效';document.getElementById('briefingHeroDetail').textContent=heroSave?'Lv.'+heroSave.level+' · '+heroSave.star+'★':hero?'缺少英雄存档':'请重新选择守界者';document.getElementById('briefingPower').textContent=power;document.getElementById('briefingHeroSkill').textContent=hero?.skill||'—';document.getElementById('briefingHeroUlt').textContent=hero?.ult||'—';
 v29BriefingList('briefingGearList',status.gear.map(x=>x.valid?x.label+' · '+x.item.name+' · '+x.item.score+'评分':x.label+' · '+(x.id||'缺失')+'（无效）'),'装备配置缺失');v29BriefingList('briefingRuneList',status.runes.map(id=>WW.config.rune?.[id]?WW.config.rune[id].name+' · '+WW.config.rune[id].score+'评分':id+'（无效）'),'符文配置缺失');document.getElementById('briefingPetName').textContent=status.pet?status.pet.name+' · '+status.pet.score+'评分':(save.pet||'主宠缺失')+'（无效）';
 v29BriefingList('briefingActiveList',status.active.map(id=>(WW.config.skill?.[id]&&!String(id).startsWith('P'))?skillName(id):id+'（无效）'),'尚未配置主动术式');v29BriefingList('briefingPassiveList',status.passive.map(id=>(WW.config.skill?.[id]&&String(id).startsWith('P'))?skillName(id):id+'（无效）'),'尚未配置被动心法');
 const readiness=document.getElementById('briefingReadiness'),summary=document.getElementById('briefingCheckSummary'),blockers=document.getElementById('briefingBlockers'),confirm=document.getElementById('briefingConfirm'),hint=document.getElementById('briefingCommandHint');readiness.classList.toggle('ready',status.ready);readiness.classList.toggle('blocked',!status.ready);readiness.querySelector('span').textContent=status.ready?'整备完成 · 可以确认出征':'发现 '+status.blockers.length+' 项阻塞';summary.textContent=status.ready?'任务、英雄、军械、符文、宠物与构筑均已就绪。':'处理以下全部问题后才能确认出征。';blockers.innerHTML='';(status.ready?[{text:'全部整备校验已通过，确认后进入当前裂隙。'}]:status.blockers).forEach(blocker=>{const item=document.createElement('li'),text=document.createElement('span');text.textContent=blocker.text;item.className=status.ready?'ready':'blocked';item.appendChild(text);if(blocker.target){const action=document.createElement('button');action.type='button';action.className='briefingFix';action.textContent=blocker.label;action.setAttribute('aria-label',blocker.label+'：'+blocker.text);action.onclick=()=>v29OpenBriefingFix(blocker.target);item.appendChild(action)}blockers.appendChild(item)});confirm.disabled=!status.ready||v29BriefingLaunching;confirm.setAttribute('aria-label',status.ready?(v29BriefingLaunching?'正在进入裂隙':'确认出征，进入'+(status.mode?.name||'当前任务')):'无法出征，仍有'+status.blockers.length+'项阻塞');confirm.querySelector('span').textContent=v29BriefingLaunching?'正在进入裂隙':'确认出征';hint.textContent=status.ready?'整备完成，等待你的最终确认':'仍有 '+status.blockers.length+' 项需要处理'
}

function v29OpenBriefingFix(target){if(V29_BRIEFING_EDITORS[target])return v29OpenBriefingEditor(target);if(target!=='modes'&&target!=='world')return;v29ClearBriefingContext();go(target)}

function v29SyncBriefingHeroAction(){
 const button=document.getElementById('heroBriefingComplete');if(!button)return;
 const label=button.querySelector('span'),detail=button.querySelector('small'),action=button.querySelector('strong'),id=heroHallFocusId,hero=WW.config.hero?.[id]||null,heroSave=save.heroes?.[id]||null,gold=Number(save.gold||0),price=Number(hero?.unlock||0),current=!!hero&&save.hero===id;
 let title='',description='',command='',disabled=false;
 if(!hero||!heroSave){title='英雄配置无效';description='请重新选择可用守界者';command='无法任命';disabled=true}
 else if(current&&heroSave.unlocked){title='保留 '+hero.name+' · 返回简报';description='当前英雄与现有构筑保持不变';command='返回简报'}
 else if(heroSave.unlocked){title='任命 '+hero.name+' · 选择构筑';description='确认保留现有构筑或载入推荐方案';command='继续确认'}
 else if(gold>=price){title='解锁并任命 '+hero.name+' · '+price+' 金';description='选择构筑并确认后才会支付金币';command='继续确认'}
 else{title='金币不足 · 还差 '+(price-gold)+' 金';description=hero.name+' 需要 '+price+' 金，当前持有 '+gold+' 金';command='无法任命';disabled=true}
 label.textContent=title;detail.textContent=description;action.textContent=command;button.disabled=disabled;button.classList.toggle('locked',!!heroSave&&!heroSave.unlocked);button.setAttribute('aria-label',title+'，'+description)
}

function v29SyncBriefingContext(){
 const active=!!v29BriefingContext;if(active)document.body.dataset.briefingActive='true';else delete document.body.dataset.briefingActive;
 if(active&&v29BriefingContext.editor)document.body.dataset.briefingEditor=v29BriefingContext.editor;else delete document.body.dataset.briefingEditor;
 document.querySelectorAll('[data-briefing-return]').forEach(button=>button.hidden=!active);
 const heroConfirm=document.getElementById('heroHallConfirm'),heroComplete=document.getElementById('heroBriefingComplete');if(heroConfirm)heroConfirm.hidden=active;if(heroComplete)heroComplete.hidden=!active;
 const loadoutComplete=document.getElementById('loadoutCompleteAction');if(loadoutComplete){loadoutComplete.textContent=active?'完成军械 · 返回简报':'进入万法构筑';loadoutComplete.setAttribute('aria-label',active?'完成军械配置，返回出战简报':'完成军械配置，进入万法构筑')}
 const buildComplete=document.getElementById('buildCompleteAction');if(buildComplete)buildComplete.setAttribute('aria-label',active?'完成构筑，返回出战简报':'完成构筑，前往裂隙选关')
 v29SyncBriefingHeroAction()
}
function v29ClearBriefingContext(){v29BriefingContext=null;v29SyncBriefingContext()}
function v29BeginBriefing(focusId=null){v29BriefingContext={editor:null,focusId};v29BriefingLaunching=false;v29SyncBriefingContext();go('briefing');v29RenderBriefing();window.scrollTo(0,0);requestAnimationFrame(()=>document.getElementById(focusId||'briefingTitle')?.focus({preventScroll:true}))}
function v29OpenBriefingEditor(page){if(!V29_BRIEFING_EDITORS[page])return;v29BriefingContext={editor:page,focusId:V29_BRIEFING_EDITORS[page]};v29SyncBriefingContext();go(page);window.scrollTo(0,0);requestAnimationFrame(()=>{v29SyncBriefingHeroAction();const title=document.getElementById({heroes:'heroHallTitle',loadout:'armoryTitle',build:'buildSanctumTitle'}[page]);title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true})})}
function v29ReturnToBriefing(){const focusId=v29BriefingContext?.focusId||null;if(!v29BriefingContext)v29BriefingContext={editor:null,focusId};else v29BriefingContext.editor=null;v29SyncBriefingContext();go('briefing');v29RenderBriefing();requestAnimationFrame(()=>document.getElementById(focusId||'briefingTitle')?.focus())}
function v29CompleteBriefingHero(){return confirmHeroSelection()}
function v29CompleteLoadout(){if(v29BriefingContext?.editor==='loadout')return v29ReturnToBriefing();go('build')}
function v29CompleteBuild(){if(v29BriefingContext?.editor==='build')return v29ReturnToBriefing();go('world')}
function v29ReplayBriefing(){v29BeginBriefing()}
function v29CampaignHandoff(result=lastResult){
 const resultStageId=result?.stage?.[0]||save.selectedStage,entry=storyStageEntry(resultStageId)||storyStageEntry(save.selectedStage),base={stageId:entry?.stage?.[0]||save.selectedStage,nextStageId:null,chapter:entry?.chapter||save.selectedChapter,stage:entry?.stage||selectedStageInfo().stage};
 if(!result?.storyReward)return{...base,kind:'replay'};
 if(!result.victory)return{...base,kind:'retry'};
 const ids=Object.values(WW.config.stage).flatMap(chapter=>chapter.stages.map(stage=>stage[0])),currentIndex=ids.indexOf(resultStageId),after=currentIndex>=0?ids.slice(currentIndex+1):ids;
 const nextStageId=after.find(id=>storyStageUnlocked(id)&&storyStageRecord(id)===0)||ids.find(id=>storyStageUnlocked(id)&&storyStageRecord(id)===0);
 if(nextStageId){const next=storyStageEntry(nextStageId);return{kind:'next',stageId:nextStageId,nextStageId,chapter:next.chapter,stage:next.stage}}
 if(ids.length&&ids.every(id=>storyStageRecord(id)>0))return{...base,kind:'complete'};
 return{...base,kind:'hold'}
}
function v29ApplyCampaignHandoff(handoff=v29CampaignHandoff()){
 if(!handoff?.stageId||handoff.kind==='hold')return handoff;
 const entry=storyStageEntry(handoff.stageId),storyResult=lastResult?.storyReward===true;
 if(!entry||storyResult&&!storyStageUnlocked(handoff.stageId))return{...handoff,kind:'hold'};
 if(save.selectedChapter!==entry.chapter||save.selectedStage!==entry.stage[0]){save.selectedChapter=entry.chapter;save.selectedStage=entry.stage[0];persist()}
 return handoff
}
function v29RenderResultHandoff(){
 const button=document.querySelector('[data-result-replay]'),label=document.getElementById('resultPrimaryLabel'),detail=document.getElementById('resultPrimaryDetail'),status=document.getElementById('resultHandoffStatus');if(!button||!label||!detail||!status)return;
 const handoff=v29CampaignHandoff(),name=handoff.stage?.[1]||handoff.stageId||'当前任务';let title='再次挑战',description='先核对出战简报',message='当前任务可再次出征';
 if(handoff.kind==='next'){title='继续征途';description=handoff.stageId+' · '+name+' · 查看出战简报';message='新任务已解锁：'+handoff.stageId+' · '+name}
 else if(handoff.kind==='retry'){title='重试本关';description=handoff.stageId+' · '+name+' · 重新整备';message='本关尚未完成：重整配置后再次出征'}
 else if(handoff.kind==='complete'){title='重温终章';description=handoff.stageId+' · '+name+' · 查看出战简报';message='主线战役已完成：所有剧情关卡均已留档'}
 else if(handoff.kind==='hold'){title='检查剧情路线';description='当前没有可安全交接的新任务';message='剧情路线尚未形成可用的下一任务，请前往地图检查'}
 label.textContent=title;detail.textContent=description;status.textContent=message;status.dataset.handoff=handoff.kind;button.setAttribute('aria-label',title+'：'+description)
}
function v29OpenResultHandoff(){const handoff=v29CampaignHandoff();if(handoff.kind==='hold')return go('world');v29ApplyCampaignHandoff(handoff);v29BeginBriefing()}
function v29ReturnResultHandoff(){v29ApplyCampaignHandoff();go('home')}
function v29ConfirmBriefing(){if(v29BriefingLaunching||v29LoadingTimer)return;const status=v29BriefingStatus();if(!status.ready){v29RenderBriefing();toast('整备尚未完成，请处理全部阻塞项');document.getElementById('briefingCheckTitle')?.focus({preventScroll:true});return}v29BriefingLaunching=true;v29RenderBriefing();startBattle()}
function v29BriefingKeydown(event){if(event.key!=='Escape'||!v29BriefingContext)return;const page=document.querySelector('.page.active')?.id;if(!V29_BRIEFING_EDITORS[page])return;event.preventDefault();event.stopPropagation();v29ReturnToBriefing()}
document.addEventListener('keydown',v29BriefingKeydown);
document.addEventListener('ui:view-change',event=>{if(event.detail?.id==='result')v29RenderResultHandoff()});
document.addEventListener('click',event=>{const grid=document.getElementById('heroGrid');if(v29BriefingContext?.editor!=='heroes'||!grid||!(event.target instanceof Element)||!event.target.closest('[data-hero-id]')||!event.composedPath().includes(grid))return;requestAnimationFrame(v29SyncBriefingHeroAction)});

function v29QuickStart(id){let [ok,why]=v29Unlocked(id);if(!ok)return toast(why);save.mode=id;persist();v29BeginBriefing()}
function v29StartSelected(){v29QuickStart(save.mode)}

function v29RuntimeInit(){let rule=v29Rule(),encounter=rule.storyEncounter||null,evidence=encounter?{stage:save.selectedStage,name:encounter.name,waves:[{at:0,name:encounter.waves[0].name,type:encounter.waves[0].type}],events:[],chests:[],hazardName:encounter.hazard.name,hazardType:encounter.hazard.type,hazardUsed:false,hazardTriggers:0,hazardPeak:0,bosses:[]}:null;run.v29={id:save.mode,rule,bossesKilled:0,lastBossSeen:null,countedBoss:null,endlessBossMilestone:0,score:0,daily:rule.daily||null,lootResolvedAt:null,settlingAt:null,encounterEvidence:evidence};if(evidence){if(run.director)run.director.lastWave=v19WaveKey(v19WaveAt(0));log('遭遇档案 · '+encounter.name+' · '+encounter.hazard.name)}}
function v29EncounterSchedule(encounter,contract){if(!encounter)return storyStageSchedule(save.selectedStage);let parts=[encounter.name];if(encounter.eventAt.length)parts.push('事件 '+encounter.eventAt.map(fmt).join('/'));if(encounter.chestAt.length)parts.push('宝箱 '+encounter.chestAt.map(fmt).join('/'));if(contract?.bosses.length)parts.push(fmt(contract.bossAt)+' Boss');parts.push(fmt(contract?.duration||0)+' 结束');return parts.join(' · ')}
function v29RecordActiveBoss(){let evidence=run?.v29?.encounterEvidence,id=run?.boss?.id;if(evidence&&id&&evidence.bosses.at(-1)?.id!==id){evidence.bosses.push({at:Math.floor(run.time),id,name:run.boss.name});log('遭遇首领 · '+id+' '+run.boss.name)}}
function storyBossGoalComplete(contract=storyStageContract(save.selectedStage)){if(!contract?.bosses.length)return true;if(contract.bosses.length>1)return (run.v30?.dualBossPhase||0)>=2&&!run.boss&&run.bossDefeated;return !run.boss&&run.bossDefeated}
function v29FirstCampaignPhase(){
 if(!run?.v29?.rule?.firstCampaign)return null;
 let r=run.v29.rule,bossLoot=run.drops?.find(drop=>drop.source==='boss');
 if(run.v29.settlingAt!=null)return{id:'settling',step:'07 / 07',title:'战果结算',next:'奖励与章节记录正在写入账册'};
 if(run.v29.lootResolvedAt!=null||bossLoot)return{id:'loot-confirmed',step:'06 / 07',title:'战利品已确认',next:'正在封存战果，请稍候'};
 if(run.bossDefeated&&run.v26BossLootShown===true){let choosing=Array.isArray(run.v26PendingLoot)&&run.v26PendingLoot.length>0||document.getElementById('v26LootOverlay')?.classList.contains('show');return choosing?{id:'loot-choice',step:'05 / 07',title:'选择战利品',next:'三选一后立即完成首战目标'}:{id:'loot-opening',step:'04 / 07',title:'Boss战利品出现',next:'正在展开三选一战利品'};}
 if(run.boss)return{id:'boss-fight',step:'03 / 07',title:'迎战黄巾巨将',next:'保持移动，击破首领并领取战利品'};
 if(run.time>=Math.max(0,r.bossAt-20))return{id:'boss-warning',step:'02 / 07',title:'Boss信号逼近',next:'保留闪避与终极，准备迎战黄巾巨将'};
 return{id:'advance',step:'01 / 07',title:'向裂隙深处推进',next:'清理敌潮并成长，等待Boss信号'};
}
function v29Progress(){if(!run?.v29)return 0;let r=run.v29.rule;if(run.v29.id==='bossrush')return run.v29.bossesKilled/8;if(run.v29.id==='endless')return Math.min(1,run.time/1200);if(r.firstCampaign){if(run.v29.lootResolvedAt!=null||run.drops?.some(drop=>drop.source==='boss'))return 1;if(run.bossDefeated)return .96;if(run.boss?.maxHp)return .70+(1-Math.max(0,run.boss.hp)/run.boss.maxHp)*.25;return Math.min(.70,run.time/Math.max(1,r.bossAt)*.70)}return r.duration?Math.min(1,run.time/r.duration):0}
function v29ObjectiveText(){if(!run?.v29)return'—';let id=run.v29.id,r=run.v29.rule;if(id==='bossrush')return run.v29.bossesKilled+'/8 Boss';if(id==='tower')return '第'+(save.modeStats.tower.floor||1)+'层 · '+(run.boss?'Boss战':'推进中');if(id==='endless')return fmt(run.time)+' · '+run.kills+'击杀';if(r.firstCampaign){let phase=v29FirstCampaignPhase();return phase?phase.title:'首战目标'}if(id==='story'){if(run.boss)return run.boss.name+' · '+Math.max(0,Math.round(run.boss.hp/run.boss.maxHp*100))+'%';if(r.storyContract?.bosses.length&&storyBossGoalComplete(r.storyContract))return '关卡目标完成';return fmt(run.time)+' / '+fmt(r.duration)}return fmt(run.time)+' / '+fmt(r.duration)}
function v29SyncCampaignStatus(element,phase,compact=false){if(!element)return;if(!phase){element.hidden=true;element.removeAttribute('data-phase');return}element.hidden=false;element.dataset.phase=phase.id;if(element.dataset.copy===phase.id)return;element.dataset.copy=phase.id;element.innerHTML='<span>'+phase.step+'</span><b>'+phase.title+'</b><small>'+(compact?'下一步 · ':'NEXT · ')+phase.next+'</small>'}
function v29BattleUI(){
 if(!run?.active||!run.v29)return;let m=WW.config.mode[run.v29.id],r=run.v29.rule,el=document.getElementById('v29BattleMode');if(!el)return;el.textContent=m.name;
 let target=r.target||('坚持 '+(r.duration?fmt(r.duration):'无限'));if(run.v29.id==='bossrush')target='连续击败8名Boss';if(run.v29.id==='tower')target='第 '+(save.modeStats.tower.floor||1)+' 层 · 击败守层Boss';if(run.v29.id==='endless')target='尽可能生存，10分钟后可撤离';
 let rewardText='×'+r.reward.toFixed(2)+' · 徽记 '+(run.v29.id==='endless'?'动态':r.tokens);if(run.v29.id==='story'){let reward=storyStageReward(save.selectedStage,0);rewardText='基础 +'+reward.base+' · 每星 +'+(r.storyContract?.reward?.starGold||0)+' · 徽记 '+r.tokens}
 document.getElementById('v29BattleObjective').innerHTML='<div class="modeObjRow"><span>核心目标</span><b>'+target+'</b></div>'+(r.storyEncounter?'<div class="modeObjRow"><span>遭遇机制</span><b>'+r.storyEncounter.name+' · '+r.storyEncounter.hazard.name+'</b></div>':'')+(r.storyCurve?'<div class="modeObjRow"><span>压力节拍</span><b>'+r.storyCurve.beat+' · '+r.storyCurve.budget.toFixed(2)+'</b></div>':'')+'<div class="modeObjRow"><span>模式奖励</span><b>'+rewardText+'</b></div><div class="modeObjRow"><span>进度</span><b>'+v29ObjectiveText()+'</b></div>';
 document.getElementById('v29ModeProgress').style.width=(v29Progress()*100)+'%';let act=document.getElementById('v29ModeAction');act.style.display=(run.v29.id==='endless'&&run.time>=600)?'block':'none';let phase=v29FirstCampaignPhase();v29SyncCampaignStatus(document.getElementById('v29CampaignPhase'),phase);v29SyncCampaignStatus(document.getElementById('v29CampaignCue'),phase,true);document.body.classList.toggle('firstCampaignBattle',!!phase);let badge=document.getElementById('v29ModeBadge');if(badge)badge.textContent=phase?phase.step+' · '+phase.title:m.name.replace('模式','')+' · '+v29ObjectiveText();let schedule=document.getElementById('battleSchedule');if(schedule)schedule.textContent=r.firstCampaign?'首战保护 · '+v29EncounterSchedule(r.storyEncounter,r.storyContract):run.v29.id==='story'?v29EncounterSchedule(r.storyEncounter,r.storyContract):'3/8/13分钟事件 · 5/10/15分钟宝箱 · 20分钟胜负判定'
}
function v29ManualExit(){if(run?.v29?.id!=='endless'||run.time<600)return;finishRun(true,'主动撤离 · 无尽成绩已保存')}

const _v29Interval=v19SpawnInterval;v19SpawnInterval=function(){let base=_v29Interval(),r=run?.v29?.rule||v29Rule();return base/Math.max(.12,r.spawn||1)};
const _v29Elite=v19EliteChance;v19EliteChance=function(){let c=_v29Elite();if(run?.v29?.id==='daily'&&run.v29.daily?.elite)c*=run.v29.daily.elite;if(run?.v29?.id==='abyss')c*=1.55;return Math.min(.42,c)};
const _v29Enemy=spawnEnemy;spawnEnemy=function(opts={}){let before=enemies.length,z=_v29Enemy(opts),r=run?.v29?.rule;if(r&&enemies.length>before)for(let i=before;i<enemies.length;i++){let e=enemies[i];if(!e._v29Scaled){e.hp*=r.hp;e.maxHp*=r.hp;e.damage*=r.dmg;e.speed*=r.speed;e._v29Scaled=true}}return z};

function v29SpawnBossId(id){if(!run?.active||run.boss)return;let old=save.selectedStage;run.bossDefeated=false;run.v26BossLootShown=false;save.selectedStage=WW.config.gameModes.bossStages[id]||old;spawnBoss();save.selectedStage=old;if(run.boss){let r=run.v29?.rule||v29Rule(),bossHp=r.bossHp??r.hp;run.boss.hp*=bossHp;run.boss.maxHp*=bossHp;run.v29.lastBossSeen=run.boss.id}}
function v29BossForTower(){return WW.config.gameModes.bossOrder[((save.modeStats.tower.floor||1)-1)%WW.config.gameModes.bossOrder.length]}
function v29BossForStage(){let stage=selectedStageInfo().stage,bosses=storyStageContract(stage[0])?.bosses||[];return bosses[bosses.length-1]||stage[4]||'B001'}
function v29ApplyMode(){if(!run?.v29)v29RuntimeInit();let id=run.v29.id,d=run.v29.daily;if(id==='daily'&&d?.player){if(d.player.atk)player.atk*=1+d.player.atk;if(d.player.hp){player.maxHp*=1+d.player.hp;player.hp=player.maxHp}}if(id==='abyss'){player.maxHp*=.92;player.hp=player.maxHp}v29BattleUI()}

const _v29HurtPlayer=hurtPlayer;hurtPlayer=function(dmg){let r=run?.v29?.rule;if(Number.isFinite(r?.incoming))dmg*=r.incoming;_v29HurtPlayer(dmg)};
const _v29Pet=v27PetCast;v27PetCast=function(){let before=player.hp;_v29Pet();if(run?.v29?.id==='abyss'&&player.hp>before)player.hp=before+(player.hp-before)*.5};

function v29FirstCampaignMilestone(times,state,show){for(let i=0;i<times.length;i++){if(run.time>=times[i]&&!state[i]){state[i]=true;show();return true}}return false}
function v29FirstCampaignLootResolved(){let overlay=document.getElementById('v26LootOverlay'),bossLoot=run.drops?.some(drop=>drop.source==='boss');return run.bossDefeated&&run.v26BossLootShown===true&&bossLoot===true&&Array.isArray(run.v26PendingLoot)&&run.v26PendingLoot.length===0&&!overlay?.classList.contains('show')}

function v29Update(dt){
 if(!run?.active||run.paused||!run.v29)return;let id=run.v29.id,r=run.v29.rule;
 v29RecordActiveBoss();
 if(run.v29.lastBossSeen&&!run.boss&&run.bossDefeated&&run.v29.countedBoss!==run.v29.lastBossSeen){run.v29.countedBoss=run.v29.lastBossSeen;run.v29.bossesKilled++}
 if(r.firstCampaign){
   if(v337FirstCampaignRecovery(r))v29BattleUI();
   if(v29FirstCampaignMilestone(r.eventAt,run.events,showEvent)||v29FirstCampaignMilestone(r.chestAt,run.chests,showChest)){v29BattleUI();return}
   if(run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(r.bossId);
   if(v29FirstCampaignLootResolved()){
     if(run.v29.lootResolvedAt==null){run.v29.lootResolvedAt=run.time;hint('Boss战利品已确认 · 正在封存战果');v29BattleUI();return}
     if(run.time-run.v29.lootResolvedAt<.75){v29BattleUI();return}
     if(run.v29.settlingAt==null){run.v29.settlingAt=run.time;v29BattleUI();return}
     if(run.time-run.v29.settlingAt<.25){v29BattleUI();return}
     return finishRun(true,'黄巾巨将已击败 · Boss战利品已领取并归档')
   }
   if(run.bossDefeated&&run.v26BossLootShown===true)return;
   if(run.time>=r.duration)return finishRun(false,'首战时限到达 · 黄巾巨将未击败');
 }else if(id==='bossrush'){
   if(!run.boss&&!document.getElementById('v26LootOverlay')?.classList.contains('show')){if(run.v29.bossesKilled>=8)return finishRun(true,'Boss Rush · 8名首领全部击败');v29SpawnBossId(WW.config.gameModes.bossOrder[run.v29.bossesKilled])}
   if(run.time>=r.duration)return finishRun(false,'Boss Rush超时 · '+run.v29.bossesKilled+'/8')
 }else if(id==='tower'){
   if(run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(v29BossForTower());
   if(run.bossDefeated&&run.v29.bossesKilled>=1)return finishRun(true,'万界塔第'+(save.modeStats.tower.floor||1)+'层通关');
   if(run.time>=r.duration)return finishRun(false,'守层Boss未能及时击破')
 }else if(id==='endless'){
   let milestone=Math.floor(run.time/600);if(milestone>=1&&milestone>run.v29.endlessBossMilestone&&!run.boss){run.v29.endlessBossMilestone=milestone;run.bossDefeated=false;run.v29.countedBoss=null;v29SpawnBossId(WW.config.gameModes.bossOrder[(milestone-1)%WW.config.gameModes.bossOrder.length])}
 }else if(id==='story'){
   let contract=r.storyContract||storyStageContract(save.selectedStage),encounter=r.storyEncounter;if(encounter&&(v29FirstCampaignMilestone(encounter.eventAt,run.events,showEvent)||v29FirstCampaignMilestone(encounter.chestAt,run.chests,showChest))){v29BattleUI();return}
   if(contract?.bosses.length&&r.bossAt!=null&&run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(v29BossForStage());
   if(r.duration&&run.time>=r.duration){let victory=storyBossGoalComplete(contract);return finishRun(victory,victory?storyStageSuccess(save.selectedStage):storyStageTimeout(save.selectedStage))}
 }else{
   if(r.bossAt!=null&&run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(v29BossForStage());
   if(r.duration&&run.time>=r.duration){if(run.boss)return finishRun(false,WW.config.mode[id].name+'时间到达但Boss仍存活');return finishRun(true,WW.config.mode[id].name+'目标完成')}
 }
 run.v29.score=Math.round(run.kills+(run.eliteKills||0)*35+run.v29.bossesKilled*600+(run.maxCombo||0)*2+run.time*.15);v29BattleUI()
}
const _v29Update=updateRun;updateRun=function(dt){_v29Update(dt);v29Update(dt)};

const _v29Finish=finishRun;
finishRun=function(victory,reason){
 if(!run?.active)return;let id=run?.v29?.id||save.mode||'story';
 if(id!=='story'&&(String(reason).includes('20分钟到达')||String(reason).includes('坚持20分钟')))return;
 let si=selectedStageInfo(),oldStars=storyStageRecord(si.stage[0]);_v29Finish(victory,reason);if(!lastResult)return;
 v29Ensure();let rule=run?.v29?.rule||v29Rule(id),ms=save.modeStats[id],score=run?.v29?.score||0,bosses=run?.v29?.bossesKilled||0;
 if(id!=='story'||!victory){if(save.chapters[si.chapter]?.stars)save.chapters[si.chapter].stars[si.stage[0]]=oldStars;lastResult.old=oldStars;lastResult.newStars=oldStars;if(!victory)lastResult.stars=0}
 let base=lastResult.gold||0,extra=Math.max(0,Math.round(base*((rule.reward||1)-1))),tokens=rule.tokens||0;if(id==='endless')tokens=Math.max(2,Math.floor(lastResult.time/300)*2+bosses*2);if(!victory)tokens=Math.floor(tokens*.35);
 save.gold+=extra;lastResult.gold+=extra;save.modeTokens+=tokens;ms.runs=(ms.runs||0)+1;if(victory)ms.wins=(ms.wins||0)+1;ms.bestKills=Math.max(ms.bestKills||0,lastResult.kills||0);ms.bestScore=Math.max(ms.bestScore||0,score);
 if(victory&&id!=='endless'&&(ms.bestTime===0||lastResult.time<ms.bestTime))ms.bestTime=lastResult.time;if(id==='endless')ms.bestTime=Math.max(ms.bestTime||0,lastResult.time);if(id==='bossrush')ms.bestBosses=Math.max(ms.bestBosses||0,bosses);
 if(id==='tower'&&victory){let floor=ms.floor||1;ms.bestFloor=Math.max(ms.bestFloor||1,floor);ms.floor=floor+1}if(id==='daily'){if(ms.lastDate!==v29DateKey()){ms.lastDate=v29DateKey();ms.bestScore=score}else ms.bestScore=Math.max(ms.bestScore||0,score)}
 lastResult.modeId=id;lastResult.modeName=WW.config.mode[id].name;lastResult.modeRewardMult=rule.reward;lastResult.modeExtraGold=extra;lastResult.modeTokens=tokens;lastResult.modeScore=score;lastResult.modeBosses=bosses;
 if(run?.v29?.encounterEvidence)lastResult.encounterEvidence=JSON.parse(JSON.stringify(run.v29.encounterEvidence));
 localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(typeof snapshotActiveSlot==='function')snapshotActiveSlot();renderAll();renderResult()
}
const _v29Result=renderResult;renderResult=function(){_v29Result();if(!lastResult||!lastResult.modeName)return;if(lastResult.modeId!=='story')document.getElementById('resultTitle').textContent=lastResult.modeName+' · '+(lastResult.victory?'完成':'失败');let rows=document.getElementById('resultRows'),evidence=lastResult.encounterEvidence,encounterRows=evidence?'<div class="resultRow"><span>遭遇档案</span><b>'+evidence.name+'</b></div><div class="resultRow"><span>实际节奏</span><b>'+evidence.waves.length+' 阶段 · '+evidence.events.length+' 事件 · '+evidence.chests.length+' 宝箱</b></div><div class="resultRow"><span>场地机制</span><b>'+evidence.hazardName+' · '+(evidence.hazardUsed?(evidence.hazardType==='fog'?'峰值 '+Math.round((evidence.hazardPeak||0)*100)+'%':'触发 '+evidence.hazardTriggers+' 次'):'未生效')+'</b></div>'+(evidence.bosses.length?'<div class="resultRow"><span>首领序列</span><b>'+evidence.bosses.map(b=>b.id+' '+b.name).join(' → ')+'</b></div>':''):'';if(rows)rows.innerHTML+=encounterRows+'<div class="resultRow"><span>游戏模式</span><b>'+lastResult.modeName+'</b></div><div class="resultRow"><span>模式评分</span><b>'+lastResult.modeScore+'</b></div><div class="resultRow"><span>奖励倍率</span><b>×'+Number(lastResult.modeRewardMult||1).toFixed(2)+'</b></div><div class="resultRow"><span>模式额外金币</span><b>+'+(lastResult.modeExtraGold||0)+'</b></div><div class="resultRow"><span>万界徽记</span><b>+'+(lastResult.modeTokens||0)+'</b></div>'+(lastResult.modeId==='bossrush'?'<div class="resultRow"><span>Boss击破</span><b>'+lastResult.modeBosses+'/8</b></div>':'');document.getElementById('resStars').textContent=lastResult.modeId==='story'?('★'.repeat(lastResult.stars)+'☆'.repeat(Math.max(0,3-lastResult.stars))):'模式成绩'};

let v29LoadingTimer=null;
startBattle=function(){
 if(v29LoadingTimer)return;v29Ensure();let [ok,why]=v29Unlocked(save.mode);if(!ok){toast(why);go('modes');return}if(save.mode==='story'&&!storyStageUnlocked(save.selectedStage)){toast('前置关卡未完成');go('world');return}v27EnsureInventory();v26MigrateGear();let si=selectedStageInfo(),screen=document.getElementById('loadingScreen'),fill=document.getElementById('loadingFill'),s=save.heroes[save.hero],rule=v29Rule(),bosses=storyBossNames(si.stage[0]),reward=storyStageReward(si.stage[0],0),encounter=rule.storyEncounter;
 document.getElementById('loadingStage').textContent=WW.config.mode[save.mode].name+' · '+WW.config.stage[si.chapter].name+' · '+si.stage[1]+(encounter?' · '+encounter.name:'');document.getElementById('loadingHero').textContent=WW.config.hero[save.hero].name+' Lv.'+s.level+' · '+s.star+'★ · 奖励×'+rule.reward.toFixed(2);document.getElementById('loadingTip').textContent=save.mode==='daily'?('今日挑战：'+v29Daily().name+' · '+v29Daily().desc):save.mode==='story'?((rule.firstCampaign?rule.desc:rule.target)+' · '+encounter.hazard.name+'：'+encounter.hazard.desc+' · '+(bosses.length?'Boss '+bosses.join(' → '):'普通生存关')+' · 基础 '+reward.base+' + 每星 '+(rule.storyContract?.reward?.starGold||0)+' 金币'):rule.desc;fill.style.width='0%';document.getElementById('loadingProgress').textContent='0%';screen.classList.add('show');let p=0;
 v29LoadingTimer=setInterval(()=>{p=Math.min(100,p+19+Math.floor(Math.random()*14));fill.style.width=p+'%';document.getElementById('loadingProgress').textContent=p+'%';if(p>=100){clearInterval(v29LoadingTimer);v29LoadingTimer=null;setTimeout(()=>{screen.classList.remove('show');_v21_startBattle();if(run?.active){v23Init();v24RuntimeInit();v26ApplyLoadout();v27Apply();v28Apply();v29RuntimeInit();v29ApplyMode();run.v26BossLootShown=false;renderHeroMechanic();renderV24Runtime();v25Ensure();renderV26BattleGear();renderV27Battle();v28Battle();v29BattleUI();hint(WW.config.mode[save.mode].name+' · '+v29ObjectiveText())}V21Audio.tone(240,.1,'triangle',.035,160)},100)}},65)
}

const _v29Go=go;go=function(id){
 const briefingPage=id==='briefing'||Object.prototype.hasOwnProperty.call(V29_BRIEFING_EDITORS,id);
 if(v29BriefingContext&&briefingPage){
  if(id==='briefing')v29BriefingContext.editor=null;
  else{v29BriefingContext.editor=id;v29BriefingContext.focusId=V29_BRIEFING_EDITORS[id]}
  v29SyncBriefingContext()
 }else if(v29BriefingContext)v29ClearBriefingContext();
 _v29Go(id);
 if(id==='modes'){document.getElementById('pageTitle').textContent='游戏模式';v29RenderModes()}
 if(id==='briefing')v29RenderBriefing()
};
const _v29Top=renderTop;renderTop=function(){v29Ensure();_v29Top();let e=document.getElementById('topMode');if(e)e.textContent=WW.config.mode[save.mode].name.replace('模式','')};
const _v29All=renderAll;renderAll=function(){_v29All();v29RenderModes();v29RenderBriefing()};
const _v29Boot=v20Boot;v20Boot=function(){v29Ensure();_v29Boot();v29SyncBriefingContext();v29RenderModes();v29RenderBriefing();renderTop()}
