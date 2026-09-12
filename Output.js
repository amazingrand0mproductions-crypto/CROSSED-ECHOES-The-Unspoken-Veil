var outputRuntimeToken = typeof utBeginRuntimePhase === "function" ? utBeginRuntimePhase("output") : null;
try {
  if (typeof CE_reconcilePlayerIdentityState === "function") CE_reconcilePlayerIdentityState();
} catch (e) {
  if (typeof log === "function") log("CROSSED ECHOES player identity/Output error: " + (e && e.message));
}
try {
  if (typeof CE_bootstrapRequiredConfigCards === "function") {
    if (typeof CE_runTurnFeature === "function") CE_runTurnFeature("codex", "output", function(){ CE_bootstrapRequiredConfigCards("output"); }, null, true);
    else CE_bootstrapRequiredConfigCards("output");
  } else if (typeof CE_markFeatureActivation === "function") CE_markFeatureActivation("codex", "output", "ok", "lazy CODEX initialization");
  initUnsaid();
} catch (e) {
  if (typeof log === "function") log("UNSAID init/Output error: " + (e && e.message));
}
var twistsModifier = (text) => {
  try {
    const { c, cfg } = Library.initState();
    const hadPendingTwistWork = !!(c.pendingPayoffId || c.pendingSeedId);
    const markerPattern = /(?:【|〖|\[|<)\s*UT-(TWIST|SEED)\s*:\s*([A-Za-z0-9_-]+)\s*(?:】|〗|\]|>)/gi;
    const confirmedTwists = new Set();
    const confirmedSeeds = new Set();
    let markerMatch;
    while ((markerMatch = markerPattern.exec(text || ""))) {
      const kind = (markerMatch[1] || "").toUpperCase();
      const id = markerMatch[2];
      if (kind === "TWIST") confirmedTwists.add(id);
      if (kind === "SEED") confirmedSeeds.add(id);
    }
    text = String(text || "").replace(markerPattern, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    function resolveThread(thread, partnerName) {
      if (!thread) return;
      thread.status = "resolved";
      thread.resolvedTurn = c.turn;
      thread.confirmMisses = 0;
      const revealedFact = Library.extractResolvedTwistFact ? Library.extractResolvedTwistFact(thread, text) : "";
      thread.resolvedFact = revealedFact || "";
      c.twistLog.push({
        entity: thread.entity,
        category: thread.category,
        tier: thread.tier,
        resolvedTurn: c.turn,
        wildcard: !!thread.wildcard,
        mature: !!thread.mature || Library.isMatureCategory(thread.category),
        source: thread.source || "live",
        compoundWith: partnerName || null,
        fact: revealedFact || ""
      });
      Library.createTwistStoryCard(c, cfg, thread, partnerName || null);
      try {
        if (Library.applyTwistImpactToMind) {
          const impacted = Library.applyTwistImpactToMind(thread.entity, thread.category, thread.tier, partnerName || null);
          if (impacted && typeof syncMindToCard === "function") {
            const ucfg = readUnsaidConfig();
            syncMindToCard(thread.entity, ucfg.allowCoreShift, ucfg.jsonNotes);
          }
        }
        if (state.unsaid && state.unsaid.codex &&
            state.unsaid.codex.mentionCounts &&
            state.unsaid.codex.mentionCounts[thread.entity] &&
            typeof recordCodexEvidence === "function") {
          recordCodexEvidence(thread.entity, text, false);
        }
        if (typeof recordCodexCardUpdateEvidence === "function") {
          const impactedCard = findStoryCardForEntity(thread.entity);
          if (impactedCard) {
            const epoch = (typeof info !== "undefined" && info && Number.isInteger(info.actionCount))
              ? info.actionCount
              : (state.unsaid ? state.unsaid.turn : 0);
            recordCodexCardUpdateEvidence(thread.entity, impactedCard, text, epoch, 4);
          }
        }
      } catch (e) {}
    }
    if (c.pendingPayoffId) {
      const thread = c.threads.find(t => t.id === c.pendingPayoffId);
      const partner = c.pendingPayoffId2 ? c.threads.find(t => t.id === c.pendingPayoffId2) : null;
      const firstConfirmed = !!thread && confirmedTwists.has(thread.id);
      const secondConfirmed = !c.pendingPayoffId2 || (!!partner && confirmedTwists.has(partner.id));
      const confirmed = firstConfirmed && secondConfirmed;
      if (confirmed) {
        resolveThread(thread, partner ? partner.entity : null);
        resolveThread(partner, thread ? thread.entity : null);
        c.lastPayoffTurn = c.turn;
        c.lastPayoffAttemptTurn = c.turn;
        if (typeof linkTwistPayoffToReveal === "function") {
          const linkCandidates = [thread, partner].filter(Boolean);
          if (linkCandidates.length > 0) {
            const chosen = linkCandidates[Math.floor(Math.random() * linkCandidates.length)];
            linkTwistPayoffToReveal(chosen.entity, chosen.tier);
          }
        }
        c.threads = c.threads.filter(t => t.status !== "resolved");
        if (c.twistLog.length > 2000) c.twistLog = c.twistLog.slice(-2000);
      } else {
        const missed = [thread, partner].filter(Boolean);
        missed.forEach(t => {
          if (t.status !== "resolved") t.status = "ready";
          t.confirmMisses = (t.confirmMisses || 0) + 1;
        });
        const worstMiss = missed.reduce((n, t) => Math.max(n, t.confirmMisses || 0), 0);
        if (worstMiss === 2 || (worstMiss > 2 && worstMiss % 3 === 0)) {
          const names = missed.map(t => t.entity).filter(Boolean).join(" + ");
          pushMessage(`🌀 The model skipped the requested twist${names ? " for " + names : ""} ${worstMiss} times. It was NOT logged as canon and stays ready to retry.`);
        }
      }
      c.pendingPayoffId = null;
      c.pendingPayoffId2 = null;
    }
    if (c.pendingSeedId) {
      const thread = c.threads.find(t => t.id === c.pendingSeedId);
      if (thread && thread.status === "brewing") {
        if (confirmedSeeds.has(thread.id)) {
          const added = Library.rememberTwistEvidence ? Library.rememberTwistEvidence(thread, text, c, {}) : true;
          if (added) {
            thread.seedTouches = Math.min(200, Number(thread.seedTouches || 1) + 1);
            if (thread.lastEvidenceLevel !== "hypothesis") thread.storyEvidenceTouches = (thread.storyEvidenceTouches || 0) + 1;
            else thread.hypothesisTouches = (thread.hypothesisTouches || 0) + 1;
            thread.lastSeedTurn = c.turn;
            thread.tier = Library.tierFor(thread.seedTouches);
            if (Library.isEligible(thread, c, cfg)) thread.status = "ready";
          }
          thread.seedConfirmMisses = 0;
        } else {
          thread.seedConfirmMisses = (thread.seedConfirmMisses || 0) + 1;
        }
      }
      c.pendingSeedId = null;
    }
    if (hadPendingTwistWork) {
      Library.updateConfigCard(cfg, c);
      Library.updateTwistLogCard(c, cfg);
    }
  } catch (e) {
    if (typeof log === "function") log("Output/Twists error: " + (e && e.message));
  }
  return { text };
};
var unsaidModifier = (text) => {
  const originalText = text;
  let controlRequest = "";
  try {
    const cfg = readUnsaidConfig();
    controlRequest = String((state.unsaid && state.unsaid.controlRequest) || "");
    const cardOpenSource = "(?:【CARD】|〖CARD〗|\\[+\\s*CARD\\s*\\]+|<\\s*CARD\\s*>)";
    const cardCloseSource = "(?:【\\/CARD】|〖\\/CARD〗|\\[+\\s*\\/\\s*CARD\\s*\\]+|<\\s*\\/\\s*CARD\\s*>)";
    const blockPattern = new RegExp(cardOpenSource + "([\\s\\S]*?)" + cardCloseSource, "gi");
    const pendingForcedCodex = !!state.unsaid.codex.pendingForced;
    const pendingRefreshNames = new Set(
      Array.isArray(state.unsaid.codex.pendingRefreshNames)
        ? state.unsaid.codex.pendingRefreshNames
        : []
    );
    const rawExpectedNames = Array.isArray(state.unsaid.codex.pendingNames)
      ? state.unsaid.codex.pendingNames.slice()
      : [];
    const expectedNames = pendingForcedCodex
      ? rawExpectedNames
      : rawExpectedNames.filter(name => {
          if (pendingRefreshNames.has(name)) return true;
          if (isClearlyJunkCodexName(name)) return false;
          const storedEvidence = typeof codexEvidenceTextFor === "function" ? codexEvidenceTextFor(name) : "";
          return !(typeof codexOnlyAttributiveTechModifier === "function" &&
            codexOnlyAttributiveTechModifier(name, storedEvidence));
        });
    const expectedTypes = state.unsaid.codex.pendingTypes || {};
    const maxFieldLength = 420;
    function codexSafeCardTriggers(name, fields, evidence, existingKeys) {
      const values = [String(name || "").trim()];
      try {
        const canonical = typeof canonicalUnsaidName === "function" ? canonicalUnsaidName(name) : String(name || "").trim();
        const learned = state.unsaid && state.unsaid.aliases && state.unsaid.aliases[canonical];
        if (Array.isArray(learned)) learned.forEach(alias => { if(alias) values.push(String(alias).trim()); });
      } catch (_) {}
      const aliasText = fields && fields["Aliases"] ? String(fields["Aliases"]) : "";
      aliasText.split(/[,;|/]/).map(v => v.trim()).filter(Boolean).forEach(alias => {
        if (alias.length < 2 || alias.length > 60) return;
        const corroborated = (evidence && nameAppears(alias, evidence)) ||
          (existingKeys && String(existingKeys).toLowerCase().split(/[,;|]/).some(k => k.trim() === alias.toLowerCase()));
        if (!corroborated) return;
        if (typeof normalizeCodexCandidate === "function" && !normalizeCodexCandidate(alias, evidence || alias)) return;
        values.push(alias);
      });
      const out=[];
      values.forEach(v => { const k=String(v||"").trim().toLowerCase(); if(k && !out.includes(k)) out.push(k); });
      return out.slice(0,8).join(",");
    }
    const hadCodexRequest = rawExpectedNames.length > 0;
    const blockMatches = hadCodexRequest ? [...text.matchAll(blockPattern)] : [];
    const succeededNames = new Set();
    const cardWasNew = {};
    const builtTypes = {};
    function matchFieldLine(line) {
      return line.match(/^\s*(?:#{1,6}\s*|[-*•+]\s*|\d+[.)]\s*)?[*_]{0,3}\s*["'“”]?([A-Za-z][A-Za-z ]+?)["'“”]?\s*[*_]{0,3}\s*[:=]\s*[*_]{0,3}\s*(.+?)\s*[*_]{0,3}\s*$/);
    }
    function peekBlockName(blockContent) {
      let found = null;
      const lines = blockContent.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const fieldMatch = matchFieldLine(lines[i]);
        if (fieldMatch && fieldMatch[1].trim().toLowerCase() === "name") {
          found = fieldMatch[2].trim();
          break;
        }
      }
      return found;
    }
    function buildBoundedCardEntry(order, fields) {
      const entryLimit = typeof codexCardEntryLimit === "function" ? codexCardEntryLimit(cfg) : 950;
      const fieldOrder = order.filter(f => fields[f]);
      if (fieldOrder.length === 0) return "";
      const renderWithCap = (cap) => fieldOrder.map(field => {
        let value = String(fields[field] || "").trim();
        if (field !== "Name" && cap && value.length > cap) {
          value = value.slice(0, Math.max(1, cap - 1)).trimEnd() + "…";
        }
        return `${field}: ${value}`;
      }).join("\n");
      const full = renderWithCap(null);
      if (full.length <= entryLimit) return full;
      let low = 24;
      let high = maxFieldLength;
      let best = renderWithCap(low);
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = renderWithCap(mid);
        if (candidate.length <= entryLimit) {
          best = candidate;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return best.length <= entryLimit
        ? best
        : best.slice(0, entryLimit - 1).trimEnd() + "…";
    }
    function tryBuildCard(blockContent, name, upfrontType) {
      try {
        const isRefresh = pendingRefreshNames.has(name);
        let type = upfrontType || expectedTypes[name] || "character";
        const fields = {};
        const allCanonicalFields = [
          ...new Set([
            ...CHARACTER_CARD_FIELDS,
            ...LOCATION_CARD_FIELDS,
            ...ITEM_CARD_FIELDS,
            ...FACTION_CARD_FIELDS
          ])
        ];
        const fieldAliases = {
          "alias": "Aliases",
          "also known as": "Aliases",
          "aka": "Aliases",
          "nickname": "Aliases",
          "nicknames": "Aliases",
          "callsign": "Aliases",
          "call sign": "Aliases",
          "occupation": "Role",
          "job": "Role",
          "profession": "Role",
          "age / life stage": "Age",
          "life stage": "Age",
          "pronoun": "Pronouns",
          "goal": "Goals",
          "motivation": "Goals",
          "objective": "Goals",
          "team": "Affiliations",
          "organization": "Affiliations",
          "organisation": "Affiliations",
          "current location": "Location",
          "current status": "Status",
          "region / area": "Region",
          "ambience": "Atmosphere",
          "mood": "Atmosphere",
          "map / layout": "Layout",
          "notable places": "Key Locations",
          "people": "People & Factions",
          "residents": "People & Factions",
          "groups": "People & Factions",
          "features and resources": "Features & Resources",
          "resources and features": "Features & Resources",
          "dangers": "Hazards",
          "risks": "Hazards",
          "present state": "Current State",
          "routes": "Connections",
          "owner / wielder": "Owner",
          "wielder": "Owner",
          "condition / state": "Condition",
          "mission": "Purpose",
          "leader": "Leadership",
          "leaders": "Leadership",
          "membership": "Members",
          "area of control": "Territory",
          "enemies": "Rivals",
          "public reputation": "Reputation",
          "activity": "Current Activity",
          "strength": "Strength Level",
          "power": "Strength Level",
          "power level": "Strength Level",
          "combat level": "Strength Level",
          "capability": "Strength Level",
          "capability level": "Strength Level",
          "competence": "Strength Level",
          "overall capability": "Strength Level",
          "species": "Race",
          "species / nature": "Race",
          "nature": "Race",
          "bio": "Background",
          "biography": "Background",
          "backstory": "Background",
          "history": "Background",
          "traits": "Personality",
          "temperament": "Personality",
          "looks": "Appearance",
          "look": "Appearance",
          "skills": "Abilities",
          "skill": "Abilities",
          "powers": "Abilities",
          "talents": "Abilities",
          "expertise": "Abilities",
          "competencies": "Abilities",
          "resources": "Abilities",
          "flaws": "Weaknesses",
          "weak points": "Weaknesses",
          "limitations": "Weaknesses",
          "vulnerabilities": "Weaknesses",
          "constraints": "Weaknesses",
          "relations": "Relationships",
          "connections": "Relationships",
          "affiliations": "Relationships",
          "social ties": "Relationships",
          "where": "Location",
          "key places": "Key Locations",
          "history events": "Historical Events",
          "kind": "Type",
          "features": "Properties",
          "importance": "Significance",
          "role": "Significance"
        };
        function cleanFieldValue(value) {
          return String(value || "")
            .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
            .replace(/^[*_]{1,3}\s*/, "")
            .replace(/\s*[*_]{1,3}$/, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxFieldLength);
        }
        const expandedBlock = blockContent.replace(
          /\s*[|;]\s*(?=["'“”]?[A-Za-z][A-Za-z ]{1,28}["'“”]?\s*[:=])/g,
          "\n"
        );
        let lastCanonical = null;
        expandedBlock.split("\n").forEach(line => {
          const fieldMatch = matchFieldLine(line);
          if (fieldMatch) {
            const rawLabel = fieldMatch[1].trim();
            const lower = rawLabel.toLowerCase();
            const canonical = allCanonicalFields.find(f => f.toLowerCase() === lower) || fieldAliases[lower];
            if (canonical) {
              fields[canonical] = cleanFieldValue(fieldMatch[2]);
              lastCanonical = canonical;
              return;
            }
          }
          if (lastCanonical && /^\s{2,}\S/.test(line) && !/【|〖|\[\/?CARD\]|<\/?CARD>/i.test(line)) {
            fields[lastCanonical] = cleanFieldValue(`${fields[lastCanonical]} ${line.trim()}`);
          }
        });
        const modelClaimedName = fields["Name"] ? cleanFieldValue(fields["Name"]) : "";
        const comparableName = (value) => String(value || "")
          .toLowerCase()
          .replace(/[“”"'‘’.,:;!?()[\]{}]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/^(?:the|a|an)\s+/, "");
        const evidenceForType = [
          (typeof codexEvidenceTextFor === "function" ? codexEvidenceTextFor(name) : ""),
          (isRefresh && typeof codexUpdateEvidenceTextFor === "function" ? codexUpdateEvidenceTextFor(name, false) : ""),
          (isRefresh && findStoryCardForEntity(name) ? findStoryCardForEntity(name).entry : ""),
          blockContent
        ].filter(Boolean).join(" ");
        if (!pendingForcedCodex && !isRefresh &&
            typeof codexOnlyAttributiveTechModifier === "function" &&
            codexOnlyAttributiveTechModifier(name, evidenceForType)) {
          return false;
        }
        const upstreamExpectedKind = upfrontType || expectedTypes[name] || null;
        const reconciledExpectedKind =
          (typeof reconcileCodexEntityType === "function" ? reconcileCodexEntityType(name, evidenceForType) : null) ||
          (typeof resolveCodexEntityType === "function" ? resolveCodexEntityType(name, evidenceForType) : null);
        const expectedKind = reconciledExpectedKind || upstreamExpectedKind || "character";
        type = expectedKind;
        const upstreamNonCharacterLock = upstreamExpectedKind && upstreamExpectedKind !== "character"
          ? upstreamExpectedKind
          : null;
        const exactNameMatch = modelClaimedName &&
          comparableName(modelClaimedName) === comparableName(name);
        const safeCharacterAliasMatch = expectedKind === "character" &&
          modelClaimedName && isSameCardEntity(name, modelClaimedName);
        if (!pendingForcedCodex) {
          if (!modelClaimedName) return false;
          if (!exactNameMatch && !safeCharacterAliasMatch) return false;
        } else if (modelClaimedName && !exactNameMatch && !safeCharacterAliasMatch) {
          return false;
        }
        fields["Name"] = name;
        const characterFieldCount = ["Role", "Race", "Age", "Pronouns", "Strength Level", "Personality", "Background", "Appearance", "Abilities", "Weaknesses", "Goals", "Relationships", "Affiliations", "Status"].filter(f => fields[f]).length;
        const locationFieldCount = ["Region", "Atmosphere", "Layout", "Key Locations", "People & Factions", "Features & Resources", "Hazards", "Historical Events", "Current State", "Connections"].filter(f => fields[f]).length;
        const itemFieldCount = ["Appearance", "Properties", "Abilities", "Limitations", "Origin", "Owner", "Condition", "History"].filter(f => fields[f]).length;
        const factionShapeScore = ["Purpose", "Leadership", "Members", "Territory", "Resources", "Allies", "Rivals", "Reputation", "Current Activity", "History"].filter(f => fields[f]).length;
        const personSignal = /\b(girl|boy|woman|man|person|lady|gentlemen|gentleman|teenager|teens?|child|kids?|elderly|toddler|infant|maiden|youth|android|robot|synthetic|alien|spirit|ghost|sapient|sentient|human|elf|dwarf|orc|fae|vampire|werewolf)\b|\byears?[\s-]old\b/i;
        const attributionPattern = /\b(?:led|founded|formed|created|ruled|run|owned|operated|guarded|watched over|managed|built|established)\s+by\s+[^.!?]*/gi;
        const readsLikeAPerson = [fields["Description"], fields["Background"], fields["Personality"], fields["Appearance"], fields["Race"]]
          .some(value => value && personSignal.test(value.replace(attributionPattern, "")));
        const placeKindSignal = /\b(?:settlement|village|town|city|hamlet|place|location|district|region|kingdom|realm|country|nation|province|colony|outpost|tavern|inn|hotel|castle|fortress|temple|school|campus|station|port|harbou?r|forest|woods|island|mountain|valley|building|neighbou?rhood|suburb|farm|ranch|arena|stadium|hospital|clinic)\b/i;
        const itemKindSignal = /\b(?:item|object|artifact|relic|device|weapon|tool|sword|blade|gun|rifle|pistol|staff|wand|amulet|ring|key|book|ship|vehicle|car|truck|robot|mech|phone|computer|document|map|medicine|dish|drink|recipe)\b/i;
        const factionKindSignal = /\b(?:faction|organization|organisation|guild|order|company|corporation|agency|group|gang|cult|society|team|club|league|union|association|government|department|business|restaurant|brand|band|crew|fleet)\b/i;
        const raceLooksLikePlace = !!fields["Race"] && placeKindSignal.test(fields["Race"]);
        const typeLooksLikePlace = !!fields["Type"] && placeKindSignal.test(fields["Type"]);
        const typeLooksLikeItem = !!fields["Type"] && itemKindSignal.test(fields["Type"]);
        const typeLooksLikeFaction = !!fields["Type"] && factionKindSignal.test(fields["Type"]);
        const descriptionLooksLikePlace = [fields["Description"], fields["Background"], fields["Appearance"]]
          .some(value => value && (
            /^\s*(?:a|an|the)?\s*(?:remote|small|large|ancient|old|modern|isolated|coastal|mountain|rural|urban|walled|hidden|quiet|grim|prosperous|ruined|abandoned|sprawling|clustered|cluster of|collection of)?\s*(?:settlement|village|town|city|hamlet|district|region|kingdom|realm|colony|outpost|tavern|inn|forest|woods|island|station|port|building)\b/i.test(value) ||
            /\b(?:cluster|collection)\s+of\s+[^.!?]{0,60}\b(?:buildings?|houses?|structures?)\b/i.test(value)
          ));
        const nameLocationHint = (CODEX_LOCATION_HINTS.test(name) || CODEX_LOCATION_SUFFIX_HINTS.test(name)) ? 1 : 0;
        const nameItemHint = CODEX_ITEM_HINTS.test(name) ? 1 : 0;
        const nameFactionHint = CODEX_FACTION_HINTS.test(name) ? 1 : 0;
        const scores = {
          character: characterFieldCount + (readsLikeAPerson ? 2 : 0) - (raceLooksLikePlace ? 6 : 0),
          location: locationFieldCount + nameLocationHint + (raceLooksLikePlace ? 6 : 0) + (typeLooksLikePlace ? 4 : 0) + (descriptionLooksLikePlace ? 3 : 0),
          item: itemFieldCount + nameItemHint + (typeLooksLikeItem ? 4 : 0),
          faction: factionShapeScore + nameFactionHint + (typeLooksLikeFaction ? 4 : 0)
        };
        const externalEvidence = [
          (typeof codexEvidenceTextFor === "function" ? codexEvidenceTextFor(name) : ""),
          (isRefresh && typeof codexUpdateEvidenceTextFor === "function" ? codexUpdateEvidenceTextFor(name, false) : "")
        ].filter(Boolean).join(" ");
        const explicitPersonLock = typeof explicitCodexCharacterCue === "function" &&
          explicitCodexCharacterCue(name, externalEvidence);
        const strongExternalNonCharacter = typeof strongCodexNonCharacterEvidence === "function"
          ? strongCodexNonCharacterEvidence(name, externalEvidence)
          : null;
        if (explicitPersonLock) {
          type = "character";
        } else if (strongExternalNonCharacter) {
          type = strongExternalNonCharacter.type;
        } else if (upstreamNonCharacterLock) {
          type = upstreamNonCharacterLock;
        } else {
          const best = Object.keys(scores).reduce((a, b) => (scores[b] > scores[a] ? b : a));
          if (scores[best] > 0) type = best;
        }
        const requiredOrder = CARD_TEMPLATES[type] || CHARACTER_CARD_FIELDS;
        const placeholderValue = (value) => {
          if (!value || !value.trim()) return true;
          const v = value.trim();
          return /^(?:\.{2,}|\?|[-—]+|unknown|not known|not yet known|unspecified|unclear|n\/?a|tbd|none|none given|not specified|<[^>]+>|\[[^\]]+\])$/i.test(v);
        };
        const existingMatches = typeof storyCardMatchesForEntity === "function"
          ? storyCardMatchesForEntity(name)
          : [];
        const compatibleMatches = typeof codexCardIdentityCompatible === "function"
          ? existingMatches.filter(c => codexCardIdentityCompatible(c, name, type))
          : existingMatches;
        if (compatibleMatches.length > 1) return false;
        let card = compatibleMatches.length === 1
          ? compatibleMatches[0]
          : findStoryCardForEntity(name);
        if (card && typeof codexCardIdentityCompatible === "function" && !codexCardIdentityCompatible(card, name, type)) card = null;
        if (card && (isRefresh || pendingForcedCodex) && card.entry) {
          String(card.entry).split("\n").forEach(line => {
            const oldMatch = matchFieldLine(line);
            if (!oldMatch) return;
            const rawLabel = oldMatch[1].trim();
            const lower = rawLabel.toLowerCase();
            const canonical = allCanonicalFields.find(f => f.toLowerCase() === lower) || fieldAliases[lower];
            if (!canonical || canonical === "Name") return;
            if (!fields[canonical] || placeholderValue(fields[canonical])) {
              const preserved = cleanFieldValue(oldMatch[2]);
              if (preserved && !placeholderValue(preserved)) fields[canonical] = preserved;
            }
          });
        }
        const usefulFields = requiredOrder.filter(f => f !== "Name" && !placeholderValue(fields[f]));
        const minimumUseful = type === "character" ? 4 : 3;
        const anchorFields = type === "character"
          ? ["Background", "Personality", "Relationships", "Appearance", "Role", "Status"]
          : type === "location"
            ? ["Description", "Current State", "Region", "Significance"]
            : type === "item"
              ? ["Type", "Description", "Properties", "Condition", "Significance"]
              : ["Type", "Description", "Purpose", "Current Activity", "Significance"];
        const hasAnchor = anchorFields.some(f => !placeholderValue(fields[f]));
        if (!card && (usefulFields.length < minimumUseful || !hasAnchor)) return false;
        if (card && (isRefresh || pendingForcedCodex) && usefulFields.length < 1) return false;
        const isNewCard = !card;
        if (isNewCard) {
          card = createOrFindCard(name.toLowerCase(), " ", platformType(type), name);
          if (!card) return false;
        }
        if (isRefresh && !isNewCard &&
            typeof codexCardHasManualEdit === "function" &&
            codexCardHasManualEdit(name, card, cfg)) {
          return false;
        }
        const rawExistingType = String(card.type || "").trim().toLowerCase();
        const standardExistingType = /^(?:character|location|item|faction)$/.test(rawExistingType);
        let finalType = card.type;
        if (isNewCard || !card.type || !card.type.trim() ||
            ((isRefresh || pendingForcedCodex) && standardExistingType)) {
          finalType = platformType(type);
        }
        const order = CARD_TEMPLATES[type] || CHARACTER_CARD_FIELDS;
        const builtEntry = buildBoundedCardEntry(order, fields);
        const finalEntry = (isNewCard || !card.entry || !card.entry.trim() || isRefresh || pendingForcedCodex)
          ? builtEntry
          : card.entry;
        const triggerEvidence = [externalEvidence, evidenceForType].filter(Boolean).join(" ");
        const safeTriggers = codexSafeCardTriggers(name, fields, triggerEvidence, card.keys || "");
        const finalKeys = (isNewCard || !card.keys || !String(card.keys).trim() || /^\s*[^,;|]+\s*$/.test(String(card.keys)))
          ? (safeTriggers || name.toLowerCase())
          : card.keys;
        if (typeof codexCommitStoryCard === "function") {
          if (!codexCommitStoryCard(card, finalKeys, finalEntry, finalType || platformType(type), name, card.description || card.notes)) return false;
        } else {
          if (!CE_updateStoryCardCompat(card, finalKeys, finalEntry, finalType || platformType(type), name, card.description || card.notes).ok) return false;
        }
        cardWasNew[name] = isNewCard;
        builtTypes[name] = type;
        succeededNames.add(name);
        try {
          const { c: tc, cfg: tcfg } = Library.initState();
          const bridgeEvidence = (typeof codexEvidenceTextFor === "function")
            ? codexEvidenceTextFor(name)
            : "";
          if (bridgeEvidence && Library.bridgeCodexEvidenceToTwists) {
            Library.bridgeCodexEvidenceToTwists(tc, tcfg, name, type, bridgeEvidence);
          }
        } catch (e) {}
        if (typeof markCodexCardGenerated === "function") {
          markCodexCardGenerated(name, type, builtEntry, isRefresh || (!isNewCard && pendingForcedCodex));
        }
        logCodexCard(
          name,
          type,
          state.unsaid.codex.mentionCounts[name] || 0,
          isRefresh || (!isNewCard && pendingForcedCodex)
        );
        forgetMentionTracking(name);
        if (type === "character") {
          const excluded = excludedNames(cfg);
          const shouldJoinUnsaid = !excluded.some(ex => isSameCardEntity(ex, name));
          if (shouldJoinUnsaid) {
            if (!Array.isArray(state.unsaid.castRegistry)) state.unsaid.castRegistry = [];
            if (!state.unsaid.castRegistry.some(existing => isSameCardEntity(existing, name))) {
              state.unsaid.castRegistry.push(name);
              if (state.unsaid.castRegistry.length > MAX_CAST_SIZE) {
                state.unsaid.castRegistry = state.unsaid.castRegistry.slice(-MAX_CAST_SIZE);
              }
            }
            syncMindToCard(name, cfg.allowCoreShift, cfg.jsonNotes);
            if (typeof CE_syncCharacterCard === "function") CE_syncCharacterCard(name);
          }
        } else if (typeof CE_syncCharacterCard === "function") {
          CE_syncCharacterCard(name);
        }
        return true;
      } catch (e) {
        return false;
      }
    }
    function createEvidenceFallbackCard(name, upfrontType) {
      try {
        if (!name || pendingRefreshNames.has(name)) return false;
        const matches = typeof storyCardMatchesForEntity === "function"
          ? storyCardMatchesForEntity(name)
          : [];
        const compatible = typeof codexCardIdentityCompatible === "function"
          ? matches.filter(c => codexCardIdentityCompatible(c,name,""))
          : matches;
        if (compatible.length > 1) return false;
        const existing = compatible.length === 1 ? compatible[0] : null;
        if (existing) return false;
        const evidenceSource = [
          typeof codexEvidenceTextFor === "function" ? codexEvidenceTextFor(name) : "",
          String(text || "")
        ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        if (evidenceSource.length < 50) return false;
        const aliases = typeof aliasesForUnsaidCharacter === "function"
          ? aliasesForUnsaidCharacter(name)
          : [name];
        const sentences = evidenceSource
          .replace(/([.!?])\s+/g, "$1\n")
          .split("\n")
          .map(v => v.trim())
          .filter(Boolean);
        const mentionsName = sentence => aliases.some(alias => nameAppears(alias, sentence));
        let picked = sentences.filter(mentionsName).slice(-3);
        if (!picked.length) return false;
        let evidence = picked.join(" ").replace(/\[[\s\S]*?\]/g, " ").replace(/\s+/g, " ").trim();
        if (evidence.length > 620) evidence = evidence.slice(0, 617).trimEnd() + "…";
        if (evidence.length < 35) return false;
        const type = (typeof reconcileCodexEntityType === "function" ? reconcileCodexEntityType(name, evidenceSource) : null) ||
          (typeof resolveCodexEntityType === "function" ? resolveCodexEntityType(name, evidenceSource) : null) ||
          upfrontType || "character";
        if (!pendingForcedCodex) {
          if (cfg.codexEvidenceRescue === false) return false;
          const strongScore = state.unsaid.codex.strongScores && state.unsaid.codex.strongScores[name] || 0;
          const likelyCharacter = !!(state.unsaid.codex.likelyCharacters && state.unsaid.codex.likelyCharacters[name]);
          const trustedType = state.unsaid.codex.trustedEntities && state.unsaid.codex.trustedEntities[name];
          const explicit = typeof hasExplicitCodexNamingCue === "function" && hasExplicitCodexNamingCue(name, evidenceSource);
          const typedReason = state.unsaid.codex.strongReasons && state.unsaid.codex.strongReasons[name] || [];
          const safeNonCharacter = type !== "character" && trustedType === type &&
            (explicit || typedReason.indexOf("typed-" + type) >= 0) && strongScore >= CODEX_FAST_TRACK_NONCHAR_SCORE;
          if (type === "character" && !likelyCharacter) return false;
          if (type !== "character" && !safeNonCharacter) return false;
        }
        let entry;
        const compactEvidence = evidence.length > 360 ? evidence.slice(0, 357).trimEnd() + "…" : evidence;
        if (type === "character") {
          entry = `Name: ${name}\nBackground: ${compactEvidence}\nStatus: Established character currently supported by story evidence.`;
        } else if (type === "location") {
          entry = `Name: ${name}\nDescription: ${compactEvidence}\nCurrent State: Established location supported by story evidence.`;
        } else if (type === "item") {
          entry = `Name: ${name}\nType: Item\nDescription: ${compactEvidence}\nCondition: Established item supported by story evidence.`;
        } else {
          entry = `Name: ${name}\nType: Faction\nDescription: ${compactEvidence}\nPurpose: Established group supported by story evidence.`;
        }
        const fallbackLimit = typeof codexCardEntryLimit === "function" ? codexCardEntryLimit(cfg) : 950;
        if (entry.length > fallbackLimit) entry = entry.slice(0, fallbackLimit - 1).trimEnd() + "…";
        const card = createOrFindCard(name.toLowerCase(), entry, platformType(type), name);
        if (!card) return false;
        if (typeof codexCommitStoryCard === "function") {
          if (!codexCommitStoryCard(card, name.toLowerCase(), entry, platformType(type), name, card.description || card.notes)) return false;
        } else {
          if (!CE_updateStoryCardCompat(card, name.toLowerCase(), entry, platformType(type), name, card.description || card.notes).ok) return false;
        }
        cardWasNew[name] = true;
        builtTypes[name] = type;
        succeededNames.add(name);
        if (typeof markCodexCardGenerated === "function") markCodexCardGenerated(name, type, entry, false);
        logCodexCard(name, type, state.unsaid.codex.mentionCounts[name] || 0, false);
        forgetMentionTracking(name);
        if (type === "character") {
          const excluded = excludedNames(cfg);
          if (!excluded.some(ex => isSameCardEntity(ex, name))) {
            if (!Array.isArray(state.unsaid.castRegistry)) state.unsaid.castRegistry = [];
            if (!state.unsaid.castRegistry.some(existingName => isSameCardEntity(existingName, name))) {
              state.unsaid.castRegistry.push(name);
              if (state.unsaid.castRegistry.length > MAX_CAST_SIZE) state.unsaid.castRegistry = state.unsaid.castRegistry.slice(-MAX_CAST_SIZE);
            }
            syncMindToCard(name, cfg.allowCoreShift, cfg.jsonNotes);
            if (typeof CE_syncCharacterCard === "function") CE_syncCharacterCard(name);
          }
        } else if (typeof CE_syncCharacterCard === "function") {
          CE_syncCharacterCard(name);
        }
        return true;
      } catch (e) {
        return false;
      }
    }
    const remainingExpected = expectedNames.slice();
    function claimBlockName(blockContent) {
      const claimed = peekBlockName(blockContent);
      if (claimed) {
        const idx = remainingExpected.findIndex(n =>
          n.toLowerCase() === claimed.toLowerCase() || isSameCardEntity(n, claimed)
        );
        if (idx === -1) return null;
        return remainingExpected.splice(idx, 1)[0];
      }
      return remainingExpected.shift() || null;
    }
    blockMatches.forEach((match) => {
      const name = claimBlockName(match[1]);
      if (!name) return;
      tryBuildCard(match[1], name, expectedTypes[name]);
    });
    if (blockMatches.length > 0) {
      text = text.replace(blockPattern, "").replace(/\n{3,}/g, "\n\n");
    }
    const remainingOpenPattern = new RegExp(cardOpenSource + "([\\s\\S]*)$", "i");
    const remainingOpenMatch = hadCodexRequest ? text.match(remainingOpenPattern) : null;
    if (remainingOpenMatch) {
      const nextName = claimBlockName(remainingOpenMatch[1]);
      if (nextName && !succeededNames.has(nextName)) {
        tryBuildCard(remainingOpenMatch[1], nextName, expectedTypes[nextName]);
      }
      text = text.replace(remainingOpenPattern, "").replace(/\n{3,}/g, "\n\n").trimEnd();
    }
    expectedNames.forEach(name => {
      if (succeededNames.has(name) || pendingRefreshNames.has(name)) return;
      const attempts = (state.unsaid.codex.attempts && state.unsaid.codex.attempts[name]) || 0;
      const likelyCharacter = !!(state.unsaid.codex.likelyCharacters && state.unsaid.codex.likelyCharacters[name]);
      const strongScore = state.unsaid.codex.strongScores && state.unsaid.codex.strongScores[name] || 0;
      const reasons = state.unsaid.codex.strongReasons && state.unsaid.codex.strongReasons[name] || [];
      const upfrontType = expectedTypes[name] || state.unsaid.codex.observedTypes[name] || "character";
      const trustedType = state.unsaid.codex.trustedEntities && state.unsaid.codex.trustedEntities[name];
      const strongCharacter = likelyCharacter && strongScore >= CODEX_FAST_TRACK_CHARACTER_SCORE;
      const strongNonCharacter = upfrontType !== "character" && trustedType === upfrontType &&
        strongScore >= CODEX_FAST_TRACK_NONCHAR_SCORE &&
        (reasons.indexOf("typed-" + upfrontType) >= 0 || reasons.some(r=>/^explicit-input-/.test(r)));
      const rescueAt = (strongCharacter || strongNonCharacter) ? 1 : 2;
      if (pendingForcedCodex || ((likelyCharacter || strongNonCharacter) && attempts >= rescueAt)) {
        createEvidenceFallbackCard(name, upfrontType);
      }
    });
    if (expectedNames.length > 0) {
      text = text.replace(/^\s*[*_]{2,}\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trimEnd();
    }
    const messageParts = [];
    if (succeededNames.size > 0) {
      const names = [...succeededNames];
      const refreshed = names.filter(n => pendingRefreshNames.has(n) || (!cardWasNew[n] && pendingForcedCodex));
      const created = names.filter(n => cardWasNew[n]);
      if (names.length === 1) {
        const n = names[0];
        if (cardWasNew[n]) {
          messageParts.push(`📇 Codex created a ${builtTypes[n] || expectedTypes[n] || "Story"} card for ${n}.`);
        } else if (pendingRefreshNames.has(n)) {
          messageParts.push(`📇 Codex refreshed ${n}'s Story Card from newer story evidence.`);
        } else if (pendingForcedCodex) {
          messageParts.push(`📇 Codex refreshed ${n}'s Story Card by request.`);
        } else {
          messageParts.push(`📇 Codex matched ${n}'s existing Story Card.`);
        }
      } else {
        if (created.length > 0) messageParts.push(`📇 Codex created ${created.length} card(s): ${created.join(", ")}.`);
        if (refreshed.length > 0) messageParts.push(`📇 Codex refreshed ${refreshed.length} card(s): ${refreshed.join(", ")}.`);
      }
    }
    const failureTrackedNames = expectedNames.filter(name => !pendingRefreshNames.has(name));
    const exhausted = failureTrackedNames.filter(name => {
      if (succeededNames.has(name)) return false;
      if (state.unsaid.codex.likelyCharacters && state.unsaid.codex.likelyCharacters[name]) return false;
      return (state.unsaid.codex.attempts[name] || 0) >= cfg.codexMaxAttempts;
    });
    const characterRetryMilestone = failureTrackedNames.filter(name =>
      !succeededNames.has(name) &&
      state.unsaid.codex.likelyCharacters &&
      state.unsaid.codex.likelyCharacters[name] &&
      (state.unsaid.codex.attempts[name] || 0) === cfg.codexMaxAttempts
    );
    if (!state.unsaid.codex.consecutiveFailedNames) state.unsaid.codex.consecutiveFailedNames = [];
    if (failureTrackedNames.length > 0 && succeededNames.size === 0) {
      failureTrackedNames.forEach(n => {
        if (!state.unsaid.codex.consecutiveFailedNames.includes(n)) {
          state.unsaid.codex.consecutiveFailedNames.push(n);
        }
      });
      if (state.unsaid.codex.consecutiveFailedNames.length > 10) {
        state.unsaid.codex.consecutiveFailedNames = state.unsaid.codex.consecutiveFailedNames.slice(-10);
      }
    } else if (succeededNames.size > 0) {
      state.unsaid.codex.consecutiveFailedNames = [];
    }
    pendingRefreshNames.forEach(name => {
      if (succeededNames.has(name)) return;
      const refreshCard = findStoryCardForEntity(name);
      const key = (typeof codexManagedCardKey === "function")
        ? codexManagedCardKey(name, refreshCard)
        : name;
      const meta = state.unsaid.codex.cardMeta && state.unsaid.codex.cardMeta[key];
      if (meta) {
        meta.refreshFailures = (meta.refreshFailures || 0) + 1;
        meta.lastRefreshAttemptTurn = state.unsaid.turn;
      }
    });
    const strugglingCount = state.unsaid.codex.consecutiveFailedNames.length;
    if (succeededNames.size > 0) {
      state.unsaid.codex.globalMissStreak = 0;
      state.unsaid.codex.autoPauseUntil = 0;
    } else if (failureTrackedNames.length > 0 && !pendingForcedCodex) {
      const streak = Math.min(8, (state.unsaid.codex.globalMissStreak || 0) + 1);
      state.unsaid.codex.globalMissStreak = streak;
      if (streak >= 3) {
        const delay = Math.min(20, 4 + (streak - 3) * 4);
        state.unsaid.codex.autoPauseUntil = Math.max(
          state.unsaid.codex.autoPauseUntil || 0,
          state.unsaid.turn + delay
        );
      }
    }
    if (pendingForcedCodex && failureTrackedNames.length > 0 && succeededNames.size === 0) {
      const n = failureTrackedNames[0];
      const rawExisting = findStoryCardForEntity(n);
      const existing = rawExisting && codexCardIdentityCompatible(rawExisting, n, "") ? rawExisting : null;
      messageParts.push(existing
        ? `📇 Codex couldn't produce a usable refresh for ${n} this turn, so the existing Story Card was left untouched.`
        : `📇 Codex couldn't produce a safe usable card for ${n} this turn. Nothing was invented or saved; try /card ${n} again after more story evidence exists.`);
    }
    if (messageParts.length > 0) pushMessage(messageParts.join(" "));
    state.unsaid.codex.pendingNames = [];
    state.unsaid.codex.pendingTypes = {};
    state.unsaid.codex.pendingForced = false;
    state.unsaid.codex.pendingRefreshNames = [];
    const codexAtHardCapacity = (typeof CE_storyCardCount === "function" ? CE_storyCardCount() : ((typeof storyCards!=="undefined"&&Array.isArray(storyCards))?storyCards.length:0)) >= 5000;
    if (!codexAtHardCapacity) {
      // Large-library Input defers ordinary mention accumulation so explicit scaffolding
      // gets the Input hook's memory budget. Consume that user-authored evidence here,
      // preserving its original non-confirming semantics before observing AI output.
      var deferredInputEvidence = state.unsaid && state.unsaid.codex ? String(state.unsaid.codex.deferredInputEvidence || "") : "";
      if (deferredInputEvidence) {
        try {
          if (typeof trackMentionsMemorySafe === "function" && typeof codexUseMemorySafeTracking === "function" && codexUseMemorySafeTracking())
            trackMentionsMemorySafe(deferredInputEvidence, false, cfg);
          else if (typeof trackMentions === "function") trackMentions(deferredInputEvidence, false, cfg);
        } catch (e) { if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Output/Codex-deferred-input", e); }
        state.unsaid.codex.deferredInputEvidence = "";
        state.unsaid.codex.deferredInputTurn = null;
      }
      if (typeof trackMentions === "function") {
        if (typeof CE_runTurnFeature === "function") CE_runTurnFeature("codex", "output", function(){ trackMentions(text, true, cfg); }, null, true);
        else trackMentions(text, true, cfg);
      }
      if (typeof codexPurgeManagedFalsePositiveCards === "function") {
        const cleanedJunkCards = codexPurgeManagedFalsePositiveCards(cfg, 8);
        if (cleanedJunkCards && cleanedJunkCards.length && typeof pushMessage === "function") {
          pushMessage("📇 CODEX removed false-positive Story Card" + (cleanedJunkCards.length === 1 ? "" : "s") + ": " + cleanedJunkCards.join(", ") + ".");
        }
      }
    }
    if (!codexAtHardCapacity && !controlRequest && cfg.codexEnabled && cfg.codexDirectScaffold !== false &&
        typeof createCodexDirectScaffoldFromOutput === "function") {
      const directScaffold = createCodexDirectScaffoldFromOutput(text, cfg);
      if (directScaffold && typeof pushMessage === "function") {
        pushMessage("📇 CODEX created a provisional " + String(directScaffold.type || "Story") + " card for " + String(directScaffold.name || "the new entity") + ". It will enrich itself as new evidence appears.");
      }
    }
    const revealWasRequested = !!state.unsaid.pending;
    const revealWasForced = !!state.unsaid.pendingRevealForced;
    const revealWasCoreCheck = !!state.unsaid.pendingCoreCheck;
    if (state.unsaid.pending) {
      const name = state.unsaid.pending;
      const revealAliases = (typeof aliasesForUnsaidCharacter === "function"
        ? aliasesForUnsaidCharacter(name)
        : [name])
        .filter(Boolean)
        .sort((a, b) => String(b).length - String(a).length);
      const revealNameSource = `(?:${revealAliases.map(v => escapeForRegex(v)).join("|") || escapeForRegex(name)})`;
      const strictPattern = new RegExp(
        `《${revealNameSource},\\s*([a-zA-Z][a-zA-Z-]*)(?:,\\s*(about\\s+[^:》]+|core-shift))?:\\s*([^》]*)》`,
        "i"
      );
      const asciiPattern = /(?:\[\[?|<)\s*UNSAID\s*\|\s*([^|\]\r\n>]+)\s*\|\s*([a-zA-Z][a-zA-Z-]*)\s*\|\s*(?:(core-shift|about\s*(?:=|:)?\s*[^|\]\r\n>]+)\s*\|\s*)?([\s\S]*?)\s*(?:\]\]?|>)/i;
      let matchedPattern = strictPattern;
      let thoughtMatch = null;
      let feeling, modifier2, thought, usedFallback = false;
      const asciiMatch = text.match(asciiPattern);
      if (asciiMatch) {
        const markerName = String(asciiMatch[1] || "").trim();
        const normalizeMarkerName = value => {
          if (typeof normalizeUnsaidIdentity === "function") return normalizeUnsaidIdentity(value);
          return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        };
        const markerKey = normalizeMarkerName(markerName);
        const markerMatchesExpected = revealAliases.some(alias => normalizeMarkerName(alias) === markerKey);
        if (markerMatchesExpected) {
          matchedPattern = asciiPattern;
          thoughtMatch = asciiMatch;
          feeling = String(asciiMatch[2] || "").trim().toLowerCase();
          if (feeling === "feeling" || feeling === "emotion" || feeling === "thought") feeling = null;
          const rawModifier = String(asciiMatch[3] || "").trim();
          if (/^core-shift$/i.test(rawModifier)) modifier2 = "core-shift";
          else if (/^about\b/i.test(rawModifier)) modifier2 = "about " + rawModifier.replace(/^about\s*(?:=|:)?\s*/i, "").trim();
          else modifier2 = null;
          thought = String(asciiMatch[4] || "").trim();
        }
      }
      if (!thoughtMatch) {
        const legacyMatch = text.match(strictPattern);
        if (legacyMatch) {
          thoughtMatch = legacyMatch;
          feeling = legacyMatch[1].trim().toLowerCase();
          if (feeling === "feeling" || feeling === "emotion" || feeling === "thought") feeling = null;
          modifier2 = legacyMatch[2] ? legacyMatch[2].trim() : null;
          thought = legacyMatch[3].trim();
        } else {
          const loosePattern = new RegExp(`《${revealNameSource},\\s*([^》]+)》`, "i");
          const looseMatch = text.match(loosePattern);
          if (looseMatch) {
            matchedPattern = loosePattern;
            thought = looseMatch[1].trim().replace(/^feeling\s+/i, "");
            usedFallback = true;
          } else {
            const barePattern = new RegExp(
              `(^|\\n)\\s*${revealNameSource},\\s*([a-zA-Z][a-zA-Z-]*)(?:,\\s*(about\\s+[^:\\n]+|core-shift))?:\\s*([^\\n]+)`,
              "i"
            );
            const bareMatch = text.match(barePattern);
            if (bareMatch) {
              const matchedText = bareMatch[0].replace(/^\n/, "");
              matchedPattern = new RegExp(escapeForRegex(matchedText));
              feeling = bareMatch[2].trim().toLowerCase();
              if (feeling === "feeling" || feeling === "emotion" || feeling === "thought") feeling = null;
              modifier2 = bareMatch[3] ? bareMatch[3].trim() : null;
              thought = bareMatch[4].trim();
              usedFallback = true;
            }
          }
        }
      }
      if (!thoughtMatch && !usedFallback && text.indexOf("《") !== -1) {
        text = text.replace(/《[\s\S]*$/, "").replace(/\n{3,}/g, "\n\n").trimEnd();
      }
      if (!thoughtMatch && !usedFallback && /(?:\[\[?|<)\s*UNSAID\b/i.test(text)) {
        text = text.replace(/(?:\[\[?|<)\s*UNSAID[\s\S]*$/i, "").replace(/\n{3,}/g, "\n\n").trimEnd();
      }
      if (thoughtMatch || (usedFallback && thought)) {
        if (!feeling) {
          const existingMind = state.unsaid.minds[name];
          feeling = (existingMind && existingMind.feeling) || "conflicted";
        }
        let isCoreShift = modifier2 && /^core-shift$/i.test(modifier2);
        let about = modifier2 && !isCoreShift ? modifier2.replace(/^about\s+/i, "").trim() : null;
        if (!isCoreShift && usedFallback && /^core-shift\s*[:,]?\s*/i.test(thought)) {
          isCoreShift = true;
          thought = thought.replace(/^core-shift\s*[:,]?\s*/i, "");
        }
        const coreShiftAuthorized = !!state.unsaid.pendingCoreShiftAllowed && !!cfg.allowCoreShift;
        if (isCoreShift && !coreShiftAuthorized) {
          isCoreShift = false;
          about = null;
        }
        if (!isCoreShift && about && typeof resolveUnsaidRelationTarget === "function") {
          about = resolveUnsaidRelationTarget(name, about, cfg);
        }
        const { wantSentence } = splitThoughtSentences(thought);
        const revealMatch = matchedPattern.exec(text);
        if (revealMatch) {
          const start = revealMatch.index;
          const end = start + revealMatch[0].length;
          const before = text.slice(0, start).replace(/\*+\s*$/, "");
          const after = text.slice(end).replace(/^\s*\*+/, "");
          const replacement = cfg.showThoughtsInStory ? `*${thought}*` : "";
          text = (before + replacement + after).replace(/\n{3,}/g, "\n\n").trimEnd();
        }
        seedMindIfKnown(name);
        if (!state.unsaid.minds[name]) state.unsaid.minds[name] = createMind();
        const mind = state.unsaid.minds[name];
        const previousFeeling = mind.feeling;
        const normalizeThought = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
        const exactRepeat = !!mind.lastThoughtText && normalizeThought(thought) === normalizeThought(mind.lastThoughtText);
        const isStaleRepeat = exactRepeat ||
          (typeof isNearRepeatThought === "function" && isNearRepeatThought(mind, thought));
        let justShifted = false;
        if (!isStaleRepeat && isCoreShift && cfg.allowCoreShift && thought && thought !== mind.core) {
          if (!mind.coreHistory) mind.coreHistory = [];
          if (mind.core) pushCapped(mind.coreHistory, mind.core, 2);
          mind.core = thought;
          mind.coreSetTurn = state.unsaid.turn;
          mind.tensionLevel = 0;
          justShifted = true;
          try {
            const { c: tc, cfg: tcfg } = Library.initState();
            Library.reinforceFromCoreShift(tc, tcfg, name);
          } catch (e) {}
        } else if (!mind.core && !about) {
          mind.core = thought;
          mind.coreSetTurn = state.unsaid.turn;
        }
        mind.feeling = feeling;
        if (wantSentence && !isStaleRepeat) mind.want = wantSentence;
        mind.lastTurn = state.unsaid.turn;
        if (!isStaleRepeat) {
          mind.lastThoughtText = thought;
          if (typeof recordThoughtHistory === "function") recordThoughtHistory(mind, thought);
          mind.revealCount = (mind.revealCount || 0) + 1;
          if (!mind.feelingHistory) mind.feelingHistory = [];
          pushCapped(mind.feelingHistory, feeling, FEELING_HISTORY_LIMIT);
        }
        let tensionJustCrossed = false;
        if (!justShifted && !isStaleRepeat) {
          if (typeof mind.tensionLevel !== "number") mind.tensionLevel = 0;
          const wasBelowThreshold = mind.tensionLevel < TENSION_THRESHOLD;
          const tensionCap = TENSION_THRESHOLD * DRASTIC_TENSION_MULTIPLIER;
          if (previousFeeling && previousFeeling !== feeling) {
            mind.tensionLevel = Math.min(tensionCap, mind.tensionLevel + 1);
          } else if (previousFeeling === feeling) {
            mind.tensionLevel = Math.max(0, mind.tensionLevel - 1);
          }
          tensionJustCrossed = cfg.allowCoreShift && wasBelowThreshold && mind.tensionLevel >= TENSION_THRESHOLD;
        }
        if (about) {
          recordRelation(name, about, feeling);
        }
        if (!isStaleRepeat && typeof rememberAdaptiveThought === "function") {
          rememberAdaptiveThought(mind, thought, about, isCoreShift, feeling, cfg);
          const reflectionInterval = Math.max(2, Math.min(20, Number(cfg.adaptiveReflectionInterval) || 4));
          if (cfg.adaptiveMindEnabled !== false && mind.revealCount > 0 && mind.revealCount % reflectionInterval === 0) {
            mind.lastReflectionTurn = state.unsaid.turn;
          }
        }
        if (!isStaleRepeat) {
          try {
            const { c: tc, cfg: tcfg } = Library.initState();
            if (Library.absorbUnsaidSignal) {
              Library.absorbUnsaidSignal(tc, tcfg, name, mind, thought, about);
            }
          } catch (e) {}
        }
        const synced = syncMindToCard(name, cfg.allowCoreShift, cfg.jsonNotes);
        if (!synced) {
          pushMessage(`⚠️ ${name} had a private thought, but no matching Story Card was found to save it on — try "/card ${name}" to create one, or check "/unsaid status".`);
        } else if (isCoreShift && cfg.allowCoreShift) {
          pushMessage(`🌗 ${name} has been fundamentally changed — check their Story Card.`);
        } else if (tensionJustCrossed) {
          pushMessage(`⚡ ${name}'s sense of self is starting to waver...`);
        } else if (isStaleRepeat) {
          pushMessage(`💭 ${name}'s mind circled back to the same thought — nothing new this time.`);
        } else {
          pushMessage(cfg.showThoughtsInStory
            ? `💭 ${name} is thinking something they're not saying...`
            : `💭 ${name} is secretly feeling ${feeling} — check their Story Card for the rest.`);
        }
        state.unsaid.consecutiveRevealMisses = 0;
        state.unsaid.revealBackoffUntil = 0;
      } else if (revealWasCoreCheck) {
        if (revealWasForced) pushMessage(`🌗 ${name}'s core truth held steady — no lasting identity shift was saved.`);
      } else {
        const misses = Math.min(8, (state.unsaid.consecutiveRevealMisses || 0) + 1);
        state.unsaid.consecutiveRevealMisses = misses;
        if (revealWasForced) {
          pushMessage(`👁️ The thought check ran for ${name}, but this model omitted the hidden UNSAID tag. No false thought was saved. You can retry /peek ${name}; automatic requests will self-throttle if the model keeps ignoring the tag.`);
        } else {
          const delay = Math.min(20, Math.pow(2, Math.min(5, misses)));
          state.unsaid.revealBackoffUntil = Math.max(state.unsaid.revealBackoffUntil || 0, state.unsaid.turn + delay);
        }
      }
      state.unsaid.pending = null;
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
    }
    if (revealWasRequested) {
      text = text
        .replace(/《[^》]*》?/g, "")
        .replace(/(?:\[\[?|<)\s*UNSAID[\s\S]*?(?:\]\]?|>)/gi, "")
        .replace(/ {2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trimEnd();
    }
    if (!revealWasRequested) {
      state.unsaid.pendingCoreShiftAllowed = false;
      state.unsaid.pendingCoreCheck = false;
      state.unsaid.pendingRevealForced = false;
    }
    syncFrontMemoryHint(cfg.enabled && cfg.subtleHints && cfg.cast.length > 0);
    if (controlRequest === "peek" || controlRequest === "card") {
      text = "\u200B";
    }
    if (state.unsaid) state.unsaid.controlRequest = "";
    if (!text || !text.trim()) {
      if (typeof log === "function") {
        log("UNSAID Output: model returned only hidden script metadata; suppressed synthetic quiet-moment narration.");
      }
      text = "\u200B";
    }
    return { text };
  } catch (e) {
    if (typeof utRecordRuntimeError === "function") utRecordRuntimeError("Output/UNSAID", e);
    if (typeof log === "function") log("UNSAID Output error: " + (e && e.message));
    try {
      if (state.unsaid) {
        state.unsaid.pending = null;
        state.unsaid.pendingCoreShiftAllowed = false;
        state.unsaid.pendingCoreCheck = false;
        state.unsaid.pendingRevealForced = false;
        state.unsaid.controlRequest = "";
        if (state.unsaid.codex) {
          state.unsaid.codex.pendingNames = [];
          state.unsaid.codex.pendingTypes = {};
          state.unsaid.codex.pendingForced = false;
          state.unsaid.codex.pendingRefreshNames = [];
        }
      }
    } catch (_) {}
    return { text: (controlRequest === "peek" || controlRequest === "card") ? "\u200B" : originalText };
  }
};
function CE_OUT_unsaidAtHardCapacity(text){
  var visible=String(text||""),u=state&&state.unsaid;if(!u)return {text:visible};
  var pending=String(u.pending||"").trim();
  if(!pending){u.pendingCoreShiftAllowed=false;u.pendingCoreCheck=false;u.pendingRevealForced=false;u.controlRequest="";return {text:visible};}
  var open="[[UNSAID|",start=visible.indexOf(open),end=start>=0?visible.indexOf("]]",start+open.length):-1;
  if(start>=0&&end>start){
    var raw=visible.slice(start+open.length,end),parts=raw.split("|"),marker=String(parts[0]||"").trim();
    var same=false;try{same=typeof isSameCardEntity==="function"?isSameCardEntity(marker,pending):marker.toLowerCase()===pending.toLowerCase();}catch(_){same=marker.toLowerCase()===pending.toLowerCase();}
    if(same&&parts.length>=3){
      var feeling=String(parts[1]||"conflicted").trim().toLowerCase(),modifier="",thought="";
      if(parts.length>=4&&(String(parts[2]||"").indexOf("about=")===0||String(parts[2]||"")==="core-shift")){modifier=String(parts[2]||"").trim();thought=parts.slice(3).join("|").trim();}
      else thought=parts.slice(2).join("|").trim();
      if(thought){
        if(!u.minds)u.minds={};if(!u.minds[pending])u.minds[pending]=createMind();var mind=u.minds[pending];
        mind.feeling=feeling||mind.feeling||"conflicted";mind.lastTurn=u.turn||0;mind.lastThoughtText=thought;mind.revealCount=(mind.revealCount||0)+1;
        try{if(typeof recordThoughtHistory==="function")recordThoughtHistory(mind,thought);}catch(_){ }
        var about=modifier.indexOf("about=")===0?modifier.slice(6).trim():null,isCore=modifier==="core-shift"&&!!u.pendingCoreShiftAllowed;
        if(isCore&&thought){if(!mind.coreHistory)mind.coreHistory=[];if(mind.core&&typeof pushCapped==="function")pushCapped(mind.coreHistory,mind.core,2);mind.core=thought;mind.coreSetTurn=u.turn||0;mind.tensionLevel=0;}else if(!mind.core&&!about)mind.core=thought;
        try{if(typeof rememberAdaptiveThought==="function")rememberAdaptiveThought(mind,thought,about,isCore,feeling,Object.assign({},UNSAID_DEFAULTS,{adaptiveMindEnabled:true}));}catch(_){ }
        try{if(about&&typeof recordRelation==="function")recordRelation(pending,about,feeling);}catch(_){ }
        u.consecutiveRevealMisses=0;u.revealBackoffUntil=0;
      }
    }
    visible=(visible.slice(0,start)+visible.slice(end+2)).replace(/\n{3,}/g,"\n\n").trimEnd();
  }else{
    u.consecutiveRevealMisses=Math.min(8,Number(u.consecutiveRevealMisses||0)+1);
    if(!u.pendingRevealForced)u.revealBackoffUntil=Math.max(Number(u.revealBackoffUntil||0),Number(u.turn||0)+Math.min(20,Math.pow(2,Math.min(5,u.consecutiveRevealMisses))));
  }
  u.pending=null;u.pendingCoreShiftAllowed=false;u.pendingCoreCheck=false;u.pendingRevealForced=false;u.controlRequest="";
  return {text:visible||"\u200B"};
}
var modifier = (text) => {
  var originalText=text;
  try {
    if(typeof UN_resetHookCaches==="function")UN_resetHookCaches("output");
    if(state.crossedWires&&state.crossedWires.command)return {text:typeof CW_onOutput==="function"?CW_onOutput(originalText):originalText};
    var t=originalText;
    var hardCapacity=(typeof CE_storyCardCount==="function"?CE_storyCardCount():((typeof storyCards!=="undefined"&&Array.isArray(storyCards))?storyCards.length:0))>=5000;
    var tw=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("twists","output",function(){return typeof twistsModifier==="function"?twistsModifier(t):{text:t};},{text:t},typeof twistsModifier==="function"):(typeof twistsModifier==="function"?twistsModifier(t):{text:t});if(tw&&typeof tw.text!=="undefined")t=tw.text;
    var un=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("unsaid","output",function(){return hardCapacity?CE_OUT_unsaidAtHardCapacity(t):(typeof unsaidModifier==="function"?unsaidModifier(t):{text:t});},{text:t},hardCapacity||typeof unsaidModifier==="function"):(hardCapacity?CE_OUT_unsaidAtHardCapacity(t):(typeof unsaidModifier==="function"?unsaidModifier(t):{text:t}));if(un&&typeof un.text!=="undefined")t=un.text;
    t=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("crossed_wires","output",function(){return CW_onOutput(t);},t,typeof CW_onOutput==="function"):(typeof CW_onOutput==="function"?CW_onOutput(t):t);
    if(typeof CE_R2_onOutput==="function"){try{t=CE_R2_onOutput(t);}catch(_){}}
    t=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("echo_veil","output",function(){return EV_onOutput(t);},t,typeof EV_onOutput==="function"):(typeof EV_onOutput==="function"?EV_onOutput(t):t);
    if(typeof CE_runTurnFeature==="function")CE_runTurnFeature("world_engine","output",function(){return CEW_onOutput(t);},t,typeof CEW_onOutput==="function");else if(typeof CEW_onOutput==="function")CEW_onOutput(t);
    t=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("canon_sentinel","output",function(){return CECS_onOutput(t);},t,typeof CECS_onOutput==="function"):(typeof CECS_onOutput==="function"?CECS_onOutput(t):t);
    t=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("full_hardening","output",function(){return CEFH_onOutput(t);},t,typeof CEFH_onOutput==="function"):(typeof CEFH_onOutput==="function"?CEFH_onOutput(t):t);
    t=typeof CE_runTurnFeature==="function"?CE_runTurnFeature("coordinator","output",function(){return CE_COORD_onOutput(t);},t,typeof CE_COORD_onOutput==="function"):(typeof CE_COORD_onOutput==="function"?CE_COORD_onOutput(t):t);
    if(typeof CE_runTurnFeature==="function")CE_runTurnFeature("storycard_presentation","output",function(){return CE_storyCardPresentationTick();},true,typeof CE_storyCardPresentationTick==="function");else if(typeof CE_storyCardPresentationTick==="function")CE_storyCardPresentationTick();
    if(!hardCapacity&&typeof observeUnsaidVisibleBehavior==="function")observeUnsaidVisibleBehavior(t);
    if(typeof CE_activationCompleteOutputTurn==="function")CE_activationCompleteOutputTurn();
    if(typeof CE_PULSE_finishTurn==="function"){try{CE_PULSE_finishTurn(t);}catch(_){}}
    return {text:t};
  } catch(e) {
    try{if(typeof utRecordRuntimeError==="function")utRecordRuntimeError("Output/unified",e);}catch(_){}
    return {text:originalText};
  } finally { if(typeof utEndRuntimePhase==="function")utEndRuntimePhase(outputRuntimeToken); }
};
modifier(text);
