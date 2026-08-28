(function(){
 window.WW=window.WW||{};
 WW.ui=WW.ui||{};

 function setText(id,value){
  const node=document.getElementById(id);
  if(node)node.textContent=value;
 }

 function render(){
  const root=document.querySelector('[data-scene-lobby]');
  if(!root||typeof save==='undefined')return false;
  const info=selectedStageInfo(),chapter=WW.config.stage[info.chapter],hero=WW.config.hero[save.hero],contract=info.stage[5]||{},handoff=typeof v29CampaignHandoff==='function'?v29CampaignHandoff():null,aligned=handoff?.stageId===save.selectedStage;
  const handoffState=aligned&&handoff.kind==='next'?'next':aligned&&handoff.kind==='retry'?'retry':aligned&&handoff.kind==='complete'?'complete':'current';
  root.dataset.chapter=info.chapter;
  root.dataset.campaignHandoff=handoffState;
  root.style.setProperty('--nexus-accent',hero.color);
  setText('nexusStageName',info.stage[1]);
  setText('nexusObjective',contract.objective||chapter.desc);
  setText('nexusChapterName',chapter.name);
  setText('nexusMissionState',handoffState==='next'?'下一任务已同步':handoffState==='retry'?'重试任务已同步':handoffState==='complete'?'主线战役已完成':'当前任务已同步');
  setText('nexusHeroSkill',hero.skill+' · '+hero.ult);
  setText('nexusSkillName',hero.skill);
  setText('nexusUltName',hero.ult);
  setText('nexusPower',combatPower().toLocaleString());
  setText('nexusActionHint',contract.bosses?.length?'选择规则并迎战 '+storyBossNames(info.stage[0]).join('、'):'选择规则并进入 '+info.stage[1]);
  setText('startCurrentHero',hero.name);
  setText('startCurrentStage',info.stage[1]);
  const art=document.getElementById('nexusHeroArt');
  if(art&&typeof v22HeroAvatarHTML==='function')art.innerHTML=v22HeroAvatarHTML(save.hero,'nexusAvatar');
  return true;
 }

 document.addEventListener('ui:view-change',event=>{if(event.detail?.id==='home')render()});
 WW.ui.nexusHub=Object.freeze({render});
 render();
})();
