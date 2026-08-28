/* result */
function finishRun(victory,reason){
 if(!run.active)return;if(typeof v34UpdateObjectives==='function')v34UpdateObjectives();const objectiveSnapshot=typeof v34ObjectiveProjection==='function'?v34ObjectiveProjection():[],timedRewardSnapshot=typeof v34TimedRewardProjection==='function'?v34TimedRewardProjection():[],heroId=save.hero,buildSnapshot={active:[...save.build.active],passive:[...save.build.passive]};run.active=false;run.paused=true;finalizeDrops();const si=selectedStageInfo(),storyMode=(run?.v29?.id||save.mode||'story')==='story',old=storyStageRecord(si.stage[0]),stars=storyMode?storyStarAward(victory,player.hp,player.maxHp,si.stage[0]):victory?(player.hp/player.maxHp>.55?3:2):1,newStars=storyMode?storyBestStars(si.stage[0],stars):Math.max(old,stars),reward=storyStageReward(si.stage[0],stars),baseGoldAward=victory?reward.base:Math.floor(reward.base*.35),starGoldAward=victory?reward.star:0,gold=baseGoldAward+starGoldAward,masteryGain=Math.max(5,Math.round(run.time/30+run.kills*.04));
 save.chapters[si.chapter].stars[si.stage[0]]=newStars;save.gold+=gold;save.heroes[save.hero].mastery+=masteryGain;save.stats.runs++;save.stats.kills+=run.kills;if(si.stage[2]&&victory)save.stats.bossKills++;
 lastResult={victory,reason,stage:si.stage,chapter:si.chapter,time:run.time,kills:run.kills,stars,gold,old,newStars,baseGoldAward,starGoldAward,storyReward:storyMode,masteryGain,drops:[...run.drops],evo:Object.keys(run.evolved).filter(x=>run.evolved[x]).length,fusion:Object.keys(run.fused).filter(x=>run.fused[x]).length,maxCombo:run.maxCombo,damageBy:{...run.damageBy},eliteKills:run.eliteKills,objectives:objectiveSnapshot,timedRewards:timedRewardSnapshot,heroId,build:buildSnapshot};
 persist();renderResult();go('result')
}
function v34ObjectiveResults(){
 const el=document.getElementById('resultObjectiveSummary'),objectives=lastResult?.objectives||[];if(!el)return;
 el.innerHTML=objectives.length?objectives.map(objective=>'<div data-state="'+objective.state+'"><span>'+(objective.state==='complete'?'✓ 已完成':'○ 未完成')+'</span><b>'+objective.label+'</b><small>'+Math.min(objective.current,objective.target)+' / '+objective.target+'</small></div>').join(''):'<p class="tiny">本局没有目标快照</p>'
}
function v34TimedRewardResults(){
 const el=document.getElementById('resultTimedRewardSummary'),rewards=lastResult?.timedRewards||[];if(!el)return;
 el.innerHTML=rewards.length?rewards.map((reward,index)=>'<div data-state="'+reward.state+'"><span>0'+(index+1)+' · '+fmt(reward.at)+'</span><b>'+(reward.state==='claimed'?'已领取':'未领取')+'</b></div>').join(''):'<p class="tiny">本局没有定时奖励快照</p>'
}
function v34ReplayAdvice(result=lastResult){
 if(!result)return'完成一局后生成重玩建议。';const hero=WW.config.hero?.[result.heroId],objectives=result.objectives||[],rewards=result.timedRewards||[],missedObjective=objectives.find(objective=>objective.state!=='complete'),missedReward=rewards.find(reward=>reward.state!=='claimed'),active=result.build?.active?.[0],passive=result.build?.passive?.[0],buildText=[active&&skillName(active),passive&&skillName(passive)].filter(Boolean).join(' + ');
 if(missedObjective)return(hero?.name||result.heroId)+' 下局优先完成「'+missedObjective.label+'」，并围绕 '+(buildText||'当前构筑')+' 保持推进节奏。';
 if(missedReward)return(hero?.name||result.heroId)+' 已完成目标；下局留意 '+fmt(missedReward.at)+' 节点，及时领取三选一强化。';
 return(hero?.name||result.heroId)+' 与 '+(buildText||'当前构筑')+' 已跑通闭环；可重玩同一关卡，尝试更早完成支线与 Boss 战利品归档。'
}
function renderResult(){
 if(!lastResult)return;const r=lastResult,page=document.getElementById('result'),bossLoot=r.drops.find(drop=>drop.source==='boss');if(page)page.dataset.resultOutcome=r.victory?'victory':'defeat';document.getElementById('resultState').textContent=r.victory?'VICTORY':'DEFEAT';document.getElementById('resultTitle').textContent=r.stage[1]+' · '+(r.victory?'胜利':'战败');document.getElementById('resultReason').textContent=r.reason;document.getElementById('resTime').textContent=fmt(r.time);document.getElementById('resKills').textContent=r.kills;document.getElementById('resStars').textContent='★'.repeat(r.stars)+'☆'.repeat(3-r.stars);document.getElementById('resGold').textContent='+'+r.gold;
 document.getElementById('resultRows').innerHTML='<div class="resultRow"><span>章节星</span><b>'+r.old+' → '+r.newStars+'</b></div>'+(bossLoot?'<div class="resultRow bossLootArchive"><span>Boss战利品</span><b>'+bossLoot.name+' · 已归档</b></div>':'')+(r.storyReward?'<div class="resultRow"><span>关卡金币</span><b>'+(r.victory?'基础 +'+r.baseGoldAward+' · 星级 +'+r.starGoldAward:'失败保底 +'+r.baseGoldAward+' · 星级 +0')+'</b></div>':'')+'<div class="resultRow"><span>英雄熟练度</span><b>+'+r.masteryGain+'</b></div><div class="resultRow"><span>本局进化</span><b>'+r.evo+'</b></div><div class="resultRow"><span>本局融合</span><b>'+r.fusion+'</b></div><div class="resultRow"><span>精英击杀</span><b>'+r.eliteKills+'</b></div><div class="resultRow"><span>最大连击</span><b>'+r.maxCombo+'</b></div>';
 const dg=document.getElementById('dropGrid');dg.innerHTML='';if(r.drops.length){r.drops.forEach(d=>{const x=document.createElement('div');x.className='dropCard';x.innerHTML='<b>'+d.name+'</b><small>'+d.id+' · '+d.rarity+' · '+d.source+'</small>';dg.appendChild(x)})}else dg.innerHTML='<div class="tiny">本局无装备掉落</div>';
 renderDamageList('resultDamage',r.damageBy);v34ObjectiveResults();v34TimedRewardResults();document.getElementById('resultReplayAdvice').textContent=v34ReplayAdvice(r)
}

function renderSettingsToggles(){['shake','numbers','particles','vignette'].forEach(k=>{const el=document.getElementById(k+'Toggle'),enabled=!!save.settings[k];if(el){el.classList.toggle('on',enabled);el.setAttribute('aria-checked',String(enabled))}})}
function renderAll(){recomputeWorldUnlocks();renderTop();renderHeroes();renderLoadout();renderBuild();renderWorld();renderSettingsToggles();if(document.getElementById('battle').classList.contains('active'))renderRunSide()}
function loop(now){const dt=Math.min(.034,(now-last)/1000||0);last=now;updateRun(dt);drawBattleFrame(dt);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
renderAll();resizeArena();
