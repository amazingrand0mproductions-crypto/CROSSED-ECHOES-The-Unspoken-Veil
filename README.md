# 🌒 CROSSED ECHOES — The Unspoken Veil

**A combined AI Dungeon living-narrative engine built from UNSPOKEN TURNS + Crossed Wires + ECHO VEIL.**

CROSSED ECHOES is not three scripts pasted together. The four live tabs now contain a **Fusion Director** that gives the three engines a shared signal bus, scene pacing, entity/pair focus and aftermath handoffs. Psychology, relationships, twists, Story Cards, continuity and consequences can reinforce the same beat without turning private inference into canon.

## Core systems

- **🧠 UNSPOKEN TURNS / UNSAID** — persistent NPC inner life, private wants/beliefs/tension and behavioural continuity.
- **🌀 TWISTS AND TURNS** — evidence-backed long-form threads, foreshadowing, logical gating and confirmed payoffs.
- **❤️ Crossed Wires** — directional relationships, trust, resentment, affection, jealousy, loyalty, roles, scars, repair and relationship arcs.
- **🌘 ECHO VEIL** — causality, knowledge boundaries, episodic memory, consequences, unresolved world threads, continuity and off-screen agency.
- **🔗 CROSSED ECHOES Fusion Director** — shared signal bus, pacing governor, convergent NPC/pair focus, theme resonance, context budgeting, aftermath propagation and Retry/Undo cleanup.
- **📚 CODEX** — automatic entity detection/classification plus detailed Character, Location, Item and Faction Story Cards.

## 🔗 Fusion Director — stronger three-way combination

The integration layer now does more than stop the engines colliding. It actively coordinates **who matters, which bond matters, and what dramatic function the next beat should serve**.

- **Shared signal bus** — combines bounded salience from Crossed Wires relationship history, UNSAID private pressure, TWISTS plot readiness, ECHO VEIL consequences, scene presence and recent confirmed aftermath. Signals change priority only; they never become evidence.
- **Shared pacing governor** — classifies the scene as `aftermath`, `crisis`, `payoff`, `social-pressure`, `consequence`, `breathe` or `steady`, then makes Crossed Wires and ECHO VEIL pull in the same dramatic direction.
- **Convergent pair focus** — a relationship pair becomes shared focus only when another layer points to the **bond itself**. NPC↔NPC pairs use shared/pair-specific pressure instead of borrowing an unrelated problem from one member, reducing false pair convergence.
- **Scene-presence bias** — active/recent characters beat off-screen pressure magnets when scores are close, while serious unresolved ECHO consequences can still matter.
- **Focus stability** — near-tie NPC and pair scores use short hysteresis so the narrative camera does not ping-pong between equally important characters from one turn to the next. A materially stronger candidate still takes over.
- **Freshness decay** — old UNSAID private-state pressure remains stored but gradually loses current-scene salience unless the story refreshes it, preventing abandoned emotional states from dominating later scenes.
- **Theme resonance** — evidence-backed plot themes can modestly bias compatible Crossed Wires relationship beats; world pressure can favour protective/care choices; psychology can favour vulnerable/repair beats. None of this bypasses Crossed Wires' own eligibility gates.
- **Aftermath propagation** — confirmed plot twists, relationship twists, meaningful relationship events, new private-state changes and new ECHO threads/consequences create short-lived pulses so the other engines react instead of forgetting the beat.
- **Priority-safe handoff** — the bridge keeps pacing, pair focus, single-entity focus and knowledge rules as complete lines. It now compacts continuity detail before dropping it entirely, preserving useful handoffs under the normal 1.4k bridge budget.
- **Director contract** — each turn gets one compact contract describing dramatic function, stable focus/bond and structured-beat ownership, helping all three engines reinforce the same beat instead of opening parallel major beats.
- **Knowledge-aware fusion** — ECHO facts that an NPC is explicitly blocked from knowing are filtered out of the cross-system handoff, so better integration does not reintroduce omniscience.

The result is a stronger loop: **people affect relationships, relationships affect plot attention, plot reveals create emotional/world aftermath, and ECHO VEIL decides when consequences or breathing room should take precedence.**

## What changed in this hardened build

### Hard NPC knowledge firewall
ECHO VEIL now separates **world truth** from **character knowledge** much more aggressively. A fact appearing in Story Cards, Plot Essentials, narration or the model's context does **not** automatically mean an NPC knows it.

Explicit boundaries such as `Mercer does not know that Leo has the black key`, `Mercer is unaware of the tunnel`, `Mercer has no idea about the plan`, `unknown to Mercer...`, `Mercer should not know...` and similar wording become persistent per-character knowledge gaps. These are placed near the top of ECHO's private director packet so they survive tight context budgets.

Private creator Notes on a Character Story Card can also define a boundary without putting the secret in Entry:

```text
Does not know: Leo hid the black key beneath the floorboards.
Knowledge Boundary: The north warehouse contains a hidden tunnel.
Restricted Knowledge: Mara is working for Internal Affairs.
```

The script reads those creator Notes directly, keeps them out of public Entry, and displays active boundaries inside the Character's managed **🌘 ECHO VEIL** Notes dashboard. Explicit secret holders also create temporary non-holder restrictions for other active NPCs.

`KNOWLEDGE_FIREWALL = ON` controls the hard boundary layer. `KNOWLEDGE_REPAIR = ON` adds a conservative final safety net that removes clear sentences where an NPC uses an explicitly blocked fact without an on-page way to have learned it. Credible disclosures/observations clear the boundary naturally.

### No visible script analysis
A final output sanitation layer now removes exact hidden tags **and malformed model paraphrases** such as `[NPC [] ...`, `[EVENT ...]`, `[ROLE ...]`, Codex diagnostics and other known internal labels. Real story prose is preserved. Crossed Wires prompts also explicitly tell the model to output an exact hidden tag or no metadata at all — never an `[NPC]` prose paragraph.

### Dedicated Codex config
Codex/Story Card automation is no longer buried inside the UNSAID config. It has its own card:

`CROSSED ECHOES — Config — CODEX`

Key option:

`cardChars=950` — configurable **300–2000** character ceiling for generated Story Card Entries.

### Richer Story Cards
Codex now supports detailed structured profiles for:

- **Characters:** aliases, role, race/nature, age, pronouns, capability, background, personality, appearance, abilities, weaknesses, goals, relationships, affiliations, location, status and significance.
- **Locations:** aliases, type, region, description, atmosphere, layout, key areas, people/factions, features/resources, hazards, history, current state, connections and significance.
- **Items:** aliases, type, appearance, description, properties, abilities, limitations, origin, owner, location, condition, history and significance.
- **Factions:** aliases, type, description, purpose, leadership, members, territory, resources, allies, rivals, reputation, current activity, history and significance.

Unsupported facts are omitted rather than invented. Refreshes merge useful old fields and respect manual-edit protection.

### Cleaner Story Card presentation
- **Entry** = public/canonical story information only.
- **Triggers** = exact name + safe corroborated aliases only.
- **Notes** = creator Notes plus an auto-managed engine dashboard.

Character Notes can show UNSAID, Crossed Wires, ECHO VEIL, TWISTS, coordinator and Codex state. Location/Item/Faction Notes get the relevant world/twist/Codex sections without character-only psychology.

The managed Notes block is excluded from story-evidence scanning, so private psychology cannot bootstrap itself into plot truth.

### Detection hardening
CROSSED ECHOES now uses a shared evidence-driven entity pipeline rather than treating capitalization as identity. The current detector has four layers:

- **Strong-introduction fast path:** explicit player-authored introductions such as `a detective named Nyra Voss`, `the city called Thornhaven`, `a sword named Dawnfall`, or `a guild called The Ashen Circle` can become trusted candidates immediately instead of waiting for three generic mentions.
- **Cross-engine type consensus:** CODEX, ECHO VEIL and Crossed Wires share only public identity/type confidence. A confirmed sword stays an Item when ECHO sees `Nyra draws Dawnfall`; a newly named guild is treated as a group rather than a person; a current named destination can be recognised before its Story Card exists.
- **Candidate hygiene:** weak one-off guesses decay after a quiet stretch and are eventually garbage-collected. Explicit/trusted entities, introduced characters and pending work are protected. Old junk therefore cannot accumulate forever and compete with the current scene.
- **Importance arbitration:** when several legitimate entities are waiting, the single automatic CARD slot is ranked by explicit introduction strength, current ECHO cast/location/item activity, Crossed Wires consensus, fusion focus, recency, evidence strength and waiting time. Repeated malformed CARD attempts get a small fairness penalty so one stubborn candidate cannot starve everything else.

Additional hardening includes Unicode-aware Latin/Greek/Cyrillic names, quoted and unquoted codenames, same-introduction aliases, lowercase/casing drift recovery, route grammar (`Head north on Harbison`), much broader action attribution, Story Card alias refresh matching, common-noun/food/furniture/weather/title/manufacturer stop filters, type-margin arbitration and evidence-only rescue cards after a strong candidate's malformed structured response.

The result is intentionally asymmetric: **strong explicit evidence can fast-track; weak ambiguous evidence decays.** That gives important people/places/items/factions a much better chance of receiving a card without bringing back the old flood of `Scar`, `Door`, `Passenger Seat`, brand modifiers and sentence-starter false positives.

## ⚙️ Five unified config cards

All config cards use category **`CROSSED ECHOES CONFIG`**, have **blank Triggers**, keep editable values in **Entry**, and put the complete guide in **Notes**.

1. `CROSSED ECHOES — Config — UNSPOKEN TURNS`
2. `CROSSED ECHOES — Config — CROSSED WIRES`
3. `CROSSED ECHOES — Config — ECHO VEIL`
4. `CROSSED ECHOES — Config — CODEX`
5. `CROSSED ECHOES — Config — INTEGRATION`

All live config Entries remain below AI Dungeon's 2,000-character config Entry limit. See `CONFIG_NOTES.md` for the exact Entry and full Notes of every card.

## ECHO VEIL config documentation

ECHO VEIL's live config Notes are a built-in manual covering:

- SUBTLE, BALANCED, CINEMATIC, LONGFORM and DYNAMIC presets;
- every ON/OFF subsystem;
- what AUTO means;
- every numeric range and what raising/lowering it changes;
- causality, threads, knowledge, **KNOWLEDGE_FIREWALL**, **KNOWLEDGE_REPAIR**, continuity and off-screen agency;
- episodic memory and consolidation;
- detection strictness and event confidence;
- context share and guidance caps;
- consequence/thread/off-screen pressure;
- Retry/rewind, temporal-scope and uncertainty safety;
- store limits and recommended tuning.

## Current AI Dungeon platform compatibility

This research pass was checked against AI Dungeon's current scripting and Story Card documentation rather than relying only on older script conventions.

- **Native cache-compatible Context:** `Context.js` begins with `// @cache-compatible`. On cache-efficient / Optimized Context calls, CROSSED ECHOES preserves the complete host Context as an unchanged prefix and appends only complete bounded suffix packets. If there is not enough headroom for a packet, that worker yields instead of rewriting/truncating the host prefix.
- **Standard Context still supported:** on ordinary models the original staged context budgeting remains available, including the 8k / 16k / 32k regression coverage.
- **Story Card visibility is respected:** only Entry is model-facing when a Story Card activates; Name and Notes are treated as creator/UI metadata. Generated Entries therefore identify their own subject explicitly.
- **Trigger whitespace is treated literally:** Codex-generated alias lists are emitted as `name,alias` rather than `name, alias`, so the alias does not accidentally gain a leading space.
- **Append-safe Story Card creation:** the documented API return index is supported, but config/Codex bootstrap also verifies the card that was actually appended before mutating UI metadata. This avoids a wrong-card write if a wrapper/runtime reports a different numeric value.
- **Story Card economy:** Codex keeps `cardChars` configurable from 300–2000, but the default remains intentionally compact and non-character candidates now require a fresh mention before stale accumulated counts can schedule a card.
- **No moving Optimized-Context pseudo-lore:** when a low-headroom cache-compatible TWISTS packet cannot fit, it yields instead of creating a temporary all-match Nudge Story Card that could waste lore allocation or arrive stale.
- **Private Notes remain non-evidence:** CROSSED ECHOES can use managed Notes as script state/debugging, but those private sections are stripped from plot/scenario evidence scans and never treated as public canon.

See `RESEARCH_NOTES.md` for the platform findings that informed this pass.

## Installation

Replace the four AI Dungeon script tabs with:

1. **Library** → `Library.js`
2. **Input** → `Input.js`
3. **Context** → `Context.js`
4. **Output** → `Output.js`

Do **not** install the three source packages alongside this build; their code is already included.

Then play one normal turn to create/migrate config cards. You can also import `CONFIG_CARD_IMPORTS.json` for the supplied polished Notes immediately.

> **Important:** AI Dungeon Story Card import replaces the entire existing Story Card set. If the Scenario/Adventure already contains lore cards, export them first and merge the five CROSSED ECHOES config objects into that JSON rather than importing the config file by itself.

## Commands

Coordinator:

```text
!crossedechoes
!crossedechoesstatus
!ce
!cestatus
```

Legacy merged aliases remain compatible:

```text
!threadbound
!threadboundstatus
!tbstatus
!unified
!unifiedstatus
```

UNSAID/Codex examples:

```text
/peek <name>
/peek <name> core
/card <name>
/alias <character> = <alias>
/unalias <character> = <alias>
/unsaid status
/unsaid health
/unsaid resetcodex
```

Existing TWISTS AND TURNS and Crossed Wires command families remain available.

## Structured-beat arbitration

Major hidden structured work is prioritised so systems do not fight over the same response:

1. manual UNSAID/Codex;
2. player-forced Crossed Wires spark;
3. supported TWISTS AND TURNS beat;
4. automatic Crossed Wires pressure;
5. automatic UNSAID work.

ECHO VEIL continues underneath as continuity/causality director. Recovery Guard gives reactions/consequences room after confirmed major beats.

## Evidence and safety rules

- Private fear/desire ≠ fact.
- Relationship pressure ≠ proof.
- Managed Notes ≠ story evidence.
- A twist needs story support.
- Story Card/world truth ≠ automatic NPC knowledge.
- Explicit “does not know / unaware / should not know” boundaries persist until an established learning event.
- Character knowledge remains perspective-bounded.
- Retry/Undo retracts rejected hidden aftermath.
- Established lore outranks detector guesses.
- Explicit player commands may override automatic pacing, but not fabricate evidence on their own.

## Context budgeting

The merged build reserves headroom in stages rather than letting one engine consume everything. Regression tests cover **8k, 16k and 32k** budgets in standard mode. Optimized Context is tested separately with the same three budgets and asserts that the returned Context begins with the **exact original host prefix** on every pass.

Cache-compatible packets are atomic: a TWISTS instruction, ECHO director block, Crossed Wires block, Fusion Director packet or UNSAID/Codex task is appended whole when it fits; lower-priority work yields when it does not. This avoids half-instructions and preserves provider prefix caching.

## Verification

Run:

```bash
node run_tests.js
node stress_test.js
```

Current build:

- **74/74 integration/regression tests passed**
- **standard 60-turn / 180-hook stress simulation passed**
- **Optimized Context 60-turn / 180-hook stress simulation passed** with exact-prefix assertion every Context call
- **208 Story Cards** in both stress environments
- cache-compatible TWISTS Retry replay tested without advancing thread state
- whitespace-safe multi-trigger alias generation tested
- stale non-character Codex freshness gate tested
- UNSAID public-canon personality anchoring / anti-drift tested
- weak-candidate confidence decay + stale garbage collection tested
- multi-candidate fairness/importance arbitration tested
- first-sight ECHO Location/Item/Faction typing before Story Card generation tested
- malformed `[NPC []` output-leak regression covered
- hard NPC knowledge-boundary Context regression covered
- private Character Notes → knowledge-boundary regression covered
- illegal knowledge output repair + attributed-dialogue repair + legitimate disclosure clearing covered
- explicit secret-holder / active non-holder restriction covered
- dedicated Codex config + `cardChars 300–2000` regression covered
- Character/Location/Item/Faction field coverage tested
- non-character managed Notes tested
- scenario/evidence isolation tested
- Retry/Undo, arbitration, focus/recovery and hidden-tag cleanup tested
- Fusion signal bus, pair-specific convergence, focus hysteresis, stale-psychology decay, shared pacing, scene-presence bias and knowledge-aware handoff tested
- all live JavaScript tabs pass syntax validation

See `TEST_REPORT.txt` for the captured report.

## Included files

- `Library.js`, `Input.js`, `Context.js`, `Output.js`
- `CONFIG_CARD_IMPORTS.json`
- `CONFIG_NOTES.md`
- `STORY_CARD_FORMAT.md`
- `QUICK_START.txt`
- `INTEGRATION_NOTES.txt`
- `RESEARCH_NOTES.md`
- `REDDIT_DESCRIPTION.md`
- `SCENARIO_DESCRIPTION.txt`
- `run_tests.js`, `stress_test.js`
- `TEST_REPORT.txt`
- `BUILD_MANIFEST.json`
- `SHA256SUMS.txt`

## Source lineage

CROSSED ECHOES — The Unspoken Veil combines **UNSPOKEN TURNS**, **Crossed Wires**, and **ECHO VEIL**. The specialist systems remain distinct internally; the coordinator exists to make them behave like parts of one persistent story.
