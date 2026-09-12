/*
 * CROSSED ECHOES — REBUILT CORE
 * Original implementation for AI Dungeon's documented scripting API.
 *
 * Design rules:
 * - state is the database; Story Cards are public lore / optional dashboards only.
 * - player is never an autonomous NPC mind.
 * - minds are private, relationships are directional, knowledge is witness-bounded.
 * - CODEX creates grounded public lore from story evidence; it never stores private thoughts.
 * - one fair scheduler rotates optional model tasks so no engine starves the others.
 * - all persistent collections are bounded and JSON-safe.
 */

var CE2_VERSION = "2.0.0";
var CE2_CONFIG_KEY = "__crossed_echoes_v2_config__";
var CE2_CONFIG_TYPE = "Config";
var CE2_DASH_KEY = "__crossed_echoes_v2_dashboard__";
var CE2_DASH_TYPE = "CE Private";
var CE2_GEN_PREFIX = "__ce2_gen_";
var CE2_MIND_PREFIX = "__ce2_mind_";
var CE2_ZERO = "\u200B";
var CE2_FM_BEGIN = "[[CROSSED_ECHOES_V2_BEGIN]]";
var CE2_FM_END = "[[CROSSED_ECHOES_V2_END]]";

var CE2_DEFAULTS = Object.freeze({
  enabled: true,
  player: "auto",
  codex: true,
  codexCardChars: 900,
  codexCreateScore: 7,
  codexMentions: 2,
  codexWritesPerTurn: 1,
  protectManualCards: true,
  minds: true,
  mindChance: 70,
  mindEvery: 2,
  mindCards: true,
  mindContextChars: 1900,
  frontMemory: true,
  frontMemoryChars: 1200,
  relationships: true,
  relationSensitivity: 1,
  socialThreads: true,
  twists: true,
  twistStrict: true,
  twistMinSeeds: 2,
  twistPayoffMinSeeds: 3,
  contextBudgetPct: 24,
  debug: false
});

function CE2_num(v, d, lo, hi) {
  var n = Number(v);
  if (!isFinite(n)) n = d;
  return Math.max(lo, Math.min(hi, n));
}
function CE2_bool(v, d) {
  if (typeof v === "boolean") return v;
  var s = String(v == null ? "" : v).trim().toLowerCase();
  if (/^(1|true|yes|on|enabled)$/.test(s)) return true;
  if (/^(0|false|no|off|disabled)$/.test(s)) return false;
  return d;
}
function CE2_clean(s, max) {
  s = String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").replace(/\s+/g, " ").trim();
  if (max && s.length > max) s = s.slice(0, max - 1).trim() + "…";
  return s;
}
function CE2_key(s) {
  return CE2_clean(s, 120).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
}
function CE2_slug(s) {
  return CE2_key(s).replace(/\s+/g, "_").slice(0, 70) || "entity";
}
function CE2_hash(s) {
  s = String(s || ""); var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function CE2_unique(arr, limit) {
  var out = [], seen = Object.create(null);
  (arr || []).forEach(function(v){ v = CE2_clean(v, 280); var k = CE2_key(v); if(v && k && !seen[k]) { seen[k]=1; out.push(v); }});
  return typeof limit === "number" ? out.slice(-limit) : out;
}
function CE2_clampMetric(n) { return Math.max(-100, Math.min(100, Math.round(Number(n) || 0))); }
function CE2_nowTurn() { return (typeof info === "object" && isFinite(info.actionCount)) ? Number(info.actionCount) : ((state && state.CE2 && state.CE2.turn) || 0); }
function CE2_storyText(limit) {
  var a = Array.isArray(history) ? history : [];
  var s = a.map(function(h){ return String(h && h.text || ""); }).join("\n");
  if (limit && s.length > limit) s = s.slice(-limit);
  return s;
}
function CE2_latestInputType() {
  var a = Array.isArray(history) ? history : [];
  for (var i=a.length-1;i>=0;i--) if (a[i] && a[i].type) return String(a[i].type);
  return "";
}
function CE2_roundTripSafe(obj) {
  try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return null; }
}

function CE2_init() {
  if (!state || typeof state !== "object") return null;
  var old = state.CE2;
  if (!old || typeof old !== "object" || Array.isArray(old)) old = {};
  var R = state.CE2 = old;
  if (!R.version) R.version = CE2_VERSION;
  R.turn = CE2_nowTurn();
  if (!R.player || typeof R.player !== "object") R.player = { name:"", aliases:[], source:"", locked:false };
  if (!R.entities || typeof R.entities !== "object") R.entities = {};
  if (!R.candidates || typeof R.candidates !== "object") R.candidates = {};
  if (!R.minds || typeof R.minds !== "object") R.minds = {};
  if (!R.relations || typeof R.relations !== "object") R.relations = {};
  if (!R.knowledge || typeof R.knowledge !== "object") R.knowledge = {};
  if (!R.threads || typeof R.threads !== "object") R.threads = {};
  if (!R.social || typeof R.social !== "object") R.social = {};
  if (!R.events || !Array.isArray(R.events)) R.events = [];
  if (!R.scene || typeof R.scene !== "object") R.scene = { cast:[], lastText:"", turn:0 };
  if (!R.scheduler || typeof R.scheduler !== "object") R.scheduler = { lane:0, lastMind:0, lastCodex:0, lastSocial:0, mindCursor:0, misses:{} };
  if (!R.codex || typeof R.codex !== "object") R.codex = { queue:[], managed:{}, writeFailures:0 };
  if (!R.snapshots || typeof R.snapshots !== "object") R.snapshots = {};
  if (!R.diag || typeof R.diag !== "object") R.diag = { hooks:0, tags:0, cardsCreated:0, cardsUpdated:0, mindUpdates:0, relationEvents:0, twistSeeds:0, twistResolved:0, knowledgeFacts:0 };
  R.diag.hooks = (R.diag.hooks || 0) + 1;
  return R;
}

function CE2_findCardByKey(key) {
  key = String(key || "");
  var cards = Array.isArray(storyCards) ? storyCards : [];
  for (var i=0;i<cards.length;i++) {
    var keys = String(cards[i] && cards[i].keys || "").split(",").map(function(x){return x.trim();});
    if (keys.indexOf(key) >= 0) return { card:cards[i], index:i };
  }
  return null;
}
function CE2_findCardForName(name) {
  var k = CE2_key(name), cards = Array.isArray(storyCards) ? storyCards : [];
  for (var i=0;i<cards.length;i++) {
    var c=cards[i]||{}, entry=String(c.entry||""), keys=String(c.keys||"").split(",");
    var firstName = "";
    var m = entry.match(/(?:^|\n)\s*Name\s*:\s*([^\n]+)/i); if(m) firstName = CE2_key(m[1]);
    if (firstName && firstName === k) return {card:c,index:i,managed:/__ce2_gen_/.test(String(c.keys||""))};
    for (var j=0;j<keys.length;j++) if (CE2_key(keys[j]) === k) return {card:c,index:i,managed:/__ce2_gen_/.test(String(c.keys||""))};
  }
  return null;
}
function CE2_safeAdd(keys, entry, type) {
  if (typeof addStoryCard !== "function") return false;
  try {
    var before = (Array.isArray(storyCards)?storyCards.length:0);
    var r = addStoryCard(keys, entry, type);
    var found = CE2_findCardByKey(String(keys).split(",").filter(function(k){return /^__ce2_/.test(k.trim());})[0] || String(keys).split(",")[0].trim());
    if (found || (r !== false && (Array.isArray(storyCards)?storyCards.length:0) > before)) return true;
  } catch(e) {}
  return false;
}
function CE2_safeUpdate(index, keys, entry, type) {
  if (typeof updateStoryCard !== "function") return false;
  try { updateStoryCard(index, keys, entry, type); return true; } catch(e) { return false; }
}

function CE2_configEntry() {
  return [
    "CROSSED ECHOES — REBUILT CORE",
    "enabled=true",
    "player=auto",
    "codex=true",
    "codexCardChars=900",
    "codexCreateScore=7",
    "codexMentions=2",
    "protectManualCards=true",
    "minds=true",
    "mindChance=70",
    "mindEvery=2",
    "mindCards=true",
    "frontMemory=true",
    "frontMemoryChars=1200",
    "relationships=true",
    "relationSensitivity=1",
    "socialThreads=true",
    "twists=true",
    "twistStrict=true",
    "twistMinSeeds=2",
    "twistPayoffMinSeeds=3",
    "contextBudgetPct=24",
    "debug=false",
    "",
    "Private minds/relationships/twists live in script state. CODEX cards contain public lore only. Use /ce help."
  ].join("\n");
}
function CE2_ensureConfig() {
  var found = CE2_findCardByKey(CE2_CONFIG_KEY);
  if (!found) CE2_safeAdd(CE2_CONFIG_KEY, CE2_configEntry(), CE2_CONFIG_TYPE);
}
function CE2_getConfig() {
  var cfg = {}; Object.keys(CE2_DEFAULTS).forEach(function(k){cfg[k]=CE2_DEFAULTS[k];});
  var found = CE2_findCardByKey(CE2_CONFIG_KEY), entry = found ? String(found.card.entry||"") : "";
  entry.split(/\r?\n/).forEach(function(line){
    var m=line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if(!m) return;
    var k=m[1],v=m[2]; if(!(k in cfg)) return;
    if (typeof CE2_DEFAULTS[k] === "boolean") cfg[k]=CE2_bool(v,CE2_DEFAULTS[k]);
    else if (typeof CE2_DEFAULTS[k] === "number") cfg[k]=Number(v);
    else cfg[k]=CE2_clean(v,120);
  });
  cfg.codexCardChars=CE2_num(cfg.codexCardChars,900,300,2000);
  cfg.codexCreateScore=CE2_num(cfg.codexCreateScore,7,2,20);
  cfg.codexMentions=CE2_num(cfg.codexMentions,2,1,10);
  cfg.codexWritesPerTurn=CE2_num(cfg.codexWritesPerTurn,1,0,2);
  cfg.mindChance=CE2_num(cfg.mindChance,70,0,100);
  cfg.mindEvery=CE2_num(cfg.mindEvery,2,1,12);
  cfg.mindContextChars=CE2_num(cfg.mindContextChars,1900,400,3200);
  cfg.frontMemoryChars=CE2_num(cfg.frontMemoryChars,1200,400,2400);
  cfg.relationSensitivity=CE2_num(cfg.relationSensitivity,1,0.25,3);
  cfg.twistMinSeeds=CE2_num(cfg.twistMinSeeds,2,1,5);
  cfg.twistPayoffMinSeeds=CE2_num(cfg.twistPayoffMinSeeds,3,2,6);
  cfg.contextBudgetPct=CE2_num(cfg.contextBudgetPct,24,8,45);
  return cfg;
}
function CE2_applyRuntimeConfig(R,cfg) {
  R.runtime={minds:!!cfg.minds,relationships:!!cfg.relationships,socialThreads:!!cfg.socialThreads,relationSensitivity:cfg.relationSensitivity,twistStrict:!!cfg.twistStrict,twistMinSeeds:cfg.twistMinSeeds,twistPayoffMinSeeds:cfg.twistPayoffMinSeeds,mindContextChars:cfg.mindContextChars};
}

var CE2_STOP = new Set((
  "the a an and or but if then so because while when where why how this that these those i you he she it we they me him her us them my your his hers our their " +
  "north south east west monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december " +
  "morning afternoon evening night today tomorrow yesterday meanwhile suddenly later earlier before after inside outside behind ahead nearby somewhere anyone everyone no one someone " +
  "chapter scene story continue do say see yes no okay right good fine thanks thank hello hi hey only sir ma'am madam miss mister doctor dr mr mrs ms professor prof captain officer detective"
).split(/\s+/));
var CE2_BAD_SINGLE = new Set("Behind Somewhere Footsteps Rain Silence Darkness Light Door Window Room Hall Street Road City House Home Office Kitchen Bedroom Bathroom Car Van Truck Phone File Files Name Man Woman Boy Girl People Someone Something Nothing Everything Anything Morning Evening Night Today Tomorrow".toLowerCase().split(" "));
var CE2_NOISE_WORDS = new Set("current main objective quiet empty old wooden heavy good bad recent latest active inactive scene story plot goal goals priority priorities status note notes summary memory context prompt instruction instructions chapter section next previous general important relevant normal ordinary unknown unclear opening recent current immediate dialogue action actions response output input model ai system script turn turns corridor hallway room door window weather rain silence darkness light morning evening night today tomorrow nearby outside inside".split(/\s+/));
var CE2_TITLE_PREFIX = /^(?:(?:Dr|Doctor|Mr|Mrs|Ms|Miss|Prof|Professor|Capt|Captain|Gen|General|Col|Colonel|Lt|Lieutenant|Sgt|Sergeant|Cmdr|Commander|Sen|Senator|Det|Detective|Insp|Inspector)\.?)\s+/i;
var CE2_LOC_HINT = /\b(city|street|road|lane|avenue|district|region|country|kingdom|realm|planet|world|base|facility|university|school|campus|bridge|river|mountain|forest|desert|hall|tavern|inn|hotel|castle|fortress|temple|station|harbou?r|warehouse|factory|farm|arena|courtroom|prison|laboratory|lab|hospital|clinic|park|garden|island|suburb|village|town|house|flat|apartment|building|tower)\b/i;
var CE2_FACTION_HINT = /\b(company|corporation|corp\.?|ltd\.?|limited|group|holdings|freight|logistics|foundation|agency|department|committee|council|guild|order|clan|gang|crew|team|university|government|police|network|syndicate|alliance|empire|army|legion|firm|chambers|partners|association|society|club|church|family)\b/i;
var CE2_ITEM_HINT = /\b(sword|blade|gun|rifle|pistol|staff|wand|ring|armou?r|shield|artifact|device|weapon|key|book|phone|tablet|laptop|computer|vehicle|car|van|truck|ship|suit|mask|helmet|document|file|contract|map|badge|serum|vial|radio)\b/i;
var CE2_CHAR_HINT = /\b(man|woman|boy|girl|person|lawyer|barrister|doctor|officer|agent|teacher|student|friend|sister|brother|mother|father|mum|mam|mom|dad|uncle|aunt|cousin|partner|boyfriend|girlfriend|husband|wife|captain|director|president|he|she|him|her|his|hers)\b/i;

function CE2_normalizeCandidate(raw) {
  var s=CE2_clean(raw,100).replace(/^["'“”‘’\[(]+|["'“”‘’\]),.!?:;]+$/g, "").trim();
  s=s.replace(/^the\s+/i, "").replace(CE2_TITLE_PREFIX, "").trim();
  if (!s || s.length<2 || s.length>80) return "";
  if (/[A-Z]/.test(s) && !/[a-z]/.test(s)) s = s.toLowerCase().replace(/(^|[\s-])([a-z])/g, function(_,a,b){ return a+b.toUpperCase(); });
  var words=s.split(/\s+/);
  if (words.length>6) return "";
  if (words.length===1 && (CE2_STOP.has(words[0].toLowerCase()) || CE2_BAD_SINGLE.has(words[0].toLowerCase()))) return "";
  if (words.every(function(w){var q=w.toLowerCase();return CE2_STOP.has(q)||CE2_NOISE_WORDS.has(q);})) return "";
  if (/^\d+$/.test(s)) return "";
  return s;
}
function CE2_classify(name, context) {
  var n=String(name||""), s=String(context||"");
  // Classify from the candidate itself before nearby prose. This prevents "Cassian Voss"
  // becoming an Item merely because the sentence also contains "file" or "device".
  if (CE2_FACTION_HINT.test(n) || /\b(?:Ltd|LLC|PLC|Inc|Corp|Freight|Logistics|Chambers|Holdings)\b/i.test(n)) return "Faction";
  if (CE2_LOC_HINT.test(n)) return "Location";
  if (CE2_ITEM_HINT.test(n)) return "Item";
  if (/^[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2}$/.test(n)) return "Character";
  if (CE2_CHAR_HINT.test(s)) return "Character";
  if (CE2_FACTION_HINT.test(s)) return "Faction";
  if (CE2_LOC_HINT.test(s)) return "Location";
  if (CE2_ITEM_HINT.test(s)) return "Item";
  return "Unknown";
}
function CE2_candidate(R, name, type, score, snippet, source) {
  name=CE2_normalizeCandidate(name); if(!name) return;
  var k=CE2_key(name); if(!k || CE2_isPlayerName(R,name)) return;
  var known=R.entities[k]||null;
  if(!known){Object.keys(R.entities).some(function(ek){var e=R.entities[ek];if((e.aliases||[]).some(function(a){return CE2_key(a)===k;})){known=e;return true;}return false;});}
  if(known){known.lastSeen=R.turn;known.mentions=(known.mentions||0)+1;if(snippet)known.evidence=CE2_unique((known.evidence||[]).concat([CE2_clean(snippet,260)]),10);return;}
  var c=R.candidates[k] || (R.candidates[k]={name:name,score:0,mentions:0,lastSeen:0,types:{Character:0,Location:0,Item:0,Faction:0},evidence:[],sources:{}});
  if (name.length > c.name.length && name.toLowerCase().indexOf(c.name.toLowerCase())>=0) c.name=name;
  c.score=Math.min(30,(c.score||0)+(score||1)); c.mentions=(c.mentions||0)+1; c.lastSeen=R.turn;
  if(type && c.types[type]!=null) c.types[type]+=Math.max(1,score||1);
  if(snippet) c.evidence=CE2_unique((c.evidence||[]).concat([CE2_clean(snippet,260)]),8);
  c.sources[source||"story"]=(c.sources[source||"story"]||0)+1;
}
function CE2_extractCandidates(R, text, source) {
  text=String(text||""); if(!text) return;
  var sentences=text.replace(/\n+/g," ").split(/(?<=[.!?])\s+|\s*[;]\s*/).slice(-24);
  sentences.forEach(function(sentence){
    var s=CE2_clean(sentence,500); if(!s) return;
    var strong=[];
    var patterns=[
      /\b(?:named|called|known as|codename(?:d)?|alias(?:ed)? as)\s+(?:the\s+)?([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’&.-]*){0,4})/g,
      /\b(?:this is|meet|introduc(?:e|es|ed)\s+(?:you\s+to\s+)?)\s+([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’&.-]*){0,4})/g,
      /\b(?:I'm|I am|my name is)\s+([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’&.-]*){0,4})/g,
      /\bName\s*:\s*([A-Z][^\n,;]{1,70})/g
    ];
    patterns.forEach(function(rx){ var m; while((m=rx.exec(s))) strong.push(m[1]); });
    strong.forEach(function(n){ var nn=CE2_normalizeCandidate(n); if(nn) CE2_candidate(R,nn,CE2_classify(nn,s),8,s,source); });
    // Strong typed grammar for single-word names and ordinary introductions that capitalization-only scanners miss.
    var typed=[
      {t:"Character",r:/\b([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]+){0,3})\s+(?:is|was)\s+(?:an?\s+)?(?:barrister|lawyer|doctor|teacher|student|officer|agent|engineer|scientist|friend|sister|brother|mother|father|director|captain|manager|investigator)\b/g},
      {t:"Location",r:/\b([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]+){0,3})\s+(?:is|was)\s+(?:an?\s+)?(?:quiet\s+|busy\s+|small\s+|large\s+|old\s+|remote\s+)?(?:place|town|city|village|district|station|warehouse|facility|university|school|hotel|street|road|island|base|laboratory|lab)\b/g},
      {t:"Faction",r:/\b([A-Z][A-Za-z'’&.-]*(?:\s+[A-Z][A-Za-z'’&.-]+){0,4})\s+(?:is|was)\s+(?:an?\s+)?(?:company|corporation|firm|agency|organisation|organization|network|syndicate|gang|crew|team|guild|council|foundation|holding company)\b/g},
      {t:"Item",r:/\b([A-Z][A-Za-z'’-]*(?:\s+[A-Z][A-Za-z'’-]+){0,3})\s+(?:is|was)\s+(?:an?\s+)?(?:sword|blade|weapon|artifact|device|vehicle|car|ship|ring|book|serum|mask|suit)\b/g}
    ];
    typed.forEach(function(tp){var tm;while((tm=tp.r.exec(s))){var nn=CE2_normalizeCandidate(tm[1]);if(nn)CE2_candidate(R,nn,tp.t,7,s,source);}});
    var sp=s.match(/^\s*([A-Z][A-Za-z'’-]{1,30})\s*:/);if(sp){var sn=CE2_normalizeCandidate(sp[1]);if(sn)CE2_candidate(R,sn,"Character",7,s,source);}
    var sv=s.match(/^\s*([A-Z][A-Za-z'’-]{1,30})\s+(?:says?|asks?|replies?|whispers?|shouts?|laughs?|smiles?|nods?)\b/);if(sv){var vn=CE2_normalizeCandidate(sv[1]);if(vn)CE2_candidate(R,vn,"Character",6,s,source);}

    var rx=/\b(?:The\s+)?([A-Z][a-zA-Z'’-]+(?:\s+(?:of|the|and|&|North|South|East|West|[A-Z][a-zA-Z'’&.-]+)){0,4})\b/g,m;
    while((m=rx.exec(s))) {
      var n=CE2_normalizeCandidate(m[1]); if(!n) continue;
      if (/^(You|Your|He|She|They|We|His|Her|Their|The)$/i.test(n) || /^You\s+(?:Are|Were|Say|Said|Do|Did)\b/i.test(n)) continue;
      if (/\s+and\s+/i.test(n)) {
        n.split(/\s+and\s+/i).forEach(function(part){ var pn=CE2_normalizeCandidate(part); if(pn) CE2_candidate(R,pn,CE2_classify(pn,s),2+(pn.split(/\s+/).length>=2?1:0),s,source); });
        continue;
      }
      var words=n.split(/\s+/); if(words.length===1 && m.index===0 && !CE2_CHAR_HINT.test(s) && !CE2_FACTION_HINT.test(n) && !CE2_LOC_HINT.test(n) && !CE2_ITEM_HINT.test(n)) continue;
      var typ=CE2_classify(n,s), sc=(words.length>=2?2:1)+(typ!=="Unknown"?1:0);
      CE2_candidate(R,n,typ,sc,s,source);
    }
  });
  CE2_coalesceCandidates(R);
}
function CE2_coalesceCandidates(R) {
  var keys=Object.keys(R.candidates);
  for(var i=0;i<keys.length;i++) for(var j=0;j<keys.length;j++) {
    if(i===j) continue; var a=R.candidates[keys[i]],b=R.candidates[keys[j]]; if(!a||!b) continue;
    var wa=a.name.split(/\s+/), wb=b.name.split(/\s+/);
    if(wa.length===1 && wb.length>=2 && wb[wb.length-1].toLowerCase()===wa[0].toLowerCase() && b.lastSeen>=a.lastSeen-2) {
      b.score+=Math.min(a.score,6); b.mentions+=a.mentions; b.evidence=CE2_unique((b.evidence||[]).concat(a.evidence||[]),8); delete R.candidates[keys[i]]; break;
    }
  }
}
function CE2_candidateType(c) {
  var best="Unknown",v=0; ["Character","Location","Item","Faction"].forEach(function(t){if((c.types[t]||0)>v){v=c.types[t];best=t;}}); return best;
}

function CE2_playerFromOpening() {
  var starts=(Array.isArray(history)?history:[]).filter(function(h){return h&&h.type==="start";}).map(function(h){return String(h.text||"");}).join("\n");
  var pats=[
    /\bYOU\s*(?:ARE|=)\s*([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/i,
    /\byou\s+(?:play as|control)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/i,
    /\bplayer(?:-controlled)?\s+character\s+(?:is|=)\s*([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/i,
    /\b([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})\s+is\s+the\s+(?:only|sole)\s+player-controlled character/i
  ];
  for(var i=0;i<pats.length;i++){var m=starts.match(pats[i]);if(m){var n=CE2_normalizeCandidate(m[1]);if(n)return n;}}
  return "";
}
function CE2_playerFromPlaceholders() {
  var ps=state&&Array.isArray(state.placeholders)?state.placeholders:[];
  for(var i=0;i<ps.length;i++) if(/character\.name|your name|player name|character name/i.test(String(ps[i].question||""))) { var n=CE2_normalizeCandidate(ps[i].answer); if(n) return n; }
  return "";
}
function CE2_resolvePlayer(R,cfg) {
  if (cfg && cfg.player && cfg.player!=="auto") {
    var explicit=CE2_normalizeCandidate(cfg.player); if(explicit){R.player.name=explicit;R.player.source="config";R.player.locked=true;}
  }
  var opening=CE2_playerFromOpening();
  if(opening){R.player.name=opening;R.player.source="opening";R.player.locked=true;}
  if(!R.player.name){var p=CE2_playerFromPlaceholders();if(p){R.player.name=p;R.player.source="placeholder";R.player.locked=true;}}
  if(!R.player.name && typeof info==="object" && Array.isArray(info.characterNames) && info.characterNames.length===1) {R.player.name=CE2_normalizeCandidate(info.characterNames[0]);R.player.source="platform";}
  var aliases=[]; if(R.player.name) aliases.push(R.player.name);
  if(R.player.name && R.player.name.indexOf(" ")>0) aliases.push(R.player.name.split(/\s+/)[0]);
  R.player.aliases=CE2_unique(aliases,6);
  if(R.player.name){
    var pk=CE2_key(R.player.name); delete R.minds[pk];
    Object.keys(R.candidates).forEach(function(k){if(CE2_isPlayerName(R,R.candidates[k].name)) delete R.candidates[k];});
  }
  return R.player;
}
function CE2_isPlayerName(R,name) { var k=CE2_key(name); if(!k)return false; if(k==="you"||k==="player"||k==="protagonist")return true; return (R.player.aliases||[]).some(function(a){return CE2_key(a)===k;}); }

function CE2_importExistingEntities(R, scanText) {
  if(R.cardScanTurn===R.turn)return;
  R.cardScanTurn=R.turn;
  var cards=Array.isArray(storyCards)?storyCards:[], recent=String(scanText==null?CE2_storyText(6500):scanText), low=recent.toLowerCase();
  cards.forEach(function(c){
    var entry=String(c&&c.entry||""), m=entry.match(/(?:^|\n)\s*Name\s*:\s*([^\n]+)/i), name="";
    if(m) name=CE2_normalizeCandidate(m[1]);
    if(!name){var first=String(c&&c.keys||"").split(",")[0];name=CE2_normalizeCandidate(first);}
    if(!name || CE2_isPlayerName(R,name)) return;
    var k=CE2_key(name), already=!!R.entities[k], mentioned=low.indexOf(name.toLowerCase())>=0;
    if(!mentioned){
      var aliases=String(c&&c.keys||"").split(",").map(function(x){return CE2_clean(x,80);}).filter(function(x){return x&&x.indexOf("__ce2_")!==0;});
      mentioned=aliases.some(function(a){if(a.length<3)return false;var esc=a.replace(/[.*+?^${}()|[\]\\]/g,"\$&");return new RegExp("(?:^|[^A-Za-z0-9])"+esc+"(?:$|[^A-Za-z0-9])","i").test(recent);});
    }
    if(!already && !mentioned) return;
    var type=String(c.type||""); if(!/^(Character|Location|Item|Faction|Technology|Transport)$/i.test(type)) type=CE2_classify(name,entry);
    if(/technology|transport/i.test(type)) type="Item";
    var e=R.entities[k] || (R.entities[k]={name:name,type:type||"Unknown",aliases:[],mentions:0,lastSeen:0,cardKey:"",evidence:[],manual:true});
    e.name=name; if(type&&type!=="Unknown")e.type=type; e.manual=!/__ce2_gen_/.test(String(c.keys||""));
    e.aliases=CE2_unique((e.aliases||[]).concat(String(c&&c.keys||"").split(",").map(function(x){return CE2_clean(x,80);}).filter(function(x){return x&&x.indexOf("__ce2_")!==0&&CE2_key(x)!==CE2_key(name);})),8);
    if(mentioned)e.lastSeen=R.turn;
    if(/Character/i.test(e.type) && mentioned){if(!(R.runtime&&R.runtime.minds===false))CE2_seedMindFromCard(R,e,entry);if(!(R.runtime&&R.runtime.relationships===false))CE2_seedRelationshipsFromCard(R,e,entry);}
  });
}
function CE2_seedMindFromCard(R,e,entry) {
  if(!e || CE2_isPlayerName(R,e.name)||(R.runtime&&R.runtime.minds===false))return;
  var mind=CE2_ensureMind(R,e.name); if(!mind)return;
  var m=entry.match(/Personality\s*:\s*([^\n]+)/i); if(m && !mind.core.length) mind.core=CE2_unique(m[1].split(/[,;]+/),6);
  var role=entry.match(/Role\s*:\s*([^\n]+)/i); if(role) mind.role=CE2_clean(role[1],140);
}
function CE2_seedRelationshipsFromCard(R,e,entry) {
  if(!e||CE2_isPlayerName(R,e.name)||(R.runtime&&R.runtime.relationships===false))return;
  var rel=entry.match(/Relationships?\s*:\s*([^\n]+)/i); if(rel) CE2_importRelationshipLine(R,e.name,rel[1]);
}
function CE2_importRelationshipLine(R,from,line) {
  String(line||"").split(/[;,]/).forEach(function(part){
    var m=part.match(/^\s*([^—–-]+?)\s*[—–-]\s*(.+?)\s*$/); if(!m)return;
    var target=CE2_normalizeCandidate(m[1]),role=CE2_clean(m[2],80); if(!target||!role)return;
    if(CE2_isPlayerName(R,target))target="YOU";
    CE2_relation(R,from,target).roles=CE2_unique(CE2_relation(R,from,target).roles.concat([role]),5);
  });
}

function CE2_newMind(name) { return {name:name,role:"",core:[],mood:"",wants:[],goals:[],fears:[],secrets:[],beliefs:[],plans:[],thoughts:[],memories:[],opinions:{},lastSeen:0,lastThought:0,createdTurn:CE2_nowTurn(),misses:0}; }
function CE2_ensureMind(R,name) { if(!name||CE2_isPlayerName(R,name)||(R.runtime&&R.runtime.minds===false))return null; var k=CE2_key(name); return R.minds[k]||(R.minds[k]=CE2_newMind(name)); }
function CE2_memory(mind,text,kind,importance) {
  text=CE2_clean(text,220); if(!text)return;
  var k=CE2_key(text), existing=(mind.memories||[]).find(function(x){return CE2_key(x.text)===k;});
  if(existing){existing.turn=CE2_nowTurn();existing.importance=Math.max(existing.importance||1,importance||1);return;}
  mind.memories.push({text:text,kind:kind||"event",importance:Math.max(1,Math.min(5,importance||1)),turn:CE2_nowTurn()});
  if(mind.memories.length>12){
    var ranked=mind.memories.slice().sort(function(a,b){var sa=(a.importance||1)*20+Math.min(20,Math.max(0,CE2_nowTurn()-(a.turn||0))===0?20:0)+(a.turn||0)/100000;var sb=(b.importance||1)*20+Math.min(20,Math.max(0,CE2_nowTurn()-(b.turn||0))===0?20:0)+(b.turn||0)/100000;return sb-sa;}).slice(0,12);
    mind.memories=ranked.sort(function(a,b){return a.turn-b.turn;});
  }
}
function CE2_mindSummary(mind,max) {
  if(!mind)return ""; var p=[];
  if(mind.role)p.push("role="+mind.role);
  if(mind.core.length)p.push("core="+mind.core.slice(0,4).join(", "));
  if(mind.mood)p.push("mood="+mind.mood);
  if(mind.wants.length)p.push("wants="+mind.wants.slice(-2).join(" / "));
  if(mind.goals.length)p.push("goals="+mind.goals.slice(-2).join(" / "));
  if(mind.fears.length)p.push("fears="+mind.fears.slice(-2).join(" / "));
  if(mind.plans.length)p.push("plans="+mind.plans.slice(-2).join(" / "));
  if(mind.beliefs.length)p.push("beliefs="+mind.beliefs.slice(-2).join(" / "));
  var ops=Object.keys(mind.opinions||{}).map(function(k){return mind.opinions[k];}).sort(function(a,b){return (b.turn||0)-(a.turn||0);}).slice(0,2);if(ops.length)p.push("opinions="+ops.map(function(o){return o.name+": "+o.text;}).join(" / "));
  if(mind.thoughts.length)p.push("private thought="+mind.thoughts[mind.thoughts.length-1].text);
  return CE2_clean(p.join("; "),max||700);
}

function CE2_knowledgeProfile(R,name) {
  if(!name||CE2_isPlayerName(R,name)) return null;
  var k=CE2_key(name);
  return R.knowledge[k] || (R.knowledge[k]={name:CE2_clean(name,100),facts:[]});
}
function CE2_addKnowledge(R,name,text,source,confidence) {
  var q=CE2_knowledgeProfile(R,name); text=CE2_clean(text,220); if(!q||!text)return false;
  var key=CE2_key(text), found=q.facts.some(function(f){return CE2_key(f.text)===key;}); if(found)return false;
  q.facts.push({turn:R.turn,text:text,source:CE2_clean(source||"witnessed",60),confidence:CE2_clean(confidence||"known",30)});
  q.facts=q.facts.slice(-16); R.diag.knowledgeFacts=(R.diag.knowledgeFacts||0)+1; return true;
}
function CE2_knowledgeSummary(R,name,max) {
  var q=R.knowledge[CE2_key(name)]; if(!q||!q.facts||!q.facts.length)return "";
  return CE2_clean(q.facts.slice(-4).map(function(f){return f.text+" ["+f.source+"]";}).join(" | "),max||500);
}
function CE2_nameMentionsWithPositions(R,s) {
  var out=[], text=String(s||""), low=text.toLowerCase();
  function addAll(name){var needle=String(name||"").toLowerCase();if(!needle)return;var at=0,count=0;while((at=low.indexOf(needle,at))>=0&&count<6){out.push({name:name,pos:at,end:at+needle.length});at+=Math.max(1,needle.length);count++;}}
  Object.keys(R.entities).forEach(function(k){var e=R.entities[k]; if(e.type==="Character"&&!CE2_isPlayerName(R,e.name))addAll(e.name);});
  Object.keys(R.minds).forEach(function(k){var m=R.minds[k]; if(!CE2_isPlayerName(R,m.name)&&!R.entities[CE2_key(m.name)])addAll(m.name);});
  var pr=/\b(?:you|your|yourself)\b/gi,pm;while((pm=pr.exec(text))&&out.filter(function(x){return x.name==="YOU";}).length<6)out.push({name:"YOU",pos:pm.index,end:pm.index+pm[0].length});
  (R.player.aliases||[]).forEach(function(a){var needle=String(a).toLowerCase(),at=0,count=0;if(!needle)return;while((at=low.indexOf(needle,at))>=0&&count<3){out.push({name:"YOU",pos:at,end:at+needle.length});at+=needle.length;count++;}});
  var seen={};out=out.filter(function(x){var k=x.name+"@"+x.pos;if(seen[k])return false;seen[k]=1;return true;});
  return out.sort(function(a,b){return a.pos-b.pos||b.end-a.end;});
}
function CE2_observeKnowledge(R,text) {
  var sentences=String(text||"").replace(/\n+/g," ").split(/(?<=[.!?])\s+/).slice(-30);
  sentences.forEach(function(s){
    var mentions=CE2_nameMentionsWithPositions(R,s), low=s.toLowerCase();
    if(!mentions.length)return;
    // Explicit transfer: A tells/explains/reveals to B ... ; You tell B ...
    var verb=/\b(tells?|explains?|reveals?|confesses?|admits?|shows?|warns?|informs?)\b/i.exec(s);
    if(verb){
      var vp=verb.index, actor=null,target=null;
      for(var i=0;i<mentions.length;i++) if(mentions[i].end<=vp) actor=mentions[i];
      for(var j=0;j<mentions.length;j++) if(mentions[j].pos>vp && (!actor||mentions[j].name!==actor.name)){target=mentions[j];break;}
      if(target&&target.name!=="YOU") CE2_addKnowledge(R,target.name,s,(actor?actor.name:"speaker")+" told them","reported");
    }
    // Discovery / witnessed evidence belongs only to people actually present in this sentence/scene.
    if(/\b(discover(?:s|ed)?|learn(?:s|ed)?|finds?|found|reads?|sees?|saw|witness(?:es|ed)?|realizes?|realises?|confirms?|proves?|uncovers?)\b/i.test(s)) {
      mentions.forEach(function(m){if(m.name!=="YOU")CE2_addKnowledge(R,m.name,s,"witnessed","observed");});
    }
  });
}

function CE2_relationKey(a,b) { return CE2_key(a)+"=>"+CE2_key(b); }
function CE2_relation(R,a,b) {
  a=CE2_isPlayerName(R,a)?"YOU":CE2_clean(a,100); b=CE2_isPlayerName(R,b)?"YOU":CE2_clean(b,100);
  var k=CE2_relationKey(a,b); return R.relations[k]||(R.relations[k]={from:a,to:b,roles:[],trust:0,affection:0,attraction:0,respect:0,fear:0,resentment:0,jealousy:0,suspicion:0,loyalty:0,intimacy:0,tension:0,lastTurn:0,history:[]});
}
function CE2_applyRelation(R,a,b,deltas,label,evidence,confidence) {
  if(!a||!b||CE2_key(a)===CE2_key(b))return;
  if(CE2_isPlayerName(R,a))return; // never author autonomous player->NPC psychology
  var rel=CE2_relation(R,a,b), sens=(R.runtime&&isFinite(R.runtime.relationSensitivity)?Number(R.runtime.relationSensitivity):1);
  Object.keys(deltas||{}).forEach(function(k){ if(typeof rel[k]==="number")rel[k]=CE2_clampMetric(rel[k]+Number(deltas[k]||0)*sens); });
  rel.lastTurn=R.turn;
  if(label||evidence) rel.history=rel.history.concat([{turn:R.turn,label:CE2_clean(label,60),evidence:CE2_clean(evidence,180),confidence:confidence||"visible"}]).slice(-12);
  R.diag.relationEvents++;
  CE2_updateSocialThread(R,rel);
  var ma=CE2_ensureMind(R,a); if(ma) CE2_memory(ma,(label?label+": ":"")+CE2_clean(evidence,160),"relationship",2);
}
var CE2_REL_EVENTS=[
  {name:"rescue",rx:/\b(rescues?|saves?|pulls? .*? to safety|protects?|shields?|defends?)\b/i,d:{trust:5,affection:3,respect:4,loyalty:3},recv:{trust:5,affection:3,respect:3}},
  {name:"support",rx:/\b(reassures?|comforts?|supports?|helps?|backs? .*? up|checks? on|stays? with)\b/i,d:{trust:3,affection:3,respect:2},recv:{trust:4,affection:3,respect:2}},
  {name:"affection",rx:/\b(hugs?|embraces?|kisses?|cuddles?|holds? .*? hand|caresses?)\b/i,d:{affection:4,intimacy:4,trust:2},recv:{affection:3,intimacy:3,trust:1}},
  {name:"flirt",rx:/\b(flirts?|teases? flirtatiously|winks?|attracted|chemistry)\b/i,d:{attraction:4,affection:1,tension:2},recv:{attraction:2,affection:1,tension:2}},
  {name:"praise",rx:/\b(praises?|compliments?|thanks?|admits? respect|impressed)\b/i,d:{respect:3,affection:2,trust:1},recv:{respect:2,affection:1}},
  {name:"argument",rx:/\b(argues?|snaps? at|shouts? at|yells? at|accuses?|confronts?)\b/i,d:{tension:4,trust:-2,resentment:2},recv:{tension:4,trust:-2,resentment:2}},
  {name:"threat",rx:/\b(threatens?|intimidates?|blackmails?|coerces?)\b/i,d:{fear:1,trust:-4,resentment:3,tension:5},recv:{fear:5,trust:-5,resentment:4,tension:5}},
  {name:"attack",rx:/\b(attacks?|hits?|punches?|shoots?|stabs?|burns?|strangles?|tortures?|tries? to kill)\b/i,d:{trust:-6,resentment:5,tension:7},recv:{trust:-8,fear:5,resentment:8,tension:8}},
  {name:"betrayal",rx:/\b(betrays?|cheats? on|sells? .*? out|lies? to|deceives?)\b/i,d:{trust:-5,resentment:4,suspicion:4},recv:{trust:-8,resentment:7,suspicion:6,jealousy:3}},
  {name:"apology",rx:/\b(apologizes?|apologises?|says? sorry|asks? forgiveness)\b/i,d:{trust:2,resentment:-3,tension:-2},recv:{trust:2,resentment:-2,tension:-2}}
];
function CE2_activeNamesInText(R,text) {
  var out=[], lower=String(text||"").toLowerCase();
  Object.keys(R.entities).forEach(function(k){var e=R.entities[k];if(e.type!=="Character"||CE2_isPlayerName(R,e.name))return;var hit=lower.indexOf(e.name.toLowerCase())>=0||(e.aliases||[]).some(function(a){return a.length>=3&&new RegExp("(?:^|[^A-Za-z0-9])"+a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?:$|[^A-Za-z0-9])","i").test(String(text||""));});if(hit)out.push(e.name);});
  Object.keys(R.minds).forEach(function(k){var m=R.minds[k];if(lower.indexOf(m.name.toLowerCase())>=0 && !CE2_isPlayerName(R,m.name))out.push(m.name);});
  Object.keys(R.candidates).forEach(function(k){var c=R.candidates[k];if(CE2_candidateType(c)==="Character" && lower.indexOf(c.name.toLowerCase())>=0 && !CE2_isPlayerName(R,c.name))out.push(c.name);});
  return CE2_unique(out,10);
}
function CE2_observeRelationships(R,text) {
  var sentences=String(text||"").replace(/\n+/g," ").split(/(?<=[.!?])\s+/).slice(-30);
  sentences.forEach(function(s){
    var mentions=CE2_nameMentionsWithPositions(R,s); if(!mentions.length)return;
    CE2_REL_EVENTS.forEach(function(ev){var hit=ev.rx.exec(s); if(!hit)return; var vp=hit.index;
      var before=mentions.filter(function(m){return m.end<=vp;}), after=mentions.filter(function(m){return m.pos>vp;});
      var actor=before.length?before[before.length-1]:null, target=after.length?after[0]:null;
      // A player pronoun immediately before a later verb is often the object of an earlier clause ("Ava stands beside you and hugs you").
      if(actor&&actor.name==="YOU"){
        var priorNpc=before.slice(0,-1).filter(function(m){return m.name!=="YOU";});
        if(priorNpc.length)actor=priorNpc[priorNpc.length-1];
      }
      // Passive form: "X is attacked by Y".
      var by=/\bby\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/i.exec(s.slice(vp));
      if(by){var bn=CE2_normalizeCandidate(by[1]);var bm=mentions.find(function(m){return CE2_key(m.name)===CE2_key(bn);});if(bm){target=before.length?before[before.length-1]:target;actor=bm;}}
      if(!actor&&mentions.length===1){
        // If the sentence is second-person and only one NPC is named, verb position resolves common "You help Ava" / "Ava helps you" cases.
        var only=mentions[0]; if(only.name==="YOU")return;
        var yp=s.toLowerCase().search(/\b(?:you|your|yourself)\b/);
        if(yp>=0){if(yp<vp){actor={name:"YOU",pos:yp,end:yp+3};target=only;}else{actor=only;target={name:"YOU",pos:yp,end:yp+3};}}
      }
      if(!actor||!target||actor.name===target.name)return;
      if(actor.name==="YOU" && target.name!=="YOU") CE2_applyRelation(R,target.name,"YOU",ev.recv||ev.d,"received "+ev.name,s,"visible");
      else if(actor.name!=="YOU") {
        CE2_applyRelation(R,actor.name,target.name,ev.d,ev.name,s,"visible");
        if(target.name!=="YOU" && ev.recv) CE2_applyRelation(R,target.name,actor.name,ev.recv,"received "+ev.name,s,"visible");
      }
      // Jealousy only grows when a third NPC is explicitly shown witnessing affection/flirting and already has earned romantic interest.
      if((ev.name==="affection"||ev.name==="flirt")&&/\b(watches?|sees?|notices?|stares?|looks? on|witnesses?)\b/i.test(s)){
        var focus=actor.name==="YOU"?target.name:(target.name==="YOU"?"YOU":target.name);
        mentions.forEach(function(w){if(w.name==="YOU"||w.name===actor.name||w.name===target.name)return;var rk=CE2_relationKey(w.name,focus),wr=R.relations[rk];if(!wr)return;var romantic=(wr.attraction||0)>=8||(wr.intimacy||0)>=15||(wr.roles||[]).some(function(x){return /partner|spouse|wife|husband|boyfriend|girlfriend|lover|dating/i.test(x);});if(romantic)CE2_applyRelation(R,w.name,focus,{jealousy:2,tension:1},"witnessed affection",s,"visible");});
      }
    });
  });
}

function CE2_event(R,text,witnesses,kind) {
  text=CE2_clean(text,240); if(!text)return null;
  var e={id:"e"+R.turn+"_"+CE2_hash(text),turn:R.turn,text:text,witnesses:CE2_unique(witnesses||[],10),kind:kind||"scene"};
  if(!(R.events||[]).some(function(x){return x.id===e.id;})) R.events.push(e);
  R.events=R.events.slice(-40); return e;
}
function CE2_observeMemories(R,text) {
  var cast=CE2_activeNamesInText(R,text); R.scene={cast:cast,lastText:CE2_clean(text,1600),turn:R.turn};
  cast.forEach(function(name){var m=CE2_ensureMind(R,name);if(m){m.lastSeen=R.turn; CE2_memory(m,CE2_clean(text,180),"witnessed scene",1);}});
  if(text) CE2_event(R,text,cast.concat(R.player.name?[R.player.name]:[]),"scene");
}

var CE2_TWIST_PATTERNS=[
  {cat:"hiddenIdentity",rx:/\b(forged identity|false identity|second identity|real name|legal identity|alias|under another name|fake passport|fake credentials)\b/i},
  {cat:"secretAllegiance",rx:/\b(secretly works? for|reports? to|answers? to|on .* payroll|double agent|handler|working for)\b/i},
  {cat:"conspiracy",rx:/\b(shell compan(?:y|ies)|offshore|encrypted channel|dead drop|hidden network|black site|black-site|covert programme|covert program)\b/i},
  {cat:"coverup",rx:/\b(cover[- ]?up|records? (?:were )?deleted|file(?:s)? erased|evidence destroyed|sealed records?|suppressed evidence)\b/i},
  {cat:"betrayal",rx:/\b(betray(?:ed|al)|sold .* out|secretly sabotag|set .* up|lied about)\b/i},
  {cat:"survival",rx:/\b(presumed dead|body was never found|survived|still alive|death was faked|fake death)\b/i},
  {cat:"hiddenAgenda",rx:/\b(unknown motive|hidden agenda|not what .* seems|something .* hiding|won't say why|refuses to explain)\b/i}
];
function CE2_restageThread(R,t) {
  if(!t||t.stage==="resolved")return;
  var min=(R.runtime&&R.runtime.twistMinSeeds)||2;
  t.stage=t.seeds.length>=min+1?"ripe":(t.seeds.length>=min?"developing":"seeded");
}
var CE2_TWIST_PROOF={
  hiddenIdentity:/\b(?:records?|documents?|passport|birth certificate|registrar|database|dna|fingerprints?|forensics?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?|establish(?:es|ed)?)\b[\s\S]{0,120}\b(?:real name|real identity|true identity|legal name|born as|actually)\b|\b(?:real name|true identity|real identity)\s+(?:is|was)\b/i,
  secretAllegiance:/\b(?:payroll|orders?|messages?|records?|ledger|communications?|files?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?|establish(?:es|ed)?)\b[\s\S]{0,120}\b(?:works? for|reports? to|paid by|agent of|member of|double agent)\b|\b(?:admits?|confesses?)\b[\s\S]{0,90}\b(?:works? for|reports? to|paid by|agent of|member of)\b/i,
  conspiracy:/\b(?:audit|records?|ledger|documents?|bank records?|ownership records?|messages?|files?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?|establish(?:es|ed)?)\b[\s\S]{0,140}\b(?:network|shell compan(?:y|ies)|operation|conspiracy|controlled by|funded by|coordinated by)\b/i,
  coverup:/\b(?:audit|records?|logs?|forensics?|files?|messages?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?|establish(?:es|ed)?)\b[\s\S]{0,140}\b(?:cover[- ]?up|deleted|erased|destroyed|suppressed|sealed|falsified|altered)\b|\b(?:admits?|confesses?)\b[\s\S]{0,100}\b(?:deleted|erased|destroyed|suppressed|falsified|covered up)\b/i,
  betrayal:/\b(?:recording|messages?|orders?|footage|records?|witness|forensics?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?|establish(?:es|ed)?)\b[\s\S]{0,140}\b(?:betray(?:ed|al)|sold .* out|set .* up|sabotag|lied to)\b|\b(?:admits?|confesses?)\b[\s\S]{0,100}\b(?:betray(?:ed|al)|sold .* out|set .* up|sabotag)\b/i,
  survival:/\b(?:dna|fingerprints?|forensics?|medical records?|authorities|police|family|witnesses?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|verify|verified|identify|identified)\b[\s\S]{0,120}\b(?:alive|survived|living)\b|\b(?:found|seen|located|rescued)\s+(?:him|her|them|[A-Z][A-Za-z'’-]+)\s+alive\b/i,
  hiddenAgenda:/\b(?:admits?|confesses?|reveals?|explains?)\b[\s\S]{0,120}\b(?:real reason|true reason|actual reason|real motive|true motive|actual motive|why .* did|why .* was)\b|\b(?:records?|messages?|files?)\b[\s\S]{0,100}\b(?:confirm(?:s|ed)?|prove(?:s|d)?|show(?:s|ed)?)\b[\s\S]{0,120}\b(?:motive|agenda|purpose|plan)\b/i
};
function CE2_resolveTwists(R,text) {
  if(!text)return 0;
  var payoffMin=(R.runtime&&R.runtime.twistPayoffMinSeeds)||3, resolved=0;
  var sentences=String(text).replace(/\n+/g," ").split(/(?<=[.!?])\s+/).slice(-35);
  Object.keys(R.threads).forEach(function(k){
    var t=R.threads[k]; if(!t||t.stage==="resolved"||!CE2_TWIST_PROOF[t.category]||(t.seeds||[]).length<payoffMin)return;
    for(var i=0;i<sentences.length;i++){
      var s=sentences[i], rx=CE2_TWIST_PROOF[t.category]; if(!rx.test(s))continue;
      if(t.subject!=="story"&&!new RegExp("\\b"+String(t.subject).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(s))continue;
      var proof=CE2_clean(s,260);
      var prior=(t.seeds||[]).some(function(x){return CE2_key(x.text)===CE2_key(proof);});
      if(prior)continue;
      t.payoff={turn:R.turn,text:proof,status:"confirmed"};t.stage="resolved";t.resolvedTurn=R.turn;t.lastTurn=R.turn;t.pressure=0;
      R.diag.twistResolved=(R.diag.twistResolved||0)+1;resolved++;break;
    }
  });
  return resolved;
}
function CE2_twistSubject(R,s,hitIndex) {
  var text=String(s||""),low=text.toLowerCase(),hits=[];
  function add(name){if(!name||CE2_isPlayerName(R,name))return;var needle=String(name).toLowerCase(),at=0,count=0;while((at=low.indexOf(needle,at))>=0&&count<3){hits.push({name:name,pos:at,end:at+needle.length});at+=Math.max(1,needle.length);count++;}}
  Object.keys(R.entities).forEach(function(k){var e=R.entities[k];if(e&&e.type==="Character")add(e.name);});
  Object.keys(R.minds).forEach(function(k){var m=R.minds[k];if(m)add(m.name);});
  Object.keys(R.candidates).forEach(function(k){var c=R.candidates[k];if(c&&CE2_candidateType(c)==="Character")add(c.name);});
  var seen={};hits=hits.filter(function(h){var k=CE2_key(h.name)+"@"+h.pos;if(seen[k])return false;seen[k]=1;return true;});
  var after=hits.filter(function(h){return h.pos>=hitIndex;}).sort(function(a,b){return a.pos-b.pos;});if(after.length)return after[0].name;
  var before=hits.filter(function(h){return h.end<=hitIndex;}).sort(function(a,b){return b.end-a.end;});if(before.length)return before[0].name;
  return hits.length?hits[0].name:"story";
}
function CE2_seedTwists(R,text) {
  if(!text)return;
  var sentences=String(text).replace(/\n+/g," ").split(/(?<=[.!?])\s+/).slice(-30);
  sentences.forEach(function(s){
    CE2_TWIST_PATTERNS.forEach(function(tp){var hit=tp.rx.exec(s);if(!hit)return;
      var subject=CE2_twistSubject(R,s,hit.index);
      var id=CE2_key(subject)+"|"+tp.cat, t=R.threads[id]||(R.threads[id]={id:id,subject:subject,category:tp.cat,seeds:[],stage:"seeded",createdTurn:R.turn,lastTurn:R.turn,pressure:0});
      var clue=CE2_clean(s,220); if(!t.seeds.some(function(x){return CE2_key(x.text)===CE2_key(clue);})) {t.seeds.push({turn:R.turn,text:clue});t.seeds=t.seeds.slice(-8);t.pressure=Math.min(10,t.pressure+1);R.diag.twistSeeds++;}
      t.lastTurn=R.turn; CE2_restageThread(R,t);
    });
  });
}

function CE2_socialPressure(rel) {
  if(!rel)return "";
  var best=[];
  if(rel.attraction>=4)best.push("attraction"); if(rel.resentment>=4)best.push("resentment"); if(rel.suspicion>=4)best.push("suspicion"); if(rel.jealousy>=4)best.push("jealousy"); if(rel.fear>=4)best.push("fear"); if(rel.affection>=4)best.push("affection"); if(rel.trust>=4)best.push("trust"); if(rel.tension>=4)best.push("tension"); if(rel.loyalty>=4)best.push("loyalty");
  return best.slice(0,3).join("+");
}
function CE2_relationStage(rel) {
  if(!rel)return "unformed";
  if(rel.resentment>=35||rel.fear>=45||(rel.trust<=-30&&rel.tension>=20))return "hostile";
  if(rel.trust>=45&&rel.loyalty>=35&&rel.affection>=35)return "devoted";
  if(rel.intimacy>=35&&rel.affection>=35)return "intimate";
  if(rel.trust>=30&&rel.affection>=25)return "close";
  if(rel.trust>=15||rel.affection>=15||rel.respect>=20)return "warm";
  if(rel.suspicion>=20||rel.tension>=20||rel.resentment>=15)return "strained";
  if(rel.fear>=15||rel.trust<=-15)return "wary";
  return "developing";
}
function CE2_relationSummary(rel) {
  var m=["stage="+CE2_relationStage(rel)];
  var metrics=["trust","affection","attraction","respect","fear","resentment","jealousy","suspicion","loyalty","intimacy","tension"].filter(function(k){return Math.abs(rel[k])>=4;}).sort(function(a,b){return Math.abs(rel[b])-Math.abs(rel[a]);}).slice(0,5).map(function(k){return k+"="+rel[k];});
  m=m.concat(metrics); if(rel.roles&&rel.roles.length)m.unshift("role="+rel.roles.slice(0,2).join("/"));
  return m.join(", ");
}

function CE2_parseTagFields(body) {
  var parts=String(body||"").split("|"); var o={_type:CE2_clean(parts.shift(),20)};
  parts.forEach(function(p){var i=p.indexOf("="); if(i<1)return; var k=CE2_key(p.slice(0,i)).replace(/ /g,"_"),v=CE2_clean(p.slice(i+1),500); if(k)o[k]=v;}); return o;
}
function CE2_applyMindTag(R,o) {
  var name=CE2_normalizeCandidate(o.name||""); if(!name||CE2_isPlayerName(R,name))return false; var m=CE2_ensureMind(R,name); if(!m)return false;
  if(o.mood)m.mood=CE2_clean(o.mood,80);
  [["want","wants",4],["goal","goals",4],["fear","fears",4],["belief","beliefs",5],["plan","plans",4],["secret","secrets",4]].forEach(function(x){if(o[x[0]])m[x[1]]=CE2_unique(m[x[1]].concat([o[x[0]]]),x[2]);});
  if(o.thought){m.thoughts=m.thoughts.concat([{turn:R.turn,text:CE2_clean(o.thought,260)}]).slice(-8);m.lastThought=R.turn;}
  if(o.opinion_target&&o.opinion){var on=CE2_isPlayerName(R,o.opinion_target)?"YOU":CE2_normalizeCandidate(o.opinion_target);if(on&&CE2_key(on)!==CE2_key(name))m.opinions[CE2_key(on)]={name:on,text:CE2_clean(o.opinion,180),turn:R.turn};}
  if(o.memory)CE2_memory(m,o.memory,"private reflection",2);
  m.misses=0; R.diag.mindUpdates++; CE2_syncMindCard(R,m); return true;
}
function CE2_applyRelTag(R,o) {
  var a=CE2_normalizeCandidate(o.from||""),b=CE2_normalizeCandidate(o.to||""); if(!a||!b||CE2_isPlayerName(R,a))return false;
  var d={}; ["trust","affection","attraction","respect","fear","resentment","jealousy","suspicion","loyalty","intimacy","tension"].forEach(function(k){if(o[k]!=null)d[k]=CE2_num(o[k],0,-8,8);});
  CE2_applyRelation(R,a,b,d,o.event||"model observation",o.evidence||"","model"); return true;
}
function CE2_applyTwistTag(R,o) {
  var subject=CE2_normalizeCandidate(o.subject||"")||"story",cat=CE2_clean(o.category||"hiddenAgenda",40),clue=CE2_clean(o.clue||"",220); if(!clue)return false;
  var id=CE2_key(subject)+"|"+CE2_key(cat),t=R.threads[id]||(R.threads[id]={id:id,subject:subject,category:cat,seeds:[],stage:"seeded",createdTurn:R.turn,lastTurn:R.turn,pressure:0});
  if(!t.seeds.some(function(x){return CE2_key(x.text)===CE2_key(clue);}))t.seeds.push({turn:R.turn,text:clue}); t.seeds=t.seeds.slice(-8);t.lastTurn=R.turn;t.pressure=Math.min(10,t.pressure+1);CE2_restageThread(R,t);R.diag.twistSeeds++;return true;
}
function CE2_parseHiddenTags(R,text) {
  var found=0;
  String(text||"").replace(/\[\[CE2:([\s\S]*?)\]\]/g,function(all,body){var o=CE2_parseTagFields(body);if(o._type==="MIND"&&CE2_applyMindTag(R,o))found++;else if(o._type==="REL"&&CE2_applyRelTag(R,o))found++;else if(o._type==="TWIST"&&CE2_applyTwistTag(R,o))found++;return all;});
  R.diag.tags+=found; return found;
}
function CE2_stripHidden(text) { return String(text||"").replace(/\s*\[\[CE2:[\s\S]*?\]\]\s*/g," ").replace(/\s*\[\[CE2:[\s\S]*$/g," ").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim() || CE2_ZERO; }

function CE2_makeMindCardEntry(R,m) {
  var rels=Object.keys(R.relations).map(function(k){return R.relations[k];}).filter(function(r){return CE2_key(r.from)===CE2_key(m.name);}).sort(function(a,b){return b.lastTurn-a.lastTurn;}).slice(0,5);
  var lines=["CROSSED ECHOES — PRIVATE NPC MIND","NPC: "+m.name,"Updated: turn "+R.turn];
  if(m.role)lines.push("Role: "+m.role); if(m.core.length)lines.push("Core: "+m.core.join(", ")); if(m.mood)lines.push("Mood: "+m.mood);
  if(m.wants.length)lines.push("Wants: "+m.wants.join(" | ")); if(m.goals.length)lines.push("Goals: "+m.goals.join(" | ")); if(m.fears.length)lines.push("Fears: "+m.fears.join(" | ")); if(m.plans.length)lines.push("Plans: "+m.plans.join(" | ")); if(m.beliefs.length)lines.push("Beliefs: "+m.beliefs.join(" | ")); if(m.secrets.length)lines.push("Secrets: "+m.secrets.join(" | "));
  var ops=Object.keys(m.opinions||{}).map(function(k){return m.opinions[k];}).sort(function(a,b){return (b.turn||0)-(a.turn||0);}).slice(0,5);if(ops.length){lines.push("Private opinions:");ops.forEach(function(o){lines.push("- "+o.name+": "+o.text);});}
  if(m.thoughts.length){lines.push("Private thoughts:");m.thoughts.slice(-5).forEach(function(t){lines.push("- ["+t.turn+"] "+t.text);});}
  if(rels.length){lines.push("Relationships:");rels.forEach(function(r){lines.push("- "+r.to+": "+(CE2_relationSummary(r)||"developing") );});}
  var know=CE2_knowledgeSummary(R,m.name,700); if(know)lines.push("Known / learned: "+know);
  if(m.memories.length){lines.push("Recent memories:");m.memories.slice(-5).forEach(function(x){lines.push("- "+x.text);});}
  lines.push("PRIVATE: inert trigger; this card is a player-readable dashboard, not public story lore.");
  return lines.join("\n").slice(0,3500);
}
function CE2_syncMindCard(R,m) {
  var cfg=CE2_getConfig(); if(!cfg.mindCards||!m)return;
  var sentinel=CE2_MIND_PREFIX+CE2_slug(m.name)+"__", found=CE2_findCardByKey(sentinel),entry=CE2_makeMindCardEntry(R,m);
  if(found) CE2_safeUpdate(found.index,sentinel,entry,CE2_DASH_TYPE); else CE2_safeAdd(sentinel,entry,CE2_DASH_TYPE);
}
function CE2_syncDashboard(R) {
  var cfg=CE2_getConfig(); if(!cfg.debug)return;
  var lines=["CROSSED ECHOES — ENGINE DASHBOARD","Version: "+CE2_VERSION,"Turn: "+R.turn,"Player: "+(R.player.name||"unresolved"),"Entities: "+Object.keys(R.entities).length,"Minds: "+Object.keys(R.minds).length,"Relationships: "+Object.keys(R.relations).length,"Threads: "+Object.keys(R.threads).length,"CODEX queue: "+R.codex.queue.length,"Tags parsed: "+R.diag.tags];
  var f=CE2_findCardByKey(CE2_DASH_KEY),e=lines.join("\n"); if(f)CE2_safeUpdate(f.index,CE2_DASH_KEY,e,CE2_DASH_TYPE);else CE2_safeAdd(CE2_DASH_KEY,e,CE2_DASH_TYPE);
}

function CE2_codexEntityFromCandidate(R,c) {
  var type=CE2_candidateType(c); if(type==="Unknown") type=(c.name.split(/\s+/).length>=2?"Character":"Concept");
  var k=CE2_key(c.name),e=R.entities[k]||(R.entities[k]={name:c.name,type:type,aliases:[],mentions:0,lastSeen:R.turn,cardKey:"",evidence:[],manual:false});
  e.name=c.name;e.type=type;e.mentions=(e.mentions||0)+c.mentions;e.lastSeen=R.turn;e.evidence=CE2_unique((e.evidence||[]).concat(c.evidence||[]),10); return e;
}
function CE2_codexEntry(e,cfg) {
  var lines=["Name: "+e.name,"Type: "+e.type];
  if(e.aliases&&e.aliases.length)lines.push("Aliases: "+e.aliases.join(", "));
  if(e.evidence&&e.evidence.length){lines.push("Known:");e.evidence.slice(-7).forEach(function(x){lines.push("- "+x);});}
  lines.push("Rule: This card contains only story-supported public information. Private CROSSED ECHOES mind state is stored separately.");
  return lines.join("\n").slice(0,cfg.codexCardChars);
}
function CE2_codexQueue(R,cfg) {
  Object.keys(R.candidates).forEach(function(k){var c=R.candidates[k];if(!c)return; if((c.score>=cfg.codexCreateScore)||(c.mentions>=cfg.codexMentions&&c.score>=4)){if(R.codex.queue.indexOf(k)<0)R.codex.queue.push(k);}});
  R.codex.queue=R.codex.queue.filter(function(k){return !!R.candidates[k];}).slice(0,80);
}
function CE2_codexWrite(R,cfg,forcedName) {
  if(!cfg.codex)return false; CE2_codexQueue(R,cfg);
  var k="";
  if(forcedName){var fk=CE2_key(forcedName); if(R.candidates[fk])k=fk; else {var found=CE2_findCardForName(forcedName); if(found)return false; CE2_candidate(R,forcedName,"Character",10,"Manually requested entity.","command");k=CE2_key(forcedName);}}
  if(!k){R.codex.queue.sort(function(a,b){var x=R.candidates[a],y=R.candidates[b];return (y.score+Math.min(y.mentions,5))-(x.score+Math.min(x.mentions,5));});k=R.codex.queue[0];}
  var c=R.candidates[k]; if(!c)return false; var e=CE2_codexEntityFromCandidate(R,c),existing=CE2_findCardForName(e.name);
  if(existing && cfg.protectManualCards && !existing.managed){e.manual=true; delete R.candidates[k]; R.codex.queue=R.codex.queue.filter(function(x){return x!==k;}); return false;}
  var sentinel=CE2_GEN_PREFIX+CE2_slug(e.name)+"__", keys=e.name+","+sentinel, entry=CE2_codexEntry(e,cfg),ok=false;
  if(existing && existing.managed) ok=CE2_safeUpdate(existing.index,keys,entry,e.type);
  else if(!existing) ok=CE2_safeAdd(keys,entry,e.type);
  if(ok){e.cardKey=sentinel;e.manual=false;R.codex.managed[k]=sentinel;R.diag.cardsCreated+=(existing?0:1);R.diag.cardsUpdated+=(existing?1:0);delete R.candidates[k];R.codex.queue=R.codex.queue.filter(function(x){return x!==k;});if(e.type==="Character")CE2_ensureMind(R,e.name);return true;}
  R.codex.writeFailures++; return false;
}
function CE2_codexRefreshManaged(R,cfg,text) {
  var names=CE2_activeNamesInText(R,text);
  names.forEach(function(name){var k=CE2_key(name),e=R.entities[k];if(!e||e.manual)return;var found=CE2_findCardForName(name);if(found&&found.managed){var entry=CE2_codexEntry(e,cfg);if(entry!==String(found.card.entry||""))CE2_safeUpdate(found.index,name+","+e.cardKey,entry,e.type);}});
}

function CE2_pickMindTarget(R,cfg) {
  var cast=R.scene.cast||[]; var eligible=cast.map(function(n){return CE2_ensureMind(R,n);}).filter(Boolean);
  if(!eligible.length)return null;
  eligible.sort(function(a,b){return (a.lastThought||0)-(b.lastThought||0)||(a.lastSeen||0)-(b.lastSeen||0);});
  var m=eligible[0], since=R.turn-(m.lastThought||0), overdue=since>=cfg.mindEvery, chance=Math.min(98,cfg.mindChance+Math.max(0,since-cfg.mindEvery)*8);
  if(overdue && Math.random()*100<chance)return m; return null;
}
function CE2_topRelations(R,cast) {
  var set={};(cast||[]).forEach(function(n){set[CE2_key(n)]=1;}); set.you=1;
  return Object.keys(R.relations).map(function(k){return R.relations[k];}).filter(function(r){return set[CE2_key(r.from)]&&set[CE2_key(r.to)];}).sort(function(a,b){return b.lastTurn-a.lastTurn;}).slice(0,6);
}
function CE2_topTwist(R,cast) {
  var set={};(cast||[]).forEach(function(n){set[CE2_key(n)]=1;});
  var ts=Object.keys(R.threads).map(function(k){return R.threads[k];}).filter(function(t){return t.stage!=="resolved" && (t.subject==="story"||set[CE2_key(t.subject)]||t.lastTurn>=R.turn-8);});
  ts.sort(function(a,b){return (b.seeds.length*3+b.pressure+b.lastTurn/1000)-(a.seeds.length*3+a.pressure+a.lastTurn/1000);});return ts[0]||null;
}
function CE2_scheduleTask(R,cfg) {
  var lane=(R.scheduler.lane||0)%3, task=null;
  if(cfg.minds){
    var urgent=(R.scene.cast||[]).map(function(n){return CE2_ensureMind(R,n);}).filter(function(m){return m&&((m.lastThought||0)===0||m.misses>=2)&&(R.turn-(m.lastThought||0)>=cfg.mindEvery);}).sort(function(a,b){return (a.lastThought||0)-(b.lastThought||0);})[0];
    if(urgent)task={type:"mind",name:urgent.name};
  }
  for(var tries=0;tries<3&&!task;tries++){
    var x=(lane+tries)%3;
    if(x===0&&cfg.minds){var m=CE2_pickMindTarget(R,cfg);if(m)task={type:"mind",name:m.name};}
    else if(x===1&&cfg.relationships){var rels=CE2_topRelations(R,R.scene.cast);if(rels.length)task={type:"relation",relation:rels[0]};}
    else if(x===2&&cfg.twists){var t=CE2_topTwist(R,R.scene.cast);if(t)task={type:"twist",thread:t};}
  }
  R.scheduler.lane=(lane+1)%3; return task;
}
function CE2_taskPrompt(task,R) {
  if(!task)return "";
  if(task.type==="mind"){
    var m=CE2_ensureMind(R,task.name),known=CE2_knowledgeSummary(R,task.name,420);return ["PRIVATE STATE UPDATE — after the visible story, append exactly one machine tag for "+task.name+".","Use only what this NPC plausibly knows. Keep private interiority out of visible narration unless POV naturally allows it. Do not invent a secret merely to fill the brain.","Existing mind: "+CE2_mindSummary(m,700),known?"Known to this NPC: "+known:"Known to this NPC: only what the visible scene/card establishes.","Tag format: [[CE2:MIND|name="+task.name+"|mood=<short>|want=<short>|goal=<short>|fear=<short>|belief=<short>|plan=<short>|opinion_target=<person>|opinion=<private view>|thought=<one private first-person thought>|memory=<important learned event>]]","Omit fields that did not genuinely change. Never create a MIND tag for the player."] .join("\n");
  }
  if(task.type==="relation"){
    var r=task.relation;return ["RELATIONSHIP STATE UPDATE — if the visible scene meaningfully changes this bond, append one machine tag after the story.",r.from+" -> "+r.to+" currently: "+CE2_relationSummary(r),"Tag format: [[CE2:REL|from="+r.from+"|to="+r.to+"|event=<short>|trust=<-8..8>|affection=<-8..8>|attraction=<-8..8>|respect=<-8..8>|fear=<-8..8>|resentment=<-8..8>|jealousy=<-8..8>|suspicion=<-8..8>|loyalty=<-8..8>|intimacy=<-8..8>|tension=<-8..8>|evidence=<what happened>]]","Only include metrics that actually changed. Do not author player feelings or intentions."] .join("\n");
  }
  if(task.type==="twist"){
    var t=task.thread,ripe=t.stage==="ripe";return [ripe?"RIPE THREAD — evidence is substantial, but do not force a reveal. A payoff may occur only if this scene naturally produces direct confirmation such as a verified record, admission, forensic match, recovered order or living witness.":"UNRESOLVED THREAD — do not force a reveal. If the current scene genuinely investigates or intersects this thread, advance it by one evidence-bearing clue or consequence.","Subject: "+t.subject+"; category: "+t.category+"; stage: "+t.stage,"Known clues: "+t.seeds.slice(-3).map(function(s){return s.text;}).join(" / "),"If and only if a NEW clue appears in the visible story, append: [[CE2:TWIST|subject="+t.subject+"|category="+t.category+"|clue=<new evidence>]]",ripe?"If direct confirmation is revealed, state that proof plainly in visible prose so the engine can close the thread. Suspicion alone is never enough.":"Suspicion is not proof."] .join("\n");
  }
  return "";
}
function CE2_prepareTask(R,cfg) {
  if(R.scheduler.preparedTurn===R.turn) return R.scheduler.pending||null;
  var task=CE2_scheduleTask(R,cfg); if(task)task.turn=R.turn;
  R.scheduler.pending=task?CE2_roundTripSafe(task):null; R.scheduler.preparedTurn=R.turn; return R.scheduler.pending;
}
function CE2_replaceManagedFrontMemory(body) {
  if(!state||typeof state!=="object")return;
  if(!state.memory||typeof state.memory!=="object")state.memory={};
  var cur=String(state.memory.frontMemory||"");
  var re=/\n?\[\[CROSSED_ECHOES_V2_BEGIN\]\][\s\S]*?\[\[CROSSED_ECHOES_V2_END\]\]\n?/g;
  var base=cur.replace(re,"\n").replace(/\n{3,}/g,"\n\n").trim();
  body=CE2_clean(body,2600);
  state.memory.frontMemory=body ? (base?base+"\n\n":"")+CE2_FM_BEGIN+"\n"+body+"\n"+CE2_FM_END : base;
}
function CE2_frontMemoryPacket(R,cfg,task) {
  if(!cfg.frontMemory)return "";
  var cast=(R.scene.cast||[]).slice(0,3), lines=[];
  lines.push("CROSSED ECHOES PRIVATE CONTINUITY — never quote this block.");
  if(R.player.name)lines.push("Player="+R.player.name+". Never invent the player's private thoughts, consent, extra dialogue or voluntary choices.");
  cast.forEach(function(n){var m=R.minds[CE2_key(n)];if(!m)return;var ms=CE2_mindSummary(m,250),ks=CE2_knowledgeSummary(R,n,230);if(ms)lines.push(n+" mind: "+ms);if(ks)lines.push(n+" knows: "+ks);});
  var rels=CE2_topRelations(R,cast).slice(0,2);rels.forEach(function(r){var rs=CE2_relationSummary(r);if(rs)lines.push("Bond "+r.from+" -> "+r.to+": "+rs);});
  var t=cfg.twists?CE2_topTwist(R,cast):null;if(t)lines.push("Open thread "+t.subject+"/"+t.category+": "+t.stage+"; suspicion is not proof.");
  var tp=CE2_taskPrompt(task,R);if(tp)lines.push(tp);
  return lines.join("\n").slice(0,cfg.frontMemoryChars);
}
function CE2_syncFrontMemory(R,cfg,task) {
  if(!cfg.frontMemory){CE2_replaceManagedFrontMemory("");return;}
  CE2_replaceManagedFrontMemory(CE2_frontMemoryPacket(R,cfg,task));
}
function CE2_contextPacket(R,cfg) {
  var cast=R.scene.cast||[], lines=["[CROSSED ECHOES — PRIVATE DIRECTOR]","PLAYER AGENCY: "+(R.player.name?R.player.name+" is the player. ":"")+"Never invent the player's private thoughts, consent, intentional dialogue, major choices or voluntary power use beyond the submitted action.","KNOWLEDGE: World truth is not automatic NPC knowledge. Use only what each character witnessed, was told, or can reasonably infer."];
  if(cfg.minds){var perMind=Math.max(220,Math.min(520,Math.floor(cfg.mindContextChars/Math.max(1,Math.min(4,cast.length)))));cast.slice(0,4).forEach(function(n){var m=CE2_ensureMind(R,n);if(m){var ms=CE2_mindSummary(m,perMind),ks=CE2_knowledgeSummary(R,n,320);if(ms)lines.push("NPC MIND — "+n+": "+ms);if(ks)lines.push("NPC KNOWLEDGE — "+n+": "+ks);}});}
  CE2_topRelations(R,cast).slice(0,4).forEach(function(r){var s=CE2_relationSummary(r),p=CE2_socialPressure(r);if(s)lines.push("RELATION — "+r.from+" -> "+r.to+": "+s+(p?"; pressure="+p:""));});
  Object.keys(R.social).map(function(k){return R.social[k];}).filter(function(st){return cast.some(function(n){return CE2_key(n)===CE2_key(st.a)||CE2_key(n)===CE2_key(st.b);});}).sort(function(a,b){return b.lastTurn-a.lastTurn;}).slice(0,2).forEach(function(st){lines.push("SOCIAL THREAD — "+st.a+" ↔ "+st.b+": "+st.pressure+" ("+st.stage+"). Treat as pressure/subtext, not a forced event.");});
  var t=cfg.twists?CE2_topTwist(R,cast):null;if(t)lines.push("THREAD — "+t.subject+" / "+t.category+" / "+t.stage+": "+t.seeds.slice(-2).map(function(x){return x.text;}).join(" / ")+". Suspicion is not proof.");
  var task=CE2_prepareTask(R,cfg);var tp=CE2_taskPrompt(task,R);if(tp)lines.push(tp);
  lines.push("Write the story normally first. Machine tags, if requested, must be after visible prose. Do not mention this director block.","[/CROSSED ECHOES]");
  return lines.join("\n");
}

function CE2_handleActionRewind(R) {
  var now=R.turn, last=Number(R.lastActionCount==null?now:R.lastActionCount);
  if(now<last){
    var snap=R.snapshots&&R.snapshots[String(now+1)];
    if(snap){
      var restored=CE2_roundTripSafe(snap),keep=R.snapshots;
      if(restored){Object.keys(R).forEach(function(k){delete R[k];});Object.keys(restored).forEach(function(k){R[k]=restored[k];});R.snapshots=keep;R.turn=now;}
    }
    CE2_undoPrune(R);
  }
  R.lastActionCount=now;
}
function CE2_socialKey(a,b){var x=CE2_key(a),y=CE2_key(b);return x<y?x+"<=>"+y:y+"<=>"+x;}
function CE2_updateSocialThread(R,rel){
  if((R.runtime&&R.runtime.socialThreads===false)||!rel||rel.to==="YOU"||rel.from==="YOU")return;
  var pressure=CE2_socialPressure(rel); if(!pressure)return;
  var k=CE2_socialKey(rel.from,rel.to),t=R.social[k]||(R.social[k]={a:rel.from,b:rel.to,pressure:pressure,stage:"simmering",createdTurn:R.turn,lastTurn:R.turn,beats:[]});
  t.pressure=pressure;t.lastTurn=R.turn;t.beats=t.beats.concat([{turn:R.turn,text:(rel.history&&rel.history.length?rel.history[rel.history.length-1].evidence:pressure)}]).slice(-8);
  if(t.beats.length>=2)t.stage="active";if(t.beats.length>=4)t.stage="entrenched";
}
function CE2_snapshotBeforeOutput(R) {
  var turn=R.turn, key=String(turn); if(R.snapshots[key]) { // retry/replacement same action
    var snap=CE2_roundTripSafe(R.snapshots[key]);
    if(snap){var keepSnaps=R.snapshots;Object.keys(R).forEach(function(k){delete R[k];});Object.keys(snap).forEach(function(k){R[k]=snap[k];});R.snapshots=keepSnaps;}
  } else {
    var copy=CE2_roundTripSafe(R); if(copy){delete copy.snapshots;R.snapshots[key]=copy;var ks=Object.keys(R.snapshots).sort(function(a,b){return Number(a)-Number(b);});while(ks.length>5){delete R.snapshots[ks.shift()];}}
  }
  Object.keys(R.snapshots).forEach(function(k){if(Number(k)>turn)delete R.snapshots[k];});
}
function CE2_undoPrune(R) {
  var turn=R.turn;
  R.events=(R.events||[]).filter(function(e){return e.turn<=turn;});
  Object.keys(R.threads).forEach(function(k){var t=R.threads[k];t.seeds=(t.seeds||[]).filter(function(s){return s.turn<=turn;});if(t.payoff&&t.payoff.turn>turn){delete t.payoff;delete t.resolvedTurn;t.stage="seeded";}if(t.createdTurn>turn||!t.seeds.length)delete R.threads[k];else CE2_restageThread(R,t);});
  Object.keys(R.minds).forEach(function(k){var m=R.minds[k];m.thoughts=(m.thoughts||[]).filter(function(x){return x.turn<=turn;});m.memories=(m.memories||[]).filter(function(x){return x.turn<=turn;});});
  Object.keys(R.relations).forEach(function(k){var r=R.relations[k];r.history=(r.history||[]).filter(function(x){return x.turn<=turn;});});
  Object.keys(R.knowledge||{}).forEach(function(k){var q=R.knowledge[k];q.facts=(q.facts||[]).filter(function(x){return x.turn<=turn;});if(!q.facts.length)delete R.knowledge[k];});
}

function CE2_maintenance(R) {
  var turn=R.turn;
  Object.keys(R.candidates).forEach(function(k){var c=R.candidates[k];if(!c||((turn-(c.lastSeen||0)>60)&&c.score<10))delete R.candidates[k];});
  function trimMap(obj,limit,score){var ks=Object.keys(obj);if(ks.length<=limit)return;ks.sort(function(a,b){return score(obj[b])-score(obj[a]);});ks.slice(limit).forEach(function(k){delete obj[k];});}
  trimMap(R.candidates,220,function(c){return (c.score||0)+(c.lastSeen||0)/10000;});
  trimMap(R.minds,100,function(m){return Math.max(m.lastSeen||0,m.lastThought||0)+(m.thoughts||[]).length*2;});
  trimMap(R.entities,350,function(e){return (e.lastSeen||0)+(e.manual?0:10);});
  trimMap(R.relations,600,function(r){return (r.lastTurn||0)+Math.abs(r.trust||0)+Math.abs(r.affection||0)+Math.abs(r.resentment||0)+Math.abs(r.tension||0);});
  trimMap(R.knowledge,120,function(q){var f=q&&q.facts&&q.facts.length?q.facts[q.facts.length-1]:null;return (f&&f.turn)||0;});
  trimMap(R.social,160,function(t){return (t.lastTurn||0)+(t.beats||[]).length*3;});
  trimMap(R.threads,160,function(t){return (t.lastTurn||0)+(t.seeds||[]).length*4;});
  R.events=(R.events||[]).slice(-40);R.codex.queue=(R.codex.queue||[]).slice(0,80);
}
function CE2_processPublicText(R,cfg,text,source) {
  CE2_extractCandidates(R,text,source);
  if(cfg.relationships)CE2_observeRelationships(R,text);
  CE2_observeKnowledge(R,text);
  if(cfg.minds)CE2_observeMemories(R,text); else {var cast=CE2_activeNamesInText(R,text);R.scene={cast:cast,lastText:CE2_clean(text,1600),turn:R.turn};if(text)CE2_event(R,text,cast.concat(R.player.name?[R.player.name]:[]),"scene");}
  if(cfg.twists){CE2_seedTwists(R,text);CE2_resolveTwists(R,text);}
  if(cfg.codex)CE2_codexQueue(R,cfg);
}

function CE2_statusText(R) {
  return ["CROSSED ECHOES "+CE2_VERSION,"turn="+R.turn,"player="+(R.player.name||"unresolved")+" ("+(R.player.source||"none")+")","entities="+Object.keys(R.entities).length,"candidates="+Object.keys(R.candidates).length,"minds="+Object.keys(R.minds).length,"relations="+Object.keys(R.relations).length,"threads="+Object.keys(R.threads).length,"socialThreads="+Object.keys(R.social).length,"codexQueue="+R.codex.queue.length,"cardsCreated="+R.diag.cardsCreated,"cardsUpdated="+R.diag.cardsUpdated,"mindUpdates="+R.diag.mindUpdates,"relationEvents="+R.diag.relationEvents,"twistSeeds="+R.diag.twistSeeds,"twistResolved="+(R.diag.twistResolved||0)].join("\n");
}
function CE2_writeInspectCard(key,title,body) { var sentinel="__ce2_inspect_"+CE2_slug(key)+"__",f=CE2_findCardByKey(sentinel),e=title+"\n\n"+body+"\n\nPRIVATE/DIAGNOSTIC — inert trigger; not normal story lore.";if(f)CE2_safeUpdate(f.index,sentinel,e,CE2_DASH_TYPE);else CE2_safeAdd(sentinel,e,CE2_DASH_TYPE); }
function CE2_command(raw,R,cfg) {
  var s=String(raw||"").replace(/^\s*>\s*You(?:\s+(?:say|try to|do))?\s*:?[\s\"]*/i,"").replace(/[\"]?\s*$/g,"").trim();
  if(s.charAt(0)!=="/")return null;
  var m=s.match(/^\/(?:ce|crossedechoes)(?:\s+(.*))?$/i); if(m){var sub=CE2_clean(m[1]||"status",120).toLowerCase();if(sub==="help"){return "Commands: /ce status · /mind <name> · /relations [name] · /threads · /codex · /card <name> · /ce debug on|off";}if(/^debug\s+(on|off)$/.test(sub)){var on=/on$/.test(sub);var f=CE2_findCardByKey(CE2_CONFIG_KEY);if(f){var ent=String(f.card.entry||CE2_configEntry()).replace(/^debug=.*$/m,"debug="+on);CE2_safeUpdate(f.index,CE2_CONFIG_KEY,ent,CE2_CONFIG_TYPE);}return "Debug "+(on?"enabled":"disabled")+".";}return CE2_statusText(R);}
  m=s.match(/^\/mind\s+(.+)$/i); if(m){var n=CE2_normalizeCandidate(m[1]),mind=R.minds[CE2_key(n)];if(!mind)return "No mind yet for "+n+".";var body=CE2_makeMindCardEntry(R,mind);CE2_writeInspectCard("mind_"+n,"CROSSED ECHOES — MIND INSPECT",body);return "Mind inspect card refreshed for "+n+".";}
  m=s.match(/^\/relations?(?:\s+(.+))?$/i); if(m){var n=CE2_normalizeCandidate(m[1]||""),rels=Object.keys(R.relations).map(function(k){return R.relations[k];}).filter(function(r){return !n||CE2_key(r.from)===CE2_key(n)||CE2_key(r.to)===CE2_key(n);}).sort(function(a,b){return b.lastTurn-a.lastTurn;}).slice(0,30),body=rels.map(function(r){return r.from+" -> "+r.to+": "+(CE2_relationSummary(r)||"baseline");}).join("\n")||"No relationships yet.";CE2_writeInspectCard("relations","CROSSED ECHOES — RELATIONSHIPS",body);return "Relationship inspect card refreshed.";}
  if(/^\/threads$/i.test(s)){var ts=Object.keys(R.threads).map(function(k){return R.threads[k];}).sort(function(a,b){return b.lastTurn-a.lastTurn;});var body=ts.map(function(t){return t.subject+" / "+t.category+" / "+t.stage+" / seeds="+t.seeds.length+(t.payoff?"\nPAYOFF: "+t.payoff.text:"")+"\n- "+t.seeds.slice(-3).map(function(x){return x.text;}).join("\n- ");}).join("\n\n")||"No active threads.";CE2_writeInspectCard("threads","CROSSED ECHOES — THREADS",body);return "Thread inspect card refreshed.";}
  if(/^\/codex$/i.test(s)){return "CODEX queue="+R.codex.queue.length+", managed="+Object.keys(R.codex.managed).length+", candidates="+Object.keys(R.candidates).length+", writeFailures="+R.codex.writeFailures+".";}
  m=s.match(/^\/card\s+(.+)$/i); if(m){var n=CE2_normalizeCandidate(m[1]);var ok=CE2_codexWrite(R,cfg,n);return ok?"CODEX card written for "+n+".":"CODEX could not write "+n+" this turn (it may already exist or be protected as manual lore).";}
  return null;
}

function CE2_input(text) {
  var R=CE2_init(); if(!R)return {text:text}; CE2_ensureConfig(); var cfg=CE2_getConfig(); CE2_applyRuntimeConfig(R,cfg); if(!cfg.enabled){CE2_replaceManagedFrontMemory("");return {text:text};} CE2_handleActionRewind(R); CE2_resolvePlayer(R,cfg); CE2_importExistingEntities(R,CE2_storyText(6000)+" "+String(text||"")); CE2_undoPrune(R);
  var cmd=CE2_command(text,R,cfg); if(cmd!=null){state.message=cmd;R.commandEcho=cmd;CE2_writeInspectCard("status","CROSSED ECHOES — LAST COMMAND",cmd);CE2_replaceManagedFrontMemory("");return {text:"(CROSSED ECHOES command; do not advance the story.)"};}
  delete state.message; delete R.commandEcho; CE2_extractCandidates(R,text,"input"); if(cfg.codex)CE2_codexQueue(R,cfg);
  var scan=CE2_storyText(4200)+"\n"+String(text||""); CE2_importExistingEntities(R,scan); var cast=CE2_activeNamesInText(R,scan.slice(-3200)); R.scene.cast=cast; cast.forEach(function(n){var m=CE2_ensureMind(R,n);if(m)m.lastSeen=R.turn;});
  var task=CE2_prepareTask(R,cfg); CE2_syncFrontMemory(R,cfg,task); return {text:text};
}
function CE2_context(text) {
  var R=CE2_init(); if(!R)return {text:text}; CE2_ensureConfig(); var cfg=CE2_getConfig(); CE2_applyRuntimeConfig(R,cfg); if(!cfg.enabled)return {text:text}; CE2_handleActionRewind(R); CE2_resolvePlayer(R,cfg); CE2_importExistingEntities(R,CE2_storyText(6000)+" "+String(text||"")); CE2_undoPrune(R);
  if(R.commandEcho){var b=String(text||"");return {text:b+"\n\n[CROSSED ECHOES COMMAND] The script already handled this command. Output only a single period; do not advance the narrative."};}
  var recent=CE2_storyText(6000), sceneScan=recent+"\n"+String(text||"").slice(-2500); CE2_extractCandidates(R,recent,"history"); CE2_importExistingEntities(R,sceneScan); var cast=CE2_activeNamesInText(R,sceneScan.slice(-4200)); R.scene.cast=cast;cast.forEach(function(n){var m=CE2_ensureMind(R,n);if(m)m.lastSeen=R.turn;});if(cfg.codex)CE2_codexQueue(R,cfg);
  var task=CE2_prepareTask(R,cfg); CE2_syncFrontMemory(R,cfg,task);
  var packet=CE2_contextPacket(R,cfg); var max=(typeof info==="object"&&isFinite(info.maxChars))?Number(info.maxChars):16000;var budget=Math.max(900,Math.min(6200,Math.floor(max*cfg.contextBudgetPct/100)));if(packet.length>budget)packet=packet.slice(0,budget);
  var base=String(text||""), avail=Math.max(0,max-base.length-2); if(packet.length>avail){var compact=CE2_frontMemoryPacket(R,cfg,task);packet=compact.length<=avail?compact:"";} return {text:packet?base+"\n\n"+packet:base};
}
function CE2_output(text) {
  var R=CE2_init(); if(!R)return {text:text}; CE2_ensureConfig(); var cfg=CE2_getConfig(); CE2_applyRuntimeConfig(R,cfg); if(!cfg.enabled)return {text:text}; CE2_handleActionRewind(R); CE2_resolvePlayer(R,cfg); CE2_importExistingEntities(R,CE2_storyText(6000)+" "+String(text||"")); CE2_snapshotBeforeOutput(R);
  if(R.commandEcho){delete R.commandEcho;return {text:CE2_ZERO};}
  var raw=String(text||"");var tagCount=CE2_parseHiddenTags(R,raw);var pending=R.scheduler.pending;if(pending&&pending.type==="mind"&&tagCount===0){var pm=R.minds[CE2_key(pending.name)];if(pm)pm.misses=(pm.misses||0)+1;}var visible=CE2_stripHidden(raw);CE2_processPublicText(R,cfg,visible,"output");CE2_codexRefreshManaged(R,cfg,visible);
  for(var i=0;i<cfg.codexWritesPerTurn;i++)if(!CE2_codexWrite(R,cfg))break;
  (R.scene.cast||[]).forEach(function(n){var m=R.minds[CE2_key(n)];if(m)CE2_syncMindCard(R,m);});CE2_syncDashboard(R); CE2_maintenance(R);
  return {text:visible};
}
