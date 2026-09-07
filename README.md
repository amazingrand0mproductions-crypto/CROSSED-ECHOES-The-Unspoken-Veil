# 🌒 CROSSED ECHOES — The Unspoken Veil

**Persistent memory, living relationships, earned twists, automatic Story Cards and world continuity for AI Dungeon.**

I built **CROSSED ECHOES** for the kind of adventures that are supposed to last. I wanted NPCs to carry history, relationships to change because of what actually happened, mysteries to develop from evidence, important world details to stop disappearing, and new Story Cards to be created without turning every capitalised word into lore.

CROSSED ECHOES is not one mechanic. It is a set of connected narrative systems that share evidence while keeping their responsibilities separate. The goal is simple: make a long-running adventure feel like one continuous world instead of a sequence of loosely connected generations.

---

## ✨ Core systems

### 🧠 UNSPOKEN TURNS

The NPC continuity layer.

UNSPOKEN TURNS keeps track of supported private state and visible behaviour without treating either as unquestionable fact. It can preserve tension, hesitation, guarded behaviour, recurring concerns, emotional pressure and other continuity that would normally disappear once a scene leaves the active context.

Observable behaviour is allowed to stay observable. A character acting evasive does not automatically mean they are guilty. A warm gesture does not automatically become romance. Private thoughts are never treated as omniscient narration.

### ❤️ CROSSED WIRES

The relationship engine.

Relationships are directional and historical rather than a single friendship score. Existing bonds can be reconstructed from Story Cards, while new developments grow from visible story events.

Family, romance, friendship, rivalry, resentment, loyalty, fear, professional ties, political relationships and other bonds can all develop independently. Identity resolution is deliberately strict around high-stakes relationships so a shared first name, surname or alias cannot casually create a marriage, parent-child bond or romance with the wrong character.

Family is now directional and first-class rather than one generic `family` bucket. Supported kinship includes parent/child, grandparent/grandchild, great-grandparent/great-grandchild, aunt-or-uncle/niece-or-nephew, great-aunt-or-uncle/great-niece-or-nephew, cousins, twins, half/step/foster/adoptive siblings, adoptive/foster/step parents and children, guardian/ward, godparent/godchild, several in-law directions, ancestor/descendant and chosen family. Directional inverses are created only from explicit canon. All of these remain in the **family relationship class**, structurally separate from romance.

Crossed Wires can bootstrap those bonds from Story Card fields such as `Relationships:`, `Relationship Status:`, `Family:`, `Kinship:`, `Parents:`, `Children:`, `Siblings:`, `Grandparents:`, `Aunts/Uncles:`, `Nieces/Nephews:`, `Cousins:`, `Guardian:` and similar explicit family fields. Current explicit relationship-status cards may supersede older historical stages; cards that only say *potential*, *possible*, *unknown* or *early attraction* cannot promote a romance by themselves.

The player remains protected. CROSSED WIRES can remember how an NPC behaves toward **YOU**, but it does not invent the player's feelings, consent or decisions.

### 🌀 TWISTS AND TURNS

The long-form twist engine.

TWISTS builds threads from evidence rather than randomly announcing surprises. Clues can reinforce, contradict, delay or resolve a thread. Repeated wording cannot artificially mature the same clue, ruled-out explanations count as counter-evidence, and historical archive material does not automatically become a current conspiracy.

With `strictLogic=true`, a reveal has to earn its way into the story. `/twist` can accelerate a supported reveal, but it cannot create a secret from nothing. Compound twists also require an established bridge instead of inventing one just because combining two ideas would be dramatic.

Current-story mystery rules are also protected as canon contracts. If a Story Card says several hooks are **independent**, that somebody is only **presumed** dead, that identities are **not pre-decided**, or that a theory is **unverified**, TWISTS AND TURNS may investigate those doors but cannot silently merge them into one master conspiracy or promote them to fact.

### 🌘 ECHO VEIL

The scene-to-scene continuity layer.

ECHO tracks active characters, places, objects, evidence trails, consequences, unresolved questions and recent scene presence. It is designed to carry forward the details that matter without dumping the entire adventure back into context every turn.

### 📚 CODEX

The automatic Story Card engine.

CODEX discovers important entities, classifies them and creates or refreshes Story Cards from supported story evidence. Its main entity classes are **Character, Location, Item and Faction**.

Detection uses naming grammar, repetition, recency, aliases, scene evidence and agreement from the other CROSSED ECHOES systems. Capitalisation alone is never enough. Manual lore is protected by default, trigger overlap is not treated as identity, and automatic writes are verified before the script adopts them.

If AI Dungeon refuses or drops a Story Card write, CROSSED ECHOES records the failure and retries safely instead of pretending the card exists. At the Story Card ceiling, non-essential automatic writes become read-only rather than risking existing lore.

### 🌍 WORLD ENGINE

The persistent world-simulation layer.

WORLD ENGINE follows narrative attention, scene state, factions, causal pressure, variants, evolving powers, off-screen possibilities and emergent arcs. Possibilities remain possibilities until the story establishes them.

It is built to adapt across very different genres and mixed settings without forcing every world into the same structure. The specialist systems remain the evidence authorities; WORLD ENGINE coordinates rather than overriding them.

---

## 🔗 How CROSSED ECHOES works as one system

The systems share signals, not conclusions.

A relationship event can increase an NPC's narrative importance. An ECHO evidence trail can give TWISTS something grounded to develop. CODEX can use scene and relationship confidence to improve classification. WORLD ENGINE can prioritise a faction or location already established elsewhere.

That shared layer is deliberately conservative: one observation should not become five invented facts. The director tries to give each turn one useful dramatic job instead of letting every subsystem fight for attention at once.

---

## 🛡️ Current AI Dungeon / published-script compatibility

CROSSED ECHOES is designed around AI Dungeon's current four-hook scripting model: **Library, Input, Context and Output**.

For compatibility with published/attachable Script environments, this build treats scenario-owned Plot Components as read-only. It does **not** write to Plot Essentials, Author's Note, Front Memory or `state.memory`.

Temporary narrative guidance is injected through the Context hook instead. Persistent CROSSED ECHOES runtime data stays in the script's own state, while editable configuration and generated public lore use Story Cards.

Story Card creation follows the documented API contract and then verifies the resulting card identity. A numeric result from `addStoryCard()` is never trusted on its own.

---

## ⚙️ Configuration

CROSSED ECHOES maintains **five config Story Cards** under the category:

`CROSSED ECHOES CONFIG`

1. **UNSPOKEN TURNS** — UNSAID + TWISTS AND TURNS
2. **CODEX** — automatic Story Card detection and refresh
3. **CROSSED WIRES** — relationship tracking
4. **ECHO VEIL** — scene and continuity memory
5. **INTEGRATION** — orchestration, WORLD ENGINE and shared behaviour

Editable settings live in each card's **Entry**. Full explanations live in **Notes** so the setting block can stay compact.

Each config has a hidden sentinel trigger used for identity across isolated hooks. Do not rename or remove those sentinel triggers.

### CODEX bootstrap guarantee

CODEX is treated as a mandatory config, not an optional side effect of another subsystem. Every hook verifies the required config set independently.

If CODEX is missing, the script attempts to recreate it. If the host returns the wrong index, refuses the write, or the requested sentinel is not actually present, the result is rejected and retried later without modifying the unrelated card.

`/unsaid health` reports the config state and Story Card write health.

---

## 📚 CODEX tuning

The defaults are intended to be a balanced starting point. The most useful settings are `cardChars`, `detectionMode`, `mentions`, `codexCD`, `charObserve`, `charAppear`, `charDeadline`, `fastTrackStrong`, `crossSystemConsensus`, `learnAliases`, `directScaffold`, `autoRefresh`, `refreshCD`, `refreshEvidence` and `protectManual`.

If too many weak entities are being considered, increase the mention/cooldown/observation thresholds. If obvious named entities are taking too long, reduce those thresholds slightly or use a more eager detection mode.

For very large Story Card libraries, keeping individual cards compact leaves more dynamic context available for the active story.

---

## 🌀 TWISTS tuning

The main pacing controls are `intensity`, `strictLogic`, `wildcard`, `compound`, `involvePlayer`, `minSeedsForPayoff`, `minTurnsForPayoff`, `payoffCooldown`, `scenarioAdaptation` and `semanticReinforcement`.

For continuity-heavy play, I recommend keeping `strictLogic=true` and `wildcard=false`. That keeps surprises possible without letting the system rewrite canon just to produce one.

---

## 📥 Installation

### Scenario script editor

1. Open the Scenario's **Script** editor.
2. Replace the four script sections with the current **Library, Input, Context and Output** code.
3. Save the Script.
4. Start a fresh test Adventure or continue from a compatible Adventure.
5. Open Story Cards and confirm all five **CROSSED ECHOES CONFIG** cards exist.
6. Run `/unsaid health` if you want to verify configuration and Story Card write health immediately.

If AI Dungeon repeatedly refuses creation of a missing config card, use the provided config-card import as a manual fallback. The sentinel keys are already included.

### Published / attachable Script

Attach or publish CROSSED ECHOES through AI Dungeon's Script system normally. The script keeps its own runtime state and does not require permission to rewrite scenario-owned Plot Essentials or Author's Note.

---

## ⌨️ Commands

All public commands use `/`.

**General**

- `/unsaid status` — subsystem state and CODEX write health
- `/unsaid health` — config integrity, protected-memory mode and subsystem health
- `/unsaid reset` — reset managed UNSAID state
- `/unsaid resetcodex` — reset CODEX detection queues without deleting Story Cards

**CODEX**

- `/card <name>` — force creation or refresh for one exact established entity

**TWISTS AND TURNS**

- `/plant <name>` — author-direct a supported thread without counting the command itself as factual evidence
- `/twist <name>` — accelerate an evidence-backed reveal when eligible
- `/twists` — inspect current twist state

The config-card Notes contain the deeper command and setting reference.

---

## 🔐 Continuity rules

CROSSED ECHOES follows a few rules that are intentionally hard to bypass:

- The player's feelings, consent, dialogue choices and voluntary actions belong to the player.
- Private NPC thoughts are not objective facts.
- Visible behaviour does not automatically prove motive.
- A relationship label is not proof of a secret.
- A twist hypothesis is not canon until the story earns it.
- Off-screen WORLD ENGINE possibilities are not canon until established.
- Manual Story Cards are not overwritten merely because triggers overlap.
- Archive/history material does not automatically become a current plot.
- Future, alternate and multiversal versions remain separate identities unless the story connects them.
- Repeated evidence is still one clue when it describes the same event.

---

## ⚡ Long adventures and large Story Card libraries

CROSSED ECHOES uses bounded caches, capped histories, active-first Story Card sampling, streaming fingerprints and an adaptive runtime governor to keep work under control as an Adventure grows.

Required config capacity is reserved before non-essential automatic writes. At the hard Story Card ceiling, the script refuses new automatic lore rather than repurposing an existing card.

Optimized Context is supported. CROSSED ECHOES preserves the host's existing Context and adds only bounded guidance when there is room.

---

## 🛡️ Canon Sentinel — live-play reliability hardening

This build adds a final evidence-and-recency arbitration layer designed for long AI Dungeon adventures where current story state can disagree with older Story Cards or summaries. It prioritizes the latest explicit player action and newest visible canon, protects player agency, preserves NPC knowledge boundaries and relationship boundaries, keeps theories/claims below confirmed fact, and prevents stale age/relationship summaries from silently winning.

The relationship engine also seeds explicit current relationship developments from live scenario context (for example a mutual kiss, a later rejection, or a stated boundary) without converting attraction into consent or commitment. The seed ledger is deduplicated so the same scenario summary does not inflate a relationship every turn.

Canon Sentinel is appended last and budget-fitted. Existing ECHO VEIL, Crossed Wires, WORLD ENGINE and UNSAID context reservations win first; the Sentinel shrinks or yields rather than pushing the host over its Context limit.

---

## 🧩 Deep relationship, mind and twist contracts

The current engine adds persistent state machines underneath the older narrative layers. They are designed to survive isolated Input/Context/Output hooks, retries and long gaps between scenes.

**Crossed Wires** now separates relationship **class** from relationship **stage**. Family, mentor/student, professional, ally and rival roles do not sit on a hidden ladder that eventually becomes romance. Romantic development has its own consent/boundary contract, including rejection locks, rupture/repair history, speaker-aware reversals and evidence requirements before a previously closed arc can reopen.

**UNSAID** separates what an NPC knows, suspects, privately believes, wants, fears, plans, values and performs socially. A private thought cannot create objective canon. NPCs can revise or retire old beliefs when later evidence disproves them, so the mind model is allowed to learn instead of endlessly repeating an obsolete suspicion.

**TWISTS AND TURNS** now tracks clue lineage and independent evidence families. Rewording the same clue does not mature a twist twice. Fresh counter-evidence blocks an automatic payoff until genuinely newer evidence answers it. Natural reveals require an evidence-backed reveal contract; explicit author commands retain their deliberate override semantics without turning unsupported guesses into established facts.

Cross-system evidence remains firewalled: relationship tension is not proof of a conspiracy, an UNSAID suspicion is not a world fact, and an unconfirmed twist cannot rewrite a character's psychology.

## 🔧 Full-system reliability layer

A final reliability kernel coordinates persistent relationship policies, same-turn Retry replacement, speaker attribution, malformed-state repair, bounded state health and whole-system diagnostics. Relationship policies are owner-aware, so a boundary belonging to one NPC cannot leak onto another NPC simply because both appear in the same Context.

Use `/crossedechoes doctor` (or `/ce doctor`) for the combined relationships / UNSAID / twists / integrity diagnostic.

---

## 🩺 Troubleshooting

### CODEX config is missing

Run `/unsaid health`.

The script independently checks the CODEX sentinel and retries the bootstrap when the card is absent. It will not accept another config card simply because the host returned that card's numeric index.

If the host continues refusing Story Card creation, import the config-card fallback and run `/unsaid health` again.

### “Script can't change Plot Essentials”

This release does not write to Plot Essentials, Author's Note, Front Memory or `state.memory`.

If that error appears after updating, make sure all four script sections come from the same current release. Mixing an older Input/Context/Output with a newer Library can leave legacy memory-writing code active.

### A Story Card never appears

Use `/unsaid status` or `/unsaid health`. CODEX distinguishes between an entity that is still gathering evidence, one rejected as noise, one waiting on a cooldown, a host-refused Story Card write and an entity that already exists under another canonical identity.

`/card <exact name>` can be used when you deliberately want to force an already-established entity through the queue.

### A relationship looks wrong

Check the public Character Story Cards first. High-stakes relationships require stronger identity support when names are ambiguous, but unclear source lore can still create unclear evidence. Correct the public canon and allow the relationship layer to rebuild from that evidence.

---

## 🧪 Testing philosophy

I test CROSSED ECHOES against isolated AI Dungeon-style hooks, long-running state, malformed saves, write refusal, large Story Card libraries, different genres, conflicting identities and real-play failures.

The target is not a large test number. The target is for the script to visibly do what it claims in normal play while still knowing when **not** to invent something.

The current release passes the 185-test core suite, dedicated deep-system and twist suites, full-system/adversarial/host-contract checks, NEXT CLASS real-play and supplied-scenario regressions, 30/30 cross-genre matrices in both Context modes, 60-turn general simulations, 48-turn fluidity simulations, high-concept temporal/multiversal simulations, 312-card relationship-foundation stress, and the 5,000-card correctness ceiling. Exact details and measured timings are in `TEST_REPORT.txt`.

Technical verification is kept with the release for anyone who wants to inspect it, but the public documentation stays focused on using the script rather than exposing internal fixtures or private scenario material.

---

## 🌒 The idea behind CROSSED ECHOES

A long story should accumulate weight.

NPCs should remember what happened. Relationships should carry consequences. A mystery should become more interesting because of earlier clues, not because a random reveal was injected. Places, factions and objects should become part of the world when they actually matter. Old history should influence the present without constantly hijacking it.

That is what I built CROSSED ECHOES to do.
