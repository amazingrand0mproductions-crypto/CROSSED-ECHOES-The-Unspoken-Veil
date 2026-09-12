# CROSSED ECHOES — Unified Config + Causal Impact Edition

CROSSED ECHOES is an AI Dungeon scripting suite built around a simple rule: **if the script tracks something important, that state must be able to affect what happens next.**

This edition keeps the mature CODEX, UNSAID, CROSSED WIRES, TWISTS AND TURNS and Live Pulse systems, then closes the gap between *recording state* and *using state*. Relevant stored state is now translated into compact, scenario-neutral guidance in the Context hook so it can materially influence the model's next generation.

## The causal pipeline

### CODEX — public canon has consequences
CODEX remains the authoritative public-lore layer. Active Story Cards are not merely detected or updated: selected public facts for entities currently present are reasserted as **active canon constraints**.

When relevant, the model is reminded to respect established:

- roles and relationships
- powers, abilities, skills and weaknesses
- status and ownership
- location/purpose/function
- personality, goals and affiliations
- other bounded public Story Card facts

The packet explicitly tells the model not to silently invent extra powers, biography or relationships. Newer visible story events still outrank stale card facts.

### CROSSED WIRES — relationships change behaviour
Relationships are directional: `A → B` and `B → A` can differ.

Premade Character Story Cards can seed family, friendship, ally, rival, romantic, mentor, peer, guardian, workplace and other roles. Live events then evolve trust, affection, attraction, respect, fear, resentment, jealousy, suspicion, loyalty, intimacy, dependence, comfort and boundary pressure without replacing the established role.

Those values now produce **behavioural pressure**, not just dashboard numbers. Examples:

- high trust → more willingness to rely on or believe the target
- low trust / high suspicion → guarded behaviour and verification
- resentment → unresolved friction can colour choices and tone
- loyalty → stronger pressure to defend, assist or remain committed
- low comfort / high boundary pressure → distance, caution or firmer limits
- family/friend/ally/rival/mentor roles → the relationship is treated as established history rather than invented afresh

The player never receives an autonomous emotional state and the script never forces the player to reciprocate an NPC's feelings.

### UNSAID — NPC minds drive decisions
NPC private state can retain goals, plans, wants, fears, beliefs, commitments, values, secrets, important memories and local knowledge.

The important change is delivery: active NPC private pressures are now converted into a narrator-only causal packet that tells the model to let them influence what the NPC:

- notices
- prioritizes
- chooses
- avoids
- says
- withholds
- reacts to

Private thoughts remain private. The packet does not grant telepathy, does not dump secrets into visible prose, and does not create a mind for the player character.

### TWISTS AND TURNS — threads develop and then affect the story
Twists remain evidence-led. Duplicate clues do not count twice, counter-evidence can weaken readiness, and strict logic blocks unsupported reveals.

Threads follow **seed → develop → ready → payoff**. Readiness is re-evaluated during ordinary maintenance, so enough distinct evidence plus enough age can mature a thread even if no new clue lands on that exact turn.

A previous delivery gap is fixed: normal non-cache twist/subtext hints are now actually appended to model context. The managed hint budget was also increased so a payoff instruction cannot be cut off midway through its required marker.

### ECHO VEIL — visible motives persist
ECHO VEIL is no longer a tracker-only compatibility layer. Visible NPC motives such as plans, wants, fears or intentions can be carried forward as **motive continuity pressure** when that NPC remains relevant.

This is intentionally weaker than the private UNSAID mind: it represents motives established through visible story material. New visible evidence can change them.

### WORLD ENGINE — location changes continuity
WORLD ENGINE now acquires scene location from active typed Location/Place/Setting Story Cards and carries that forward as a scene anchor.

That location can affect spatial and environmental continuity until visible travel, teleportation, displacement or another location change is established. On huge archives, location detection uses a cheap type-first path to stay within AI Dungeon's runtime limit.

### CANON SENTINEL — recent visible events carry forward
Canon Sentinel now retains a bounded set of recent visible story beats and can reassert ones that have fallen out of the immediate text window.

It distinguishes continuity from objective truth: dialogue claims remain claims. Newer player actions and newer visible events always outrank older stored beats.

### LIVE PULSE — proof without debug spam
Live Pulse reports **real state changes** through the player-facing message channel instead of inserting debug text into the story.

Examples:

- `❤️ relationship updated: Maya Walker→YOU`
- `🧠 NPC mind updated: Maya Walker`
- `📚 CODEX saved: Glass Key`
- `🌀 twist thread deepened: C-12`
- `🌀 twist matured: C-12 (payoff eligible)`

`/pulse` also reports whether causal context delivery is active and which causal packets were delivered on the latest Context hook.

Use:

- `/pulse` — dashboard + recent activity
- `/pulse smart` — recommended default
- `/pulse verbose` — more visible activity
- `/pulse off` — silence notifications only; the engine continues working

## Premade Story Card relationships

Relationship seeding understands structured sections such as:

- `Relationships:`
- `Family:`
- `Friends:`
- `Allies:`
- `Rivals:`
- `Connections:`
- `Bonds:`

It also understands common direct fields and forms such as `Mother: Sera Walker`, `Ezra Walker — nephew`, `Ezra Walker (nephew)` and similar patterns.

Role direction is normalized. If Maya's card says `Ezra Walker — nephew`, the system derives Maya → Ezra as aunt/uncle rather than incorrectly calling Maya the nephew.

## Scenario independence

The causal layer contains no built-in superhero, fantasy, horror, western, modern or science-fiction plot assumptions. It works from the scenario's own Story Cards, visible events and accumulated state.

The release matrix is explicitly tested against:

- fantasy
- science fiction
- contemporary
- western
- horror

The tests verify that each genre's own NPC plan, relationship and canon facts reach model context without importing a default setting.

No script can guarantee that a generative model will obey every instruction on every turn. What this release guarantees at the scripting level is that relevant tracked state is **actually placed into the model input path** rather than living only in hidden counters or diagnostics.

## Noise and identity hardening

The name detector filters common context headings such as `Recent Story`, `Current Scene`, `Plot Essentials`, `Author Notes`, `AI Instructions`, `Front Memory`, `Story Cards` and similar labels so they cannot become fake NPC minds.

Relationship vocabulary has also been broadened for general scenarios, including allies, guardians/wards, neighbours, peers/classmates, workplace hierarchy, clients/counsel and business partners.

## Configuration — two cards, not five

This release consolidates the old five-card configuration surface into **exactly two genuine configuration Story Cards**:

1. **CROSSED ECHOES — Config — CORE** — TWISTS AND TURNS, UNSAID/NPC minds, CROSSED WIRES relationships, ECHO VEIL and Integration/World Engine/Canon Sentinel.
2. **CROSSED ECHOES — Config — CODEX** — specialist Story Card detection, creation, refresh and protection controls.

There is no third hidden config. The private diagnostics dashboard now uses the separate `CROSSED ECHOES PRIVATE` type. Legacy five-card adventures are read and safely migrated into CORE when the old cards can be positively identified as script-owned configuration cards.

Every option exposed in either card is explained in that card's **Notes/Description** with its accepted values, default, purpose and important trade-offs. Runtime authority remains the card **Entry**. Relationships now have one authoritative configuration section instead of duplicate switches in UNSAID and CROSSED WIRES.

The runtime also avoids repeatedly trying to rewrite title/Notes fields on hosts that do not expose them, reducing unnecessary Story Card work on large archives.

## Install

1. Open the AI Dungeon Scenario editor.
2. Open **Scripting**.
3. Replace the four script tabs with `Library.js`, `Input.js`, `Context.js`, and `Output.js`.
4. Save all four tabs.
5. Optional: import `CONFIG_CARD_IMPORTS.json`.
6. Start a fresh test adventure.
7. Run `/ce doctor` and then `/pulse`.

Do not concatenate the four files into one tab.

## Useful commands

- `/ce` — overall status
- `/ce doctor` — runtime diagnostic
- `/ce help` — command overview
- `/pulse` — causal/runtime activity dashboard
- `/pulse smart|verbose|off` — notification mode
- `/unsaid status` — mind/CODEX status
- `/unsaid health` — write/config health
- `/peek <name>` — private-mind diagnostic request
- `/card <name>` — force a CODEX creation/refresh request
- `/alias <character> = <alias>` — add alias
- `/unalias <character> = <alias>` — remove alias
- `/wire <name>` — inspect one character's directional bonds
- `/wires` — inspect all tracked relationships
- `/threads` — inspect twist threads
- `/twist <name>` — request an evidence-backed payoff candidate
- `/plant <name> [category]` — deliberately plant a plotting direction

Administrative commands are consumed locally rather than being sent into story prose.

## How to verify causal impact

Use a small test scenario with one established NPC, one premade relationship and one non-character Story Card.

1. Run `/ce doctor` and `/pulse`.
2. Give the NPC a visible positive or negative interaction and inspect `/wire <name>`.
3. Continue a scene with that NPC. The relationship should not only change numerically; the Context system should use the changed relationship as behavioural guidance.
4. Establish an NPC plan or goal. On later relevant turns, UNSAID should carry that pressure forward without printing the private note verbatim.
5. Mention a typed Location Story Card. WORLD ENGINE should retain the scene anchor until visible relocation occurs.
6. Seed a mystery with two genuinely distinct clues. `/threads` should show development; age + support should eventually permit readiness.
7. `/pulse` should show which real subsystems changed and whether causal context delivery occurred.

Creator-side model-context inspection, where available, is the strongest verification because it lets you see the actual causal packets delivered to the model.

## Story Card Notes

Core operation does not depend on Notes. Public canon belongs in Story Card Entry. Private minds, relationship metrics, twist state and causal diagnostics live in persistent script state. Notes remain presentation/documentation where supported.

## Large libraries

The release stays archive-lazy. Dormant Character cards are not all materialized into full live minds. At the 5,000-card ceiling, automatic writes fail closed instead of overwriting unrelated lore.

The release gate includes a synthetic **4,998 Character Story Card** archive under a 16 MB sandbox. The latest run kept every hook below two seconds while still developing a new live NPC relationship; the maximum observed hook in the final causal build was **1.383 seconds**.

## Files

- `Library.js` — mature CODEX, UNSAID, relationships, twists, causal context, ECHO/WORLD/Canon integration and Live Pulse
- `Input.js` — player input, commands and turn processing
- `Context.js` — model-context scheduler and causal delivery
- `Output.js` — output parsing, state learning and CODEX refresh
- `CONFIG_CARD_IMPORTS.json` — optional config-card import
- `CONFIG_NOTES.md` — configuration reference
- `QUICK_START.txt` — short install/test checklist
- `TEST_REPORT.txt` — release validation
- `AUDIT_SUMMARY.md` — technical audit
- `tests/` — regression, scenario-matrix and constrained-runtime tests
