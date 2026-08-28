/* ================= V2.4 REAL SKILL FORMS & BUILD SYNERGY ================= */
window.WW.config.skillForms=window.WW.config.skillForms||{};
window.WW.config.skillForms.descriptions={
 A001:['physical','弧斩','周期释放范围弧斩；范围强化会直接扩大刀圈。'],
 A002:['lightning','雷枪','高速贯穿雷枪；弹射被动会追加链雷。'],
 A003:['fire','烈焰刀','近身火刀斩并留下短时灼烧区域。'],
 A005:['physical','回旋棍','向目标方向飞出后回旋，对路径敌人多次命中。'],
 A007:['shadow','修罗斩','锁定最近目标进行高伤单点斩击。'],
 A009:['physical','连环拳','近身连续拳风，小范围高速多段。'],
 A011:['fire','火球','飞行火球命中爆炸；进化后爆炸半径和子火球提升。'],
 A013:['lightning','雷电弹','命中后向附近目标弹射；进化后链数大幅提升。'],
 A014:['ki','气功弹','直线气弹，天然穿透；进化后体积和穿透增加。'],
 A015:['shadow','手里剑','多重暗器；分裂/穿透被动直接改变弹道。'],
 A019:['fire','爆裂弹','命中后范围爆炸；暴击爆炸被动提升爆炸次数。'],
 A021:['fire','火焰领域','跟随英雄的持续燃烧领域。'],
 A022:['lightning','雷霆领域','跟随英雄的雷域，周期随机劈击域内敌人。'],
 A026:['wind','龙卷风','沿目标方向移动，并持续把附近敌人吸向中心。'],
 A027:['fire','陨石雨','地面先出现落点预警，延迟后陨石砸落。'],
 A028:['fire','爆炎阵','在敌群附近生成延迟爆炸法阵。'],
 A030:['ki','气爆领域','跟随英雄周期释放击退气浪。'],
 A041:['lightning','落雷','直接锁定敌人落雷，优先打击精英和Boss。'],
 A042:['fire','火柱','目标脚下出现火柱，对小范围连续灼烧。'],
 A045:['wind','风刃雨','向前方扇形发射多枚风刃。'],
 A049:['ki','气功轰炸','多个落点连续气爆轰炸。'],
 A051:['lightning','雷闪','瞬间闪击目标并在原地/目标点形成雷痕。'],
 A053:['shadow','影袭','目标身后出现影刃并进行高倍率斩击。'],
 A054:['fire','火焰冲刺','生成向前推进的火焰路径。'],
 A060:['ki','气爆瞬移','在目标位置爆发气能冲击波。'],
 A062:['lightning','雷珠','雷珠环绕英雄，接触敌人并周期放电。'],
 A063:['fire','火轮','火轮环绕英雄，对接触目标造成灼烧。'],
 A068:['ki','气功珠','气珠环绕并自动向附近敌人发射小气弹。'],
 A070:['shadow','暗影刃','暗影刀环绕英雄并造成高频切割。'],
 A072:['shadow','黑洞','在敌群中心生成黑洞，持续吸怪并造成伤害。'],
 A073:['shadow','镜像攻击','生成镜像，从对称位置复制投射攻击。'],
 S001:['shadow','影分身','实体分身独立选择目标并发射暗器。'],
 S002:['fire','火分身','实体分身独立发射火弹，命中产生小爆炸。'],
 S003:['lightning','雷分身','实体分身发射雷弹并附带链雷。'],
 S018:['ki','气功幻影','实体幻影持续发射穿透气功弹。']
};
window.WW.config.skillForms.elementPassives={fire:'P026',lightning:'P027',wind:'P030',ki:'P032',shadow:'P033'};
function v24Desc(id){return WW.config.skillForms.descriptions[id]||['physical','技能形态','按技能等级提升伤害与频率。']}
function v24Element(id){return v24Desc(id)[0]}
function v24Lv(id){return run?.skills?.[id]||0}
function v24PLv(id){return run?.passives?.[id]||0}
function v24Has(id){return v24Lv(id)>0}
function v24EvoForBase(base){for(const [id,v] of Object.entries(WW.config.evolution)){if(v[1]===base&&run?.evolved?.[id])return id}return null}
function v24IsFusion(id){return !!run?.fused?.[id]}
function v24Mod(id){
 const lv=v24Lv(id)||1,elem=v24Element(id);
 let dmg=1+(lv-1)*.20,range=1,duration=1,cd=1,count=1,crit=player?.crit||.05;
 if(v24PLv('P019'))dmg*=1+v24PLv('P019')*.08;
 if(v24PLv('P016'))range*=1+v24PLv('P016')*.07;
 if(v24PLv('P017'))duration*=1+v24PLv('P017')*.08;
 if(v24PLv('P018'))cd*=Math.max(.55,1-v24PLv('P018')*.06);
 if(WW.config.skillForms.elementPassives[elem]&&v24PLv(WW.config.skillForms.elementPassives[elem]))dmg*=1+v24PLv(WW.config.skillForms.elementPassives[elem])*.09;
 if(id.startsWith('S')&&v24PLv('P036'))dmg*=1+v24PLv('P036')*.11;
 if(id.startsWith('S')&&v24PLv('P039'))count+=Math.floor((v24PLv('P039')+1)/2);
 const evo=v24EvoForBase(id);if(evo){dmg*=1.55;range*=1.25;count+=1;duration*=1.20}
 return {lv,dmg,range,duration,cd,count,crit,evo}
}
function v24DamageEnemy(e,id,base,crit=false){
 if(!e||!enemies.includes(e))return;
 const m=v24Mod(id);let d=base*m.dmg;
 if(v24PLv('P007')&&crit)d*=1+v24PLv('P007')*.08;
 damageEnemy(e,d,crit,id);
 if(v24PLv('P043'))player.hp=Math.min(player.maxHp,player.hp+d*.0025*v24PLv('P043'))
}
function v24DamageBoss(id,base){if(!run.boss)return;let d=base*v24Mod(id).dmg;if(v24PLv('P003'))d*=1+v24PLv('P003')*.08;damageBoss(d,id)}
function v24NearestPoint(){
 const t=nearest();return t?{x:t.x,y:t.y}:{x:player.x+100,y:player.y}
}
function v24RuntimeInit(){
 run.v24={cool:{},projectiles:[],fields:[],vortices:[],meteors:[],summons:[],mirrors:[],orbit:0,fieldTick:0,fusionTick:0,serial:0};
}
function v24Ensure(){if(run?.active&&!run.v24)v24RuntimeInit();return run?.v24}
function v24CD(id,base){const r=v24Ensure();if(!r)return false;if((r.cool[id]||0)>0)return false;r.cool[id]=base*v24Mod(id).cd;return true}
function v24Projectile(id,x,y,a,speed,dmg,radius=5,opts={}){
 const r=v24Ensure();if(!r)return;
 r.projectiles.push(Object.assign({id,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,dmg,r:radius,life:2.0,pierce:0,bounce:0,split:0,explode:0,homing:0,color:v23P().color},opts));
 if(r.projectiles.length>260)r.projectiles.splice(0,r.projectiles.length-260)
}
function v24Field(id,x,y,radius,dmg,life,type='damage',opts={}){
 const rt=v24Ensure();if(!rt)return;
 rt.fields.push(Object.assign({id,x,y,r:radius,dmg,life,max:life,tick:0,type,follow:false,color:'#ef694e',pull:0,knock:0},opts));
 if(rt.fields.length>22)rt.fields.splice(0,rt.fields.length-22)
}
function v24Meteor(id,x,y,dmg,radius,delay=.85,color='#ef7958'){
 const rt=v24Ensure();rt.meteors.push({id,x,y,dmg,r:radius,life:delay,max:delay,impact:false,color});
 if(rt.meteors.length>28)rt.meteors.splice(0,rt.meteors.length-28)
}
function v24Vortex(id,x,y,a,dmg,radius,life){
 const rt=v24Ensure();rt.vortices.push({id,x,y,vx:Math.cos(a)*85,vy:Math.sin(a)*85,dmg,r:radius,life,max:life,tick:0,color:'#82d6b7'});
 if(rt.vortices.length>10)rt.vortices.shift()
}
function v24SummonTargetCount(id){
 const m=v24Mod(id);let n=Math.min(6,m.count);
 if(v24EvoForBase(id))n=Math.min(8,n+2);
 if(v24IsFusion('F026')&&id==='S001')n=Math.max(n,6);
 if(v24IsFusion('F005')&&id==='S003')n=Math.max(n,5);
 return n
}
function v24EnsureSummons(id){
 const rt=v24Ensure();if(!rt||!v24Has(id))return;
 const target=v24SummonTargetCount(id),current=rt.summons.filter(s=>s.id===id).length;
 for(let i=current;i<target;i++)rt.summons.push({id,angle:Math.random()*6.28,attack:Math.random()*.6,index:i,x:player.x,y:player.y})
}

/* ---------- data-driven skill casting ---------- */
function v24Cast(id){
 const m=v24Mod(id),t=nearest(),pt=v24NearestPoint(),a=t?Math.atan2(t.y-player.y,t.x-player.x):0;
 const R=m.range,D=player.atk;
 if(id==='A001')v23Arc(105*R,D*.95*m.dmg,id,Math.PI*1.25);
 else if(id==='A002'){let multi=1+(v24PLv('P021')?Math.min(2,Math.floor(v24PLv('P021')/2)):0);for(let i=0;i<multi;i++)v24Projectile(id,player.x,player.y,a+(i-(multi-1)/2)*.10,580,D*.9,4,{color:'#70a9ff',pierce:1+(v24PLv('P022')?1:0),bounce:v24PLv('P023')?1+Math.floor(v24PLv('P023')/2):0})}
 else if(id==='A003'){v23Arc(118*R,D*1.05*m.dmg,id,Math.PI*1.15);v24Field(id,player.x,player.y,85*R,D*.16,2.2*m.duration,'damage',{follow:true,color:'#ef694e'})}
 else if(id==='A005'){v24Projectile(id,player.x,player.y,a,330,D*.82,10,{color:'#f0b45d',pierce:5,boomerang:true,originX:player.x,originY:player.y})}
 else if(id==='A007'&&t){v24DamageEnemy(t,id,D*1.8,Math.random()<player.crit);effects.push({type:'ring',x:t.x,y:t.y,r:5,life:.18,max:.18,color:'#a47dff',maxr:34})}
 else if(id==='A009'){for(let i=0;i<3+m.lv;i++)setTimeout(()=>{if(run?.active)v23Arc(82*R,D*.32*m.dmg,id,Math.PI*.7)},i*55)}
 else if(id==='A011'){let n=m.evo?3:1;for(let i=0;i<n;i++)v24Projectile(id,player.x,player.y,a+(i-(n-1)/2)*.13,390,D*.95,7+(m.evo?3:0),{color:'#ef694e',explode:(m.evo?82:58)*R,split:v24PLv('P024')?1:0})}
 else if(id==='A013'){v24Projectile(id,player.x,player.y,a,520,D*.78,5,{color:'#70a9ff',bounce:(m.evo?5:2)+(v24PLv('P023')?v24PLv('P023'):0)})}
 else if(id==='A014'){v24Projectile(id,player.x,player.y,a,450,D*.92,7+(m.evo?5:0),{color:'#65d8ff',pierce:(m.evo?4:2)+(v24PLv('P022')?1:0)})}
 else if(id==='A015'){let n=3+(v24PLv('P021')?2:0)+(m.evo?3:0);for(let i=0;i<n;i++)v24Projectile(id,player.x,player.y,a+(i-(n-1)/2)*.09,570,D*.55,4,{color:'#a47dff',pierce:v24PLv('P022')?2:1,split:v24PLv('P024')?1:0})}
 else if(id==='A019')v24Projectile(id,player.x,player.y,a,430,D*1.05,7,{color:'#ef7958',explode:74*R,chainExplode:v24PLv('P010')?1:0});
 else if(id==='A021'){if(!run.v24.fields.some(f=>f.id===id))v24Field(id,player.x,player.y,(m.evo?155:112)*R,D*.18,999,'damage',{follow:true,color:'#ef694e'})}
 else if(id==='A022'){if(!run.v24.fields.some(f=>f.id===id))v24Field(id,player.x,player.y,(m.evo?170:125)*R,D*.33,999,'lightning',{follow:true,color:'#70a9ff'})}
 else if(id==='A026'){v24Vortex(id,player.x,player.y,a,D*.20,(m.evo?108:82)*R,(m.evo?6.5:4.5)*m.duration)}
 else if(id==='A027'){let n=(m.evo?5:3)+Math.floor(m.lv/2);for(let i=0;i<n;i++)v24Meteor(id,pt.x+(Math.random()-.5)*160,pt.y+(Math.random()-.5)*140,D*1.35,(m.evo?70:52)*R,.65+Math.random()*.55,'#ef694e')}
 else if(id==='A028'){let n=m.evo?3:1;for(let i=0;i<n;i++)v24Meteor(id,pt.x+(Math.random()-.5)*100,pt.y+(Math.random()-.5)*90,D*1.10,(m.evo?88:65)*R,.95+i*.18,'#f07b4f')}
 else if(id==='A030'){if(!run.v24.fields.some(f=>f.id===id))v24Field(id,player.x,player.y,(m.evo?165:120)*R,D*.28,999,'pulse',{follow:true,color:'#65d8ff',knock:28})}
 else if(id==='A041'){let candidates=enemies.slice().sort((x,y)=>(y.elite?1:0)-(x.elite?1:0)).slice(0,m.evo?4:2);candidates.forEach(e=>{effects.push({type:'ring',x:e.x,y:e.y,r:3,life:.16,max:.16,color:'#70a9ff',maxr:30});v24DamageEnemy(e,id,D*1.35,false)});if(run.boss&&m.evo)v24DamageBoss(id,D*1.1)}
 else if(id==='A042'){v24Field(id,pt.x,pt.y,60*R,D*.32,2.4*m.duration,'damage',{color:'#ef694e'})}
 else if(id==='A045'){let n=5+(m.lv>3?2:0);for(let i=0;i<n;i++)v24Projectile(id,player.x,player.y,a+(i-(n-1)/2)*.12,500,D*.48,5,{color:'#82d6b7',pierce:1})}
 else if(id==='A049'){let n=3+(m.evo?3:0);for(let i=0;i<n;i++)v24Meteor(id,pt.x+(Math.random()-.5)*150,pt.y+(Math.random()-.5)*120,D*.92,48*R,.45+i*.15,'#65d8ff')}
 else if(id==='A051'&&t){effects.push({type:'ring',x:t.x,y:t.y,r:5,life:.18,max:.18,color:'#70a9ff',maxr:42});v24DamageEnemy(t,id,D*1.55,true);if(v24PLv('P023'))v23Chain(t,D*.65,2+v24PLv('P023'),id)}
 else if(id==='A053'&&t){v24DamageEnemy(t,id,D*1.75,Math.random()<.35+player.crit);effects.push({type:'ring',x:t.x,y:t.y,r:5,life:.2,max:.2,color:'#a47dff',maxr:45})}
 else if(id==='A054'){for(let i=1;i<=5;i++)v24Field(id,player.x+Math.cos(a)*i*42,player.y+Math.sin(a)*i*42,42*R,D*.22,2.0*m.duration,'damage',{color:'#ef694e'})}
 else if(id==='A060'){v24Field(id,pt.x,pt.y,95*R,D*.85,.5,'burst',{color:'#65d8ff',knock:55})}
 else if(['A062','A063','A068','A070'].includes(id)){/* handled continuously by orbit runtime */}
 else if(id==='A072'){v24Field(id,pt.x,pt.y,(m.evo?155:112)*R,D*.17,(m.evo?7:5)*m.duration,'blackhole',{color:'#7d5ab7',pull:m.evo?125:85})}
 else if(id==='A073'){let n=m.evo?3:2;for(let i=0;i<n;i++)run.v24.mirrors.push({id,angle:(i/n)*6.28,life:6*m.duration,attack:.1,index:i})}
 else if(id.startsWith('S'))v24EnsureSummons(id)
}
window.WW.config.skillForms.baseCooldowns={A001:1.25,A002:1.15,A003:1.8,A005:2.1,A007:2.8,A009:1.7,A011:1.3,A013:1.45,A014:1.25,A015:1.15,A019:1.75,A021:.5,A022:.5,A026:3.4,A027:4.2,A028:3.0,A030:.5,A041:2.2,A042:2.8,A045:2.0,A049:3.2,A051:3.0,A053:2.6,A054:3.1,A060:3.2,A062:.5,A063:.5,A068:.5,A070:.5,A072:5.0,A073:4.6,S001:.5,S002:.5,S003:.5,S018:.5};

/* ---------- update entities ---------- */
function v24UpdateProjectiles(dt){
 const rt=run.v24;
 for(let i=rt.projectiles.length-1;i>=0;i--){
   const p=rt.projectiles[i];p.life-=dt;
   if(p.homing){const t=nearest();if(t){let a=Math.atan2(t.y-p.y,t.x-p.x),sp=Math.hypot(p.vx,p.vy);p.vx=p.vx*.9+Math.cos(a)*sp*.1;p.vy=p.vy*.9+Math.sin(a)*sp*.1}}
   if(p.boomerang&&p.life<1.0){let a=Math.atan2(player.y-p.y,player.x-p.x),sp=380;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   let hit=null;for(const e of enemies){if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r){hit=e;break}}
   if(hit){
     v24DamageEnemy(hit,p.id,p.dmg,p.crit);
     if(p.explode)v24Explosion(p.id,p.x,p.y,p.explode,p.dmg*.72);
     if(p.bounce>0){let next=null,bd=1e9;for(const e of enemies){if(e===hit)continue;let d=dist(hit,e);if(d<175&&d<bd){next=e;bd=d}}if(next){p.x=hit.x;p.y=hit.y;let a=Math.atan2(next.y-p.y,next.x-p.x),sp=Math.hypot(p.vx,p.vy);p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.bounce--;continue}}
     if(p.split>0){let base=Math.atan2(p.vy,p.vx);[-.36,.36].forEach(off=>v24Projectile(p.id,p.x,p.y,base+off,Math.hypot(p.vx,p.vy)*.9,p.dmg*.55,p.r*.8,{color:p.color,pierce:1,split:p.split-1}));}
     if(p.pierce>0){p.pierce--}else{rt.projectiles.splice(i,1);continue}
   }
   if(run.boss&&Math.hypot(run.boss.x-p.x,run.boss.y-p.y)<run.boss.r+p.r){v24DamageBoss(p.id,p.dmg);if(p.explode)v24Explosion(p.id,p.x,p.y,p.explode,p.dmg*.65);if(p.pierce>0)p.pierce--;else{rt.projectiles.splice(i,1);continue}}
   if(p.life<=0||p.x<-100||p.x>WORLD_W+100||p.y<-100||p.y>WORLD_H+100)rt.projectiles.splice(i,1)
 }
}
function v24Explosion(id,x,y,r,dmg){
 effects.push({type:'ring',x,y,r:5,life:.25,max:.25,color:v24Element(id)==='ki'?'#65d8ff':v24Element(id)==='lightning'?'#70a9ff':'#ef694e',maxr:r});
 enemies.slice().forEach(e=>{if(Math.hypot(e.x-x,e.y-y)<=r)v24DamageEnemy(e,id,dmg,false)});
 if(run.boss&&Math.hypot(run.boss.x-x,run.boss.y-y)<=r+run.boss.r)v24DamageBoss(id,dmg)
}
function v24UpdateFields(dt){
 const rt=run.v24;
 for(let i=rt.fields.length-1;i>=0;i--){
   const f=rt.fields[i];f.life-=dt;f.tick-=dt;if(f.follow){f.x=player.x;f.y=player.y}
   if(f.type==='blackhole'){
     enemies.forEach(e=>{let dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy)||1;if(d<f.r*1.5){e.x+=dx/d*f.pull*dt;e.y+=dy/d*f.pull*dt}});
   }
   if(f.tick<=0){f.tick=(f.type==='lightning'?.45:.30);
     let inside=enemies.filter(e=>Math.hypot(e.x-f.x,e.y-f.y)<=f.r);
     if(f.type==='lightning'){inside.sort(()=>Math.random()-.5).slice(0,2+(v24EvoForBase(f.id)?2:0)).forEach(e=>v24DamageEnemy(e,f.id,f.dmg,false))}
     else inside.forEach(e=>{v24DamageEnemy(e,f.id,f.dmg,false);if(f.knock){let dx=e.x-f.x,dy=e.y-f.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*f.knock;e.y+=dy/l*f.knock}});
     if(run.boss&&Math.hypot(run.boss.x-f.x,run.boss.y-f.y)<=f.r+run.boss.r)v24DamageBoss(f.id,f.dmg*.8)
   }
   if(f.life<=0)rt.fields.splice(i,1)
 }
}
function v24UpdateVortices(dt){
 const rt=run.v24;
 for(let i=rt.vortices.length-1;i>=0;i--){
   const v=rt.vortices[i];v.life-=dt;v.tick-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;
   enemies.forEach(e=>{let dx=v.x-e.x,dy=v.y-e.y,d=Math.hypot(dx,dy)||1;if(d<v.r*1.5){e.x+=dx/d*85*dt;e.y+=dy/d*85*dt}});
   if(v.tick<=0){v.tick=.28;enemies.slice().forEach(e=>{if(Math.hypot(e.x-v.x,e.y-v.y)<=v.r)v24DamageEnemy(e,v.id,v.dmg,false)});if(run.boss&&Math.hypot(run.boss.x-v.x,run.boss.y-v.y)<=v.r+run.boss.r)v24DamageBoss(v.id,v.dmg)}
   if(v24IsFusion('F001')&&v.tick<.05&&Math.random()<.35)v24Field('F001',v.x,v.y,55,v.dmg*.55,1.2,'damage',{color:'#ef694e'});
   if(v.life<=0)rt.vortices.splice(i,1)
 }
}
function v24UpdateMeteors(dt){
 const rt=run.v24;
 for(let i=rt.meteors.length-1;i>=0;i--){
   const m=rt.meteors[i];m.life-=dt;
   if(m.life<=0&&!m.impact){m.impact=true;v24Explosion(m.id,m.x,m.y,m.r,m.dmg);if(m.id==='A027'&&v24EvoForBase('A027'))v24Field(m.id,m.x,m.y,m.r*.8,m.dmg*.12,1.8,'damage',{color:m.color})}
   if(m.impact)rt.meteors.splice(i,1)
 }
}
function v24UpdateOrbit(dt){
 const rt=run.v24;rt.orbit+=dt*1.7;
 const specs={A062:['#70a9ff',player.atk*.32,58],A063:['#ef694e',player.atk*.34,62],A068:['#65d8ff',player.atk*.26,68],A070:['#a47dff',player.atk*.38,55]};
 for(const [id,[color,dmg,rad]] of Object.entries(specs)){
   if(!v24Has(id))continue;let m=v24Mod(id),count=Math.min(6,1+Math.floor((m.lv-1)/2)+(m.evo?2:0));
   rt.cool['orbit_'+id]=(rt.cool['orbit_'+id]||0)-dt;
   if(rt.cool['orbit_'+id]<=0){rt.cool['orbit_'+id]=.34*m.cd;
     for(let i=0;i<count;i++){let a=rt.orbit+i/count*6.28,x=player.x+Math.cos(a)*rad*m.range,y=player.y+Math.sin(a)*rad*m.range;
       enemies.slice().forEach(e=>{if(Math.hypot(e.x-x,e.y-y)<e.r+13)v24DamageEnemy(e,id,dmg,false)});
       if(run.boss&&Math.hypot(run.boss.x-x,run.boss.y-y)<run.boss.r+15)v24DamageBoss(id,dmg);
       if(id==='A068'&&Math.random()<.25){let t=nearest();if(t){let aa=Math.atan2(t.y-y,t.x-x);v24Projectile(id,x,y,aa,420,player.atk*.35,4,{color})}}
     }
   }
 }
}
function v24UpdateSummons(dt){
 const rt=run.v24;
 ['S001','S002','S003','S018'].forEach(id=>v24EnsureSummons(id));
 rt.summons.forEach((s,idx)=>{
   s.angle+=dt*(.7+idx*.05);let radius=78+(idx%3)*18;s.x=player.x+Math.cos(s.angle)*radius;s.y=player.y+Math.sin(s.angle)*radius;s.attack-=dt;
   if(s.attack<=0){let m=v24Mod(s.id),rate=(v24PLv('P037')?1+v24PLv('P037')*.08:1);s.attack=.9*m.cd/rate;let t=nearest();if(!t)return;let a=Math.atan2(t.y-s.y,t.x-s.x);
     let cfg={S001:['#a47dff',.55,1,0],S002:['#ef694e',.60,0,48],S003:['#70a9ff',.52,0,0],S018:['#65d8ff',.62,2,0]}[s.id];
     v24Projectile(s.id,s.x,s.y,a,430,player.atk*cfg[1],4,{color:cfg[0],pierce:cfg[2],explode:cfg[3],bounce:s.id==='S003'?2:0})
   }
 });
 rt.summons=rt.summons.filter(s=>v24Has(s.id))
}
function v24UpdateMirrors(dt){
 const rt=run.v24;
 for(let i=rt.mirrors.length-1;i>=0;i--){
   const m=rt.mirrors[i];m.life-=dt;m.angle+=dt*.65;m.attack-=dt;
   if(m.attack<=0){m.attack=.65;let t=nearest();if(t){let x=player.x+Math.cos(m.angle)*95,y=player.y+Math.sin(m.angle)*60,a=Math.atan2(t.y-y,t.x-x);v24Projectile('A073',x,y,a,510,player.atk*.68,4,{color:'#c0a1ff',pierce:1})}}
   if(m.life<=0)rt.mirrors.splice(i,1)
 }
}

/* ---------- fusion transforms ---------- */
function v24FusionPulse(){
 const rt=run.v24;if(!rt)return;const D=player.atk,pt=v24NearestPoint();
 if(v24IsFusion('F001')){let t=nearest(),a=t?Math.atan2(t.y-player.y,t.x-player.x):0;v24Vortex('F001',player.x,player.y,a,D*.42,125,5.5)}
 if(v24IsFusion('F002')){v24Field('F002',player.x,player.y,165,D*.30,3.2,'damage',{follow:true,color:'#ef694e'});for(let i=0;i<3;i++)v24Meteor('F002',pt.x+(Math.random()-.5)*120,pt.y+(Math.random()-.5)*100,D*1.4,68,.55+i*.15)}
 if(v24IsFusion('F003'))for(let i=0;i<4;i++)v24Meteor('F003',pt.x+(Math.random()-.5)*150,pt.y+(Math.random()-.5)*130,D*1.2,72,.45+i*.12,'#ef7958');
 if(v24IsFusion('F004'))for(let i=0;i<8;i++)v24Projectile('F004',player.x,player.y,i/8*6.28,470,D*.82,6,{color:'#ef694e',pierce:2,explode:35});
 if(v24IsFusion('F005')){let targets=enemies.slice().sort(()=>Math.random()-.5).slice(0,5);targets.forEach(e=>v23Chain(e,D*.8,3,'F005'))}
 if(v24IsFusion('F006')){enemies.slice().sort(()=>Math.random()-.5).slice(0,8).forEach(e=>v24DamageEnemy(e,'F006',D*.92,false));if(run.boss)v24DamageBoss('F006',D*1.3)}
 if(v24IsFusion('F020'))for(let i=0;i<14;i++)v24Projectile('F020',player.x,player.y,i/14*6.28,520,D*.72,6,{color:'#65d8ff',pierce:3});
 if(v24IsFusion('F021')){v24Field('F021',player.x,player.y,150,D*.28,3,'pulse',{follow:true,color:'#65d8ff'});for(let i=0;i<4;i++)v24Meteor('F021',pt.x+(Math.random()-.5)*130,pt.y+(Math.random()-.5)*100,D*.9,54,.45+i*.12,'#65d8ff')}
 if(v24IsFusion('F026')){v24EnsureSummons('S001');for(let i=0;i<10;i++)v24Projectile('F026',player.x,player.y,i/10*6.28,500,D*.58,4,{color:'#a47dff',pierce:2})}
 if(v24IsFusion('F033')){v24Field('F033',player.x,player.y,165,D*.30,2.8,'damage',{follow:true,color:'#f0b45d'});let t=nearest(),a=t?Math.atan2(t.y-player.y,t.x-player.x):0;v24Vortex('F033',player.x,player.y,a,D*.28,105,4)}
}
function v24Update(dt){
 if(!run?.active||run.paused)return;v24Ensure();const rt=run.v24;
 Object.keys(rt.cool).forEach(k=>rt.cool[k]-=dt);
 for(const id of Object.keys(run.skills||{})){
   if(!v24Has(id))continue;const base=WW.config.skillForms.baseCooldowns[id];if(base!=null&&v24CD(id,base))v24Cast(id)
 }
 v24UpdateProjectiles(dt);v24UpdateFields(dt);v24UpdateVortices(dt);v24UpdateMeteors(dt);v24UpdateOrbit(dt);v24UpdateSummons(dt);v24UpdateMirrors(dt);
 rt.fusionTick-=dt;if(rt.fusionTick<=0){rt.fusionTick=3.4;v24FusionPulse()}
 renderV24Runtime()
}

/* ---------- drawing ---------- */
function v24Draw(){
 if(!run?.active||!run.v24)return;const rt=run.v24;ctx.save();
 // fields
 rt.fields.forEach(f=>{ctx.globalAlpha=.10+.07*Math.sin(performance.now()/180);ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.28);ctx.fill();ctx.globalAlpha=.45;ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.28);ctx.stroke();ctx.globalAlpha=1;
   if(f.type==='blackhole'){ctx.fillStyle='#0b0713';ctx.beginPath();ctx.arc(f.x,f.y,f.r*.30,0,6.28);ctx.fill();ctx.strokeStyle='#b18cff';ctx.beginPath();ctx.arc(f.x,f.y,f.r*.46,0,6.28);ctx.stroke()}
 });
 // vortices
 rt.vortices.forEach(v=>{ctx.save();ctx.translate(v.x,v.y);ctx.rotate(performance.now()/180);for(let i=0;i<3;i++){ctx.strokeStyle='rgba(142,222,190,'+(0.55-i*.12)+')';ctx.lineWidth=5-i;ctx.beginPath();ctx.arc(0,0,v.r*(.35+i*.22),i*.8,i*.8+4.2);ctx.stroke()}ctx.restore()});
 // meteors
 rt.meteors.forEach(m=>{let p=Math.max(0,m.life/m.max);ctx.globalAlpha=.18+.22*(1-p);ctx.fillStyle=m.color;ctx.beginPath();ctx.arc(m.x,m.y,m.r*(1.1-.25*p),0,6.28);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle='#ffd5ab';ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,6.28);ctx.stroke();ctx.globalAlpha=1});
 // orbiters
 const specs={A062:['#70a9ff',58],A063:['#ef694e',62],A068:['#65d8ff',68],A070:['#a47dff',55]};
 Object.entries(specs).forEach(([id,[color,rad]])=>{if(!v24Has(id))return;let m=v24Mod(id),count=Math.min(6,1+Math.floor((m.lv-1)/2)+(m.evo?2:0));for(let i=0;i<count;i++){let a=rt.orbit+i/count*6.28,x=player.x+Math.cos(a)*rad*m.range,y=player.y+Math.sin(a)*rad*m.range;ctx.shadowBlur=14;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7+(m.evo?2:0),0,6.28);ctx.fill();ctx.shadowBlur=0}});
 // summons
 rt.summons.forEach(s=>{let col={S001:'#a47dff',S002:'#ef694e',S003:'#70a9ff',S018:'#65d8ff'}[s.id];ctx.globalAlpha=.72;ctx.fillStyle=col;ctx.shadowBlur=16;ctx.shadowColor=col;ctx.beginPath();ctx.arc(s.x,s.y,9,0,6.28);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0});
 // mirrors
 rt.mirrors.forEach(m=>{let x=player.x+Math.cos(m.angle)*95,y=player.y+Math.sin(m.angle)*60;ctx.globalAlpha=.35;ctx.fillStyle='#b695ef';ctx.beginPath();ctx.arc(x,y,11,0,6.28);ctx.fill();ctx.globalAlpha=1});
 // custom projectiles
 rt.projectiles.forEach(p=>{ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();ctx.shadowBlur=0});
 ctx.restore()
}
const _v24_prevDraw=drawRun;drawRun=function(){_v24_prevDraw();v24Draw()};

/* ---------- Build/UI ---------- */
function renderBuildForms(){
 const panel=document.getElementById('buildFormPanel');if(!panel)return;panel.innerHTML='';
 const ids=save.build.active||[];
 ids.forEach(id=>{let [el,form,desc]=v24Desc(id),d=document.createElement('div');d.className='skillFormRow';d.innerHTML='<div class="formDot '+el+'">'+glyph(id)+'</div><div><b>'+skillName(id)+' · '+form+'</b><small>'+desc+'</small></div><div class="skillFormState">'+id+'</div>';panel.appendChild(d)});
 document.getElementById('buildEntityCount').textContent=ids.filter(id=>WW.config.skillForms.descriptions[id]).length;
 document.getElementById('buildEvoCount').textContent=reachableBuildEvos().length;
 document.getElementById('buildFusionCount').textContent=reachableBuildFusions().length
}
function renderV24Runtime(){
 if(!run?.v24)return;const rt=run.v24;
 const p=document.getElementById('v24ProjectileCount'),f=document.getElementById('v24FieldCount'),s=document.getElementById('v24SummonCount');
 if(p)p.textContent=rt.projectiles.length;
 if(f)f.textContent=rt.fields.length+rt.vortices.length+rt.meteors.length;
 if(s)s.textContent=rt.summons.length+rt.mirrors.length+['A062','A063','A068','A070'].filter(v24Has).length;
 const st=document.getElementById('v24FormStatus');if(st){st.innerHTML='';Object.keys(run.evolved||{}).filter(x=>run.evolved[x]).forEach(id=>st.innerHTML+='<span class="formStatusChip evo">'+id+' '+skillName(id)+'</span>');Object.keys(run.fused||{}).filter(x=>run.fused[x]).forEach(id=>st.innerHTML+='<span class="formStatusChip fusion">'+id+' '+skillName(id)+'</span>');if(!st.innerHTML)st.innerHTML='<span class="formStatusChip">等待技能进化</span>'}
}
const _v24_prevRenderBuild=renderBuild;renderBuild=function(){_v24_prevRenderBuild();renderBuildForms()};
const _v24_prevRunSide=renderRunSide;renderRunSide=function(){_v24_prevRunSide();renderV24Runtime()};

/* ---------- unified loading -> battle init: fixes delayed V2.3 hero-state init ---------- */
let v24LoadingTimer=null;
startBattle=function(){
 if(v24LoadingTimer)return;
 const si=selectedStageInfo(),screen=document.getElementById('loadingScreen'),fill=document.getElementById('loadingFill');
 document.getElementById('loadingStage').textContent=WW.config.stage[si.chapter].name+' · '+si.stage[1];
 document.getElementById('loadingHero').textContent=WW.config.hero[save.hero].name+' · '+(V19_DIFFICULTIES?.[save.difficulty]?.name||'标准');
 document.getElementById('loadingTip').textContent='本局Build可形成领域、控制、投射、召唤与融合效果，它们会共同改变战场。';
 fill.style.width='0%';document.getElementById('loadingProgress').textContent='0%';screen.classList.add('show');
 let p=0;v24LoadingTimer=setInterval(()=>{
   p=Math.min(100,p+18+Math.floor(Math.random()*14));fill.style.width=p+'%';document.getElementById('loadingProgress').textContent=p+'%';
   if(p>=100){clearInterval(v24LoadingTimer);v24LoadingTimer=null;setTimeout(()=>{
     screen.classList.remove('show');
     _v21_startBattle();              // V1.9/V2.0 real battle start including Director
     if(run?.active){v23Init();v24RuntimeInit();renderHeroMechanic();renderV24Runtime();hint(v23P().title+' · 战斗构筑已就绪')}
     V21Audio.tone(240,.1,'triangle',.035,160)
   },110)}
 },65)
};

/* update after all previous V2.3 logic */
const _v24_prevUpdate=updateRun;updateRun=function(dt){_v24_prevUpdate(dt);v24Update(dt)};

/* refresh forms after choices/chests */
const _v24_pickLevel=pickLevel;pickLevel=function(o){_v24_pickLevel(o);renderBuildForms();renderV24Runtime()};
const _v24_pickChest=pickChest;pickChest=function(r){_v24_pickChest(r);renderV24Runtime();if(r?.id)hint((r.type==='fusion'?'融合形态':'进化形态')+'已改变技能形态')};

/* damage display names for fusion sources */
window.WW.config.skillForms.extraNames={F001:'焚天龙卷',F002:'天火炼狱',F003:'炎爆地狱',F004:'炎龙乱舞',F005:'雷神万影',F006:'九天雷劫',F020:'百重气功炮',F021:'星河冲击',F026:'无限影军',F033:'斗战风暴'};
const _v24_prevSkillName=skillName;skillName=function(id){return WW.config.skillForms.extraNames[id]||_v24_prevSkillName(id)};

/* boot */
const _v24_boot=v20Boot;v20Boot=function(){_v24_boot();renderBuildForms()}
