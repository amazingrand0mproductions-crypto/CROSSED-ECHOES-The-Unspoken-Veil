var inputRuntimeToken = typeof utBeginRuntimePhase === "function" ? utBeginRuntimePhase("input") : null;

state.message = "";

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

// Command input must fail closed. If an internal error happens while handling
// an administrative command, never leak `/card`, `/peek`, etc. to the story
// model as ordinary prose.
var ownedControlCommand = (raw) => {
  try {
    if (typeof Library !== "undefined" && Library.extractCommand) return Library.extractCommand(raw);
  } catch (e) {}
  const t = String(raw || "").replace(/\r/g, "").trim();
  const owned = "(?:crossedechoesstatus|crossedechoes|cestatus|ce|threadboundstatus|threadbound|tbstatus|unifiedstatus|unified|unsaid|pe(?:e|a)k|card|alias|unalias|twistcategories|twisttypes|twistlog|twisthelp|twist|plant|mature|scenario|synergy|link|intensity|threads|rescan|twists|wiremerge|wireforget|wireprofile|wirestatus|wiretwists|wirehelp|wirerole|wireage|wires|wire|spark)";
  const direct = new RegExp(`^[!/:]${owned}\\b`, "i");
  const normalize = value => {
    let v = String(value || "").trim();
    if (/^[!:]/.test(v)) v = "/" + v.slice(1);
    return v;
  };
  if (direct.test(t)) return normalize(t);
  const labeled = t.match(new RegExp(`^(?:story|do|say|see|guide)\\s*[:=-]\\s*["“‘']?([!/:]${owned}\\b[\\s\\S]*?)["”’']?\\s*[.!]?\\s*$`, "i"));
  return labeled ? normalize(labeled[1]) : null;
};

var crossedEchoesCommandHelp = () => [
  "🌒 CROSSED ECHOES COMMANDS",
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
          let thread = c.threads.find(t => isSameCardEntity(t.entity, name) && Library.isThreadAllowed(t, cfg));
          if (!thread) {
            thread = Library.createThread(c, name, null, c.turn - cfg.minTurnsForPayoff, cfg);
          }

          if (!thread) {
            pushMessage(`🌀 I couldn't prepare another allowed twist thread for ${name}. They may already be at the per-entity thread cap, or only have disabled mature threads waiting.`);
          } else {
            thread.seedTouches = Math.max(thread.seedTouches, cfg.minSeedsForPayoff);
            thread.tier = Library.tierFor(thread.seedTouches);
            thread.status = "ready";
            c.forceEntity = thread.id;
            pushMessage(`🌀 Forcing a twist around ${name}...`);
          }
        } else {
          c.forceEntity = "any";
          pushMessage("🌀 Forcing the next twist...");
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
    if (!isUnsaidCommand) trackMentions(text, false);

    const cfg = readUnsaidConfig();
    // Control-task mode is single-flight. Every new player input starts clean;
    // /peek and /card set it again below when they intentionally need a model
    // call. This prevents a stale failed command from suppressing later prose.
    state.unsaid.controlRequest = "";

    if (/^\/unsaid\s+status\s*$/i.test(commandText)) {
      const report = buildStatusReport(cfg);
      let card = storyCards.find(c => c.title === "UNSAID — Status");
      if (!card) card = createOrFindCard("unsaid status", " ", "Class");
      if (card) {
        card.title = "UNSAID — Status";
        card.keys = "unsaid status";
        card.type = "Class";
        card.entry = " ";
        card.description = "Regenerated fresh each time you type \"/unsaid status\" as an action. Not sent to the AI.\n\n" + report;
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
      let card = storyCards.find(c => c.title === "UNSPOKEN TURNS — Runtime Health");
      if (!card) card = createOrFindCard("unspoken runtime health", " ", "Class");
      if (card) {
        card.title = "UNSPOKEN TURNS — Runtime Health";
        card.keys = "unspoken runtime health";
        card.type = "Class";
        card.entry = " ";
        card.description = "Regenerated fresh each time you type \"/unsaid health\". Diagnostic only; not sent to the AI.\n\n" + report;
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
        // Re-render the dedicated Codex card so the momentary reset flag is
        // false while every other Story Card setting is preserved.
        const currentCfg = readUnsaidConfig();
        codexCard.entry = renderCodexSection(currentCfg);
        codexCard.type = CE_CONFIG_CATEGORY;
        codexCard.title = CE_CONFIG_TITLE_CODEX;
        codexCard.name = CE_CONFIG_TITLE_CODEX;
        codexCard.keys = "";
        codexCard.description = CONFIG_DEFAULT_CODEX_NOTES_SECTION;
        codexCard.notes = CONFIG_DEFAULT_CODEX_NOTES_SECTION;
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
      const canonical = characterMatches.length === 1 && characterMatches[0].title
        ? characterMatches[0].title
        : (typeof resolveUnsaidCanonicalName === "function" ? resolveUnsaidCanonicalName(requestedCharacter) : requestedCharacter);
      const aliasMatches = typeof storyCardMatchesForEntity === "function"
        ? storyCardMatchesForEntity(alias)
        : [];
      const conflict = aliasMatches.find(card => card && card.title && !isSameCardEntity(card.title, canonical));
      let manualConflict = null;
      try {
        if (typeof buildUnsaidAliasIndex === "function" && typeof normalizeUnsaidIdentity === "function") {
          const owners = buildUnsaidAliasIndex().aliasToTitles[normalizeUnsaidIdentity(alias)] || [];
          manualConflict = owners.find(owner => !isSameCardEntity(owner, canonical)) || null;
        }
      } catch (e) {}
      if (conflict || manualConflict) {
        const owner = conflict && conflict.title ? conflict.title : manualConflict;
        pushMessage(`🏷️ "${alias}" already identifies ${owner}. I won't make that alias ambiguous.`);
        return stopControl();
      }
      const canonicalCard = findStoryCardForEntity(canonical);
      if (canonicalCard && !isCharacterLikeCard(canonical)) {
        pushMessage(`🏷️ "${canonicalCard.title}" is not typed as a character, so I didn't attach a character alias to it.`);
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
      const name = enteredName && typeof resolveUnsaidCanonicalName === "function"
        ? resolveUnsaidCanonicalName(enteredName)
        : enteredName;

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
      const matchedCard = peekMatches.length === 1 ? peekMatches[0] : findStoryCardForEntity(name);
      if (peekMatches.length > 1) {
        pushMessage(`👁️ "${name}" matches ${peekMatches.length} Story Cards — rename/remove the duplicate or use a more specific name before peeking.`);
        return stopControl();
      }
      if (matchedCard && !isCharacterLikeCard(name)) {
        pushMessage(`👁️ "${matchedCard.title}" is typed "${matchedCard.type}" on its Story Card, not a character — skipping the peek.`);
        return stopControl();
      }
      state.unsaid.forcedPeek = matchedCard && matchedCard.title ? matchedCard.title : name;
      state.unsaid.forcedPeekCore = coreRequested;
      state.unsaid.controlRequest = "peek";
      pushMessage(coreRequested
        ? `🌗 Checking whether this moment has changed ${matchedCard && matchedCard.title ? matchedCard.title : name}...`
        : `👁️ Peeking into ${matchedCard && matchedCard.title ? matchedCard.title : name}'s thoughts...`);
      // This must reach Context/Output, but it is an admin/control turn rather
      // than a request to advance the scene. Output suppresses any incidental
      // story prose after extracting the hidden result.
      return { text: "[UNSPOKEN TURNS CONTROL REQUEST]" };
    }

    const cardMatch = commandText.match(/^\/card\b\s*(.*?)\s*$/i);
    if (cardMatch) {
      const enteredName = cleanCommandEntity(cardMatch[1], 60);
      const name = enteredName && typeof resolveUnsaidCanonicalName === "function"
        ? resolveUnsaidCanonicalName(enteredName)
        : enteredName;
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
      if (cardMatches.length > 1) {
        pushMessage(`📇 "${name}" matches ${cardMatches.length} Story Cards — automatic overwrite is paused until you remove/rename the duplicate or use a more specific name.`);
        return stopControl();
      }
      state.unsaid.forcedCodex = cardMatches.length === 1 && cardMatches[0].title
        ? cardMatches[0].title
        : name;
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
    if (typeof UN_resetHookCaches === "function") UN_resetHookCaches("input");

    var coordinatorCommand = ownedControlCommand(originalText);
    if (coordinatorCommand && /^\/(?:crossedechoes(?:status)?|cestatus|ce|threadbound(?:status)?|tbstatus|unified(?:status)?)\b/i.test(coordinatorCommand)) {
      try {
        if (/^\/(?:crossedechoes|ce)\s+(?:help|commands?|guide)\s*$/i.test(coordinatorCommand)) {
          pushMessage(crossedEchoesCommandHelp());
        } else if (/^\/(?:crossedechoes(?:status)?|cestatus|ce|threadbound(?:status)?|tbstatus|unified(?:status)?)(?:\s+status)?\s*$/i.test(coordinatorCommand)) {
          pushMessage(UN_statusText());
        } else {
          pushMessage("🌒 Unknown CROSSED ECHOES coordinator option. Use /crossedechoes for status or /crossedechoes help for commands.");
        }
      } catch (_) {}
      return { text: null, stop: true };
    }

    // Crossed Wires uses the /wire command family. Keep those turns local
    // so ECHO/UNSAID do not learn from a synthetic zero-width command action.
    var cwCommand = null;
    try { cwCommand = typeof CW_readCommand === "function" ? CW_readCommand(originalText) : null; } catch (_) {}
    if (cwCommand) return { text: CW_onInput(originalText) };

    // UNSPOKEN/TWISTS slash commands get first refusal. Local commands stop
    // immediately; model-backed /peek, /card, /twist and /plant intentionally
    // skip the other engines' Input analyzers so command scaffolding is never
    // mistaken for story evidence.
    var owned = ownedControlCommand(originalText);
    var afterTwists = twistsModifier(originalText);
    if (afterTwists && afterTwists.stop) return afterTwists;
    var afterUnsaid = unsaidModifier(afterTwists.text);
    if (afterUnsaid && afterUnsaid.stop) return afterUnsaid;
    if (owned) return afterUnsaid;

    var visible = afterUnsaid && typeof afterUnsaid.text !== "undefined" ? afterUnsaid.text : originalText;
    // Capture unfinished player hand-offs before the scheduling systems run.
    // This lets every automatic engine yield without changing the visible text.
    if (typeof UN_captureContinuation === "function") UN_captureContinuation(originalText);
    if (typeof UN_capturePlayerIntent === "function") UN_capturePlayerIntent(originalText);
    if (typeof CW_onInput === "function") visible = CW_onInput(visible);
    if (typeof ECHO_VEIL !== "undefined" && ECHO_VEIL.input) visible = ECHO_VEIL.input(visible);
    if (typeof UN_profileConsensus === "function") UN_profileConsensus();
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
