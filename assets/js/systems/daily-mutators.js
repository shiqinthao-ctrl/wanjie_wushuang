/* V2.9 daily mutator completion */
const _v29DailyDamageMult=v26DamageMult;
v26DamageMult=function(source,targetType='normal'){
 let m=_v29DailyDamageMult(source,targetType);
 if(run?.v29?.id==='daily'&&run.v29.daily?.player){
   let p=run.v29.daily.player,el=v26SourceElement(source);
   if(el==='lightning'&&p.lightning)m*=1+p.lightning;
   if(targetType==='boss'&&p.boss)m*=1+p.boss;
 }
 return m
};
const _v29DailyRarity=v26RarityForSource;
v26RarityForSource=function(source){
 let r=_v29DailyRarity(source);
 if(run?.v29?.id==='daily'&&run.v29.daily?.player?.drop&&r==='gold'&&Math.random()<run.v29.daily.player.drop*.35)return'mythic';
 return r
};
const _v29DailyFinalFinish=finishRun;
finishRun=function(victory,reason){
 if(!run?.active)return;
 let dailyGold=run?.v29?.id==='daily'?(run.v29.daily?.player?.gold||0):0;
 _v29DailyFinalFinish(victory,reason);
 if(lastResult&&lastResult.modeId==='daily'&&dailyGold>0){
   let extra=Math.round((lastResult.gold||0)*dailyGold);
   save.gold+=extra;lastResult.gold+=extra;lastResult.modeExtraGold=(lastResult.modeExtraGold||0)+extra;
   localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(typeof snapshotActiveSlot==='function')snapshotActiveSlot();renderAll();renderResult()
 }
};
