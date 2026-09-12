var contextRuntimeToken = typeof utBeginRuntimePhase === "function" ? utBeginRuntimePhase("context") : null;
function CE_CTX_twists(text){
  try{
    var init=Library.initState(),c=init.c,cfg=init.cfg;
    Library.applyEntryConfig(cfg);
    var control=String(state.unsaid&&state.unsaid.controlRequest||"");
    var manual=control==="peek"||control==="card";
    var advanced=Library.beginContextTurn(c,text,!manual);
    Library.updateScenarioProfile(c,cfg,text);
    var cache=!!(typeof info!=="undefined"&&info&&info.useCacheEfficient);
    Library.updateCacheEfficiencyWarning(cache);
    if(typeof CE_playerIdentityNames==="function")c.multiplayerNames=CE_playerIdentityNames();
    else if(typeof CE_platformCharacterNames==="function")c.multiplayerNames=CE_platformCharacterNames();
    if(!cfg.enabled||manual){c.hintActive=false;c.lastContextHint="";if(typeof syncTwistFrontMemoryHint==="function")syncTwistFrontMemoryHint("");Library.updateNudgeCard(cache,"",[]);Library.updateConfigCard(cfg,c);Library.updateTwistLogCard(c,cfg);return text;}
    if(!advanced&&!c.forcePlant&&!c.forceEntity){
      if(cache&&c.hintActive&&c.lastContextHint&&typeof CE_appendCompleteContextSuffix==="function"){
        var reserve=typeof UN_contextReserveChars==="function"?UN_contextReserveChars():0;
        var replay=CE_appendCompleteContextSuffix(text,"\n\n"+c.lastContextHint,reserve);if(replay&&replay.appended)return replay.text;
      }
      return text;
    }
    if(c.forcePlant){var planted=Library.createThread(c,c.forcePlant.entity,c.forcePlant.category,c.turn,cfg);if(planted){planted.source="manual";planted.manualPlant=true;if(!planted.evidenceRecords||!planted.evidenceRecords.length)planted.storyEvidenceTouches=0;}c.forcePlant=null;}
    var scan=(typeof recentTurnsText==="function"?recentTurnsText(text,3):String(text||"").slice(-4500)).replace(/\[[^\[\]]*\]/g," ").replace(/《[^》]*》?/g," ").replace(/【CARD】[\s\S]*?【\/CARD】?/g," ");
    var live=Library.eligibleCardTitles(scan,32),lane=Math.abs(Number(c.turn||0))%4;
    Library.scanForLooseThreads(scan,c,cfg,live);
    if(lane===0&&live.length&&(typeof utHasRuntimeBudget!=="function"||utHasRuntimeBudget(180)))Library.scanStoryCardsForScenarioThreads(c,cfg,live,true);
    else if(lane===1&&(typeof utHasRuntimeBudget!=="function"||utHasRuntimeBudget(300)))Library.scanPlotEssentialsForThreads(c,cfg,live);
    else if(lane===2&&(typeof utHasRuntimeBudget!=="function"||utHasRuntimeBudget(260)))Library.scanAuthorsNoteForThreads(c,cfg,live);
    else if(lane===3&&(typeof utHasRuntimeBudget!=="function"||utHasRuntimeBudget(380)))Library.scanStoryCardsForScenarioThreads(c,cfg,[],false);
    if(typeof Library.promoteEligibleThreads==="function")Library.promoteEligibleThreads(c,cfg);
    var hint=null,entities=[],direct=false,thread=null;
    if(c.forceEntity){
      if(c.forceEntity==="any")thread=Library.pickPayoffThread(c,cfg)||Library.pickMostBuiltUpBrewingThread(c,cfg);else thread=(c.threads||[]).find(function(t){return t.id===c.forceEntity&&Library.isThreadAllowed(t,cfg);});
      if(thread){if(thread.status==="brewing"){thread.seedTouches=Math.max(thread.seedTouches,cfg.minSeedsForPayoff);thread.tier=Library.tierFor(thread.seedTouches);thread.status="ready";}hint=Library.payoffHint(thread);entities=[thread.entity];c.pendingPayoffId=thread.id;c.pendingPayoffId2=null;c.lastPayoffAttemptTurn=c.turn;}else if(typeof pushMessage==="function")pushMessage('🌀 Nothing has built up enough yet to force a twist on.');
      c.forceEntity=null;
    }
    if(!hint&&!(typeof UN_shouldSuppressPlotTwist==="function"&&UN_shouldSuppressPlotTwist())&&(c.turn-c.lastPayoffTurn)>=cfg.payoffCooldown&&(c.turn-c.lastPayoffAttemptTurn)>=cfg.twistRetryCooldown){
      var payoff=Library.pickPayoffThread(c,cfg);if(payoff){hint=Library.payoffHint(payoff);entities=[payoff.entity];c.pendingPayoffId=payoff.id;c.pendingPayoffId2=null;c.lastPayoffAttemptTurn=c.turn;}
    }
    if(!hint&&!(typeof UN_shouldSuppressPlotTwist==="function"&&UN_shouldSuppressPlotTwist())){
      var pace=Library.effectivePacing(cfg,c);if(pace>0&&c.turn%pace===0){var seed=Library.pickForeshadowThread(c,cfg);if(seed){hint=Library.foreshadowHint(seed);entities=[seed.entity];c.pendingSeedId=seed.id;}}
    }
    c.lastContextHint=hint||"";c.hintActive=!!hint;
    if(cache&&hint&&typeof CE_appendCompleteContextSuffix==="function"){
      var rr=typeof UN_contextReserveChars==="function"?UN_contextReserveChars():0,ap=CE_appendCompleteContextSuffix(text,"\n\n"+hint,rr);if(ap&&ap.appended){text=ap.text;direct=true;if(typeof syncTwistFrontMemoryHint==="function")syncTwistFrontMemoryHint("");}else if(typeof syncTwistFrontMemoryHint==="function")syncTwistFrontMemoryHint(hint);
    }else if(typeof syncTwistFrontMemoryHint==="function")syncTwistFrontMemoryHint(hint||"");
    Library.updateNudgeCard(cache&&!direct,hint,entities);Library.updateConfigCard(cfg,c);Library.updateTwistLogCard(c,cfg);
  }catch(e){try{if(typeof utRecordRuntimeError==="function")utRecordRuntimeError("Context/Twists",e);}catch(_){}}
  return text;
}
function CE_CTX_nameIn(name,text){var n=String(name||"").toLowerCase().trim(),s=String(text||"").toLowerCase();if(!n)return false;var at=s.indexOf(n);while(at>=0){var b=at?s[at-1]:"",a=at+n.length<s.length?s[at+n.length]:"";if((!b||!/[a-z0-9]/i.test(b))&&(!a||!/[a-z0-9]/i.test(a)))return true;at=s.indexOf(n,at+1);}return false;}
function CE_CTX_readCfg(text){
  if(typeof initUnsaid==="function")initUnsaid();
  var cfg={...UNSAID_DEFAULTS},card=typeof ensureSharedConfigCard==="function"?ensureSharedConfigCard():null;
  try{if(card&&typeof extractConfigSection==="function"&&typeof parseUnsaidSectionInto==="function")parseUnsaidSectionInto(cfg,extractConfigSection(CW_cardEntryText(card),CONFIG_SECTION_UNSAID));}catch(_){}
  try{var cc=card&&typeof ensureCodexConfigCard==="function"?ensureCodexConfigCard(card):null;if(cc&&typeof applyCodexConfigText==="function")applyCodexConfigText(cfg,CW_cardEntryText(cc));}catch(_){}
  try{var pn=typeof CE_primaryPlayerName==="function"?CE_primaryPlayerName():"";if(pn)cfg.playerName=pn;}catch(_){}
  var recent=String(text||"").slice(-9000),live=[];
  try{if(typeof CW_liteCharacterNames==="function")live=CW_liteCharacterNames(recent,16)||[];}catch(_){}
  try{var reg=state.unsaid&&Array.isArray(state.unsaid.castRegistry)?state.unsaid.castRegistry:[];reg.slice(-48).forEach(function(n){if(CE_CTX_nameIn(n,recent)&&live.indexOf(n)<0)live.push(n);});}catch(_){}
  if(state.unsaid&&state.unsaid.forcedPeek&&live.indexOf(state.unsaid.forcedPeek)<0)live.push(state.unsaid.forcedPeek);
  cfg.cast=live.filter(function(n){try{return !(typeof CE_isResolvedPlayerName==="function"&&CE_isResolvedPlayerName(n));}catch(_){return String(n).toLowerCase()!==String(cfg.playerName||"").toLowerCase();}}).slice(0,24);
  try{cfg.cast.forEach(function(n){if(!state.unsaid.castRegistry.some(function(x){return isSameCardEntity(x,n);}))state.unsaid.castRegistry.push(n);});if(state.unsaid.castRegistry.length>MAX_CAST_SIZE)state.unsaid.castRegistry=state.unsaid.castRegistry.slice(-MAX_CAST_SIZE);}catch(_){}
  return cfg;
}
function CE_CTX_unsaid(text){
  var original=text;
  try{
    var cfg=CE_CTX_readCfg(text);text=stripConfigNoise(text);var cache=!!(typeof info!=="undefined"&&info&&info.useCacheEfficient);
    var fp=state.unsaid.forcedPeek,fpc=state.unsaid.forcedPeekCore,fc=state.unsaid.forcedCodex;state.unsaid.forcedPeek=null;state.unsaid.forcedPeekCore=null;state.unsaid.forcedCodex=null;
    if(!cfg.enabled){state.unsaid.pending=null;state.unsaid.controlRequest="";if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,"");return text;}
    var manual=String(state.unsaid.controlRequest||"");var advanced=isNewStoryTurn(text);
    if(!advanced&&!fp&&!fc){state.unsaid.pending=null;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,"");return text;}
    if(manual!=="peek"&&manual!=="card")state.unsaid.turn++;
    var recent=recentTurnsText(text,cfg.recentTurnsWindow),latest=recentTurnsText(text,1),active=activeUnsaidCharacters(cfg.cast,recent,latest);active.forEach(seedMindIfKnown);if(fp)seedMindIfKnown(fp);
    if(fp&&fpc&&!cfg.allowCoreShift){if(typeof pushMessage==="function")pushMessage('🌗 Core-shift checks are disabled in config.');state.unsaid.controlRequest="";return text;}
    if(fp){var fi=fpc?buildCoreCheckInstruction(fp,state.unsaid.minds[fp]):buildAndFitThoughtInstruction(fp,active,text,cfg.allowCoreShift,cfg);var ff=fpc?fitInstructionToBudget(text,fi):fi;if(ff){state.unsaid.pending=fp;state.unsaid.pendingCoreShiftAllowed=fpc||naturalCoreShiftEligible(state.unsaid.minds[fp],cfg.allowCoreShift,fp);state.unsaid.pendingCoreCheck=!!fpc;state.unsaid.pendingRevealForced=true;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,ff);return text+ff;}state.unsaid.controlRequest="";return text;}
    if(fc){var ft=reconcileCodexEntityType(fc,text)||resolveCodexEntityType(fc,text)||classifyCodexEntry(fc,text),pf=state.unsaid.codex.attempts[fc]||0,ci=buildAndFitCodexInstruction([fc],text,true,pf,true);if(ci){state.unsaid.codex.attempts[fc]=pf+1;state.unsaid.codex.lastAttemptTurn[fc]=state.unsaid.turn;state.unsaid.codex.pendingNames=[fc];state.unsaid.codex.pendingTypes={};state.unsaid.codex.pendingTypes[fc]=ft;state.unsaid.codex.pendingForced=true;state.unsaid.codex.pendingRefreshNames=[];state.unsaid.codex.lastTriggerTurn=state.unsaid.turn;state.unsaid.pending=null;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,ci);return text+ci;}state.unsaid.controlRequest="";return text;}
    var owner=!!(state.contingency&&state.contingency.hintActive)||(typeof UN_structuredOwnerActive==="function"&&UN_structuredOwnerActive());
    if(cfg.codexEnabled&&!owner){
      var since=state.unsaid.turn-(state.unsaid.codex.lastTriggerTurn||0);
      if(cfg.codexAutoRefresh&&since>=cfg.codexCooldown&&typeof pickCodexRefreshCandidate==="function"&&(typeof utHasRuntimeBudget!=="function"||utHasRuntimeBudget(240))){var r=pickCodexRefreshCandidate(cfg);if(r&&r.name){var ri=buildAndFitCodexInstruction([r.name],text,false,0,false,true);if(ri){state.unsaid.codex.pendingNames=[r.name];state.unsaid.codex.pendingTypes={};state.unsaid.codex.pendingTypes[r.name]=r.type||"character";state.unsaid.codex.pendingForced=false;state.unsaid.codex.pendingRefreshNames=[r.name];state.unsaid.codex.lastTriggerTurn=state.unsaid.turn;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,ri);return text+ri;}}}
    }
    state.unsaid.codex.pendingNames=[];state.unsaid.codex.pendingForced=false;state.unsaid.codex.pendingRefreshNames=[];
    if(owner){state.unsaid.pending=null;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,"");return text;}
    var eligible=active.filter(function(n){var m=state.unsaid.minds[n];return !m||!m.lastTurn||(state.unsaid.turn-m.lastTurn)>=cfg.cooldown;});var action=typeof getLastActionType==="function"?getLastActionType():"";var playerAction=action==="do"||action==="say";var chance=typeof unsaidEffectiveRevealChance==="function"?unsaidEffectiveRevealChance(cfg,eligible,state.unsaid.turn,playerAction):cfg.chance;
    if(eligible.length&&Math.random()<chance){var chosen="",bestWait=-1;try{eligible.forEach(function(n){var m=state.unsaid.minds[n]||{},p=state.unsaid.scenePresence[n]||{},last=(m.lastTurn!=null&&Number.isFinite(Number(m.lastTurn)))?Number(m.lastTurn):Number(p.firstSeenTurn||state.unsaid.turn),wait=state.unsaid.turn-last;if(Number(p.firstSeenTurn||state.unsaid.turn)<=state.unsaid.turn-8&&wait>bestWait){bestWait=wait;chosen=n;}});}catch(_){}if(!chosen)chosen=typeof pickUnsaidThinker==="function"?pickUnsaidThinker(eligible,state.unsaid.turn,recent):eligible[0];var ti=buildAndFitThoughtInstruction(chosen,active,text,cfg.allowCoreShift,cfg);if(ti){state.unsaid.pending=chosen;state.unsaid.pendingCoreShiftAllowed=naturalCoreShiftEligible(state.unsaid.minds[chosen],cfg.allowCoreShift,chosen);state.unsaid.pendingCoreCheck=false;state.unsaid.pendingRevealForced=false;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,ti);return text+ti;}}
    state.unsaid.pending=null;if(typeof updateUnsaidBackupCard==="function")updateUnsaidBackupCard(cache,"");return text;
  }catch(e){try{if(typeof utRecordRuntimeError==="function")utRecordRuntimeError("Context/UNSAID",e);}catch(_){}return original;}
}
function CE_CTX_twistsLight(text){try{var x=Library.initState();Library.applyEntryConfig(x.cfg);var control=String(state.unsaid&&state.unsaid.controlRequest||"");Library.beginContextTurn(x.c,text,!(control==="peek"||control==="card"));Library.updateScenarioProfile(x.c,x.cfg,text);if(typeof Library.promoteEligibleThreads==="function")Library.promoteEligibleThreads(x.c,x.cfg);x.c.hintActive=false;x.c.lastContextHint="";if(typeof syncTwistFrontMemoryHint==="function")syncTwistFrontMemoryHint("");}catch(_){}return text;}
function CE_CTX_touchUnsaid(text){try{initUnsaid();if(isNewStoryTurn(text))state.unsaid.turn++;state.unsaid.pending=null;state.unsaid.pendingCoreShiftAllowed=false;state.unsaid.pendingCoreCheck=false;state.unsaid.pendingRevealForced=false;}catch(_){}return text;}
var modifier = (text) => {var original=text;try{
  if(typeof UN_resetHookCaches==="function")UN_resetHookCaches("context");
  if(typeof CE_reconcilePlayerIdentityState==="function")CE_reconcilePlayerIdentityState();
  if(typeof CE_bootstrapRequiredConfigCards==="function")CE_bootstrapRequiredConfigCards("context");
  if(typeof initUnsaid==="function")initUnsaid();
  var control=String(state.unsaid&&state.unsaid.controlRequest||""),forceTwist=!!(state.contingency&&(state.contingency.forceEntity||state.contingency.forcePlant));
  var action=0;try{action=Math.abs(Number(info&&info.actionCount||0));}catch(_){}
  var mindLane=(action%2===0);
  try{var uu=state.unsaid||{},ut=Number(uu.turn||0),mm=uu.minds||{},sp=uu.scenePresence||{};if(Object.keys(mm).some(function(n){var m=mm[n]||{},p=sp[n]||{};var last=Number.isFinite(Number(m.lastTurn))&&m.lastTurn!=null?Number(m.lastTurn):Number(p.firstSeenTurn||ut);return Number(p.lastSeenTurn||-999)>=ut-2&&ut-last>=8;}))mindLane=true;}catch(_){}
  if(control==="peek"||control==="card")mindLane=true;if(forceTwist)mindLane=false;
  var working=original;
  if(mindLane){
    working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("twists","context",function(){return CE_CTX_twistsLight(working);},working,true):CE_CTX_twistsLight(working);
    working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("unsaid","context",function(){return CE_CTX_unsaid(working);},working,true):CE_CTX_unsaid(working);
  }else{
    working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("twists","context",function(){return CE_CTX_twists(working);},working,true):CE_CTX_twists(working);
    if(typeof CE_runTurnFeature==="function")CE_runTurnFeature("unsaid","context",function(){CE_CTX_touchUnsaid(original);return true;},true,true);else CE_CTX_touchUnsaid(original);
  }
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("crossed_wires","context",function(){return CW_onContext(working);},working,typeof CW_onContext==="function"):(typeof CW_onContext==="function"?CW_onContext(working):working);
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("echo_veil","context",function(){return EV_onContext(working);},working,typeof EV_onContext==="function"):(typeof EV_onContext==="function"?EV_onContext(working):working);
  if(typeof CE_runTurnFeature==="function")CE_runTurnFeature("world_engine","context",function(){return CEW_onContext(working,false);},"",typeof CEW_onContext==="function");else if(typeof CEW_onContext==="function")CEW_onContext(working,false);
  if(typeof CE_markFeatureActivation==="function")CE_markFeatureActivation("codex","context","ok","CODEX maintenance scheduled in Input/Output");
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("coordinator","context",function(){return CE_COORD_onContext(working);},working,typeof CE_COORD_onContext==="function"):(typeof CE_COORD_onContext==="function"?CE_COORD_onContext(working):working);
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("canon_sentinel","context",function(){return CECS_onContext(working);},working,typeof CECS_onContext==="function"):(typeof CECS_onContext==="function"?CECS_onContext(working):working);
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("full_hardening","context",function(){return CEFH_onContext(working);},working,typeof CEFH_onContext==="function"):(typeof CEFH_onContext==="function"?CEFH_onContext(working):working);
  working=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("causal_impact","context",function(){return CE_IMPACT_applyContext(working,original);},working,typeof CE_IMPACT_applyContext==="function"):(typeof CE_IMPACT_applyContext==="function"?CE_IMPACT_applyContext(working,original):working);
  return {text:working};
}catch(e){try{if(typeof utRecordRuntimeError==="function")utRecordRuntimeError("Context/unified",e);}catch(_){}return {text:original};}finally{if(typeof utEndRuntimePhase==="function")utEndRuntimePhase(contextRuntimeToken);}};
modifier(text);
