(function(){
 window.WW=window.WW||{};
 WW.ui=WW.ui||{};

 const primary=Object.freeze(['home','heroes','growth','loadout']);
 const secondary=Object.freeze(['build','modes','world']);
 const flowOnly=Object.freeze(['briefing','battle','result']);
 const views=Object.freeze({
  home:Object.freeze({tier:'primary'}),
  heroes:Object.freeze({tier:'primary'}),
  growth:Object.freeze({tier:'primary'}),
  loadout:Object.freeze({tier:'primary'}),
  build:Object.freeze({tier:'secondary'}),
  modes:Object.freeze({tier:'secondary'}),
  world:Object.freeze({tier:'secondary'}),
  briefing:Object.freeze({tier:'flow'}),
  battle:Object.freeze({tier:'flow'}),
  result:Object.freeze({tier:'flow'})
 });

 function sync(id){
  const view=views[id];
  if(!view)return false;
  const battle=id==='battle';
  document.body.dataset.shellView=id;
  document.body.dataset.shellMode=battle?'battle':'standard';
  document.body.classList.toggle('shellBattle',battle);
  document.body.classList.toggle('mobileBattle',battle);
  document.dispatchEvent(new CustomEvent('ui:view-change',{detail:{id,tier:view.tier,battle}}));
  return true;
 }

 WW.ui.shell=Object.freeze({primary,secondary,flowOnly,views,sync});
 sync(document.querySelector('.page.active')?.id||'home');
})();
