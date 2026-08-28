/* build */
function renderBuild(){
 document.getElementById('buildHeroName').textContent=WW.config.hero[save.hero].name;
 renderBuildSlots('activeSlots',save.build.active,6);renderBuildSlots('passiveSlots',save.build.passive,6);
 document.getElementById('activeCount').textContent=save.build.active.length+'/6';document.getElementById('passiveCount').textContent=save.build.passive.length+'/6';
 document.querySelectorAll('#activeSlots .buildSlot.filled,#passiveSlots .buildSlot.filled').forEach(slot=>{
  slot.setAttribute('role','button');slot.tabIndex=0;slot.setAttribute('aria-label','移除 '+(slot.querySelector('b')?.textContent||'已选术式'));
  slot.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();slot.click()}}
 });
 const presets=WW.config.hero[save.hero].presets,pg=document.getElementById('presetGrid');pg.innerHTML='';
 presets.forEach((p,i)=>{const d=document.createElement('article');d.className='preset';d.innerHTML='<div class="eyebrow">PRESET '+(i+1)+'</div><h4>'+p[0]+'</h4><p>主动：'+p[1].map(skillName).join(' / ')+'<br>被动：'+p[2].map(skillName).join(' / ')+'</p><button type="button" class="btn gold" onclick="applyPreset('+i+')">应用此流派</button>';pg.appendChild(d)});
 document.getElementById('buildPresetLibraryCount').textContent=presets.length+' 套真实方案';
 const all=[...new Set(Object.values(WW.config.hero).flatMap(h=>h.presets.flatMap(p=>[...p[1],...p[2]])))],activeGrid=document.querySelector('[data-build-picks="active"]'),passiveGrid=document.querySelector('[data-build-picks="passive"]');
 activeGrid.innerHTML='';passiveGrid.innerHTML='';
 all.forEach(id=>{const passive=id.startsWith('P'),active=save.build.active.includes(id)||save.build.passive.includes(id),d=document.createElement('button');d.type='button';d.className='pick '+(active?'active':'');d.setAttribute('aria-pressed',String(active));d.innerHTML='<span class="pickGlyph" aria-hidden="true">'+glyph(id)+'</span><span><b>'+skillName(id)+'</b><small>'+id+' · '+(passive?'被动心法':'主动术式')+'</small></span><em>'+(active?'已入阵':'加入')+'</em>';d.onclick=()=>toggleBuild(id);(passive?passiveGrid:activeGrid).appendChild(d)});
 document.getElementById('buildActiveLibraryCount').textContent=all.filter(id=>!id.startsWith('P')).length+' 项可选';
 document.getElementById('buildPassiveLibraryCount').textContent=all.filter(id=>id.startsWith('P')).length+' 项可选'
}
function renderBuildSlots(elId,arr,limit){const g=document.getElementById(elId);g.innerHTML='';for(let i=0;i<limit;i++){const id=arr[i],d=document.createElement('div');d.className='buildSlot '+(id?'filled':'')+(id&&reachableBuildEvos().some(e=>WW.config.evolution[e][1]===id)?' ready':'');d.innerHTML=id?'<div class="skillIcon">'+glyph(id)+'</div><b>'+skillName(id)+'</b><small>'+id+'</small>':'<div class="tiny">空槽</div>';if(id)d.onclick=()=>toggleBuild(id);g.appendChild(d)}}
function focusBuildLibrary(type){
 const target=document.querySelector('[data-build-library="'+type+'"]'),scroller=target?.closest('.buildCodexScroll');
 if(!target||!scroller)return;
 document.querySelectorAll('[data-build-target]').forEach(button=>{
  const active=button.dataset.buildTarget===type;
  button.setAttribute('aria-pressed',String(active))
 });
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 target.focus({preventScroll:true});
 scroller.scrollTo({top:Math.max(0,target.offsetTop-scroller.offsetTop-8),behavior:reduced?'auto':'smooth'})
}
function toggleBuild(id){const passive=id.startsWith('P'),arr=passive?save.build.passive:save.build.active,idx=arr.indexOf(id);if(idx>=0)arr.splice(idx,1);else{if(arr.length>=6){toast((passive?'被动':'主动')+'槽已满');return}arr.push(id)}persist()}
function applyPreset(i){const p=WW.config.hero[save.hero].presets[i];save.build.active=[...p[1]];save.build.passive=[...p[2]];persist();toast('已应用 '+p[0])}
function clearBuild(){save.build.active=[];save.build.passive=[];persist()}
