import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const REQUIRED_ROUTES=[
 {role:'early-boss',stageId:'ST001-01',duration:360},
 {role:'early-normal',stageId:'ST001-02',duration:1200},
 {role:'mid-boss',stageId:'ST003-03',duration:1200},
 {role:'late-normal',stageId:'ST004-02',duration:1200},
 {role:'final-dual-boss',stageId:'ST004-03',duration:1200}
];
export const REQUIRED_INPUTS=['keyboard-mouse','browser-touch','physical-device-touch'];
const RATING_KEYS=['movementAim','threatClarity','hitClarity','dodgeResponse','skillResponse','recoveryFairness','buildQuality','fatigue'];
const OBSERVATION_KEYS=['movementAim','threatAndHitClarity','dodgeAndSkillResponse','recovery','build','deathRetry','fatigue'];
const ACCESS_METHODS=['pending','legitimate-unlocks','isolated-non-save-fixture'];
const EVIDENCE_SOURCES=['pending','human','automation','emulation'];
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const filled=value=>typeof value==='string'&&value.trim().length>0;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const integerAtLeast=(value,min)=>Number.isInteger(value)&&value>=min;

function validateCompletedRoute(route,expected,prefix,errors){
 if(route.outcome!=='victory')errors.push(`${prefix}.outcome must be victory`);
 for(const key of ['attemptCount','deathCount','retryCount'])if(!integerAtLeast(route[key],key==='attemptCount'?1:0))errors.push(`${prefix}.${key} must be an integer >= ${key==='attemptCount'?1:0}`);
 if(!finite(route.completionSeconds)||route.completionSeconds<=0||route.completionSeconds>expected.duration)errors.push(`${prefix}.completionSeconds must be > 0 and <= ${expected.duration}`);
 if(!finite(route.healthMarginPercent)||route.healthMarginPercent<0||route.healthMarginPercent>100)errors.push(`${prefix}.healthMarginPercent must be between 0 and 100`);
 if(!isObject(route.build)||!filled(route.build.summary)||!Array.isArray(route.build.keyChoices)||route.build.keyChoices.length===0||route.build.keyChoices.some(value=>!filled(value)))errors.push(`${prefix}.build needs a summary and keyChoices`);
 if(!isObject(route.ratings))errors.push(`${prefix}.ratings is required`);
 else for(const key of RATING_KEYS)if(!Number.isInteger(route.ratings[key])||route.ratings[key]<1||route.ratings[key]>5)errors.push(`${prefix}.ratings.${key} must be an integer from 1 to 5`);
 if(!isObject(route.observations))errors.push(`${prefix}.observations is required`);
 else for(const key of OBSERVATION_KEYS)if(!filled(route.observations[key]))errors.push(`${prefix}.observations.${key} is required`);
 if(!Array.isArray(route.evidenceRefs)||route.evidenceRefs.length===0||route.evidenceRefs.some(value=>!filled(value)))errors.push(`${prefix}.evidenceRefs needs at least one reference`);
}

export function validateAcceptance(report){
 const errors=[],warnings=[],coverage=Object.fromEntries(REQUIRED_INPUTS.map(input=>[input,false]));
 const completedRoutes=Object.fromEntries(REQUIRED_INPUTS.map(input=>[input,0]));
 if(!isObject(report))return {valid:false,accepted:false,errors:['report must be an object'],warnings,coverage,completedRoutes};
 if(report.schema!=='wanjie-human-play-v1')errors.push('schema must be wanjie-human-play-v1');
 if(!['pending','complete'].includes(report.acceptanceStatus))errors.push('acceptanceStatus must be pending or complete');
 if(!Array.isArray(report.sessions)||report.sessions.length===0)errors.push('sessions must be a non-empty array');
 const sessionIds=new Set();
 for(const [sessionIndex,session] of (Array.isArray(report.sessions)?report.sessions:[]).entries()){
  const prefix=`sessions[${sessionIndex}]`,startErrors=errors.length;
  if(!isObject(session)){errors.push(`${prefix} must be an object`);continue}
  if(!filled(session.sessionId))errors.push(`${prefix}.sessionId is required`);
  else if(sessionIds.has(session.sessionId))errors.push(`${prefix}.sessionId is duplicated`);
  else sessionIds.add(session.sessionId);
  if(!['pending','completed'].includes(session.status))errors.push(`${prefix}.status must be pending or completed`);
  if(!REQUIRED_INPUTS.includes(session.inputMethod))errors.push(`${prefix}.inputMethod is invalid`);
  const tester=isObject(session.tester)?session.tester:{};
  const environment=isObject(session.environment)?session.environment:{};
  const access=isObject(session.routeAccess)?session.routeAccess:{};
  const performance=isObject(session.devicePerformance)?session.devicePerformance:{};
  if(typeof tester.humanConfirmed!=='boolean')errors.push(`${prefix}.tester.humanConfirmed must be boolean`);
  if(!EVIDENCE_SOURCES.includes(environment.evidenceSource))errors.push(`${prefix}.environment.evidenceSource is invalid`);
  if(typeof environment.emulated!=='boolean')errors.push(`${prefix}.environment.emulated must be boolean`);
  if(typeof environment.physicalPhoneConfirmed!=='boolean')errors.push(`${prefix}.environment.physicalPhoneConfirmed must be boolean`);
  if((environment.evidenceSource==='automation'||environment.evidenceSource==='emulation')&&tester.humanConfirmed)errors.push(`${prefix} cannot mark automation/emulation as human`);
  if((environment.evidenceSource==='emulation'||environment.emulated)&&environment.physicalPhoneConfirmed)errors.push(`${prefix} cannot mark emulation as a physical phone`);
  if(!ACCESS_METHODS.includes(access.method))errors.push(`${prefix}.routeAccess.method is invalid`);
  const routes=Array.isArray(session.routes)?session.routes:[];
  if(routes.length!==REQUIRED_ROUTES.length)errors.push(`${prefix}.routes must contain exactly ${REQUIRED_ROUTES.length} required routes`);
  const routeKeys=new Set();
  for(const [routeIndex,route] of routes.entries()){
   const routePrefix=`${prefix}.routes[${routeIndex}]`;
   if(!isObject(route)){errors.push(`${routePrefix} must be an object`);continue}
   const key=`${route.role}:${route.stageId}`;
   const expected=REQUIRED_ROUTES.find(item=>item.role===route.role&&item.stageId===route.stageId);
   if(!expected)errors.push(`${routePrefix} has an unknown role/stage pair`);
   if(routeKeys.has(key))errors.push(`${routePrefix} duplicates ${key}`);
   routeKeys.add(key);
   if(!['pending','completed'].includes(route.status))errors.push(`${routePrefix}.status must be pending or completed`);
   if(session.status==='completed'&&route.status!=='completed')errors.push(`${routePrefix} must be completed with its session`);
   if(route.status==='completed'&&expected)validateCompletedRoute(route,expected,routePrefix,errors);
  }
  for(const expected of REQUIRED_ROUTES)if(!routeKeys.has(`${expected.role}:${expected.stageId}`))errors.push(`${prefix}.routes is missing ${expected.role}:${expected.stageId}`);
  if(session.status==='completed'){
   if(environment.evidenceSource!=='human'||tester.humanConfirmed!==true||!filled(tester.testerId))errors.push(`${prefix} completed sessions require identified, confirmed human input`);
   if(environment.emulated)errors.push(`${prefix} completed human sessions cannot use emulation`);
   for(const key of ['deviceName','os','browser','viewport'])if(!filled(environment[key]))errors.push(`${prefix}.environment.${key} is required`);
   if(!['legitimate-unlocks','isolated-non-save-fixture'].includes(access.method)||!filled(access.notes))errors.push(`${prefix}.routeAccess must document legitimate unlocks or an isolated non-save fixture`);
   if(!filled(session.sessionNotes))errors.push(`${prefix}.sessionNotes is required`);
   if(session.inputMethod==='physical-device-touch'){
    if(environment.physicalPhoneConfirmed!==true)errors.push(`${prefix} physical-device-touch requires physicalPhoneConfirmed`);
    if(!finite(performance.sustainedMinutes)||performance.sustainedMinutes<20)errors.push(`${prefix}.devicePerformance.sustainedMinutes must be >= 20`);
    if(!finite(performance.averageFps)||performance.averageFps<=0||performance.averageFps>240)errors.push(`${prefix}.devicePerformance.averageFps is invalid`);
    if(!finite(performance.minimumObservedFps)||performance.minimumObservedFps<=0||performance.minimumObservedFps>performance.averageFps)errors.push(`${prefix}.devicePerformance.minimumObservedFps is invalid`);
    if(!filled(performance.thermalObservation))errors.push(`${prefix}.devicePerformance.thermalObservation is required`);
   }else if(environment.physicalPhoneConfirmed)errors.push(`${prefix} non-phone input cannot claim the physical-phone evidence slot`);
  }
  const sessionClean=errors.length===startErrors;
  if(sessionClean&&session.status==='completed'){
   coverage[session.inputMethod]=true;
   completedRoutes[session.inputMethod]=routes.filter(route=>route.status==='completed').length;
  }
 }
 const coverageComplete=REQUIRED_INPUTS.every(input=>coverage[input]&&completedRoutes[input]===REQUIRED_ROUTES.length);
 if(report.acceptanceStatus==='complete'&&!coverageComplete)errors.push('acceptanceStatus complete requires clean completed coverage for all three input methods');
 if(report.acceptanceStatus==='pending'&&coverageComplete)warnings.push('all required evidence is present; set acceptanceStatus to complete after review');
 const valid=errors.length===0,accepted=valid&&report.acceptanceStatus==='complete'&&coverageComplete;
 return {valid,accepted,errors,warnings,coverage,completedRoutes};
}

function clone(value){return JSON.parse(JSON.stringify(value))}
function completeSyntheticSession(session){
 session.status='completed';
 session.tester={testerId:`synthetic-${session.inputMethod}`,humanConfirmed:true};
 session.environment={evidenceSource:'human',emulated:false,physicalPhoneConfirmed:session.inputMethod==='physical-device-touch',deviceName:'synthetic device',os:'synthetic OS',browser:'synthetic browser',viewport:'synthetic viewport'};
 session.routeAccess={method:'legitimate-unlocks',notes:'synthetic validator self-test only'};
 session.devicePerformance=session.inputMethod==='physical-device-touch'?{sustainedMinutes:20,averageFps:60,minimumObservedFps:48,thermalObservation:'synthetic warm'}:{sustainedMinutes:null,averageFps:null,minimumObservedFps:null,thermalObservation:''};
 session.routes=session.routes.map((route,index)=>({...route,status:'completed',outcome:'victory',attemptCount:1,deathCount:0,retryCount:0,completionSeconds:index?1190:350,healthMarginPercent:60,build:{summary:'synthetic build',keyChoices:['synthetic choice']},ratings:Object.fromEntries(RATING_KEYS.map(key=>[key,4])),observations:Object.fromEntries(OBSERVATION_KEYS.map(key=>[key,'synthetic observation'])),evidenceRefs:['synthetic://self-test']}));
 session.sessionNotes='synthetic validator self-test only';
 return session;
}

function runSelfTest(){
 const template=JSON.parse(fs.readFileSync(path.join(root,'playtest/session-template.json'),'utf8'));
 const pending=validateAcceptance(template);
 assert.equal(pending.valid,true);
 assert.equal(pending.accepted,false);
 const accepted=clone(template);
 accepted.acceptanceStatus='complete';
 accepted.sessions=accepted.sessions.map(completeSyntheticSession);
 const acceptedResult=validateAcceptance(accepted);
 assert.deepEqual(acceptedResult.errors,[]);
 assert.equal(acceptedResult.accepted,true);
 const automationClaim=clone(accepted);
 automationClaim.sessions[0].environment.evidenceSource='automation';
 assert.equal(validateAcceptance(automationClaim).valid,false);
 const emulatedPhone=clone(accepted);
 emulatedPhone.sessions[2].environment.emulated=true;
 assert.equal(validateAcceptance(emulatedPhone).valid,false);
 console.log('PLAYTEST SELF-TEST OK: pending template, complete synthetic coverage, automation rejection, and emulated-phone rejection.');
}

if(path.resolve(process.argv[1]||'')===path.resolve(fileURLToPath(import.meta.url))){
 const args=process.argv.slice(2);
 if(args.includes('--self-test'))runSelfTest();
 else{
  const requireAcceptance=args.includes('--require-acceptance');
  const fileArg=args.find(arg=>!arg.startsWith('--'))||'playtest/session-template.json';
  let report;
  try{report=JSON.parse(fs.readFileSync(path.resolve(root,fileArg),'utf8'))}catch(error){console.error(`PLAYTEST INVALID: ${error.message}`);process.exit(1)}
  const result=validateAcceptance(report);
  for(const warning of result.warnings)console.warn(`WARN ${warning}`);
  if(!result.valid){
   console.error(`PLAYTEST INVALID: ${result.errors.length} error(s)`);
   for(const error of result.errors)console.error(`- ${error}`);
   process.exit(1);
  }
  const coverage=REQUIRED_INPUTS.map(input=>`${input} ${result.completedRoutes[input]}/${REQUIRED_ROUTES.length}`).join(', ');
  if(result.accepted)console.log(`PLAYTEST ACCEPTED: ${coverage}`);
  else{
   console.log(`PLAYTEST PENDING: ${coverage}. This is not human acceptance evidence.`);
   if(requireAcceptance)process.exit(2);
  }
 }
}
