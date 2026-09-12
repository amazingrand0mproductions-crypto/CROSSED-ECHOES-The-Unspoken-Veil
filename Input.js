state.message = "";
var inputRuntimeToken = typeof utBeginRuntimePhase === "function" ? utBeginRuntimePhase("input") : null;

try {
  if (typeof CE_reconcilePlayerIdentityState === "function") CE_reconcilePlayerIdentityState();
} catch (e) {
  if (typeof log === "function") log("CROSSED ECHOES player identity/Input error: " + (e && e.message));
}

try {
  if (typeof CE_runTurnFeature === "function") {
    CE_runTurnFeature("codex", "input", function(){
      if (typeof CE_bootstrapRequiredConfigCards === "function") CE_bootstrapRequiredConfigCards("input");
    }, null, typeof CE_bootstrapRequiredConfigCards === "function");
  } else if (typeof CE_bootstrapRequiredConfigCards === "function") CE_bootstrapRequiredConfigCards("input");
} catch (e) {
  if (typeof log === "function") log("CROSSED ECHOES config bootstrap/Input error: " + (e && e.message));
}

try {
  initUnsaid();
} catch (e) {
  if (typeof log === "function") log("UNSAID init/Input error: " + (e && e.message));
}

var cleanCommandEntity = (raw, maxLen) => {
  let name = String(raw || "").trim();
  name = name.replace(/^["'“”‘’]+/, "").replace(/["'“”‘’.!?]+$/, "").trim();
  name = name.replace(/\s+/g, " ");
  return name.slice(0, typeof maxLen === "number" ? maxLen : 80);
};

var resolveControlEntityName = (enteredName, expectedType) => {
  const entered = cleanCommandEntity(enteredName, 80);
  if (!entered || typeof resolveUnsaidCanonicalName !== "function") return entered;
  const resolved = resolveUnsaidCanonicalName(entered) || entered;
  if (String(resolved).toLowerCase() === String(entered).toLowerCase()) return resolved;
  // A trigger on an Event/Plot/manual lore card is retrieval overlap, not
  // proof that the command named that card's identity. Preserve the literal
  // command target unless at least one compatible entity card supports the
  // alias resolution.
  if (typeof storyCardMatchesForEntity === "function" && typeof codexCardIdentityCompatible === "function") {
    const matches = storyCardMatchesForEntity(entered);
    if (!matches.some(card => codexCardIdentityCompatible(card, entered, expectedType || ""))) return entered;
  }
  return resolved;
};

// Command input must fail closed. If an internal error happens while handling
// an administrative command, never leak `/card`, `/peek`, etc. to the story
// model as ordinary prose.
var ownedControlCommand = (raw) => {
  try {
    if (typeof Library !== "undefined" && Library.extractCommand) return Library.extractCommand(raw);
  } catch (e) {}
  const t = String(raw || "").replace(/\r/g, "").trim();
  const owned = "(?:help|status|crossedechoesstatus|crossedechoes|cestatus|ce|threadboundstatus|threadbound|tbstatus|unifiedstatus|unified|worldengine|world|unsaid|pe(?:e|a)k|card|alias|unalias|twistcategories|twisttypes|twistlog|twisthelp|twist|plant|mature|scenario|synergy|link|intensity|threads|rescan|twists|wiremerge|wireforget|wireprofile|wirestatus|wiretwists|wirehelp|wirerole|wireage|wires|wire|spark)";
  const direct = new RegExp(`^[!/:]${owned}\\b`, "i");
  const normalize = value => {
    let v = String(value || "").trim();
    if (/^[!:]/.test(v)) v = "/" + v.slice(1);
    if (/^\/help\s*$/i.test(v)) v = "/crossedechoes help";
    else if (/^\/status\s*$/i.test(v)) v = "/crossedechoes";
    else if (/^\/status\s+(?:unsaid|codex)\s*$/i.test(v)) v = "/unsaid status";
    else if (/^\/status\s+(?:wire|wires|crossed\s+wires)\s*$/i.test(v)) v = "/wire status";
    else if (/^\/status\s+(?:world|worldengine|world\s+engine)\s*$/i.test(v)) v = "/world status";
    else if (/^\/status\s+(?:twist|twists)\s*$/i.test(v)) v = "/threads";
    else if (/^\/help\s+(?:unsaid|codex)\s*$/i.test(v)) v = "/unsaid";
    else if (/^\/help\s+(?:wire|wires|crossed\s+wires)\s*$/i.test(v)) v = "/wire help";
    else if (/^\/help\s+(?:world|worldengine|world\s+engine)\s*$/i.test(v)) v = "/world";
    else if (/^\/help\s+(?:twist|twists)\s*$/i.test(v)) v = "/twists";
    return v;
  };
  if (direct.test(t)) return normalize(t);
  const labeled = t.match(new RegExp(`^(?:story|do|say|see|guide)\\s*[:=-]\\s*["“‘']?([!/:]${owned}\\b[\\s\\S]*?)["”’']?\\s*[.!]?\\s*$`, "i"));
  return labeled ? normalize(labeled[1]) : null;
};

var crossedEchoesCommandHelp = () => [
  "🌒 CROSSED ECHOES COMMANDS",
  "/help — this command overview",
  "/status — coordinator status; /status unsaid, /status wire, /status world also work",
  "/crossedechoes — coordinator status",
  "/crossedechoes help — command overview",
  "/wire help — Crossed Wires commands",
  "/unsaid — UNSPOKEN TURNS / CODEX commands",
  "/twists — TWISTS AND TURNS config/help",
  "",
  "Quick controls: /peek <name> • /card <name> • /wire <name> • /spark [small|medium|major] • /threads • /twist [name]"
].join("\n");

var controlCommandFailedSafely = (raw, where, knownCommand) => {
  const command = knownCommand || ownedControlCommand(raw);
  if (!command) return null;
  try {
    pushMessage(`⚠️ ${where || "Command"} hit an internal script error, so CROSSED ECHOES stopped the action instead of letting the command become story text. Retry the command once; if it repeats, run /unsaid health.`);
  } catch (e) {}
  return { text: null, stop: true };
};

var twistsModifier = (text) => {
  var detectedControlCommand = ownedControlCommand(text);
  try {
    const { c, cfg } = Library.initState();
    Library.applyEntryConfig(cfg);
    const cmd = Library.extractCommand(text);
    detectedControlCommand = cmd;
    const stopControl = () => ({ text: null, stop: true });

    if (cmd) {
      const parts = cmd.slice(1).trim().split(/\s+/);
      const head = (parts[0] || "").toLowerCase();

      if (head === "twist") {
        if (!cfg.enabled) {
          pushMessage("🌀 TWISTS AND TURNS is currently disabled — turn on \"Enable Twists and Turns\" on the config card first, or nothing will actually happen this turn.");
          return stopControl();
        }
        const name = cleanCommandEntity(parts.slice(1).join(" "));
        if (name) {
          const candidates = c.threads
            .filter(t => isSameCardEntity(t.entity, name) && Library.isThreadAllowed(t, cfg))
            .sort((a,b) => Library.twistGroundingScore(b) - Library.twistGroundingScore(a) || b.seedTouches - a.seedTouches);
          let thread = candidates[0] || null;

          // In strict mode /twist is a pacing override, not a canon-invention
          // command. The player can reveal a supported thread early, but the
          // command cannot manufacture a secret that has zero story evidence.
          if (cfg.strictLogic !== false && (!thread || Library.twistGroundingScore(thread) < 0.90)) {
            pushMessage(`🌀 Strict Logic blocked an unsupported forced twist around ${name}. Plant/develop the thread first, or turn strictLogic off if you intentionally want a wildcard reveal.`);
            return stopControl();
          }
          if (!thread && cfg.strictLogic === false) {
            thread = Library.createThread(c, name, null, c.turn - cfg.minTurnsForPayoff, cfg);
            if (thread) { thread.source = "forced"; thread.wildcard = true; }
          }

          if (!thread) {
            pushMessage(`🌀 I couldn't prepare another allowed twist thread for ${name}. They may already be at the per-entity thread cap, or only have disabled mature threads waiting.`);
          } else {
            thread.seedTouches = Math.max(thread.seedTouches, cfg.minSeedsForPayoff);
            thread.tier = Library.tierFor(thread.seedTouches);
            thread.status = "ready";
            c.forceEntity = thread.id;
            pushMessage(`🌀 Forcing a twist around ${thread.entity}...`);
          }
        } else {
          if (cfg.strictLogic !== false) {
            const supported = c.threads.some(t => Library.isThreadAllowed(t, cfg) && Library.twistGroundingScore(t) >= 0.90);
            if (!supported) {
              pushMessage("🌀 Strict Logic found no evidence-backed twist to force yet. Use /plant to choose a direction, let the story establish a clue, or turn strictLogic off for deliberate wildcard twists.");
              return stopControl();
            }
          }
          c.forceEntity = "any";
          pushMessage("🌀 Forcing the next supported twist...");
        }
        if (!c.forceEntity) return stopControl();
        text = "(A quiet moment passes.)";
      } else if (head === "plant") {
        if (!cfg.enabled) {
          pushMessage("🌱 TWISTS AND TURNS is currently disabled — turn on \"Enable Twists and Turns\" on the config card first, or nothing will actually happen this turn.");
          return stopControl();
        }
        const rest = parts.slice(1);
        let category = null;
        if (rest.length > 1) {
          const lastLower = rest[rest.length - 1].toLowerCase();
          const match = Library.CP_CATEGORY_KEYS.find(k => k.toLowerCase() === lastLower);
          if (match) { category = match; rest.pop(); }
        }
        const name = cleanCommandEntity(rest.join(" "));
        if (name) {
          if (category && Library.isMatureCategory(category) && !cfg.allowMatureTwists) {
            pushMessage(`🔞 ${CP_CATEGORY_LABELS[category]} is an opt-in mature twist. Use "/mature on" first.`);
          } else if (category && Library.isMatureCategory(category) && !Library.isEntityConfirmedAdult(name, "")) {
            pushMessage(`🔞 Mature twists only attach to characters with clear adult evidence. Put an adult age/description on ${name}'s Character Story Card first.`);
          } else {
            c.forcePlant = { entity: name, category: category };
            pushMessage(category
              ? `🌱 Planting a new thread on ${name} (${CP_CATEGORY_LABELS[category]})...`
              : `🌱 Planting a new thread on ${name}...`);
          }
        } else {
          pushMessage("🌱 /plant needs a name — try \"/plant Kessler\" or \"/plant Kessler hiddenIdentity\".");
        }
        if (!c.forcePlant) return stopControl();
        text = "(A quiet moment passes.)";
      } else if (head === "mature") {
        const val = (parts[1] || "").toLowerCase();
        if (["on", "true", "yes", "enable", "enabled"].includes(val)) {
          cfg.allowMatureTwists = true;
          c.importedCardSignatures = {};
          c.lastContextSignature = null;
          c.lastAuthorsNoteSignature = null;
          pushMessage("🔞 Mature (18+) twist themes enabled for confirmed adult characters. Existing lore will be rescanned for eligible hooks.");
        } else if (["off", "false", "no", "disable", "disabled"].includes(val)) {
          cfg.allowMatureTwists = false;
          pushMessage("🔞 Mature (18+) twist themes disabled. Existing mature threads are kept but will not seed or pay off while this is off.");
        } else {
          pushMessage(`🔞 Mature (18+) twists are currently ${cfg.allowMatureTwists ? "ON" : "OFF"}. Use "/mature on" or "/mature off".`);
        }
        Library.updateConfigCard(cfg, c);
        return stopControl();
      } else if (head === "scenario") {
        const raw = parts.slice(1).join(" ").trim();
        const val = raw.toLowerCase();
        if (!raw || val === "status") {
          const profile = Library.updateScenarioProfile(c, cfg, text);
          const tags = profile.tags && profile.tags.length ? profile.tags.join(", ") : "general";
          pushMessage(`🎭 Scenario adaptation is ${cfg.scenarioAdaptation ? "ON" : "OFF"} — detected: ${tags}; era: ${profile.era}; reality: ${profile.reality}; stakes: ${profile.scale}${cfg.scenarioOverride ? `; override: "${cfg.scenarioOverride}"` : ""}.`);
        } else if (["auto", "on", "true", "enable", "enabled"].includes(val)) {
          cfg.scenarioAdaptation = true;
          cfg.scenarioOverride = "";
          const profile = Library.updateScenarioProfile(c, cfg, text);
          pushMessage(`🎭 Automatic scenario adaptation enabled. Current read: ${(profile.tags || ["general"]).join(", ")}.`);
        } else if (["off", "false", "disable", "disabled"].includes(val)) {
          cfg.scenarioAdaptation = false;
          cfg.scenarioOverride = "";
          Library.updateScenarioProfile(c, cfg, text);
          pushMessage("🎭 Automatic scenario adaptation disabled. Twists still obey established evidence and your manual theme bias.");
        } else {
          cfg.scenarioAdaptation = true;
          cfg.scenarioOverride = cleanCommandEntity(raw, 180);
          const profile = Library.updateScenarioProfile(c, cfg, text);
          pushMessage(`🎭 Scenario override set to "${cfg.scenarioOverride}". Automatic evidence still contributes, but this guidance is treated as deliberate player direction.`);
        }
        Library.updateConfigCard(cfg, c);
        return stopControl();
      } else if (head === "synergy" || head === "link") {
        const val = (parts[1] || "").toLowerCase();
        if (["on", "true", "yes", "enable", "enabled"].includes(val)) {
          cfg.crossSystemSynergy = true;
          pushMessage("🔗 UNSAID ↔ TWISTS AND TURNS link enabled. Established psychology can reinforce compatible active threads, and confirmed twists can feed emotional aftermath back into characters.");
        } else if (["off", "false", "no", "disable", "disabled"].includes(val)) {
          cfg.crossSystemSynergy = false;
          pushMessage("🔗 UNSAID ↔ TWISTS AND TURNS link disabled. Both systems still run independently.");
        } else {
          pushMessage(`🔗 Cross-system link is currently ${cfg.crossSystemSynergy ? "ON" : "OFF"}. Use "/synergy on" or "/synergy off".`);
        }
        Library.updateConfigCard(cfg, c);
        return stopControl();
      } else if (head === "twisttypes" || head === "twistcategories") {
        Library.updateCategoryCatalog(cfg);
        pushMessage("🗂️ Twist category catalog written — check the \"Twists and Turns — Twist Catalog\" card.");
        return stopControl();
      } else if (head === "twistlog") {
        cfg.showTwistLog = !cfg.showTwistLog;
        Library.updateTwistLogCard(c, cfg);
        // Every other setting-changing command here (see /intensity right
        // below) writes its new value back to the actual config card text
        // via updateConfigCard — this one never did, meaning the toggle
        // only ever lived in memory for the current turn. Since the next
        // turn's applyEntryConfig always re-parses cfg.showTwistLog fresh
        // from the card's own rendered text, and that text was never
        // updated, the very next turn silently reverted the toggle right
        // back to whatever it was before — confirmed directly via a real
        // captured transcript and reproduced in the sandbox: the
        // confirmation message correctly said "now visible," but the
        // config card's own text still read "false" immediately
        // afterward, before a single further turn had even passed.
        Library.updateConfigCard(cfg, c);
        pushMessage(cfg.showTwistLog
          ? "📜 Twist log now visible — check the \"Twists and Turns — Twist Log\" card."
          : "📜 Twist log now hidden.");
        return stopControl();
      } else if (head === "intensity") {
        const val = (parts[1] || "").toLowerCase();
        if (["low", "medium", "high"].includes(val)) {
          cfg.intensity = val;
          pushMessage(`⚙️ Intensity set to ${val}.`);
        } else {
          pushMessage("⚙️ /intensity needs low, medium, or high — try \"/intensity high\".");
        }
        Library.updateConfigCard(cfg, c);
        return stopControl();
      } else if (head === "threads") {
        Library.updateThreadsOverview(c);
        pushMessage("🧵 Brewing overview written — check the \"Twists and Turns — Brewing Overview\" card.");
        return stopControl();
      } else if (head === "rescan") {
        c.importedCardSignatures = {};
        c.lastContextSignature = null;
        c.lastAuthorsNoteSignature = null;
        pushMessage("🔄 Twist hook rescan queued for the next story turn.");
        return stopControl();
      } else if (head === "twists" || head === "twisthelp") {
        Library.updateConfigCard(cfg, c);
        pushMessage("📖 Config card refreshed — check \"CROSSED ECHOES — Config — UNSPOKEN TURNS\" for settings and commands.");
        return stopControl();
      } else {}
    }
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Input/Twists", e);
    if (typeof log === "function") log("Input/Twists error: " + (e && e.message));
    if (detectedControlCommand) {
      const failed = controlCommandFailedSafely(text, "TWISTS command", detectedControlCommand);
      if (failed) return failed;
    }
  }

  return { text };
};

var unsaidModifier = (text) => {
  const originalText = text;
  var detectedControlCommand = ownedControlCommand(originalText);
  if (detectedControlCommand && !/^\/(?:unsaid|pe(?:e|a)k|card|alias|unalias)\b/i.test(detectedControlCommand)) detectedControlCommand = null;
  try {
    const extractedCommand = (typeof Library !== "undefined" && Library.extractCommand)
      ? Library.extractCommand(text)
      : null;
    const commandText = extractedCommand || "";
    const isUnsaidCommand = /^\/(?:unsaid|pe(?:e|a)k|card|alias|unalias)\b/i.test(commandText);
    if (isUnsaidCommand) detectedControlCommand = commandText;
    const stopControl = () => ({ text: null, stop: true });

    // Commands are control input, not story evidence. Ordinary Say/Do/Story
    // input still contributes mention tracking, but "/card Mirelle" should
    // not itself make Mirelle look more established.
    if (!isUnsaidCommand) {
      if (typeof CE_runTurnFeature === "function") CE_runTurnFeature("codex", "input", function(){ trackMentions(text, false); }, null, typeof trackMentions === "function");
      else trackMentions(text, false);
    }

    const cfg = readUnsaidConfig();
    // Strong explicit player introductions are authoritative story evidence.
    // Create a conservative CODEX scaffold here so a new entity cannot starve
    // merely because the model fails to repeat its name in the next Output.
    if (!isUnsaidCommand && cfg && cfg.codexEnabled !== false && cfg.codexDirectScaffold !== false && typeof createCodexDirectScaffoldFromInput === "function") {
      try { createCodexDirectScaffoldFromInput(originalText, cfg); } catch (e) { if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Input/Codex-direct", e); }
    }
    // Control-task mode is single-flight. Every new player input starts clean;
    // /peek and /card set it again below when they intentionally need a model
    // call. This prevents a stale failed command from suppressing later prose.
    state.unsaid.controlRequest = "";

    if (/^\/unsaid\s+status\s*$/i.test(commandText)) {
      const report = buildStatusReport(cfg);
      const statusKey = "__crossed_echoes_unsaid_status__";
      let card = storyCards.find(c => c && ((typeof CE_cardIdentityName === "function" && CE_cardIdentityName(c) === "UNSAID — Status") || (typeof CE_hasCardKey === "function" && CE_hasCardKey(c, statusKey))));
      if (!card) card = createOrFindCard(statusKey, " ", "Class");
      if (card) {
        const statusNotes = "Regenerated fresh each time you type \"/unsaid status\" as an action. Diagnostic only; not sent to the AI.\n\n" + report;
        if (typeof CE_updateStoryCardCompat === "function") {
          const committed = CE_updateStoryCardCompat(card, statusKey, " ", "Class", "UNSAID — Status", statusNotes);
          card = committed.card || card;
        } else {
          pushMessage("📋 Story Card compatibility writer unavailable; status card was not modified.");
        }
        const mindCount = Object.keys((state.unsaid && state.unsaid.minds) || {}).length;
        const trackedCount = Object.keys((state.unsaid && state.unsaid.codex && state.unsaid.codex.mentionCounts) || {}).length;
        pushMessage(`📋 UNSAID status updated — ${mindCount} mind(s), ${trackedCount} Codex candidate(s). Full details are in the "UNSAID — Status" card.`);
      } else {
        pushMessage("📋 Couldn't write the status card this turn — try again in a moment.");
      }
      return stopControl();
    }

    if (/^\/unsaid\s+health\s*$/i.test(commandText)) {
      const report = typeof utRuntimeHealthReport === "function"
        ? utRuntimeHealthReport()
        : "Runtime health data is unavailable in this build.";
      const healthKey = "__crossed_echoes_runtime_health__";
      let card = storyCards.find(c => c && ((typeof CE_cardIdentityName === "function" && CE_cardIdentityName(c) === "UNSPOKEN TURNS — Runtime Health") || (typeof CE_hasCardKey === "function" && CE_hasCardKey(c, healthKey))));
      if (!card) card = createOrFindCard(healthKey, " ", "Class");
      if (card) {
        const healthNotes = "Regenerated fresh each time you type \"/unsaid health\". Diagnostic only; not sent to the AI.\n\n" + report;
        if (typeof CE_updateStoryCardCompat === "function") {
          const committed = CE_updateStoryCardCompat(card, healthKey, " ", "Class", "UNSPOKEN TURNS — Runtime Health", healthNotes);
          card = committed.card || card;
        } else {
          pushMessage("🩺 Story Card compatibility writer unavailable; health card was not modified.");
        }
        pushMessage("🩺 Runtime diagnostics written — check the \"UNSPOKEN TURNS — Runtime Health\" card.");
      } else {
        pushMessage("🩺 Couldn't write the runtime-health card this turn — try again in a moment.");
      }
      return stopControl();
    }

    if (/^\/unsaid(?:\s+(?:help|commands?|guide))?\s*$/i.test(commandText)) {
      ensureSharedConfigCard();
      pushMessage("📖 Commands are active. They work from Story, Do, Say, and third-person input: /peek <name>, /peek <name> core, /card <name>, /alias <character> = <alias>, /unalias <character> = <alias>, /unsaid status, /unsaid health, /unsaid resetcodex. Full settings are on the \"CROSSED ECHOES — Config — UNSPOKEN TURNS\" card.");
      return stopControl();
    }

    if (/^\/unsaid\s+resetcodex\s*$/i.test(commandText)) {
      resetCodexTrackingState();
      const sharedCard = ensureSharedConfigCard();
      const codexCard = ensureCodexConfigCard(sharedCard);
      if (codexCard) {
        // Re-render the dedicated CODEX card through the durable writer. Keep
        // its inert sentinel key: clearing that key made the card temporarily
        // lose cross-hook ownership and could cause a duplicate bootstrap later.
        const currentCfg = readUnsaidConfig();
        const committed = CE_updateStoryCardCompat(
          codexCard, CE_CONFIG_KEY_CODEX, renderCodexSection(currentCfg), CE_CONFIG_CATEGORY,
          CE_CONFIG_TITLE_CODEX, CONFIG_DEFAULT_CODEX_NOTES_SECTION
        );
        codexCard = committed.card || codexCard;
      }
      pushMessage("♻️ Codex tracking reset. Existing Story Cards were left untouched.");
      return stopControl();
    }

    const aliasAddMatch = commandText.match(/^\/alias\s+(.+?)\s*(?:=|->)\s*(.+?)\s*$/i);
    if (aliasAddMatch) {
      const requestedCharacter = cleanCommandEntity(aliasAddMatch[1], 80);
      const alias = cleanCommandEntity(aliasAddMatch[2], 80);
      if (!requestedCharacter || !alias) {
        pushMessage('🏷️ Use /alias <character> = <alias> — for example "/alias Harlan Voss = Ghost".');
        return stopControl();
      }
      const characterMatches = typeof storyCardMatchesForEntity === "function"
        ? storyCardMatchesForEntity(requestedCharacter)
        : [];
      if (characterMatches.length > 1) {
        pushMessage(`🏷️ "${requestedCharacter}" matches ${characterMatches.length} Story Cards. Use the exact full character title first.`);
        return stopControl();
      }
      const canonicalIdentity = characterMatches.length === 1 && typeof CE_cardIdentityName === "function"
        ? CE_cardIdentityName(characterMatches[0]) : "";
      const canonical = canonicalIdentity
        ? canonicalIdentity
        : (typeof resolveUnsaidCanonicalName === "function" ? resolveUnsaidCanonicalName(requestedCharacter) : requestedCharacter);
      const aliasMatches = typeof storyCardMatchesForEntity === "function"
        ? storyCardMatchesForEntity(alias)
        : [];
      const conflict = aliasMatches.find(card => {
        if (!card) return false;
        const identity = typeof CE_cardIdentityName === "function" ? CE_cardIdentityName(card) : String(card.title || card.name || "");
        return identity && !isSameCardEntity(identity, canonical);
      });
      let manualConflict = null;
      try {
        if (typeof buildUnsaidAliasIndex === "function" && typeof normalizeUnsaidIdentity === "function") {
          const owners = buildUnsaidAliasIndex().aliasToTitles[normalizeUnsaidIdentity(alias)] || [];
          manualConflict = owners.find(owner => !isSameCardEntity(owner, canonical)) || null;
        }
      } catch (e) {}
      if (conflict || manualConflict) {
        const owner = conflict && typeof CE_cardIdentityName === "function" ? (CE_cardIdentityName(conflict) || manualConflict) : (conflict && conflict.title ? conflict.title : manualConflict);
        pushMessage(`🏷️ "${alias}" already identifies ${owner}. I won't make that alias ambiguous.`);
        return stopControl();
      }
      const canonicalCard = findStoryCardForEntity(canonical);
      if (canonicalCard && !isCharacterLikeCard(canonical)) {
        pushMessage(`🏷️ "${(typeof CE_cardIdentityName === "function" ? CE_cardIdentityName(canonicalCard) : canonicalCard.title) || canonical}" is not typed as a character, so I didn't attach a character alias to it.`);
        return stopControl();
      }
      const saved = typeof registerUnsaidAlias === "function" ? registerUnsaidAlias(canonical, alias) : null;
      if (saved) pushMessage(`🏷️ Alias saved: ${alias} → ${saved}. Mentions of either name now share the same UNSAID mind and Story Card.`);
      else pushMessage("🏷️ I couldn't save that alias. Check both names and try again.");
      return stopControl();
    }

    const aliasListMatch = commandText.match(/^\/alias\s+(.+?)\s*$/i);
    if (aliasListMatch) {
      const requestedCharacter = cleanCommandEntity(aliasListMatch[1], 80);
      const canonical = typeof resolveUnsaidCanonicalName === "function"
        ? resolveUnsaidCanonicalName(requestedCharacter)
        : requestedCharacter;
      const aliases = typeof aliasesForUnsaidCharacter === "function"
        ? aliasesForUnsaidCharacter(canonical)
        : [canonical];
      pushMessage(`🏷️ ${canonical}: ${aliases.length ? aliases.join(", ") : "no aliases found"}. Story Card triggers are included automatically.`);
      return stopControl();
    }

    const aliasRemoveMatch = commandText.match(/^\/unalias\s+(.+?)\s*(?:=|->)\s*(.+?)\s*$/i);
    if (aliasRemoveMatch) {
      const requestedCharacter = cleanCommandEntity(aliasRemoveMatch[1], 80);
      const alias = cleanCommandEntity(aliasRemoveMatch[2], 80);
      const canonical = typeof resolveUnsaidCanonicalName === "function"
        ? resolveUnsaidCanonicalName(requestedCharacter)
        : requestedCharacter;
      const removed = typeof removeUnsaidAlias === "function" && removeUnsaidAlias(canonical, alias);
      pushMessage(removed
        ? `🏷️ Removed manual alias "${alias}" from ${canonical}.`
        : `🏷️ "${alias}" is not a manual alias for ${canonical}. If it comes from that Story Card's triggers, edit the trigger list on the card itself.`);
      return stopControl();
    }

    const peekMatch = commandText.match(/^\/pe(?:e|a)k\b\s*(.*?)\s*$/i);
    if (peekMatch) {
      let rawName = peekMatch[1] || "";
      const coreRequested = /\s+core\s*$/i.test(rawName);
      if (coreRequested) rawName = rawName.replace(/\s+core\s*$/i, "");
      const enteredName = cleanCommandEntity(rawName, 60);
      const name = resolveControlEntityName(enteredName, "character");

      if (!name) {
        pushMessage("👁️ /peek needs a character name — try \"/peek Elara\" or \"/peek Elara core\".");
        return stopControl();
      }
      if (!cfg.enabled) {
        pushMessage(`👁️ UNSAID is currently disabled — turn on "Enable UNSAID" on the config card first, or ${name} won't actually be peeked at this turn.`);
        return stopControl();
      }

      const peekMatches = typeof storyCardMatchesForEntity === "function"
        ? storyCardMatchesForEntity(name)
        : [];
      const peekEntityMatches = typeof codexCardIdentityCompatible === "function"
        ? peekMatches.filter(card => codexCardIdentityCompatible(card, name, "character"))
        : peekMatches;
      const matchedCard = peekEntityMatches.length === 1 ? peekEntityMatches[0] : null;
      if (peekEntityMatches.length > 1) {
        pushMessage(`👁️ "${name}" matches ${peekEntityMatches.length} Character Story Cards — rename/remove the duplicate or use a more specific name before peeking.`);
        return stopControl();
      }
      const matchedIdentity = matchedCard && typeof CE_cardIdentityName === "function" ? CE_cardIdentityName(matchedCard) : (matchedCard && matchedCard.title ? matchedCard.title : "");
      if (matchedCard && !isCharacterLikeCard(name)) {
        pushMessage(`👁️ "${matchedIdentity || name}" is typed "${matchedCard.type}" on its Story Card, not a character — skipping the peek.`);
        return stopControl();
      }
      state.unsaid.forcedPeek = matchedIdentity || name;
      state.unsaid.forcedPeekCore = coreRequested;
      state.unsaid.controlRequest = "peek";
      pushMessage(coreRequested
        ? `🌗 Checking whether this moment has changed ${matchedIdentity || name}...`
        : `👁️ Peeking into ${matchedIdentity || name}'s thoughts...`);
      // This must reach Context/Output, but it is an admin/control turn rather
      // than a request to advance the scene. Output suppresses any incidental
      // story prose after extracting the hidden result.
      return { text: "[UNSPOKEN TURNS CONTROL REQUEST]" };
    }

    const cardMatch = commandText.match(/^\/card\b\s*(.*?)\s*$/i);
    if (cardMatch) {
      const enteredName = cleanCommandEntity(cardMatch[1], 60);
      const name = resolveControlEntityName(enteredName, "");
      if (!name) {
        pushMessage("📇 /card needs a name — try \"/card Elara\".");
        return stopControl();
      }
      if (!cfg.enabled) {
        pushMessage(`📇 UNSAID is currently disabled — turn on "Enable UNSAID" on the config card first, or no card will actually be written for ${name} this turn.`);
        return stopControl();
      }
      const cardMatches = typeof storyCardMatchesForEntity === "function"
        ? storyCardMatchesForEntity(name)
        : [];
      const entityCardMatches = typeof codexCardIdentityCompatible === "function"
        ? cardMatches.filter(card => codexCardIdentityCompatible(card, name, ""))
        : cardMatches;
      if (entityCardMatches.length > 1) {
        pushMessage(`📇 "${name}" matches ${entityCardMatches.length} entity Story Cards — automatic overwrite is paused until you remove/rename the duplicate or use a more specific name.`);
        return stopControl();
      }
      const forcedCardIdentity = entityCardMatches.length === 1 && typeof CE_cardIdentityName === "function"
        ? CE_cardIdentityName(entityCardMatches[0]) : "";
      state.unsaid.forcedCodex = forcedCardIdentity || name;
      state.unsaid.controlRequest = "card";
      pushMessage(`📇 Writing a Story Card for ${name}...`);
      return { text: "[UNSPOKEN TURNS CONTROL REQUEST]" };
    }

    if (isUnsaidCommand) {
      const head = (commandText.slice(1).trim().split(/\s+/)[0] || "").toLowerCase();
      if (head === "alias") pushMessage("🏷️ Use /alias <character> to list aliases, or /alias <character> = <alias> to add one.");
      else if (head === "unalias") pushMessage("🏷️ Use /unalias <character> = <alias>.");
      else if (head === "unsaid") pushMessage("📖 Unknown UNSPOKEN TURNS option. Use /unsaid to see the available commands.");
      else pushMessage("📖 That control command could not be parsed. Use /unsaid or /crossedechoes help for command syntax.");
      return stopControl();
    }

    return { text };
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Input/UNSAID", e);
    if (typeof log === "function") log("UNSAID Input error: " + (e && e.message));
    if (detectedControlCommand) {
      const failed = controlCommandFailedSafely(originalText, "UNSAID command", detectedControlCommand);
      if (failed) return failed;
    }
    return { text: originalText };
  }
};

var modifier = (text) => {
  var originalText = text;
  try {
    if (typeof CE_runTurnFeature === "function") CE_runTurnFeature("coordinator", "input", function(){ if (typeof UN_resetHookCaches === "function") UN_resetHookCaches("input"); }, null, typeof UN_resetHookCaches === "function");
    else if (typeof UN_resetHookCaches === "function") UN_resetHookCaches("input");
    if (typeof CE_runTurnFeature === "function") {
      CE_runTurnFeature("full_hardening", "input", function(){ if (typeof CEFH_prepareInput === "function") CEFH_prepareInput(originalText); }, null, typeof CEFH_prepareInput === "function");
    } else if (typeof CEFH_prepareInput === "function") CEFH_prepareInput(originalText);

    var coordinatorCommand = ownedControlCommand(originalText);
    if (coordinatorCommand && /^\/(?:crossedechoes(?:status)?|cestatus|ce|threadbound(?:status)?|tbstatus|unified(?:status)?|world(?:engine)?)\b/i.test(coordinatorCommand)) {
      try {
        if (/^\/(?:world|worldengine)(?:\s+status)?\s*$/i.test(coordinatorCommand)) {
          pushMessage(typeof CEW_statusText === "function" ? CEW_statusText() : "WORLD ENGINE unavailable.");
        } else if (/^\/(?:world|worldengine)\s+doctor\s*$/i.test(coordinatorCommand)) {
          pushMessage(typeof CEW_doctor === "function" ? CEW_doctor() : "WORLD ENGINE doctor unavailable.");
        } else if (/^\/(?:world|worldengine)\s+pulse\s*$/i.test(coordinatorCommand)) {
          var pulse = typeof CEW_forcePulse === "function" ? CEW_forcePulse() : null;
          pushMessage(pulse ? ("🌍 WORLD ENGINE pulse candidate — "+pulse.entity+": "+pulse.basis) : "🌍 No evidence-backed off-screen pulse is currently eligible.");
        } else if (/^\/(?:crossedechoes|ce)\s+doctor\s*$/i.test(coordinatorCommand)) {
          pushMessage(typeof CEFH_doctor === "function" ? CEFH_doctor() : (typeof CEDS_doctor === "function" ? CEDS_doctor() : "Full-system doctor unavailable."));
        } else if (/^\/(?:crossedechoes|ce)\s+(?:help|commands?|guide)\s*$/i.test(coordinatorCommand)) {
          pushMessage(crossedEchoesCommandHelp()+"\n/crossedechoes doctor — full relationships/UNSAID/twists/integrity diagnostic\n\nWORLD ENGINE: /world, /world doctor, /world pulse");
        } else if (/^\/(?:crossedechoes(?:status)?|cestatus|ce|threadbound(?:status)?|tbstatus|unified(?:status)?)(?:\s+status)?\s*$/i.test(coordinatorCommand)) {
          pushMessage(UN_statusText());
        } else {
          pushMessage("🌒 Unknown CROSSED ECHOES coordinator option. Use /crossedechoes for status, /world for WORLD ENGINE status, or /crossedechoes help for commands.");
        }
      } catch (_) {}
      if (typeof CE_markActivationControlTurn === "function") CE_markActivationControlTurn(coordinatorCommand || "coordinator command");
      return { text: null, stop: true };
    }

    // Crossed Wires uses the /wire command family. Keep those turns local
    // so ECHO/UNSAID do not learn from a synthetic zero-width command action.
    var cwCommand = null;
    try { cwCommand = typeof CW_readCommand === "function" ? CW_readCommand(originalText) : null; } catch (_) {}
    if (cwCommand) {
      if (typeof CE_markActivationControlTurn === "function") CE_markActivationControlTurn("/wire control");
      return { text: CW_onInput(originalText) };
    }

    // UNSPOKEN/TWISTS slash commands get first refusal. Local commands stop
    // immediately; model-backed /peek, /card, /twist and /plant intentionally
    // skip the other engines' Input analyzers so command scaffolding is never
    // mistaken for story evidence.
    var owned = ownedControlCommand(originalText);
    var afterTwists = typeof CE_runTurnFeature === "function"
      ? CE_runTurnFeature("twists", "input", function(){ return twistsModifier(originalText); }, { text: originalText }, typeof twistsModifier === "function")
      : twistsModifier(originalText);
    if (afterTwists && afterTwists.stop) {
      if (typeof CE_markActivationControlTurn === "function") CE_markActivationControlTurn(owned || "TWISTS control");
      return afterTwists;
    }
    var twistText = afterTwists && typeof afterTwists.text !== "undefined" ? afterTwists.text : originalText;
    var afterUnsaid = typeof CE_runTurnFeature === "function"
      ? CE_runTurnFeature("unsaid", "input", function(){ return unsaidModifier(twistText); }, { text: twistText }, typeof unsaidModifier === "function")
      : unsaidModifier(twistText);
    if (afterUnsaid && afterUnsaid.stop) {
      if (typeof CE_markActivationControlTurn === "function") CE_markActivationControlTurn(owned || "local control");
      return afterUnsaid;
    }
    if (owned) {
      if (typeof CE_markActivationControlTurn === "function") CE_markActivationControlTurn(owned);
      return afterUnsaid;
    }

    var visible = afterUnsaid && typeof afterUnsaid.text !== "undefined" ? afterUnsaid.text : originalText;
    if (typeof CE_R2_onInput === "function") {
      try { CE_R2_onInput(originalText); } catch (e) { if (typeof log === "function") log("CROSSED ECHOES Reforged Input: " + (e && e.message)); }
    }
    if (typeof CE_runTurnFeature === "function") {
      CE_runTurnFeature("coordinator", "input", function(){ if (typeof UN_capturePlayerIntent === "function") UN_capturePlayerIntent(originalText); }, null, typeof UN_capturePlayerIntent === "function");
      visible = CE_runTurnFeature("crossed_wires", "input", function(){ return typeof CW_onInput === "function" ? CW_onInput(visible) : visible; }, visible, typeof CW_onInput === "function");
      visible = CE_runTurnFeature("echo_veil", "input", function(){ return (typeof ECHO_VEIL !== "undefined" && ECHO_VEIL.input) ? ECHO_VEIL.input(visible) : visible; }, visible, typeof ECHO_VEIL !== "undefined" && !!ECHO_VEIL.input);
      CE_runTurnFeature("world_engine", "input", function(){ if (typeof CEW_onInput === "function") CEW_onInput(visible); }, null, typeof CEW_onInput === "function");
      CE_runTurnFeature("canon_sentinel", "input", function(){ if (typeof CECS_onInput === "function") CECS_onInput(originalText); }, null, typeof CECS_onInput === "function");
      CE_runTurnFeature("coordinator", "input", function(){ if (typeof UN_profileConsensus === "function") UN_profileConsensus(); }, null, typeof UN_profileConsensus === "function");
    } else {
      if (typeof UN_capturePlayerIntent === "function") UN_capturePlayerIntent(originalText);
      if (typeof CW_onInput === "function") visible = CW_onInput(visible);
      if (typeof ECHO_VEIL !== "undefined" && ECHO_VEIL.input) visible = ECHO_VEIL.input(visible);
      if (typeof CEW_onInput === "function") CEW_onInput(visible);
      if (typeof CECS_onInput === "function") CECS_onInput(originalText);
      if (typeof UN_profileConsensus === "function") UN_profileConsensus();
    }
    return { text: visible };
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Input/unified", e);
    if (typeof UN_error === "function") UN_error("Input", e);
    if (typeof log === "function") log("CROSSED ECHOES Input wrapper error: " + (e && e.message));
    var failed = controlCommandFailedSafely(originalText, "Control command");
    if (failed) return failed;
    return { text: originalText };
  } finally {
    if (typeof utEndRuntimePhase === "function") utEndRuntimePhase(inputRuntimeToken);
  }
};

modifier(text);
