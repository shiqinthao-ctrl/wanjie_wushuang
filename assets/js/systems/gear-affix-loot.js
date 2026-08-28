/* ================= V2.6 Gear Affix & Loot Build ================= */
window.WW.config.gearSystem=window.WW.config.gearSystem||{};
window.WW.config.gearSystem.catalog={
 // 武器 EQW001–EQW010
 EQW001:{name:'赤炎刀',slot:'weapon',score:315,rarity:'purple',set:'SET_FIRE',exclusive:'H001',legend:'烈焰斩击范围+12%，火系伤害+8%。'},
 EQW002:{name:'雷鸣枪',slot:'weapon',score:330,rarity:'purple',set:'SET_THUNDER',exclusive:'H002',legend:'雷系技能获得额外弹射倾向。'},
 EQW003:{name:'玄铁神棍',slot:'weapon',score:350,rarity:'gold',set:'SET_MONKEY',exclusive:'H007',legend:'召唤伤害+12%，斗战分身上限提高。'},
 EQW004:{name:'炎忍苦无',slot:'weapon',score:325,rarity:'purple',set:'SET_BLAZE',exclusive:'H010',legend:'爆炸范围+15%，闪避爆符强化。'},
 EQW005:{name:'万影短刃',slot:'weapon',score:335,rarity:'purple',set:'SET_SHADOW',exclusive:'H012',legend:'暗器穿透+1，影系暴击+5%。'},
 EQW006:{name:'星河拳环',slot:'weapon',score:345,rarity:'gold',set:'SET_KI',exclusive:'H019',legend:'气功弹穿透+1，气能蓄积速度提高。'},
 EQW007:{name:'黄天战刃',slot:'weapon',score:405,rarity:'gold',set:'SET_CHAOS',boss:'B001',legend:'对Boss伤害+12%；击破护盾时提升攻击。'},
 EQW008:{name:'牛魔战棍',slot:'weapon',score:430,rarity:'gold',set:'SET_YAOLING',boss:'B006',legend:'范围伤害+14%，近身技能对精英伤害提高。'},
 EQW009:{name:'万影妖刀',slot:'weapon',score:455,rarity:'gold',set:'SET_NINJABOSS',boss:'B011',legend:'暗影技能额外分裂，Boss阶段3伤害提高。'},
 EQW010:{name:'裂界神刃',slot:'weapon',score:480,rarity:'gold',set:'SET_RIFT',legend:'全元素伤害+10%，融合技能伤害+15%。'},
 // 防具 EQA001–EQA010
 EQA001:{name:'炎龙战甲',slot:'armor',score:250,rarity:'purple',set:'SET_FIRE',legend:'最大生命+8%，火焰领域范围+8%。'},
 EQA002:{name:'雷神战铠',slot:'armor',score:255,rarity:'purple',set:'SET_THUNDER',legend:'闪避后雷势+12%。'},
 EQA003:{name:'斗战金甲',slot:'armor',score:275,rarity:'gold',set:'SET_MONKEY',legend:'召唤物数量倾向+1，受到近战伤害降低。'},
 EQA004:{name:'炎忍战装',slot:'armor',score:260,rarity:'purple',set:'SET_BLAZE',legend:'英雄技冷却-6%，移动速度+5%。'},
 EQA005:{name:'万影忍装',slot:'armor',score:265,rarity:'purple',set:'SET_SHADOW',legend:'影印衰减减缓，暴击伤害提高。'},
 EQA006:{name:'星河武衣',slot:'armor',score:270,rarity:'gold',set:'SET_KI',legend:'气功技能冷却-6%，最大生命+5%。'},
 EQA007:{name:'混沌骑甲',slot:'armor',score:410,rarity:'gold',set:'SET_CHAOS',boss:'B003',legend:'Boss预警期间移动速度+10%。'},
 EQA008:{name:'炎狱忍装',slot:'armor',score:425,rarity:'gold',set:'SET_NINJABOSS',boss:'B009',legend:'火/暗影伤害提高，地图危险伤害降低。'},
 EQA009:{name:'妖王战铠',slot:'armor',score:420,rarity:'gold',set:'SET_YAOLING',legend:'精英伤害+15%，击杀精英恢复生命。'},
 EQA010:{name:'万界神衣',slot:'armor',score:470,rarity:'gold',set:'SET_RIFT',legend:'最大生命+12%，所有冷却缩减提高。'},
 // 饰品 EQX001–EQX010
 EQX001:{name:'炎龙核心',slot:'accessory',score:265,rarity:'purple',set:'SET_FIRE',legend:'火系爆炸命中有概率扩大燃烧区域。'},
 EQX002:{name:'雷霆勾玉',slot:'accessory',score:270,rarity:'purple',set:'SET_THUNDER',legend:'雷电弹/雷枪弹射次数提高。'},
 EQX003:{name:'斗战战印',slot:'accessory',score:285,rarity:'gold',set:'SET_MONKEY',legend:'分身攻击速度提高，范围强化。'},
 EQX004:{name:'爆炎卷轴',slot:'accessory',score:268,rarity:'purple',set:'SET_BLAZE',legend:'爆符和爆裂弹的爆炸半径提高。'},
 EQX005:{name:'影界勾玉',slot:'accessory',score:275,rarity:'purple',set:'SET_SHADOW',legend:'手里剑分裂层数+1。'},
 EQX006:{name:'星河核心',slot:'accessory',score:282,rarity:'gold',set:'SET_KI',legend:'气功领域范围+12%，穿透伤害提高。'},
 EQX007:{name:'妖师法印',slot:'accessory',score:400,rarity:'gold',set:'SET_CHAOS',boss:'B002',legend:'对护盾目标伤害提高；元素伤害+8%。'},
 EQX008:{name:'魔猿战印',slot:'accessory',score:435,rarity:'gold',set:'SET_YAOLING',boss:'B008',legend:'召唤与范围技能伤害提高。'},
 EQX009:{name:'雷瞬勾玉',slot:'accessory',score:440,rarity:'gold',set:'SET_NINJABOSS',boss:'B010',legend:'闪避后短时间暴击率提高。'},
 EQX010:{name:'万界印记',slot:'accessory',score:475,rarity:'gold',set:'SET_RIFT',legend:'融合/进化技能伤害和范围同时提高。'}
};
Object.assign(WW.config.gear,WW.config.gearSystem.catalog);

window.WW.config.gearSystem.sets={
 SET_FIRE:{name:'炎龙',two:'火系伤害 +18%',three:'火系范围 +12%，持续强化视为+1级',bonus2:{fireDmg:.18},bonus3:{area:.12,virtual:{P017:1}}},
 SET_THUNDER:{name:'九天雷霆',two:'雷系伤害 +18%',three:'弹射能力显著提高',bonus2:{lightningDmg:.18},bonus3:{virtual:{P023:2}}},
 SET_MONKEY:{name:'斗战',two:'召唤伤害 +18%，范围 +8%',three:'召唤数量倾向 +2',bonus2:{summonDmg:.18,area:.08},bonus3:{virtual:{P039:2,P036:1}}},
 SET_BLAZE:{name:'炎忍爆破',two:'火系伤害 +12%，冷却 -8%',three:'分裂/爆炸能力提高',bonus2:{fireDmg:.12,cdr:.08},bonus3:{virtual:{P024:1,P010:1}}},
 SET_SHADOW:{name:'万影',two:'暗影伤害 +16%，暴击 +6%',three:'手里剑分裂 +2级倾向',bonus2:{shadowDmg:.16,crit:.06},bonus3:{virtual:{P024:2}}},
 SET_KI:{name:'星河',two:'气系伤害 +18%，冷却 -8%',three:'穿透+1级倾向，气功范围 +10%',bonus2:{kiDmg:.18,cdr:.08},bonus3:{virtual:{P022:1},area:.10}},
 SET_CHAOS:{name:'乱世混沌',two:'Boss伤害 +20%',three:'全元素 +10%，对护盾伤害提高',bonus2:{bossDmg:.20},bonus3:{allElement:.10,shieldDmg:.25}},
 SET_YAOLING:{name:'妖王斗战',two:'精英伤害 +20%，范围 +10%',three:'召唤/近战伤害 +15%',bonus2:{eliteDmg:.20,area:.10},bonus3:{summonDmg:.15,physicalDmg:.15}},
 SET_NINJABOSS:{name:'忍王残响',two:'火/暗影伤害 +12%',three:'分裂 +1级、暴击伤害 +18%',bonus2:{fireDmg:.12,shadowDmg:.12},bonus3:{virtual:{P024:1},critDmg:.18}},
 SET_RIFT:{name:'万界裂隙',two:'全伤害 +12%',three:'进化/融合伤害 +22%，范围 +12%',bonus2:{allDamage:.12},bonus3:{evoFusionDmg:.22,area:.12}}
};
window.WW.config.gearSystem.affixPool=[
 ['atkPct','攻击%',.035,.085],['hpPct','生命%',.04,.10],['defPct','防御%',.05,.12],['crit','暴击率',.018,.055],['critDmg','暴击伤害',.06,.16],
 ['cdr','冷却缩减',.025,.07],['area','范围',.03,.09],['move','移动速度',.02,.06],['bossDmg','Boss伤害',.04,.12],['eliteDmg','精英伤害',.05,.14],
 ['fireDmg','火系伤害',.04,.13],['lightningDmg','雷系伤害',.04,.13],['shadowDmg','暗影伤害',.04,.13],['kiDmg','气系伤害',.04,.13],
 ['summonDmg','召唤伤害',.05,.15],['lifesteal','吸血',.006,.018]
];
window.WW.config.gearSystem.rarityAffixCounts={blue:2,purple:3,gold:4,mythic:5};
window.WW.config.gearSystem.bossDrops={
 B001:['EQW007','EQA007','EQX007'],B002:['EQX007','EQW007','EQA007'],B003:['EQA007','EQW007','EQX007'],
 B006:['EQW008','EQA009','EQX008'],B008:['EQX008','EQW008','EQA009'],
 B009:['EQA008','EQW009','EQX009'],B010:['EQX009','EQA008','EQW009'],B011:['EQW009','EQA008','EQX009']
};

function v26Uid(){return 'G'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function v26Rand(a,b){return a+Math.random()*(b-a)}
function v26AffixLabel(a){
 const map=Object.fromEntries(WW.config.gearSystem.affixPool.map(x=>[x[0],x[1]]));
 return map[a.key]||a.key
}
function v26AffixValue(a){
 const pct=['atkPct','hpPct','defPct','crit','critDmg','cdr','area','move','bossDmg','eliteDmg','fireDmg','lightningDmg','shadowDmg','kiDmg','summonDmg','lifesteal'];
 return pct.includes(a.key)?'+'+(a.value*100).toFixed(a.key==='lifesteal'?1:1)+'%':String(a.value)
}
function v26CreateInstance(templateId,source='drop',rarityOverride=null,fixed=false){
 const t=WW.config.gearSystem.catalog[templateId]||WW.config.gear[templateId];if(!t)return null;
 let rarity=rarityOverride||t.rarity||'blue';
 const count=WW.config.gearSystem.rarityAffixCounts[rarity]||2,pool=WW.config.gearSystem.affixPool.slice().sort(()=>Math.random()-.5).slice(0,count);
 const affixes=pool.map(([key,label,min,max],i)=>({key,value:fixed?(min+max)/2:v26Rand(min,max)}));
 return {uid:v26Uid(),templateId,id:templateId,name:t.name,slot:t.slot,rarity,score:t.score,source,affixes,acquiredAt:Date.now()}
}
function v26InstanceScore(inst){
 if(!inst)return 0;const t=WW.config.gearSystem.catalog[inst.templateId]||WW.config.gear[inst.templateId];let s=t?.score||inst.score||0;
 for(const a of inst.affixes||[])s+=Math.round(a.value*600);if(inst.rarity==='mythic')s+=90;
 if(t?.exclusive===save.hero)s+=45;return Math.round(s)
}
function v26MigrateGear(){
 if(!save.inventory.gearInstances)save.inventory.gearInstances=[];
 const ids=[...new Set([...(save.inventory.gear||[]),...Object.values(save.equip||{})])].filter(id=>WW.config.gear[id]);
 ids.forEach(id=>{if(!save.inventory.gearInstances.some(x=>x.templateId===id)){const inst=v26CreateInstance(id,'legacy',WW.config.gear[id].rarity,true);inst.uid='LEGACY_'+id;save.inventory.gearInstances.push(inst)}});
 if(!save.equipInst)save.equipInst={};
 ['weapon','armor','accessory'].forEach(slot=>{
   const old=save.equip?.[slot],match=save.inventory.gearInstances.find(x=>x.templateId===old&&x.slot===slot)||save.inventory.gearInstances.find(x=>x.slot===slot);
   if(!save.equipInst[slot]&&match)save.equipInst[slot]=match.uid
 });
 if(save.inventory.gearInstances.length>70)save.inventory.gearInstances=save.inventory.gearInstances.slice(-70)
}
function v26Inst(uid){return save.inventory.gearInstances?.find(x=>x.uid===uid)||null}
function v26Equipped(){return ['weapon','armor','accessory'].map(slot=>v26Inst(save.equipInst?.[slot])).filter(Boolean)}
function v26SetCounts(){const o={};v26Equipped().forEach(i=>{const s=WW.config.gearSystem.catalog[i.templateId]?.set;if(s)o[s]=(o[s]||0)+1});return o}
function v26MergeBonus(dst,src){
 if(!src)return dst;
 for(const [k,v] of Object.entries(src)){if(k==='virtual'){dst.virtual=dst.virtual||{};for(const [p,n] of Object.entries(v))dst.virtual[p]=(dst.virtual[p]||0)+n}else dst[k]=(dst[k]||0)+v}
 return dst
}
function v26Bonuses(){
 const b={virtual:{},atkPct:0,hpPct:0,defPct:0,crit:0,critDmg:0,cdr:0,area:0,move:0,bossDmg:0,eliteDmg:0,fireDmg:0,lightningDmg:0,shadowDmg:0,kiDmg:0,summonDmg:0,lifesteal:0,allDamage:0,allElement:0,evoFusionDmg:0,physicalDmg:0,shieldDmg:0};
 for(const inst of v26Equipped()){
   const t=WW.config.gearSystem.catalog[inst.templateId];
   for(const a of inst.affixes||[])b[a.key]=(b[a.key]||0)+a.value;
   if(t?.exclusive===save.hero){b.atkPct+=.08;b.crit+=.025}
   if(inst.templateId==='EQW001')b.fireDmg+=.08;
   if(inst.templateId==='EQW002')b.virtual.P023=(b.virtual.P023||0)+1;
   if(inst.templateId==='EQW003'){b.summonDmg+=.12;b.virtual.P039=(b.virtual.P039||0)+1}
   if(inst.templateId==='EQW004')b.area+=.10;
   if(inst.templateId==='EQW005')b.virtual.P022=(b.virtual.P022||0)+1;
   if(inst.templateId==='EQW006'){b.virtual.P022=(b.virtual.P022||0)+1;b.kiDmg+=.08}
   if(inst.templateId==='EQX002')b.virtual.P023=(b.virtual.P023||0)+1;
   if(inst.templateId==='EQX003')b.virtual.P036=(b.virtual.P036||0)+1;
   if(inst.templateId==='EQX004')b.area+=.08;
   if(inst.templateId==='EQX005')b.virtual.P024=(b.virtual.P024||0)+1;
   if(inst.templateId==='EQX006')b.area+=.08;
 }
 const counts=v26SetCounts();
 for(const [set,n] of Object.entries(counts)){const s=WW.config.gearSystem.sets[set];if(!s)continue;if(n>=2)v26MergeBonus(b,s.bonus2);if(n>=3)v26MergeBonus(b,s.bonus3)}
 return b
}
gearScore=function(){return v26Equipped().reduce((s,i)=>s+v26InstanceScore(i),0)}

/* 30 exact templates are placed in inventory discovery pool; starter save only owns migrated pieces + drops. */
function v26TemplateSetName(id){const set=WW.config.gearSystem.catalog[id]?.set;return WW.config.gearSystem.sets[set]?.name||'散件'}
function v26GearCard(inst,equipped=false,choice=false){
 const t=WW.config.gearSystem.catalog[inst.templateId],score=v26InstanceScore(inst),exclusive=t?.exclusive?WW.config.hero[t.exclusive]?.name:null;
 const aff=(inst.affixes||[]).map(a=>'<div class="gearAffix"><span>'+v26AffixLabel(a)+'</span><b>'+v26AffixValue(a)+'</b></div>').join('');
 const tag=choice?'button':'div',attrs=choice?' type="button"':'';
 return '<'+tag+attrs+' class="'+(choice?'gearChoiceCard':'itemCard')+' '+(typeof v22RarityClass==='function'?v22RarityClass(inst.rarity):'')+' '+(equipped?'active':'')+'" style="position:relative">'+
 '<div class="rarityRibbon">'+(typeof v22RarityName==='function'?v22RarityName(inst.rarity):inst.rarity)+'</div>'+
 '<div class="itemIcon">装</div><div class="eyebrow">'+inst.templateId+'</div><h3>'+inst.name+'</h3>'+
 '<div class="score">'+score+' <small style="font-size:7px;color:#68768a">评分</small></div>'+
 '<span class="gearSetTag">'+v26TemplateSetName(inst.templateId)+'</span>'+(exclusive?'<span class="gearExclusive">'+exclusive+'专属</span>':'')+
 '<div class="gearAffixes">'+aff+'</div><div class="gearLegendary">'+(t?.legend||'无传奇特效')+'</div>'+
 '<div class="source">'+(t?.boss?'<span class="bossDropBadge">'+t.boss+'专属池</span> ':'')+'来源：'+inst.source+'</div></'+tag+'>'
}

/* ---------- Loadout UI ---------- */
renderLoadout=function(){
 v26MigrateGear();
 const h=WW.config.hero[save.hero],st=heroStats(save.hero),b=v26Bonuses();
 document.getElementById('loadoutHeroName').textContent=h.name;
 document.getElementById('loadoutHeroStats').innerHTML=[['HP',Math.round(st.hp*(1+b.hpPct))],['ATK',Math.round(st.atk*(1+b.atkPct))],['DEF',Math.round(st.def*(1+b.defPct))],['战力',combatPower()],['暴击',(st.crit+b.crit*100).toFixed(1)+'%'],['装备',gearScore()]].map(([n,v])=>'<div><small>'+n+'</small><b>'+v+'</b></div>').join('');
 const es=document.getElementById('equipSlots');es.innerHTML='';
 for(const slot of ['weapon','armor','accessory']){const inst=v26Inst(save.equipInst?.[slot]),d=document.createElement('div');d.className='slot '+(inst?(typeof v22RarityClass==='function'?v22RarityClass(inst.rarity):''):'');d.innerHTML=inst?'<b>'+({weapon:'武器',armor:'防具',accessory:'饰品'}[slot])+' · '+inst.name+'</b><small>'+inst.templateId+' · '+v26InstanceScore(inst)+'评分 · '+v26TemplateSetName(inst.templateId)+'</small>':'<b>空槽</b>';es.appendChild(d)}
 document.getElementById('runeSlots').innerHTML=save.runes.map(id=>'<div class="slot"><b>'+WW.config.rune[id].name+'</b><small>'+id+' · '+WW.config.rune[id].score+'</small></div>').join('');
 document.getElementById('petSlot').innerHTML='<b>'+WW.config.pet[save.pet].name+'</b><small>'+save.pet+' · '+WW.config.pet[save.pet].score+'评分</small>';
 const bonusEl=document.getElementById('v26LoadoutBonuses');if(bonusEl)bonusEl.innerHTML=[
   ['攻击','+'+(b.atkPct*100).toFixed(1)+'%'],['暴击','+'+(b.crit*100).toFixed(1)+'%'],['冷却','-'+(b.cdr*100).toFixed(1)+'%'],
   ['范围','+'+(b.area*100).toFixed(1)+'%'],['Boss','+'+(b.bossDmg*100).toFixed(1)+'%'],['吸血','+'+(b.lifesteal*100).toFixed(1)+'%']
 ].map(([n,v])=>'<div class="bonusBox"><small>'+n+'</small><b>'+v+'</b></div>').join('');
 const setEl=document.getElementById('v26SetSummary'),counts=v26SetCounts();if(setEl)setEl.innerHTML=Object.entries(WW.config.gearSystem.sets).map(([id,s])=>{let n=counts[id]||0;return '<div class="setRow '+(n>=2?'active':'')+'"><div class="setRowHead"><b>'+s.name+'</b><span>'+n+'/3</span></div><div class="setEffect '+(n>=2?'on':'')+'">2件：'+s.two+'</div><div class="setEffect '+(n>=3?'on':'')+'">3件：'+s.three+'</div></div>'}).join('');
 const gg=document.getElementById('gearGrid');gg.innerHTML='';
 (save.inventory.gearInstances||[]).slice().sort((a,b)=>v26InstanceScore(b)-v26InstanceScore(a)).forEach(inst=>{
   const equipped=Object.values(save.equipInst||{}).includes(inst.uid),wrap=document.createElement('div');wrap.innerHTML=v26GearCard(inst,equipped,false);const card=wrap.firstElementChild;
   const actions=document.createElement('div');actions.className='actions';actions.innerHTML='<button class="btn '+(equipped?'gold':'ghost')+'" style="width:100%" onclick="v26Equip(\''+inst.uid+'\')">'+(equipped?'已装备':'装备')+'</button>';
   if(!equipped)actions.innerHTML+='<button class="btn ghost" style="width:100%" onclick="v26Salvage(\''+inst.uid+'\')">分解</button>';card.appendChild(actions);gg.appendChild(card)
 });
 const rg=document.getElementById('runeGrid');rg.innerHTML='';save.inventory.runes.forEach(id=>{const x=WW.config.rune[id],active=save.runes.includes(id),d=document.createElement('div');d.className='itemCard '+(active?'active':'');d.innerHTML='<div class="itemIcon">符</div><div class="eyebrow">'+id+'</div><h4>'+x.name+'</h4><p>'+x.score+'评分</p><button class="btn '+(active?'purple':'ghost')+'" style="width:100%" onclick="toggleRune(\''+id+'\')">'+(active?'卸下':'装备')+'</button>';rg.appendChild(d)});
 const pg=document.getElementById('petGrid');pg.innerHTML='';save.inventory.pets.forEach(id=>{const x=WW.config.pet[id],active=save.pet===id,d=document.createElement('div');d.className='itemCard '+(active?'active':'');d.innerHTML='<div class="itemIcon">宠</div><div class="eyebrow">'+id+'</div><h4>'+x.name+'</h4><p>'+x.score+'评分</p><button class="btn '+(active?'gold':'ghost')+'" style="width:100%" onclick="setPet(\''+id+'\')">'+(active?'主宠':'设为主宠')+'</button>';pg.appendChild(d)})
}
function v26Equip(uid){
 const inst=v26Inst(uid);if(!inst)return;save.equipInst[inst.slot]=uid;save.equip[inst.slot]=inst.templateId;persist();toast('已装备 '+inst.name)
}
function v26Salvage(uid){
 const inst=v26Inst(uid);if(!inst||Object.values(save.equipInst||{}).includes(uid))return;
 const gain=Math.max(80,Math.round(v26InstanceScore(inst)*.42));save.inventory.gearInstances=save.inventory.gearInstances.filter(x=>x.uid!==uid);save.gold+=gain;persist();toast('分解 '+inst.name+' · +'+gain+'金币')
}
autoBest=function(){
 v26MigrateGear();
 for(const slot of ['weapon','armor','accessory']){
   const arr=save.inventory.gearInstances.filter(x=>x.slot===slot).sort((a,b)=>v26InstanceScore(b)-v26InstanceScore(a));if(arr[0]){save.equipInst[slot]=arr[0].uid;save.equip[slot]=arr[0].templateId}
 }
 save.runes=save.inventory.runes.slice().sort((a,b)=>WW.config.rune[b].score-WW.config.rune[a].score).slice(0,3);save.pet=save.inventory.pets.slice().sort((a,b)=>WW.config.pet[b].score-WW.config.pet[a].score)[0];persist();toast('已应用最高评分配置')
}

/* ---------- Combat link ---------- */
function v26ApplyLoadout(){
 const b=v26Bonuses();run.v26={bonus:b,exclusive:v26Equipped().filter(i=>WW.config.gearSystem.catalog[i.templateId]?.exclusive===save.hero).map(i=>i.templateId),sets:v26SetCounts()};
 player.maxHp*=1+b.hpPct;player.hp=player.maxHp;player.atk*=1+b.atkPct;player.speed*=1+b.move;player.crit=Math.min(.65,player.crit+b.crit);
 renderV26BattleGear()
}
function v26SourceElement(source){
 if(WW.config.skillForms.descriptions?.[source])return v24Element(source);
 if(String(source).startsWith('F'))return source==='F005'||source==='F006'?'lightning':source==='F020'||source==='F021'?'ki':source==='F026'?'shadow':source==='F033'?'physical':'fire';
 if(String(source).startsWith('H001')||String(source).startsWith('H010'))return'fire';
 if(String(source).startsWith('H002'))return'lightning';
 if(String(source).startsWith('H012'))return'shadow';
 if(String(source).startsWith('H019'))return'ki';
 return'physical'
}
function v26DamageMult(source,targetType='normal'){
 const b=run?.v26?.bonus||v26Bonuses(),el=v26SourceElement(source);let m=1+b.allDamage+(b.allElement||0);
 if(el==='fire')m+=b.fireDmg||0;if(el==='lightning')m+=b.lightningDmg||0;if(el==='shadow')m+=b.shadowDmg||0;if(el==='ki')m+=b.kiDmg||0;if(el==='physical')m+=b.physicalDmg||0;
 if(String(source).startsWith('S')||String(source).includes('CLONE'))m+=b.summonDmg||0;
 if((String(source).startsWith('E')||String(source).startsWith('F'))&&b.evoFusionDmg)m+=b.evoFusionDmg;
 if(targetType==='boss')m+=b.bossDmg||0;if(targetType==='elite')m+=b.eliteDmg||0;
 return Math.max(.5,m)
}
const _v26DamageEnemy=damageEnemy;
damageEnemy=function(e,dmg,crit=false,source='AUTO'){
 const mult=v26DamageMult(source,e?.elite?'elite':'normal');_v26DamageEnemy(e,dmg*mult,crit,source);
 const b=run?.v26?.bonus;if(b?.lifesteal&&dmg>0)player.hp=Math.min(player.maxHp,player.hp+dmg*mult*b.lifesteal*.08)
}
const _v26DamageBoss=damageBoss;
damageBoss=function(dmg,source='AUTO'){
 const mult=v26DamageMult(source,'boss')*((run?.boss?.shield>0)?1+(run?.v26?.bonus?.shieldDmg||0):1);_v26DamageBoss(dmg*mult,source)
}
const _v26V24PLv=v24PLv;
v24PLv=function(id){return _v26V24PLv(id)+(run?.v26?.bonus?.virtual?.[id]||0)}
const _v26V24Mod=v24Mod;
v24Mod=function(id){
 const m=_v26V24Mod(id),b=run?.v26?.bonus;if(b){m.range*=1+b.area;m.cd*=Math.max(.55,1-b.cdr)}return m
}
const _v26HeroSkill=castHeroSkill;
castHeroSkill=function(){
 const ready=run?.active&&!run.paused&&player.skillCd<=0;_v26HeroSkill();if(ready&&run?.v26?.bonus?.cdr)player.skillCd*=Math.max(.55,1-run.v26.bonus.cdr)
}
function renderV26BattleGear(){
 const el=document.getElementById('v26BattleGear');if(!el)return;const b=run?.v26?.bonus||v26Bonuses(),sets=v26SetCounts();
 const activeSets=Object.entries(sets).filter(([id,n])=>n>=2).map(([id,n])=>WW.config.gearSystem.sets[id].name+' '+n+'件').join(' / ')||'无套装';
 const ex=v26Equipped().filter(i=>WW.config.gearSystem.catalog[i.templateId]?.exclusive===save.hero).map(i=>i.name).join(' / ')||'无';
 el.innerHTML='<div class="gearBuildRow"><span>装备评分</span><b>'+gearScore()+'</b></div>'+
 '<div class="gearBuildRow"><span>激活套装</span><b>'+activeSets+'</b></div>'+
 '<div class="gearBuildRow"><span>英雄专属</span><b>'+ex+'</b></div>'+
 '<div class="gearBuildRow"><span>伤害核心</span><b>Boss +'+((b.bossDmg||0)*100).toFixed(0)+'% · 范围 +'+((b.area||0)*100).toFixed(0)+'% · CDR '+((b.cdr||0)*100).toFixed(0)+'%</b></div>'
}

/* ---------- Loot generation / boss-specific three-choice ---------- */
function v26RarityForSource(source){
 let r='purple';if(source==='boss'||source==='rift'||source==='gold')r='gold';
 if(save.difficulty==='nightmare'&&source==='boss'&&Math.random()<.14)r='mythic';
 else if(save.difficulty==='hard'&&source==='boss'&&Math.random()<.05)r='mythic';
 return r
}
function v26DropTemplates(source,bossId=null){
 if(source==='boss'&&bossId&&WW.config.gearSystem.bossDrops[bossId])return WW.config.gearSystem.bossDrops[bossId];
 const all=Object.keys(WW.config.gearSystem.catalog);return all.filter(id=>!WW.config.gearSystem.catalog[id].boss||source==='boss')
}
function v26GenerateDrop(source='drop',bossId=null,forceTemplate=null){
 const pool=v26DropTemplates(source,bossId),template=forceTemplate||pool[Math.floor(Math.random()*pool.length)],rarity=v26RarityForSource(source);
 const inst=v26CreateInstance(template,source,rarity);return inst
}
makeGearDrop=function(source){
 const bossId=run?.boss?.id||selectedStageInfo()?.stage?.[4]||null,inst=v26GenerateDrop(source,source==='boss'?bossId:null);
 return {...inst,id:inst.templateId,name:inst.name,score:v26InstanceScore(inst)}
}
finalizeDrops=function(){
 v26MigrateGear();
 for(const d of run.drops||[]){
   if(!d?.uid)continue;if(!save.inventory.gearInstances.some(x=>x.uid===d.uid))save.inventory.gearInstances.push({...d,templateId:d.templateId||d.id});
   const tid=d.templateId||d.id;if(tid&&!save.inventory.gear.includes(tid))save.inventory.gear.push(tid)
 }
}
function v26BossChoices(bossId){
 const pool=WW.config.gearSystem.bossDrops[bossId]||Object.keys(WW.config.gearSystem.catalog),choices=[];
 const shuffled=pool.slice().sort(()=>Math.random()-.5);
 for(let i=0;i<3;i++){const tid=shuffled[i%shuffled.length],inst=v26GenerateDrop('boss',bossId,tid);choices.push(inst)}
 return choices
}
function v26ShowBossLoot(bossId){
 if(!run?.active)return;run.paused=true;run.v26PendingLoot=v26BossChoices(bossId);
 const g=document.getElementById('v26LootChoices'),title=document.getElementById('v26LootTitle'),summary=document.getElementById('v26LootSummary');if(title)title.textContent=(WW.config.boss[bossId]?.name||bossId)+' · Boss专属战利品';if(summary)summary.textContent=run.v29?.rule?.firstCampaign?'选择一件装备后将立即完成首战目标并进入结算':'装备会永久进入当前存档，可在下一局前重新配置。';
 g.innerHTML='';run.v26PendingLoot.forEach(inst=>{
   const wrap=document.createElement('div');wrap.innerHTML=v26GearCard(inst,false,true);const card=wrap.firstElementChild;
   card.onclick=()=>v26PickBossLoot(inst.uid);g.appendChild(card)
 });
 v32OpenLayer('v26LootOverlay');if(typeof v29BattleUI==='function')v29BattleUI();V21Audio.chest()
}
function v26PickBossLoot(uid){
 const inst=run.v26PendingLoot?.find(x=>x.uid===uid);if(!inst)return;
 run.drops.push({...inst,id:inst.templateId,score:v26InstanceScore(inst)});v32CloseLayer('v26LootOverlay');run.v26PendingLoot=[];run.paused=false;
 hint('获得 '+inst.name+' · '+(typeof v22RarityName==='function'?v22RarityName(inst.rarity):inst.rarity));if(typeof v22LootToast==='function')v22LootToast('Boss战利品 · '+inst.name);if(typeof v29BattleUI==='function')v29BattleUI()
}
const _v26BossDamageAfter=damageBoss;
damageBoss=function(dmg,source='AUTO'){
 const before=run?.boss?.id||null;_v26BossDamageAfter(dmg,source);
 if(before&&!run.boss&&run?.bossDefeated&&!run.v26BossLootShown){run.v26BossLootShown=true;setTimeout(()=>v26ShowBossLoot(before),180)}
}

/* ---------- unified delayed battle init with gear applied before play ---------- */
let v26LoadingTimer=null;
startBattle=function(){
 if(v26LoadingTimer)return;
 const si=selectedStageInfo(),screen=document.getElementById('loadingScreen'),fill=document.getElementById('loadingFill');
 document.getElementById('loadingStage').textContent=WW.config.stage[si.chapter].name+' · '+si.stage[1];
 document.getElementById('loadingHero').textContent=WW.config.hero[save.hero].name+' · '+(V19_DIFFICULTIES?.[save.difficulty]?.name||'标准')+' · 装备 '+gearScore();
 document.getElementById('loadingTip').textContent='装备词条和套装会真实改变攻击、范围、冷却、弹射、分裂、召唤数量与Boss伤害。';
 fill.style.width='0%';document.getElementById('loadingProgress').textContent='0%';screen.classList.add('show');
 let p=0;v26LoadingTimer=setInterval(()=>{
   p=Math.min(100,p+17+Math.floor(Math.random()*15));fill.style.width=p+'%';document.getElementById('loadingProgress').textContent=p+'%';
   if(p>=100){clearInterval(v26LoadingTimer);v26LoadingTimer=null;setTimeout(()=>{
     screen.classList.remove('show');_v21_startBattle();
     if(run?.active){v23Init();v24RuntimeInit();v26ApplyLoadout();run.v26BossLootShown=false;renderHeroMechanic();renderV24Runtime();v25Ensure();renderV26BattleGear();hint('装备Build已加载 · '+gearScore()+'评分')}
     V21Audio.tone(240,.1,'triangle',.035,160)
   },110)}
 },65)
};

/* ---------- Result UI ---------- */
const _v26RenderResult=renderResult;
renderResult=function(){
 _v26RenderResult();if(!lastResult)return;
 const dg=document.getElementById('dropGrid');if(dg&&lastResult.drops?.length){
   dg.innerHTML='';lastResult.drops.forEach(d=>{
     const inst=d.uid?d:v26CreateInstance(d.id||d.templateId,d.source||'result',d.rarity||'purple',true),card=document.createElement('div');
     card.className='dropCard '+(typeof v22RarityClass==='function'?v22RarityClass(inst.rarity):'');card.innerHTML='<b>'+inst.name+'</b><small>'+(inst.templateId||inst.id)+' · '+v26InstanceScore(inst)+'评分 · '+v26TemplateSetName(inst.templateId||inst.id)+'</small>';dg.appendChild(card)
   })
 }
}
const _v26Finish=finishRun;
finishRun=function(victory,reason){
 if(run?.drops)finalizeDrops();_v26Finish(victory,reason)
}

/* ---------- Boot/migration/persistence ---------- */
const _v26RenderTop=renderTop;
renderTop=function(){v26MigrateGear();_v26RenderTop()}
const _v26Boot=v20Boot;
v20Boot=function(){
 v26MigrateGear();localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(typeof snapshotActiveSlot==='function')snapshotActiveSlot();_v26Boot();renderLoadout()
}
