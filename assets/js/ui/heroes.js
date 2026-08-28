/* heroes */
let heroHallFocusId=null;
let v34PendingHeroId=null;
const V34_HERO_PROFILES={
 H001:{role:'近战压制',difficulty:'入门',range:'近战',survival:'高',mobility:'稳健',resource:'炎势',loop:'贴身连斩积蓄炎势，以炎龙斩清场并用赤龙降世压制 Boss。',style:'适合喜欢正面推进、容错稳定与范围清场的玩家。'},
 H002:{role:'突进连击',difficulty:'进阶',range:'中近程',survival:'中',mobility:'高',resource:'雷势',loop:'连续命中积蓄雷势，借雷闪突击换位并串联高频攻击。',style:'适合主动寻找空隙、持续走位并维持连击的玩家。'},
 H007:{role:'召唤控场',difficulty:'进阶',range:'中程',survival:'高',mobility:'高',resource:'斗战势',loop:'腾挪聚怪并维持分身，抓住密集敌群释放法天象地。',style:'适合操控召唤物、拉扯战线并制造范围压制的玩家。'},
 H010:{role:'爆发游击',difficulty:'熟练',range:'中近程',survival:'低',mobility:'高',resource:'炎印',loop:'高速穿插叠加炎印，短窗口内集中引爆并迅速脱离。',style:'适合追求高风险爆发、频繁换位与节奏判断的玩家。'},
 H012:{role:'暴击刺杀',difficulty:'熟练',range:'中程',survival:'低',mobility:'极高',resource:'影印',loop:'利用影袭瞬杀切入弱点，累积影印后以万影杀阵收割。',style:'适合精确走位、挑选目标并追求暴击连杀的玩家。'},
 H019:{role:'蓄力炮击',difficulty:'进阶',range:'远程',survival:'中',mobility:'中',resource:'气能',loop:'保持安全距离积蓄气能，用爆气冲击开路并蓄力炮击 Boss。',style:'适合管理距离与蓄力时机、偏好远程输出的玩家。'}
};

function v34HeroSelectionPreview(id){
 const hero=WW.config.hero?.[id],profile=V34_HERO_PROFILES[id];if(!hero||!profile)return null;
 const preset=hero.presets?.[0]||['未配置',[],[]];
 return{heroId:id,name:hero.name,profile:{...profile},recommendedPreset:{name:preset[0],active:[...preset[1]],passive:[...preset[2]]}}
}

function renderHeroes(){renderHeroHall()}

function renderHeroHall(){
 const g=document.getElementById('heroGrid');if(!g)return;
 const ids=Object.keys(WW.config.hero);if(!ids.includes(heroHallFocusId))heroHallFocusId=ids.includes(save.hero)?save.hero:ids[0];
 const focused=heroHallFocusId,h=WW.config.hero[focused],s=save.heroes[focused],st=heroStats(focused),preview=v34HeroSelectionPreview(focused),profile=preview.profile,identity=WW.config.heroIdentity?.combat?.[focused]||{title:h.skill+' · 守界作战',trait:h.skill+'与'+h.ult+'构成核心战斗循环',basic:'基础连击',skill:h.skill,ult:h.ult,resource:profile.resource,color:h.color};
 const current=save.hero===focused,locked=!s.unlocked,state=current?'当前守界者':locked?'尚未解锁':'可任命出征';
 document.querySelector('.heroHallFocus')?.style.setProperty('--hero-accent',identity.color||h.color);
 document.getElementById('heroHallHeroId').textContent=focused;
 document.getElementById('heroHallHeroName').textContent=h.name;
 document.getElementById('heroHallHeroRole').textContent=profile.role+' · '+identity.title;
 document.getElementById('heroHallHeroState').textContent=state;
 document.getElementById('heroHallTrait').textContent=identity.trait;
 document.getElementById('heroHallBasic').textContent=identity.basic;
 document.getElementById('heroHallSkill').textContent=identity.skill;
 document.getElementById('heroHallUlt').textContent=identity.ult;
 document.getElementById('heroHallResource').textContent=profile.resource;
 document.getElementById('heroHallRole').textContent=profile.role;
 document.getElementById('heroHallDifficulty').textContent=profile.difficulty;
 document.getElementById('heroHallRange').textContent=profile.range;
 document.getElementById('heroHallSurvival').textContent=profile.survival;
 document.getElementById('heroHallMobility').textContent=profile.mobility;
 document.getElementById('heroHallLoop').textContent=profile.loop;
 document.getElementById('heroHallStyle').textContent=profile.style;
 document.getElementById('heroHallHp').textContent=st.hp;
 document.getElementById('heroHallAtk').textContent=st.atk;
 document.getElementById('heroHallDef').textContent=st.def;
 document.getElementById('heroHallLevel').textContent=s.level;
 const readiness=document.getElementById('heroHallReadiness');readiness.classList.toggle('locked',locked);readiness.querySelector('span').textContent=locked?'封印未解 · 需 '+h.unlock+' 金':'已解锁 · '+(current?'当前出征守界者':'可任命出征');
 const hint=document.getElementById('heroHallActionHint'),label=document.getElementById('heroHallConfirmLabel'),detail=document.getElementById('heroHallConfirmDetail'),confirm=document.getElementById('heroHallConfirm');
 hint.textContent=current?'当前守界者已载入':locked?'解锁后将同步任命':'已解锁，可切换守界者';
 label.textContent=current?'当前守界者':locked?'解锁并任命 · '+h.unlock+' 金':'任命 '+h.name;
 detail.textContent=current?'确认保留或载入推荐构筑':locked?'确认构筑后支付 · 当前 '+save.gold+' 金':'选择保留现有或载入推荐构筑';
 confirm.classList.toggle('locked',locked);confirm.setAttribute('aria-label',label.textContent+'，'+detail.textContent);
 g.innerHTML='';
 Object.entries(WW.config.hero).forEach(([id,hero],index)=>{const heroSave=save.heroes[id],isFocused=heroHallFocusId===id,isCurrent=save.hero===id,d=document.createElement('button');d.type='button';d.dataset.heroId=id;d.className='heroRosterEntry '+(isFocused?'focused ':'')+(isCurrent?'current ':'')+(!heroSave.unlocked?'locked':'');d.style.setProperty('--hero-accent',WW.config.heroIdentity?.combat?.[id]?.color||hero.color);d.setAttribute('aria-pressed',String(heroHallFocusId===id));if(isCurrent)d.setAttribute('aria-current','true');d.setAttribute('aria-label',hero.name+'，'+(isCurrent?'当前守界者，':heroSave.unlocked?'已解锁，':'未解锁，')+(isFocused?'正在检视':'可检视'));d.innerHTML='<span class="heroRosterIndex">0'+(index+1)+'</span><span class="heroRosterSeal" aria-hidden="true">'+hero.name.slice(0,1)+'</span><span class="heroRosterCopy"><strong>'+hero.name+'</strong><small>'+id+' · Lv.'+heroSave.level+'</small><em>'+(isCurrent?'当前':heroSave.unlocked?'可用':'封印')+'</em></span>';d.onclick=()=>focusHero(id);g.appendChild(d)});
}

function focusHero(id){
 if(!WW.config.hero[id])return;const restoreFocus=document.activeElement?.classList.contains('heroRosterEntry');heroHallFocusId=id;renderHeroHall();if(restoreFocus)document.querySelector('#heroGrid .heroRosterEntry[aria-pressed="true"]')?.focus({preventScroll:true})
}

function confirmHeroSelection(){
 const preview=v34HeroSelectionPreview(heroHallFocusId);if(!preview)return;
 v34PendingHeroId=preview.heroId;const hero=WW.config.hero[preview.heroId],heroSave=save.heroes[preview.heroId],locked=!heroSave.unlocked,affordable=Number(save.gold||0)>=Number(hero.unlock||0);
 document.getElementById('heroConfirmName').textContent=preview.name;
 document.getElementById('heroConfirmRole').textContent=preview.profile.role+' · '+preview.profile.difficulty+' · '+preview.profile.range;
 document.getElementById('heroConfirmCost').textContent=locked?(affordable?'确认后支付 '+hero.unlock+' 金并解锁':'金币不足 · 需要 '+hero.unlock+' 金，当前 '+save.gold+' 金'):'英雄已解锁，本次不扣除金币';
 document.getElementById('heroConfirmKeepActive').textContent=v34BuildNames(save.build?.active);
 document.getElementById('heroConfirmKeepPassive').textContent=v34BuildNames(save.build?.passive);
 document.getElementById('heroConfirmPresetName').textContent=preview.recommendedPreset.name;
 document.getElementById('heroConfirmPresetActive').textContent=v34BuildNames(preview.recommendedPreset.active);
 document.getElementById('heroConfirmPresetPassive').textContent=v34BuildNames(preview.recommendedPreset.passive);
 document.querySelectorAll('#heroConfirmOverlay [data-build-choice]').forEach(button=>button.disabled=locked&&!affordable);
 v32OpenLayer('heroConfirmOverlay')
}

function v34BuildNames(ids){return Array.isArray(ids)&&ids.length?ids.map(id=>typeof skillName==='function'?skillName(id):id).join(' · '):'未配置'}
function v34CancelHeroSelection(){v34PendingHeroId=null;v32CloseLayer('heroConfirmOverlay')}
function applyHeroSelection(choice='keep'){
 if(choice!=='keep'&&choice!=='recommended')return false;const id=v34PendingHeroId,preview=v34HeroSelectionPreview(id),hero=WW.config.hero?.[id],heroSave=save.heroes?.[id];if(!preview||!hero||!heroSave)return false;
 if(!heroSave.unlocked){const price=Number(hero.unlock||0);if(Number(save.gold||0)<price){toast('金币不足，还差 '+(price-Number(save.gold||0))+' 金');return false}save.gold-=price;heroSave.unlocked=true}
 save.hero=id;if(choice==='recommended'){save.build.active=[...preview.recommendedPreset.active];save.build.passive=[...preview.recommendedPreset.passive]}persist();v34PendingHeroId=null;v32CloseLayer('heroConfirmOverlay');toast('已任命 '+hero.name+' · '+(choice==='recommended'?'推荐构筑':'保留现有构筑'));
 if(typeof v29BriefingContext!=='undefined'&&v29BriefingContext?.editor==='heroes'){v29BriefingContext={editor:'heroes',focusId:V29_BRIEFING_EDITORS.heroes};v29ReturnToBriefing()}else go('loadout');return true
}
function selectHero(id){if(!WW.config.hero?.[id])return false;heroHallFocusId=id;renderHeroHall();confirmHeroSelection();return true}

document.addEventListener('ui:view-change',event=>{if(event.detail?.id==='heroes')renderHeroHall()});
