// @cache-compatible
var contextRuntimeToken = typeof utBeginRuntimePhase === "function" ? utBeginRuntimePhase("context") : null;

try {
  initUnsaid();
  if (typeof CE_noteCacheCompatibleSeen === "function") CE_noteCacheCompatibleSeen();
  checkCacheEfficientWarning();
} catch (e) {
  if (typeof log === "function") log("UNSAID init/Context error: " + (e && e.message));
}

var twistsModifier = (text) => {
  try {
    const { c, cfg } = Library.initState();
    if (!state.memory) state.memory = {};

    const matureWasEnabled = c.lastMatureEnabled;
    Library.applyEntryConfig(cfg);
    if (matureWasEnabled === false && cfg.allowMatureTwists) {
      // A manual config-card toggle should behave the same as /mature on:
      // rescan lore that may previously have been skipped while adult
      // categories were disabled.
      c.importedCardSignatures = {};
      c.lastContextSignature = null;
      c.lastAuthorsNoteSignature = null;
    }
    c.lastMatureEnabled = !!cfg.allowMatureTwists;
    // Manual /peek and /card are model-control calls, not narrative turns.
    // Acknowledge their actionCount so retries de-duplicate correctly, but do
    // not age twist threads, cooldowns, or pacing clocks.
    const unsaidControlRequest = String((state.unsaid && state.unsaid.controlRequest) || "");
    const manualUnsaidControl = unsaidControlRequest === "peek" || unsaidControlRequest === "card";
    const twistStoryAdvanced = Library.beginContextTurn(c, text, !manualUnsaidControl);
    // Re-evaluate from live story + lore every context pass. The profile is
    // advisory and may evolve as a scenario reveals that it is hybrid,
    // grounded, speculative, historical, etc.
    Library.updateScenarioProfile(c, cfg, text);

    const cacheEfficient = !!(typeof info !== "undefined" && info && info.useCacheEfficient);
    Library.updateCacheEfficiencyWarning(cacheEfficient);

    if (typeof info !== "undefined" && info && Array.isArray(info.characterNames)) {
      c.multiplayerNames = info.characterNames.filter(n => typeof n === "string");
    }

    if (!cfg.enabled) {
      syncTwistFrontMemoryHint("");
      c.hintActive = false;
      c.lastContextHint = "";
      Library.updateConfigCard(cfg, c);
      Library.updateTwistLogCard(c, cfg);
      Library.updateNudgeCard(cacheEfficient, "", []);
      return { text };
    }

    // A manual /peek or /card is already a dedicated model-control turn.
    // Never stack an automatic twist instruction onto the same generation:
    // competing hidden formats were a major source of "command ran but the
    // model ignored the metadata" failures. Manual control gets sole ownership
    // of this call; normal twist pacing resumes on the next story turn.
    if (manualUnsaidControl) {
      syncTwistFrontMemoryHint("");
      c.hintActive = false;
      c.lastContextHint = "";
      Library.updateNudgeCard(cacheEfficient, "", []);
      if (typeof utSkipRuntimeTask === "function") utSkipRuntimeTask("single-control-owner-manual");
      return { text };
    }

    // Retries/regenerations of the same action should not seed, pay off, or
    // advance pacing twice. Keep the already-delivered managed hint in place
    // and leave pending Output work untouched.
    if (!twistStoryAdvanced && !c.forcePlant && !c.forceEntity) {
      // Retry/regenerate still needs the SAME managed instruction. In native
      // cache-compatible mode replay the stored hint as an append-only suffix
      // instead of advancing or creating a second twist.
      if (cacheEfficient && c.hintActive && c.lastContextHint &&
          typeof CE_appendCompleteContextSuffix === "function") {
        const reserve = typeof UN_contextReserveChars === "function" ? UN_contextReserveChars() : 0;
        const replay = CE_appendCompleteContextSuffix(text, "\n\n" + c.lastContextHint, reserve);
        if (replay.appended) {
          Library.updateNudgeCard(false, "", []);
          return { text: replay.text };
        }
      }
      Library.updateConfigCard(cfg, c);
      Library.updateTwistLogCard(c, cfg);
      return { text };
    }

    let hint = null;
    let hintEntities = [];
    let directTwistDelivered = false;

    try {
    if (c.forcePlant) {
      const existing = Library.findThreadFuzzy(c, c.forcePlant.entity);
      if (!existing) Library.createThread(c, c.forcePlant.entity, c.forcePlant.category, c.turn, cfg);
      c.forcePlant = null;
    }

    // Always prioritize the live story window. Lore maintenance can wait a
    // turn; understanding what just happened cannot. In very large adventures
    // do NOT materialize/sort every Story Card title just to discover which
    // few names appear in the current text. eligibleCardTitles(source, cap)
    // performs one bounded relevance scan instead.
    const twistScanSource = (typeof recentTurnsText === "function")
      ? recentTurnsText(text, 3)
      : String(text || "").slice(-4500);
    const scanText = twistScanSource
      .replace(/\[[^\[\]]*\]/g, " ")
      .replace(/《[^》]*》?/g, " ")
      .replace(/【CARD】[\s\S]*?【\/CARD】?/g, " ");

    const liveCardTitles = Library.eligibleCardTitles(scanText, 64);
    const loreReferenceText = [
      scanText,
      state && state.memory && typeof state.memory.context === "string" ? state.memory.context.slice(-5000) : "",
      state && state.memory && typeof state.memory.authorsNote === "string" ? state.memory.authorsNote.slice(-3000) : ""
    ].filter(Boolean).join("\n");
    const cardTitles = Library.eligibleCardTitles(loreReferenceText, 96);
    Library.scanForLooseThreads(scanText, c, cfg, liveCardTitles);

    if (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(430)) {
      Library.scanStoryCardsForScenarioThreads(c, cfg, liveCardTitles);
    } else if (typeof utSkipRuntimeTask === "function") {
      utSkipRuntimeTask("twist-storycard-scan");
    }
    if (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(350)) {
      Library.scanPlotEssentialsForThreads(c, cfg, cardTitles);
    } else if (typeof utSkipRuntimeTask === "function") {
      utSkipRuntimeTask("twist-plot-scan");
    }
    if (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(300)) {
      Library.scanAuthorsNoteForThreads(c, cfg, cardTitles);
    } else if (typeof utSkipRuntimeTask === "function") {
      utSkipRuntimeTask("twist-authors-note-scan");
    }

    if (c.forceEntity) {
      let thread = null;
      if (c.forceEntity === "any") {
        thread = Library.pickPayoffThread(c, cfg) || Library.pickMostBuiltUpBrewingThread(c, cfg);
        if (thread && thread.status === "brewing") {
          thread.seedTouches = Math.max(thread.seedTouches, cfg.minSeedsForPayoff);
          thread.tier = Library.tierFor(thread.seedTouches);
          thread.status = "ready";
        }
      } else {
        thread = c.threads.find(t => t.id === c.forceEntity);
        if (thread && !Library.isThreadAllowed(thread, cfg)) thread = null;
      }
      if (thread) {
        hint = Library.payoffHint(thread);
        hintEntities = [thread.entity];
        c.pendingPayoffId = thread.id;
        c.pendingPayoffId2 = null;
        c.lastPayoffAttemptTurn = c.turn;
        Library.safeLog("[Twists and Turns] /twist forced a payoff for " + thread.entity + " (" + thread.category + ")");
      } else {
        // The Input hook always shows "Forcing the next twist..." on
        // /twist with no name, since it can't know in advance whether
        // anything will actually be available by the time this hook
        // runs — confirmed directly via sandbox that with zero threads
        // of any kind (a genuinely fresh game, nothing /planted, nothing
        // scanned yet), the player got that confident message and then
        // nothing happened at all: no hint, no thread, no log entry, and
        // no explanation, the exact same shape of "the command doesn't
        // work" complaint as the cfg.enabled gap fixed last round, just
        // triggered by empty state instead of a disabled system.
        pushMessage("🌀 Nothing has built up enough yet to force a twist on — try \"/plant a name\" first, or let the story develop a bit more.");
      }
      c.forceEntity = null;
    }

    if (!hint && !(typeof UN_shouldSuppressPlotTwist === "function" && UN_shouldSuppressPlotTwist()) &&
        (c.turn - c.lastPayoffTurn) >= cfg.payoffCooldown &&
        (c.turn - c.lastPayoffAttemptTurn) >= cfg.twistRetryCooldown) {
      let compound = null;
      if (cfg.allowCompoundTwists && Math.random() < Library.CP_COMPOUND_CHANCE) {
        compound = Library.pickCompoundPayoffThreads(c, cfg);
      }
      if (compound) {
        hint = Library.compoundPayoffHint(compound[0], compound[1]);
        hintEntities = [compound[0].entity, compound[1].entity];
        c.pendingPayoffId = compound[0].id;
        c.pendingPayoffId2 = compound[1].id;
        c.lastPayoffAttemptTurn = c.turn;
        Library.safeLog("[Twists and Turns] compound payoff: " + compound[0].entity + " + " + compound[1].entity);
      } else {
        const payoffThread = Library.pickPayoffThread(c, cfg);
        if (payoffThread) {
          hint = Library.payoffHint(payoffThread);
          hintEntities = [payoffThread.entity];
          c.pendingPayoffId = payoffThread.id;
          c.pendingPayoffId2 = null;
          c.lastPayoffAttemptTurn = c.turn;
          Library.safeLog("[Twists and Turns] payoff: " + payoffThread.entity + " (" + payoffThread.category + ", " + payoffThread.tier + ")");
        }
      }
    }

    let pacingTurn = false;
    if (!hint) {
      const pacing = Library.effectivePacing(cfg, c);
      pacingTurn = (c.turn % pacing === 0);
      if (pacingTurn) {
        const seedThread = Library.pickForeshadowThread(c, cfg);
        if (seedThread) {
          hint = Library.foreshadowHint(seedThread);
          hintEntities = [seedThread.entity];
          c.pendingSeedId = seedThread.id;
          Library.safeLog("[Twists and Turns] foreshadowing: " + seedThread.entity + " (" + seedThread.seedTouches + " touches so far)");
        }
      }
    }

    if (!hint && !cfg.strictLogic && cfg.allowWildcard && pacingTurn &&
        !(typeof UN_shouldSuppressPlotTwist === "function" && UN_shouldSuppressPlotTwist()) &&
        (c.turn - c.lastPayoffTurn) >= cfg.payoffCooldown &&
        (c.turn - c.lastPayoffAttemptTurn) >= cfg.twistRetryCooldown &&
        Math.random() < Library.CP_WILDCARD_CHANCE) {
      const candidate = Library.pickWildcardEntity(scanText, c, cfg);
      if (candidate) {
        const wildThread = Library.createThread(c, candidate, null, c.turn, cfg, scanText);
        if (wildThread) {
          wildThread.seedTouches = cfg.minSeedsForPayoff;
          wildThread.status = "ready";
          wildThread.wildcard = true;
          hint = Library.payoffHint(wildThread);
          hintEntities = [wildThread.entity];
          c.pendingPayoffId = wildThread.id;
          c.pendingPayoffId2 = null;
          c.lastPayoffAttemptTurn = c.turn;
          Library.safeLog("[Twists and Turns] wildcard payoff: " + wildThread.entity);
        }
      }
    }

    c.lastContextHint = hint || "";
    if (cacheEfficient && hint && typeof CE_appendCompleteContextSuffix === "function") {
      const reserve = typeof UN_contextReserveChars === "function" ? UN_contextReserveChars() : 0;
      const delivered = CE_appendCompleteContextSuffix(text, "\n\n" + hint, reserve);
      if (delivered.appended) {
        text = delivered.text;
        directTwistDelivered = true;
        // Avoid duplicate emphasis: current-turn delivery is already at the
        // dynamic suffix, which is exactly where optimized context wants it.
        syncTwistFrontMemoryHint("");
      } else {
        syncTwistFrontMemoryHint(hint);
      }
    } else {
      syncTwistFrontMemoryHint(hint || "");
    }
    c.hintActive = !!hint;
    } catch (e) {
      if (typeof log === "function") log("Context/Twists inner error: " + (e && e.message));
    }

    Library.updateNudgeCard(cacheEfficient && !directTwistDelivered, hint, hintEntities);
    Library.updateConfigCard(cfg, c);
    Library.updateTwistLogCard(c, cfg);
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Context/Twists", e);
    if (typeof log === "function") log("Context/Twists error: " + (e && e.message));
  }

  return { text };
};

var unsaidModifier = (text) => {
  const originalText = text;
  try {
    const cfg = readUnsaidConfig();
    text = stripConfigNoise(text);

    // Same platform limitation TWISTS AND TURNS already works around for
    // its own hint (see updateNudgeCard) — computed here too since this is
    // a separate function from twistsModifier and doesn't share its local
    // variables.
    const cacheEfficient = !!(typeof info !== "undefined" && info && info.useCacheEfficient);

    const forcedPeek = state.unsaid.forcedPeek;
    const forcedPeekCore = state.unsaid.forcedPeekCore;
    state.unsaid.forcedPeek = null;
    state.unsaid.forcedPeekCore = null;

    const forcedCodex = state.unsaid.forcedCodex;
    state.unsaid.forcedCodex = null;

    if (!cfg.enabled) {
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
      state.unsaid.controlRequest = "";
      state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
      syncFrontMemoryHint(false);
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    }

    const controlRequest = String(state.unsaid.controlRequest || "");
    const manualControlTurn = controlRequest === "peek" || controlRequest === "card";
    const storyAdvanced = isNewStoryTurn(text);
    if (!storyAdvanced && !forcedPeek && !forcedCodex) {
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
      state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    }

    if (!manualControlTurn) state.unsaid.turn++;

    const recent = recentTurnsText(text, cfg.recentTurnsWindow);
    const latestSceneText = recentTurnsText(text, 1);
    const active = (typeof activeUnsaidCharacters === "function")
      ? activeUnsaidCharacters(cfg.cast, recent, latestSceneText)
      : cfg.cast.filter(name => nameAppears(name, recent));

    active.forEach(seedMindIfKnown);
    if (forcedPeek) seedMindIfKnown(forcedPeek);

    // One high-complexity side task per generation. If TWISTS AND TURNS has
    // already asked the model to seed/pay off a thread, defer automatic Codex,
    // private-thought and behavioral-continuity instructions until the next
    // turn. This makes each hidden protocol dramatically easier for different
    // AI Dungeon models to follow and prevents subsystems from fighting over
    // the same output. Manual /peek and /card are exempt because the Twists
    // hook above yields to them before setting hintActive.
    const twistInstructionActive = !!(state.contingency && state.contingency.hintActive) ||
      (typeof UN_structuredOwnerActive === "function" && UN_structuredOwnerActive());
    if (twistInstructionActive && !forcedPeek && !forcedCodex) {
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
      state.unsaid.codex.pendingNames = [];
      state.unsaid.codex.pendingForced = false;
      state.unsaid.codex.pendingRefreshNames = [];
      updateUnsaidBackupCard(cacheEfficient, "");
      if (typeof utSkipRuntimeTask === "function") utSkipRuntimeTask("single-control-owner-twist");
      return { text };
    }

    if (forcedPeek && forcedPeekCore && !cfg.allowCoreShift) {
      pushMessage(`🌗 Core-shift checks are off — turn on "Allow major events to rewrite a core truth" in the config card first.`);
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
      state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    }

    if (forcedPeek && forcedPeekCore) {
      const instruction = buildCoreCheckInstruction(forcedPeek, state.unsaid.minds[forcedPeek]);
      const fitted = fitInstructionToBudget(text, instruction);
      if (fitted) {
        state.unsaid.pending = forcedPeek;
        state.unsaid.pendingCoreShiftAllowed = true;
        state.unsaid.pendingCoreCheck = true;
        state.unsaid.pendingRevealForced = true;
        state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
        updateUnsaidBackupCard(cacheEfficient, fitted);
        return { text: text + fitted };
      }
      pushMessage(`🌗 Not enough room left in context to check ${forcedPeek} this turn — try again once the story frees up some space.`);
      state.unsaid.controlRequest = "";
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    } else if (forcedPeek) {
      const fitted = buildAndFitThoughtInstruction(forcedPeek, active, text, cfg.allowCoreShift, cfg);
      if (fitted) {
        state.unsaid.pending = forcedPeek;
        state.unsaid.pendingCoreShiftAllowed = naturalCoreShiftEligible(state.unsaid.minds[forcedPeek], cfg.allowCoreShift, forcedPeek);
        state.unsaid.pendingCoreCheck = false;
        state.unsaid.pendingRevealForced = true;
        state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
        updateUnsaidBackupCard(cacheEfficient, fitted);
        return { text: text + fitted };
      }
      pushMessage(`👁️ Not enough room left in context to peek at ${forcedPeek} this turn — try again once the story frees up some space.`);
      state.unsaid.controlRequest = "";
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    }

    if (forcedCodex) {
      const type = reconcileCodexEntityType(forcedCodex, text) ||
        resolveCodexEntityType(forcedCodex, text) ||
        classifyCodexEntry(forcedCodex, text);
      const priorFailures = state.unsaid.codex.attempts[forcedCodex] || 0;
      const fitted = buildAndFitCodexInstruction([forcedCodex], text, true, priorFailures, true);
      if (fitted) {
        state.unsaid.codex.attempts[forcedCodex] = (state.unsaid.codex.attempts[forcedCodex] || 0) + 1;
        state.unsaid.codex.lastAttemptTurn[forcedCodex] = state.unsaid.turn;
        state.unsaid.codex.pendingNames = [forcedCodex];
        state.unsaid.codex.pendingTypes = { [forcedCodex]: type };
        state.unsaid.codex.pendingForced = true;
        state.unsaid.codex.pendingRefreshNames = [];
        state.unsaid.codex.lastTriggerTurn = state.unsaid.turn;
        state.unsaid.pending = null;
        state.unsaid.pendingCoreShiftAllowed = false;
        state.unsaid.pendingCoreCheck = false;
        updateUnsaidBackupCard(cacheEfficient, fitted);
        return { text: text + fitted };
      }
      pushMessage(`📇 Not enough room left in context to card ${forcedCodex} this turn — try again once the story frees up some space.`);
      state.unsaid.controlRequest = "";
      updateUnsaidBackupCard(cacheEfficient, "");
      return { text };
    }

    const sinceLastCodex = state.unsaid.turn - (state.unsaid.codex.lastTriggerTurn || 0);

    const codexAutoPaused = !!(state.unsaid.codex &&
      state.unsaid.turn < (state.unsaid.codex.autoPauseUntil || 0));

    if (cfg.codexEnabled && !codexAutoPaused) {
      // Keep Context maintenance deliberately bounded. Input/Output perform
      // the full candidate scan on real actions; Context only needs a small
      // rotating cleanup slice so it can never spend its entire VM budget on
      // old persisted candidates before generating the actual story context.
      if (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(360)) {
        pruneMentionCounts(CODEX_CONTEXT_PRUNE_BATCH);
      } else if (typeof utSkipRuntimeTask === "function") {
        utSkipRuntimeTask("codex-prune");
      }

      const codexRecent = recentTurnsText(
        text,
        Math.max(
          cfg.recentTurnsWindow || 3,
          cfg.codexCharacterDeadline || 5,
          (cfg.codexCharacterMinTurns || 3) + 1
        )
      );

      // Legacy migration is only needed for the old sticky character flags
      // that have NO introduction timestamp. Previous code reclassified every
      // tracked name (up to ~150) against the same recent context on every
      // Context pass — the main source of the timeout seen in the screenshot.
      // Repair a small rotating batch instead; current/new entities are already
      // handled by trackMentions in Input/Output.
      const codexState = state.unsaid.codex;
      const legacyNames = Object.keys(codexState.mentionCounts || {}).filter(name =>
        !!codexState.likelyCharacters[name] &&
        typeof codexState.introducedTurn[name] !== "number"
      );

      if (legacyNames.length > 0 && (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(300))) {
        const batchSize = Math.max(1, CODEX_CONTEXT_MIGRATION_BATCH || 8);
        const cursor = Math.max(0, Math.floor(codexState.legacyMigrationCursor || 0)) % legacyNames.length;
        const migrationBatch = [];
        for (let i = 0; i < Math.min(batchSize, legacyNames.length); i++) {
          migrationBatch.push(legacyNames[(cursor + i) % legacyNames.length]);
        }
        codexState.legacyMigrationCursor = (cursor + migrationBatch.length) % legacyNames.length;

        migrationBatch.forEach(name => {
          const existingLegacyMatches = typeof storyCardMatchesForEntity === "function"
            ? storyCardMatchesForEntity(name)
            : [];
          if (existingLegacyMatches.length > 0) return;

          if (typeof codexState.firstSeenTurn[name] !== "number") {
            codexState.firstSeenTurn[name] = state.unsaid.turn;
          }

          const repairedType = reconcileCodexEntityType(name, codexRecent);
          const directlyIntroduced = repairedType === "character" &&
            isLikelyCharacterIntroduction(name, codexRecent);

          if (directlyIntroduced) {
            codexState.likelyCharacters[name] = true;
            codexState.observedTypes[name] = "character";
            codexState.introducedTurn[name] = state.unsaid.turn;
            if (codexAppearanceCount(name) === 0) {
              recordCodexEvidence(name, codexRecent, true);
            }
          } else {
            delete codexState.likelyCharacters[name];
            codexState.observedTypes[name] = codexState.observedTypes[name] || "character";
          }
        });
      } else if (legacyNames.length === 0) {
        codexState.legacyMigrationCursor = 0;
      } else if (typeof utSkipRuntimeTask === "function") {
        utSkipRuntimeTask("codex-legacy-migration");
      }

      const canAutoCodex = typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(220);
      const available = canAutoCodex
        ? findCodexCandidates(
            cfg.mentionThreshold,
            excludedNames(cfg),
            cfg.codexMaxAttempts
          ).filter(name => (state.unsaid.codex.lastAttemptTurn[name] || -999999) < state.unsaid.turn)
        : [];
      if (!canAutoCodex && typeof utSkipRuntimeTask === "function") {
        utSkipRuntimeTask("codex-auto-scheduling");
      }

      const minObserve = Math.max(0, cfg.codexCharacterMinTurns || 0);
      const minAppearances = Math.max(1, cfg.codexCharacterMinAppearances || 1);
      const deadline = Math.max(minObserve, cfg.codexCharacterDeadline || 5);

      const characterCandidates = available.filter(name =>
        !!state.unsaid.codex.likelyCharacters[name] &&
        typeof state.unsaid.codex.introducedTurn[name] === "number"
      );

      // The normal path needs BOTH enough elapsed story time and enough
      // distinct on-screen appearances. The hard deadline is deliberately
      // time-only so a recurring character cannot get stranded forever
      // because they stepped out of the scene after a strong introduction.
      const deadlineCharacters = characterCandidates.filter(name => {
        const age = state.unsaid.turn - state.unsaid.codex.introducedTurn[name];
        return age >= deadline;
      });
      const matureCharacters = characterCandidates.filter(name => {
        if (typeof codexCharacterGateReady === "function") return codexCharacterGateReady(name, cfg);
        const age = state.unsaid.turn - state.unsaid.codex.introducedTurn[name];
        return age >= minObserve && codexAppearanceCount(name) >= minAppearances;
      });

      const nonCharacters = available.filter(name => !state.unsaid.codex.likelyCharacters[name]);
      const canRefreshCodex = canAutoCodex && (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(170));
      const refreshPreview = (canRefreshCodex && cfg.codexAutoRefresh && sinceLastCodex >= cfg.codexCooldown)
        ? pickCodexRefreshCandidate(cfg)
        : null;
      if (canAutoCodex && !canRefreshCodex && cfg.codexAutoRefresh && typeof utSkipRuntimeTask === "function") {
        utSkipRuntimeTask("codex-refresh-preview");
      }
      const refreshVeryOverdue = !!refreshPreview &&
        refreshPreview.since >= Math.max(1, cfg.codexRefreshInterval || 20) * 2;

      // Automatic character generation is intentionally one profile at a
      // time. Introduced characters always outrank maintenance. A refresh
      // that has been waiting for twice its configured interval may outrank
      // a new non-character card so long-running busy scenarios cannot starve
      // existing cards forever.
      let candidates = [];
      let hardDeadline = false;
      // Strong direct-scaffold candidates may bypass the ordinary Codex task
      // cooldown. They have already passed the strict entity/type gates and
      // creating the first evidence-only card does not require a model call.
      // This is what makes an explicitly introduced character, location,
      // item or faction reliably appear as a Story Card instead of waiting
      // for the model to repeat the name several turns later.
      const directScaffoldCandidates = (cfg.codexDirectScaffold !== false && typeof codexDirectScaffoldEligibility === "function")
        ? available.filter(function(name){
            const t = reconcileCodexEntityType(name, text) || resolveCodexEntityType(name, text) ||
              (state.unsaid.codex.likelyCharacters[name] ? "character" : dominantCodexType(name));
            return codexDirectScaffoldEligibility(name, t, cfg, codexRecent);
          })
        : [];
      if (deadlineCharacters.length > 0) {
        candidates = deadlineCharacters.slice(0, 1);
        hardDeadline = true;
      } else if (matureCharacters.length > 0) {
        candidates = matureCharacters.slice(0, 1);
      } else if (directScaffoldCandidates.length > 0) {
        candidates = directScaffoldCandidates.slice(0, 1);
      } else if (sinceLastCodex >= cfg.codexCooldown && !refreshVeryOverdue) {
        // One automatic card task per story turn. Multiple hidden profiles in
        // the same model response substantially increase the chance that the
        // model outputs only metadata and forgets the visible story.
        candidates = nonCharacters.slice(0, 1);
      }

      // ULTIMATE CODEX RELIABILITY: high-confidence entities no longer depend
      // on the model obeying a hidden [CARD] formatting request. Build a
      // conservative evidence-only scaffold immediately, then let normal
      // refresh/enrichment improve it after more story evidence accumulates.
      // This keeps automatic card creation reliable while the junk/entity
      // gates remain responsible for deciding whether a name is safe.
      if (candidates.length > 0 && cfg.codexDirectScaffold !== false && typeof createCodexDirectScaffoldCard === "function") {
        const scaffoldName = candidates[0];
        const scaffold = createCodexDirectScaffoldCard(scaffoldName, cfg, codexRecent);
        if (scaffold) {
          state.unsaid.codex.lastTriggerTurn = state.unsaid.turn;
          state.unsaid.codex.pendingNames = [];
          state.unsaid.codex.pendingTypes = {};
          state.unsaid.codex.pendingForced = false;
          state.unsaid.codex.pendingRefreshNames = [];
          if (typeof pushMessage === "function") {
            pushMessage("📇 CODEX created a provisional " + String(scaffold.type || "Story") + " card for " + String(scaffoldName) + ". It will enrich itself as new evidence appears.");
          }
          candidates = [];
        }
      }

      if (candidates.length > 0) {
        const priorFailures = candidates.reduce(
          (max, name) => Math.max(max, state.unsaid.codex.attempts[name] || 0),
          0
        );

        const fitted = buildAndFitCodexInstruction(
          candidates,
          text,
          false,
          priorFailures,
          hardDeadline
        );

        if (fitted) {
          const types = {};
          candidates.forEach(name => {
            state.unsaid.codex.attempts[name] = (state.unsaid.codex.attempts[name] || 0) + 1;
            state.unsaid.codex.lastAttemptTurn[name] = state.unsaid.turn;
            types[name] = reconcileCodexEntityType(name, text) ||
              resolveCodexEntityType(name, text) ||
              state.unsaid.codex.observedTypes[name] ||
              classifyCodexEntry(name, text);
          });
          state.unsaid.codex.pendingNames = candidates;
          state.unsaid.codex.pendingTypes = types;
          state.unsaid.codex.pendingForced = false;
      state.unsaid.codex.pendingRefreshNames = [];
          state.unsaid.codex.lastTriggerTurn = state.unsaid.turn;
          state.unsaid.pending = null;
          state.unsaid.pendingCoreShiftAllowed = false;
          state.unsaid.pendingCoreCheck = false;
          state.unsaid.pendingRevealForced = false;
          updateUnsaidBackupCard(cacheEfficient, fitted);
          return { text: text + fitted };
        }

        // Context-budget failures do not consume an attempt. Mature
        // characters remain eligible next turn; non-characters wait for
        // their normal scheduling opportunity.
        if (typeof utSkipRuntimeTask === "function") utSkipRuntimeTask("codex-context-fit");
      }

      // Periodic refreshes are intentionally lower priority than creating a
      // genuinely new card. They run only when no new-card candidate was due
      // this turn, respect the normal Codex task cooldown, and refresh at most
      // one existing Codex-made card at a time.
      if (candidates.length === 0 && sinceLastCodex >= cfg.codexCooldown && cfg.codexAutoRefresh && canRefreshCodex) {
        const refresh = refreshPreview || pickCodexRefreshCandidate(cfg);
        if (refresh && refresh.name) {
          const card = findStoryCardForEntity(refresh.name);
          const refreshType = card
            ? (reconcileCodexEntityType(refresh.name, codexUpdateEvidenceTextFor(refresh.name, false)) ||
               codexKindFromExistingCard(card, refresh.name))
            : refresh.type;
          const fitted = buildAndFitCodexInstruction(
            [refresh.name],
            text,
            false,
            0,
            false,
            true
          );

          if (fitted) {
            state.unsaid.codex.pendingNames = [refresh.name];
            state.unsaid.codex.pendingTypes = { [refresh.name]: refreshType || refresh.type || "character" };
            state.unsaid.codex.pendingForced = false;
            state.unsaid.codex.pendingRefreshNames = [refresh.name];
            state.unsaid.codex.lastTriggerTurn = state.unsaid.turn;
            state.unsaid.codex.lastRefreshTriggerTurn = state.unsaid.turn;
            if (card && typeof ensureCodexCardMeta === "function") {
              const refreshMeta = ensureCodexCardMeta(refresh.name, card, refreshType || refresh.type);
              if (refreshMeta) refreshMeta.lastRefreshAttemptTurn = state.unsaid.turn;
            }
            state.unsaid.pending = null;
            state.unsaid.pendingCoreShiftAllowed = false;
            state.unsaid.pendingCoreCheck = false;
            updateUnsaidBackupCard(cacheEfficient, fitted);
            return { text: text + fitted };
          }
        }
      }
    }

    if (cfg.codexEnabled && codexAutoPaused && typeof utSkipRuntimeTask === "function") {
      utSkipRuntimeTask("codex-delivery-backoff");
    }

    state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];

    if (cfg.cast.length > 0) {
      const eligible = active.filter(name => {
        const mind = state.unsaid.minds[name];
        return !mind || !mind.lastTurn || (state.unsaid.turn - mind.lastTurn) >= cfg.cooldown;
      });

      const actionType = getLastActionType();
      const isPlayerAction = actionType === "do" || actionType === "say";
      let effectiveChance = (cfg.reduceDuringActions && isPlayerAction) ? cfg.chance * 0.5 : cfg.chance;

      const anyoneNeverRevealed = eligible.some(name => !state.unsaid.minds[name]);
      if (anyoneNeverRevealed) {
        // Give new NPCs a modest nudge, but never turn a 30% setting into an
        // almost-every-turn metadata request. Repeated model misses now trigger
        // an internal cooldown instead of hammering the same hidden format.
        effectiveChance = Math.min(0.6, effectiveChance * 1.5);
      }

      const revealBackoffActive = state.unsaid.turn < (state.unsaid.revealBackoffUntil || 0);
      if (!revealBackoffActive && eligible.length > 0 && Math.random() < effectiveChance) {
        const chosen = (typeof pickUnsaidThinker === "function")
          ? pickUnsaidThinker(eligible, state.unsaid.turn, recent)
          : pickBySilence(eligible, state.unsaid.turn);
        const fitted = buildAndFitThoughtInstruction(chosen, active, text, cfg.allowCoreShift, cfg);
        if (fitted) {
          state.unsaid.pending = chosen;
          state.unsaid.pendingCoreShiftAllowed = naturalCoreShiftEligible(state.unsaid.minds[chosen], cfg.allowCoreShift, chosen);
          state.unsaid.pendingCoreCheck = false;
          state.unsaid.pendingRevealForced = false;
          updateUnsaidBackupCard(cacheEfficient, fitted);
          return { text: text + fitted };
        }
      }
    }

    state.unsaid.pending = null;
    state.unsaid.pendingCoreShiftAllowed = false;
    state.unsaid.pendingCoreCheck = false;
    state.unsaid.pendingRevealForced = false;

    // Even when this turn does not reveal a private thought, established
    // goals/plans can keep shaping visible behavior. This is intentionally
    // lower priority than Codex or thought-generation work and yields first
    // when the runtime governor is getting tight.
    let continuityFitted = null;
    if (cfg.behavioralContinuity !== false && active.length > 0 &&
        (typeof utHasRuntimeBudget !== "function" || utHasRuntimeBudget(110))) {
      const continuityInstruction = typeof buildBehaviorContinuityInstruction === "function"
        ? buildBehaviorContinuityInstruction(active, text, cfg)
        : "";
      if (continuityInstruction) continuityFitted = fitInstructionToBudget(text, continuityInstruction);
    } else if (cfg.behavioralContinuity !== false && active.length > 0 && typeof utSkipRuntimeTask === "function") {
      utSkipRuntimeTask("behavioral-continuity");
    }
    updateUnsaidBackupCard(cacheEfficient, continuityFitted || "");
    return { text: continuityFitted ? text + continuityFitted : text };
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Context/UNSAID", e);
    if (typeof log === "function") log("UNSAID Context error: " + (e && e.message));
    try {
      if (state.unsaid && state.unsaid.codex) {
        state.unsaid.codex.pendingNames = [];
        state.unsaid.codex.pendingTypes = {};
        state.unsaid.codex.pendingForced = false;
        state.unsaid.codex.pendingRefreshNames = [];
      }
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
      state.unsaid.controlRequest = "";
    } catch (_) {}
    return { text: originalText };
  }
};

var modifier = (text) => {
  var originalText = text;
  try {
    if (typeof UN_resetHookCaches === "function") UN_resetHookCaches("context");

    // Manual UNSAID/Codex generations own the whole model call. They are
    // administrative workers, not story turns, so skip the other directors.
    var manualControl = !!(state.unsaid && (state.unsaid.controlRequest === "peek" || state.unsaid.controlRequest === "card"));
    if (manualControl) {
      var manualTwists = twistsModifier(originalText);
      return unsaidModifier(manualTwists.text);
    }

    // A previously armed /spark is explicit player intent and receives
    // priority over an automatic plot beat. Normal turns give seeded plot
    // threads first refusal, then relationship pressure, then UNSAID work.
    var afterTwists = { text: originalText };
    if (typeof UN_crossedForcedPending === "function" && UN_crossedForcedPending()) {
      if (typeof UN_setOwner === "function") UN_setOwner("crossed_forced", "player-forced relationship spark", true);
      try { if (state.contingency) state.contingency.hintActive = false; } catch (_) {}
    } else {
      afterTwists = twistsModifier(originalText);
      if (typeof UN_markOwnerFromTwists === "function") UN_markOwnerFromTwists();
    }

    var working = afterTwists.text;
    if (typeof ECHO_VEIL !== "undefined" && ECHO_VEIL.context) working = ECHO_VEIL.context(working);
    if (typeof CW_onContext === "function") working = CW_onContext(working);
    if (typeof UN_markOwnerFromCrossed === "function") UN_markOwnerFromCrossed();

    if (typeof UN_contextPacket === "function") {
      var bridgePacket = UN_contextPacket(working);
      if (bridgePacket) {
        if (typeof CE_isCacheEfficientContext === "function" && CE_isCacheEfficientContext() &&
            typeof CE_appendCompleteContextSuffix === "function") {
          var bridgeAppend = CE_appendCompleteContextSuffix(working, bridgePacket, 0);
          if (bridgeAppend.appended) working = bridgeAppend.text;
          else if (typeof utSkipRuntimeTask === "function") utSkipRuntimeTask("fusion-cache-headroom");
        } else working += bridgePacket;
      }
    }
    var finalResult = unsaidModifier(working);
    return finalResult;
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Context/unified", e);
    if (typeof UN_error === "function") UN_error("Context", e);
    if (typeof log === "function") log("CROSSED ECHOES Context wrapper error: " + (e && e.message));
    return { text: originalText };
  } finally {
    if (typeof utEndRuntimePhase === "function") utEndRuntimePhase(contextRuntimeToken);
  }
};

modifier(text);
