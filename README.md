# 🌒 CROSSED ECHOES — The Unspoken Veil

**A persistent narrative simulation engine for AI Dungeon combining UNSPOKEN TURNS, Crossed Wires, ECHO VEIL, TWISTS, CODEX and WORLD ENGINE.**

CROSSED ECHOES is built for long-running stories where characters, relationships, secrets and consequences are meant to carry forward instead of resetting from scene to scene.

It combines three separate systems into one four-tab AI Dungeon script:

- **🧠 UNSPOKEN TURNS** handles NPC psychology and the things characters do not always say out loud.
- **❤️ Crossed Wires** handles relationships, trust, tension, loyalty, attraction, resentment and long-term bonds.
- **🌘 ECHO VEIL** handles continuity, knowledge, consequences, world state, memory and off-screen pressure.

**TWISTS AND TURNS** is included inside UNSPOKEN TURNS for long-form plot threads, foreshadowing and earned reveals.

**CODEX** handles automatic Story Card detection, creation and maintenance.

The systems keep their own jobs. **WORLD ENGINE** sits above them as a bounded orchestration/simulation layer so psychology, relationships, plot, canon, factions, powers, variants and consequences can follow the same long-running world without becoming one undifferentiated prompt.

---

## ✨ What CROSSED ECHOES does

### 🧠 NPCs have an inner life

UNSPOKEN TURNS keeps track of the private side of characters: wants, fears, beliefs, unresolved feelings, tension, plans and changes in attitude.

Private state can shape how a character behaves without automatically becoming public knowledge or objective fact.

A character can be suspicious without being correct. They can want something without admitting it. They can change over time without losing the personality already established in their Story Card.

Public Character cards act as a personality anchor, so temporary jealousy, fear or stress does not quietly rewrite someone into a completely different person.

---

### ❤️ Relationships remember what happened

Crossed Wires tracks relationships as their own living history rather than reducing them to a single friendship score.

It can follow things such as:

- trust and distrust
- affection and attachment
- attraction
- resentment
- jealousy
- loyalty
- fear
- dependency
- respect
- power imbalance
- promises and betrayals
- unresolved arguments
- shared scars
- relationship roles
- repair and reconciliation

Relationships are directional. One character can trust another far more than they are trusted in return.

Healthy relationships matter too. Strong loyalty, friendship, trust or affection can become narratively important without the script needing to turn everything into conflict.

#### Story Card Relationship Foundations

Crossed Wires now **bootstraps established relationship canon directly from Character Story Cards** instead of waiting for new-turn events to rediscover it. A card that says `Married to Julian`, `daughter of Kyle/Ravati`, `Ezra’s father`, `trusted by Jordan`, `close with Katara`, `former partner of Sera`, or similar supported wording becomes persistent directional relationship state at scenario start.

These are **foundations, not fake events**. A five-year marriage is not recorded as if the wedding happened on turn one. Later story events can deepen, strain, repair or end the bond without erasing its established history. Family roles outrank accidental romantic inference, alternate/future variants are isolated from the primary character, explicit aliases are merged, and common-word codenames such as `Ghost` or `Ally` are protected from ordinary-noun/role collisions.

When a founded bond is scene-relevant, the Context layer tells the model to express it naturally through lived-in familiarity, shorthand, concern, obligations, boundaries, irritation, comfort and shared history **without forcing affection or relationship drama every turn**. Managed Character-card Notes are also migrated so an established spouse/parent/sibling/friend no longer displays the stale `no mature directional bond` message.

---

### 🌀 Twists are seeded instead of thrown in randomly

TWISTS AND TURNS watches for story-supported possibilities and develops them over time.

A twist can be planted, reinforced through later evidence and held back until there is enough support for a payoff. Existing threads use **semantic reinforcement**, so later evidence does not need to repeat the original trigger wording. A future-warning thread can mature through a blood sample, chronal residue, a resonance match, a contradictory date, an alternate-self sighting, a recovered component or another clearly related development.

Evidence is deliberately conservative. **The same clue cannot be counted twice**, one Story Card contributes one evidence touch, and explicit counter-evidence such as a ruled-out theory weakens a thread instead of secretly strengthening it. Background Story Cards only seed current twist threads when they contain a genuinely open/uncertain hook; archive-only profiles, completed history and canon rules such as “do not reopen this” stay dormant unless the live story reactivates them.

The system is designed around one important rule:

> **Suspicion is not proof.**

A private fear, relationship problem or interesting NPC can make a plot thread more relevant, but it cannot magically prove that a betrayal, hidden identity, conspiracy or secret is true. With `strictLogic=true`, compound reveals also need an already-established bridge between their threads, and `/twist` is a pacing override for a supported reveal rather than a loophole for creating new canon. Confirmed payoffs save the **actual revealed fact** into established-twist memory so later continuity remembers what was revealed, not just the category name.

This keeps twists tied to the story that actually happened.

---


### ⏳ Time travel, multiverse and power continuity are first-class systems

CROSSED ECHOES now treats high-concept continuity as more than generic mystery text. It can distinguish **future/past versions**, **alternate-universe counterparts**, **branch timelines**, **multiversal leakage**, **reality anchors**, **copied or borrowed powers**, **power suppression**, **signature spoofing** and similar speculative mechanics.

A future or alternate version of a character is tracked as a separate continuity identity unless the story explicitly establishes one continuous traveler. Injuries, deaths, memories, relationships and power state therefore do not silently overwrite the primary character.

TWISTS AND TURNS also has dedicated temporal, multiversal and power-system twist families. Scenario detection weights those families more strongly when the adventure actually contains time travel, multiverse or superhero/reality mechanics, while grounded scenarios remain protected from speculative imports.

### 🧵 Story Card thread Notes stay readable

ECHO VEIL no longer presents important threads as clipped quotation fragments. Managed Story Card Notes now explain threads in full sentences: what the arc is, whether it is established or hypothetical, what evidence has moved it, the open question, and a **Useful next proof** prompt. Hypotheses are clearly marked **unverified** and kept separate from established continuity.

The bridge can let a supported ECHO thread seed a TWISTS AND TURNS long arc, but an unverified theory does **not** become factual setup merely because another subsystem noticed it. Actorless world theories also remain actorless instead of being attached to whichever NPC happened to be nearby.

### 📚 CODEX is stricter without becoming blind

CODEX adds another anti-junk layer for pasted AI instructions, diagnostic headings and derived narrative words such as *Investigations*, *Developments*, *Specifications*, *Reactions* and similar prose fragments. Explicit naming grammar remains an override, so deliberately unusual names are still possible.

High-concept non-character entities are understood directly: named timelines/realities can become Locations, chronal anchors/arrays/tethers can become Items, and named projects/authorities/programs can become Factions when the story supplies strong semantic evidence.

For high-confidence introductions, CODEX now creates a **direct evidence scaffold** itself instead of depending on the model to return a hidden `[CARD]` block. The first card contains only story-supported evidence, is marked provisional internally, and can enrich itself after later evidence appears. This closes the failure mode where CODEX detected an entity but no Story Card ever appeared.

Story Card writes are **identity-safe**. A matching trigger is not treated as proof that two cards represent the same entity, so a hand-authored Event, Plot or lore card cannot be overwritten merely because it shares a trigger with a new Character, Location, Item or Faction. CODEX retries a collision with specific identity-safe triggers, commits core fields through AI Dungeon's supported update route, and reports write failures separately from detection failures under `/unsaid status`.

The anti-junk layer combines more than **1,700 explicit stop words**, **750+ generic common nouns**, **220+ hard generic entity roots**, morphology rejection, diagnostic-heading rejection, sentence grammar, semantic typing and partial-name shadow protection. `Timeline Omega` can be a real Location while bare `Timeline` is rejected; `Project Nightglass` can be a Faction while bare `Project` is not allowed to age into a junk card.

### 🌍 WORLD ENGINE — persistent simulation above the whole script

WORLD ENGINE sits above **CODEX, TWISTS AND TURNS, ECHO VEIL, Crossed Wires and UNSPOKEN TURNS**. It does not replace their evidence rules. It decides what deserves attention this turn and keeps a bounded simulation model of the parts of the world that matter.

It includes:

- **Narrative Attention** — limits each turn to a small primary/supporting focus set instead of dragging every tracked NPC and arc into the scene.
- **Scene Director** — recognises combat, stealth, investigation, horror, romance, legal, medical, political, military, survival, school, sports, espionage, workplace, family, adventure, travel, recovery, slice-of-life and social beats.
- **Knowledge Matrix** — mirrors established knows/unknown/contested boundaries without turning model-level context into NPC knowledge.
- **Causal Web** — carries ECHO's established cause/consequence state forward so follow-up developments prefer earned causes over coincidence.
- **Faction Simulation** — tracks established faction goals, resources and pressures without inventing new capabilities.
- **Power Ecology** — separates permanent powers from gained, manifested, copied, borrowed, stolen, suppressed, lost, restored and evolved states.
- **Variant Graph** — future, past, alternate-timeline and multiversal counterparts remain separate identities linked to a base person.
- **Emergent Arcs** — independent pressure from multiple systems can converge into one developing arc instead of creating duplicate threads.
- **Off-Screen World Pulse** — absent NPCs/factions with established goals can receive a plausible development *candidate*. Candidates are not canon until the story actually narrates them.

WORLD ENGINE currently recognises **30 scenario families**: fantasy, sci-fi, cyberpunk, contemporary, historical, western, horror, mystery, crime/noir, romance, slice-of-life, school/campus, workplace, family, adventure, espionage, superhero, time travel, multiverse, reality-warping, post-apocalyptic, survival, military/war, political/intrigue, medical, legal, sports, music/celebrity, pirate/nautical and comedy. Hybrid stories keep multiple live tags instead of being flattened into one genre.

The base-world profile and the **live scene/world profile are separate**. That matters for portals, time jumps, holodecks, alternate universes, dream worlds and reality changes: entering a different world can change the active rules without deleting the original setting.

Useful commands:

```text
/world
/world doctor
/world pulse
```

`/world pulse` forces one off-screen candidate for inspection/testing. It still does not declare that event canon.

---

### 🌘 The world remembers consequences

ECHO VEIL handles the wider continuity layer.

It tracks things such as:

- important scene facts
- unresolved events
- injuries and conditions
- promises and threats
- evidence and discoveries
- active consequences
- current location
- recurring people and groups
- episodic memories
- off-screen activity
- who knows what
- what still needs a follow-up

The aim is to stop important events from disappearing simply because the story moved on for a few turns.

---

## 🔐 Character knowledge is separate from world truth

One of the most important parts of ECHO VEIL is the **Knowledge Firewall**.

AI Dungeon may have a fact somewhere in its overall context, but that does not mean every character in the scene is allowed to know it.

If the story establishes:

> Mercer does not know Leo hid the black key beneath the floorboards.

then Mercer is treated as not knowing that fact until the story gives him a believable way to learn it.

Knowledge can be gained through things such as:

- being told
- witnessing something
- finding evidence
- overhearing a conversation
- receiving a message
- reading a document
- another clear on-page discovery

Character Story Card Notes can also contain private boundaries such as:

```text
Does not know: Leo possesses the black key.
Knowledge Boundary: The north warehouse contains a hidden tunnel.
Restricted Knowledge: Mara is working undercover.
```

These belong in **Notes**, not Entry, so they remain script-facing information rather than public lore.

---

## 🔗 The Fusion Director

The Fusion Director is the layer that joins the three systems together.

It does not merge their private state into one giant pool. Instead, it passes controlled signals between them so they can agree on what deserves attention.

For example:

- relationship pressure can make an already-supported plot thread more important
- a strong friendship can make two characters worth focusing on even without conflict
- private emotional pressure can make a scene more personal without becoming factual evidence
- ECHO VEIL danger can tell Crossed Wires that now is a bad time for unrelated relationship drama
- a confirmed twist can create emotional and world aftermath instead of ending at the reveal
- an unresolved consequence can keep an NPC or relationship relevant across later scenes

The Director also keeps a stable **NPC focus** and **relationship-pair focus** when several systems independently agree that the same person or bond matters.

Near-ties are deliberately stabilised so the story does not bounce between different characters every turn.

### 🎯 Player Intent Anchor

The Director pays attention to what the player is actually trying to do right now. It can recognise broad objectives such as investigating, travelling, fighting, protecting someone, escaping, sneaking, talking, using an item, observing, planning or resting.

A clear objective can push unrelated automatic drama out of the way. If you are actively searching a crime scene, the relationship engine is less likely to interrupt with a random confrontation. If a supported twist is directly tied to the thing you are investigating, it can still land naturally.

Intent is only a scheduling signal. It never means the attempted action succeeded and it never creates evidence.

### 🧭 Entity Lattice

CROSSED ECHOES keeps a shared, type-aware map of the important **Characters, Locations, Items and Factions** in the current story. CODEX, ECHO VEIL, Crossed Wires, Story Cards and player intent can all contribute public identity confidence without flattening different entity types into the same thing.

That means a named sword can matter as an Item, a fortress can matter as a Location and a guild can matter as a Faction without being mistaken for NPCs. Strong conflicting type evidence makes the Director abstain instead of forcing a bad classification.

### 🕯️ Long-Arc Memory

Major reveals, betrayals, rescues, relationship turning points and severe world consequences can become compact milestones. They cool down when the involved people, places, items or factions are absent, then regain callback salience when something genuinely connected returns.

This gives old events weight without keeping every major moment permanently hot. Returning to the place where something terrible happened can matter again dozens of turns later without the script replaying the old event or treating it as a new fact.

---

## 🎭 Shared pacing

CROSSED ECHOES keeps track of the kind of beat the story currently needs.

The Director can recognise states such as:

- **aftermath** — let characters react to something important
- **crisis** — immediate danger takes priority
- **payoff** — a supported plot thread is ready to land
- **social pressure** — relationships or private tension have room to surface
- **consequence** — follow through on something already set in motion
- **breathe** — give the story a quieter turn
- **steady** — continue normally

This helps prevent several systems from trying to force different dramatic moments into the same response.

Major structured work is prioritised roughly as:

1. manual UNSAID / CODEX request
2. player-forced Crossed Wires beat
3. supported TWISTS AND TURNS beat
4. automatic Crossed Wires pressure
5. automatic UNSAID work

ECHO VEIL continues underneath as the continuity and causality layer.

---

## 📚 CODEX — automatic Story Cards

CODEX watches the story for important entities and can create or refresh Story Cards for:

- **Characters**
- **Locations**
- **Items**
- **Factions**

Detection is evidence-driven rather than based on capital letters alone.

Strong introductions can be recognised quickly, including genre-specific and operational naming grammar:

> a chronal investigator named Nyra Voss

> the city called Thornhaven

> a sword named Dawnfall

> a guild called The Ashen Circle

> a holding company called Aethelgard Logistics

> a Delivery Point listed as Sovereign Zero

> the project designation is Sovereign

> the units are labeled as Correctors

Weak or ambiguous guesses need more evidence. Old one-off guesses gradually lose confidence and are eventually removed from the candidate pool, which helps stop junk cards from building up over a long adventure. A shorter prefix can no longer borrow the naming evidence of a longer proper name, so `Nyra Vale` does not separately validate `Nyra`, `Timeline Omega` does not validate bare `Timeline`, and `Project Nightglass` does not validate bare `Project`.

When several valid entities are waiting for a card, CODEX considers things like:

- how clearly the entity was introduced
- how recently it appeared
- whether it is active in the current scene
- whether ECHO VEIL recognises it
- whether Crossed Wires recognises the character
- whether the Fusion Director is focusing on it
- evidence quality
- waiting time
- confidence in the entity type

A repeatedly failed card request is temporarily deprioritised so it cannot block every other valid entity behind it.

**Direct-scaffold reliability is now independent of the hidden Context owner.** Once visible Output establishes a high-confidence entity, CODEX can write one evidence-only Story Card locally on that Output pass. TWISTS, UNSPOKEN TURNS or another structured system may still own Context without starving card creation. This path does not bypass the anti-junk gates: it still requires explicit/typed evidence and creates at most one direct scaffold per Output.

Operational naming now has dedicated semantic routes rather than falling through to Character: delivery/drop/staging destinations resolve as Locations, explicit project/program designations resolve as project/faction entities, and labeled manufactured unit/model classes resolve as Items. Same-root names remain protected from duplicate partials, but an explicitly named different-kind entity can coexist when canon genuinely distinguishes them (for example `Storm Sovereign` history and a separate project named `Sovereign`).

---

## 🧭 Entity detection

The detector supports more than simple English-style names.

It can handle:

- multi-word names
- aliases and codenames
- same-sentence alias introductions
- casing drift
- Unicode Latin names
- Greek and Cyrillic names
- letter/number designations such as `XJ-9`
- named weapons and objects
- named organisations
- route and destination phrasing
- locations without obvious `Street`, `Road`, `City` or `Kingdom` suffixes

The stopword and noise filters are intentionally strict around ordinary scene language, furniture, weather, food, body parts, sentence starters, generic titles and other phrases that should not become Character cards.

Strong explicit evidence can override those filters when the story clearly establishes something unusual as a real name.

---

## 🗂️ Story Card format

CROSSED ECHOES keeps the three AI Dungeon Story Card fields separate on purpose.

### Entry

**Public story canon.**

This is the information AI Dungeon may use when the card activates. Entries should contain established facts about the character, place, item or faction.

### Triggers

**Names and safe aliases only.**

Generated trigger lists avoid spaces after commas because trigger whitespace can affect matching.

Example:

```text
Mara Vale,Mara,Wren
```

### Notes

**Creator information and CROSSED ECHOES state.**

The script can maintain readable sections for the systems that actually apply to that card.

A Character card may contain sections for:

- 🧠 UNSPOKEN TURNS
- ❤️ CROSSED WIRES
- 🌘 ECHO VEIL
- 🌀 TWISTS AND TURNS
- 🔗 CROSSED ECHOES
- 📚 CODEX

Location, Item and Faction cards only receive relevant world/Codex sections rather than character psychology.

Anything you manually write in Notes is preserved above the managed section.

Managed Notes are excluded from story-evidence scanning, so private psychology and diagnostics cannot accidentally turn themselves into canon.

---

## 📝 Story Card detail

Generated cards can hold much more than a one-line description.

### Character cards

May include:

- aliases
- role
- race / nature
- age
- pronouns
- capability / strength level
- background
- personality
- appearance
- abilities
- weaknesses
- goals
- relationships
- affiliations
- current location
- status
- significance

### Location cards

May include:

- aliases
- location type
- region
- description
- atmosphere
- layout
- key areas
- important people and factions
- features and resources
- hazards
- history
- current state
- connections
- significance

### Item cards

May include:

- aliases
- item type
- appearance
- description
- properties
- abilities
- limitations
- origin
- owner
- current location
- condition
- history
- significance

### Faction cards

May include:

- aliases
- faction type
- description
- purpose
- leadership
- members
- territory
- resources
- allies
- rivals
- reputation
- current activity
- history
- significance

Unsupported information is left out rather than invented.

---

## ⚙️ Configuration

CROSSED ECHOES uses five config Story Cards, all in the category:

`CROSSED ECHOES CONFIG`

The cards are:

1. **CROSSED ECHOES — Config — UNSPOKEN TURNS**
2. **CROSSED ECHOES — Config — CROSSED WIRES**
3. **CROSSED ECHOES — Config — ECHO VEIL**
4. **CROSSED ECHOES — Config — CODEX**
5. **CROSSED ECHOES — Config — INTEGRATION**

Config cards have blank Triggers so they are not recalled as story lore.

The editable settings stay in **Entry**. Full explanations are kept in **Notes**.

The ECHO VEIL Notes cover its presets, memory, consequences, knowledge controls, continuity, off-screen activity, context use, confidence thresholds, Retry behavior and store limits.

CODEX includes:

`cardChars=950`

This controls the maximum generated Story Card Entry size and can be set from **300 to 2000 characters**.

See `CONFIG_NOTES.md` for the full config reference.

---

## ⚡ Optimized Context support

`Context.js` is cache-compatible and works with AI Dungeon's Optimized Context system.

When Optimized Context is active, CROSSED ECHOES preserves AI Dungeon's original context as an unchanged prefix and appends its own bounded guidance after it.

If there is not enough room for a lower-priority packet, that worker simply waits rather than cutting the host context apart or inserting half an instruction.

Standard Context is supported as well.

The Director also uses **adaptive context reservation**. Quiet turns reserve less private headroom; dense crisis, payoff or convergence turns can reserve modestly more, always inside the hard context cap. High-priority safety and knowledge rules stay whole, while lower-priority detail is compacted or deferred first.

---

## 🔄 Retry / Undo safety

Retrying a generation should not leave rejected hidden state behind.

CROSSED ECHOES retracts coordinator-created aftermath and other turn-specific bridge state before processing the replacement generation.

The source systems keep their own Retry handling as well.

---

## 🧹 Clean story output

Internal script metadata is not meant to appear in the adventure.

The Output layer removes known hidden protocol tags and malformed diagnostic fragments such as broken `[NPC ...]`, `[EVENT ...]`, `[ROLE ...]` or CODEX metadata while leaving normal prose intact.

---

## 📥 Installation

Open your AI Dungeon Scenario and go to **Scripts**.

Replace the four tabs with the files from this repository:

1. **Library** → `Library.js`
2. **Input** → `Input.js`
3. **Context** → `Context.js`
4. **Output** → `Output.js`

Do **not** install UNSPOKEN TURNS, Crossed Wires or ECHO VEIL separately alongside this package. Their code is already included.

Play one normal turn and the config cards will be created or migrated automatically.

### Using the supplied config-card import

`CONFIG_CARD_IMPORTS.json` contains the five config cards with their full Notes already filled out.

**Important:** importing Story Cards in AI Dungeon can replace the existing Story Card collection. If your scenario already has lore cards, export them first and merge the five CROSSED ECHOES config objects into your existing JSON instead of importing the supplied file by itself.

---

## ⌨️ Commands

Every CROSSED ECHOES command uses `/`. Commands are control actions: the script consumes them instead of treating them as story prose.

### 🌒 CROSSED ECHOES

```text
/crossedechoes
/crossedechoes status
/crossedechoes help
/ce
/ce status
/ce help
```

`/crossedechoes` and `/ce` show the coordinator status. The `help` form gives a quick command overview.

Compatibility aliases from older merged builds are also slash commands:

```text
/threadbound
/threadboundstatus
/tbstatus
/unified
/unifiedstatus
```

### 🧠 UNSPOKEN TURNS / CODEX

```text
/unsaid
/unsaid status
/unsaid health
/unsaid resetcodex
/peek <name>
/peek <name> core
/card <name>
/alias <character>
/alias <character> = <alias>
/unalias <character> = <alias>
```

`/peek` asks for a private-thought check. `/card` forces a CODEX create/refresh request. Alias commands keep nicknames, callsigns and alternate names tied to the same character identity.

### 🌀 TWISTS AND TURNS

```text
/twists
/twist [name]
/plant <name> [categoryKey]
/threads
/twisttypes
/twistlog
/mature on|off
/scenario status|auto|off|<custom guidance>
/synergy on|off
/intensity low|medium|high
/rescan
```

`/twist` accelerates the next **supported** payoff. With `strictLogic=true`, it refuses to manufacture an unsupported secret; disabling strict logic can permit configured wildcard behaviour. `/plant` starts a plotting thread deliberately but contributes **zero factual evidence** by itself. `/threads` writes a spoiler-safe brewing overview. The remaining controls tune or inspect the twist engine without advancing the story.

### ❤️ Crossed Wires

```text
/wire <name>
/wires
/wire twists
/wire status
/wire profile
/wire forget <name>
/wire merge <alias> | <canonical>
/wire role <name> | <role>
/wire role <from> | <to> | <role>
/wire age <name> | adult|minor|unknown
/spark
/spark small
/spark medium
/spark major
/wire help
```

Compact slash aliases such as `/wirestatus`, `/wireprofile`, `/wiretwists`, `/wireforget`, `/wiremerge`, `/wirerole`, `/wireage` and `/wirehelp` are accepted too.

Commands are recognised from direct Story input and the normal AI Dungeon Story/Do/Say wrappers. A command mentioned inside ordinary prose is not treated as a control action.

---

## 🛡️ Core rules

The systems are built around a few hard boundaries:

- private thoughts are not facts
- relationship pressure is not proof
- Story Card truth is not automatic NPC knowledge
- private managed Notes are not public story evidence
- twists need story support
- detector guesses never outrank established lore
- explicit knowledge restrictions remain until a believable learning event happens
- Retry should not preserve rejected hidden aftermath
- one subsystem being interested in an NPC is not enough to manufacture a shared focus or reveal

These rules matter more than making the script fire as often as possible.

---


## 🌊 Smooth & Fluid orchestration

The WORLD layer is deliberately **sticky where continuity benefits from stability and immediate where danger demands a switch**. Scene hysteresis prevents weak keywords from jerking the camera around; strong combat/horror/survival signals can still take control instantly. Retrospective or negated action (for example, discussing an earlier fight or saying there is not another attack) no longer hijacks the present scene.

Attention uses near-tie hysteresis so active focus does not ping-pong between equally relevant people. Director ownership also keeps the engines from talking over one another: when TWISTS or Crossed Wires owns the current beat, WORLD ENGINE supplies continuity support instead of opening an unrelated off-screen development.

Emergent arcs now advance on **novel development**, not repeated reads. The same clue can keep an arc alive but cannot inflate its maturity across Input/Context/Output. A distinct clue, changed state, independent source or meaningful consequence can advance it. Background goals use cooldown/rotation, stale arcs decay once per turn, and the WORLD packet filters unrelated consequences away from the active camera.

A dedicated 48-turn camera-flow torture test repeatedly cycles social → investigation → combat → recovery. The release holds the intended mode through each phase, records only 12 legitimate scene switches, has zero focus ping-pong, prevents automatic background pulses from entering high-motion scenes, and preserves structurally complete WORLD packets in Standard and Optimized Context.

---

### 🧩 Documented host-field compatibility

CROSSED ECHOES no longer depends on `title`, `description` or other non-guaranteed Story Card properties surviving between isolated hooks. Managed config identity uses inert sentinel triggers, and entity identity can be reconstructed from canonical Entry forms (`Name:`, `{title: ...}`, `[NAME: ...]`) plus safe trigger aliases. Compatibility names are hook-local and non-enumerable, so the resolver does not pollute manual Story Card objects.

## 🧪 Testing

The package includes:

```text
run_tests.js
twists_hardening_tests.js
world_engine_tests.js
host_contract_tests.js
stress_test.js
high_concept_stress_test.js
codex_noise_stress_test.js
world_engine_long_stress_test.js
fluidity_stress_test.js
relationship_foundation_stress_test.js
second_dawn_codex_replay_test.js
second_dawn_twist_replay_test.js
```

They cover the integration between the three engines, Story Card generation, entity detection, knowledge boundaries, Retry handling, context budgeting, output cleanup and both Standard and Optimized Context behavior.

Run them with:

```bash
node run_tests.js
node twists_hardening_tests.js
node world_engine_tests.js
node host_contract_tests.js
node stress_test.js
CE_CACHE_STRESS=1 node stress_test.js
node high_concept_stress_test.js
CE_CACHE_STRESS=1 node high_concept_stress_test.js
node codex_noise_stress_test.js
CE_CACHE_STRESS=1 node codex_noise_stress_test.js
node second_dawn_codex_replay_test.js
CE_CACHE_STRESS=1 node second_dawn_codex_replay_test.js
node second_dawn_twist_replay_test.js
CE_LIBRARY_FILL=4980 node second_dawn_codex_replay_test.js
CE_LIBRARY_FILL=4980 CE_CACHE_STRESS=1 node second_dawn_codex_replay_test.js
node world_engine_long_stress_test.js
CE_CACHE_STRESS=1 node world_engine_long_stress_test.js
node fluidity_stress_test.js
CE_CACHE_STRESS=1 node fluidity_stress_test.js
node relationship_foundation_stress_test.js
CE_CACHE_STRESS=1 node relationship_foundation_stress_test.js
```

Current verification: **175/175 core integration/regression tests pass**, **23/23 dedicated TWISTS hardening tests pass**, **31/31 WORLD ENGINE tests pass**, and a new **6/6 official-host compatibility suite passes**. The host suite intentionally discards non-documented Story Card fields between isolated hooks, proving that the five config cards, setting changes, titleless entity identity, Established Facts and player/model history attribution survive on AI Dungeon's documented `id / keys / entry / type` contract. The live **324-card SECOND DAWN** export still reconstructs **191 directional relationship foundations** in Standard and Optimized Context. Its CODEX replay preserves manual canon such as unresolved **Sovereign Zero**, resolves **Mira → Mira Vail**, creates **Klaus Von Heisler** and **Symmetry Cell**, and rejects bare-title junk such as **Dr**. A live-library capacity replay padded to **4,980 pre-existing Story Cards** passes in both modes; after the performance hardening its measured p95 is about **1.35 s Standard** and **1.32 s Optimized**, leaving materially more headroom below the host's 2-second hook limit. The speedup comes from eliminating redundant whole-library player-identity scans during relationship bootstrap and avoiding heavyweight alias parsing for irrelevant cards—not from disabling continuity features.


---

## 🌒 Source lineage

**CROSSED ECHOES — The Unspoken Veil** combines three separate AI Dungeon projects:

- **UNSPOKEN TURNS**
- **Crossed Wires**
- **ECHO VEIL**

They still have distinct responsibilities under the hood. CROSSED ECHOES coordinates them, and WORLD ENGINE is the persistent simulation/orchestration layer above that coordination. Evidence authority remains with the story, Story Cards and the specialist systems; WORLD ENGINE decides relevance and continuity pressure rather than inventing truth.

## 🧪 Live-story hardening

The engine is also regression-tested against a large, long-running Story Card library rather than synthetic fixtures alone. That testing hardened several edge cases that matter in real adventures: address forms such as `Dr. Name`, short-name aliases that collide with Event titles, quoted organization labels, existing manual cards whose type must not be overwritten, malformed legacy combined configs, and relationship scenes where the model omits private Crossed Wires tags.

When private relationship tags are missing, Crossed Wires can conservatively recover **observable NPC actions** from visible prose—support, reassurance, protection, apology, forgiveness, betrayal, rescue, hugs/embraces and related events. A proven protagonist name is resolved to `YOU`; the fallback never invents the player's feelings, attraction, consent, choices or private thoughts.



### Twist hardening audit

See `TWISTS_HARDENING_AUDIT.txt` for the dedicated TWISTS AND TURNS 1.3.1 live-story audit and final regression results.
