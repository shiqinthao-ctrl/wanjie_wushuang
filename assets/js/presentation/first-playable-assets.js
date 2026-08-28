(function(){
 const WW=window.WW=window.WW||{};
 const entries=Array.isArray(WW.config?.firstPlayableAssets?.entries)?WW.config.firstPlayableAssets.entries:[];
 const records=new Map(entries.map(entry=>[entry.role,{entry,image:null,state:'loading',error:null}]));
 let status='loading';

 function refreshStatus(){
  const values=[...records.values()];
  const loaded=values.filter(record=>record.state==='ready').length;
  const failed=values.filter(record=>record.state==='failed').length;
  status=failed===0&&loaded===values.length?'ready':loaded>0&&failed>0?'partial':failed===values.length?'fallback':'loading';
 }

 function snapshot(){
  const assets=[...records.values()].map(record=>({
   id:record.entry.id,
   role:record.entry.role,
   path:record.entry.path,
   state:record.state,
   error:record.error
  }));
  return Object.freeze({
   status,
   total:assets.length,
   loaded:assets.filter(asset=>asset.state==='ready').length,
   failed:assets.filter(asset=>asset.state==='failed').length,
   pending:assets.filter(asset=>asset.state==='loading').length,
   assets:Object.freeze(assets)
  });
 }

 function load(record){
  return new Promise(resolve=>{
   if(typeof Image!=='function'){
    record.state='failed';record.error='Image constructor unavailable';refreshStatus();resolve(record);return
   }
   const image=new Image();record.image=image;
   image.onload=()=>{record.state='ready';record.error=null;refreshStatus();resolve(record)};
   image.onerror=()=>{record.state='failed';record.error='Asset failed to load';refreshStatus();resolve(record)};
   image.src=record.entry.path;
  })
 }

 function drawRole(role,frame={}){
  const record=records.get(role),entry=record?.entry,context=frame.ctx;
  if(!record||record.state!=='ready'||!context||frame.stageId!==entry.stageId)return false;
  if(entry.entityId&&frame.entityId!==entry.entityId)return false;
  const width=Number.isFinite(frame.width)&&frame.width>0?frame.width:entry.render.width;
  const height=Number.isFinite(frame.height)&&frame.height>0?frame.height:entry.render.height;
  const x=Number.isFinite(frame.x)?frame.x:0,y=Number.isFinite(frame.y)?frame.y:0;
  try{
   context.save();
   if(frame.filter)context.filter=frame.filter;
   if(Number.isFinite(frame.alpha))context.globalAlpha=frame.alpha;
   context.translate(x,y);
   if(Number.isFinite(frame.rotation))context.rotate(frame.rotation);
   context.drawImage(record.image,-width*entry.render.anchorX,-height*entry.render.anchorY,width,height);
   context.restore();
   return true
  }catch(error){
   try{context.restore()}catch(restoreError){}
   return false
  }
 }

 const ready=Promise.all([...records.values()].map(load)).then(()=>{refreshStatus();return snapshot()});
 WW.assets=Object.freeze({get status(){return status},ready,snapshot,drawRole});
})();
