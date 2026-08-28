/* loadout */
function loadoutResolve(catalog,id,fallbackId,predicate){
 const valid=predicate||(()=>true),current=catalog?.[id];
 if(current&&valid(current))return{id,item:current};
 const fallback=catalog?.[fallbackId];
 if(fallback&&valid(fallback))return{id:fallbackId,item:fallback};
 const first=Object.entries(catalog||{}).find(([,item])=>item&&valid(item));
 return first?{id:first[0],item:first[1]}:null
}
function loadoutKnown(ids,catalog){return(Array.isArray(ids)?ids:[]).filter(id=>catalog?.[id])}
function renderLoadout(){
 const heroId=WW.config.hero[save.hero]?save.hero:DEFAULT_SAVE.hero,h=WW.config.hero[heroId],st=heroStats(heroId);
 document.getElementById('loadoutHeroName').textContent=h.name;
 document.getElementById('loadoutHeroStats').innerHTML=[['HP',st.hp],['ATK',st.atk],['DEF',st.def],['战力',combatPower()],['攻速',st.aspd],['暴击',st.crit+'%']].map(([n,v])=>'<div><small>'+n+'</small><b>'+v+'</b></div>').join('');
 const es=document.getElementById('equipSlots');es.innerHTML='';
 for(const slot of ['weapon','armor','accessory']){
  const choice=loadoutResolve(WW.config.gear,save.equip?.[slot],DEFAULT_SAVE.equip[slot],item=>item.slot===slot),d=document.createElement('div');
  d.className='slot';d.innerHTML='<b>'+({weapon:'武器',armor:'防具',accessory:'饰品'}[slot])+'</b><small>'+(choice?choice.item.name+' · '+choice.item.score:'待加载')+'</small>';es.appendChild(d)
 }
 const runeChoices=[];
 for(const [index,id] of (save.runes||[]).entries()){
  const choice=loadoutResolve(WW.config.rune,id,DEFAULT_SAVE.runes[index]||DEFAULT_SAVE.runes[0]);
  if(choice&&!runeChoices.some(x=>x.id===choice.id))runeChoices.push(choice)
 }
 document.getElementById('runeSlots').innerHTML=runeChoices.map(x=>'<div class="slot"><b>'+x.item.name+'</b><small>'+x.id+' · '+x.item.score+'</small></div>').join('');
 const petChoice=loadoutResolve(WW.config.pet,save.pet,DEFAULT_SAVE.pet);
 document.getElementById('petSlot').innerHTML=petChoice?'<b>'+petChoice.item.name+'</b><small>'+petChoice.id+' · '+petChoice.item.score+'评分</small>':'<b>待加载</b>';
 const gg=document.getElementById('gearGrid');gg.innerHTML='';
 loadoutKnown(save.inventory?.gear,WW.config.gear).forEach(id=>{const x=WW.config.gear[id],active=Object.values(save.equip||{}).includes(id),d=document.createElement('div');d.className='itemCard '+(active?'active':'');d.innerHTML='<div class="itemIcon">装</div><div class="eyebrow">'+id+'</div><h4>'+x.name+'</h4><p>'+x.slot+' · '+x.score+'评分</p><button class="btn '+(active?'gold':'ghost')+'" style="width:100%" onclick="equipGear(\''+id+'\')">'+(active?'已装备':'装备')+'</button>';gg.appendChild(d)});
 const rg=document.getElementById('runeGrid');rg.innerHTML='';
 loadoutKnown(save.inventory?.runes,WW.config.rune).forEach(id=>{const x=WW.config.rune[id],active=(save.runes||[]).includes(id),d=document.createElement('div');d.className='itemCard '+(active?'active':'');d.innerHTML='<div class="itemIcon">符</div><div class="eyebrow">'+id+'</div><h4>'+x.name+'</h4><p>'+x.score+'评分</p><button class="btn '+(active?'purple':'ghost')+'" style="width:100%" onclick="toggleRune(\''+id+'\')">'+(active?'卸下':'装备')+'</button>';rg.appendChild(d)});
 const pg=document.getElementById('petGrid');pg.innerHTML='';
 loadoutKnown(save.inventory?.pets,WW.config.pet).forEach(id=>{const x=WW.config.pet[id],active=save.pet===id,d=document.createElement('div');d.className='itemCard '+(active?'active':'');d.innerHTML='<div class="itemIcon">宠</div><div class="eyebrow">'+id+'</div><h4>'+x.name+'</h4><p>'+x.score+'评分</p><button class="btn '+(active?'gold':'ghost')+'" style="width:100%" onclick="setPet(\''+id+'\')">'+(active?'主宠':'设为主宠')+'</button>';pg.appendChild(d)})
}
function focusLoadoutBay(type){
 const target=document.querySelector('[data-loadout-bay="'+type+'"]'),scroller=target?.closest('.armoryInventoryScroll');
 if(!target||!scroller)return;
 document.querySelectorAll('[data-loadout-target]').forEach(button=>{
  const active=button.dataset.loadoutTarget===type;
  button.setAttribute('aria-pressed',String(active))
 });
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 target.focus({preventScroll:true});
 scroller.scrollTo({top:Math.max(0,target.offsetTop-scroller.offsetTop-8),behavior:reduced?'auto':'smooth'})
}
function equipGear(id){const item=WW.config.gear[id];if(!item)return;save.equip[item.slot]=id;persist()}
function toggleRune(id){if(!WW.config.rune[id])return;const i=save.runes.indexOf(id);if(i>=0)save.runes.splice(i,1);else{if(save.runes.length>=3)save.runes.shift();save.runes.push(id)}persist()}
function setPet(id){if(!WW.config.pet[id])return;save.pet=id;persist()}
function autoBest(){
 for(const slot of ['weapon','armor','accessory']){
  const arr=loadoutKnown(save.inventory?.gear,WW.config.gear).filter(id=>WW.config.gear[id].slot===slot).sort((a,b)=>WW.config.gear[b].score-WW.config.gear[a].score);
  if(arr[0])save.equip[slot]=arr[0]
 }
 save.runes=loadoutKnown(save.inventory?.runes,WW.config.rune).sort((a,b)=>WW.config.rune[b].score-WW.config.rune[a].score).slice(0,3);
 const pets=loadoutKnown(save.inventory?.pets,WW.config.pet).sort((a,b)=>WW.config.pet[b].score-WW.config.pet[a].score);if(pets[0])save.pet=pets[0];
 persist();toast('已应用最高评分配置')
}
