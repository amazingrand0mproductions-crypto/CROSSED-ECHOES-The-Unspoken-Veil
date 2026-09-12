# CROSSED ECHOES — Startup-Safe Full CODEX Reforged

CROSSED ECHOES is an AI Dungeon scripting suite for automatic Story Card management, persistent NPC psychology, directional relationships, evidence-led twists, continuity and bounded world-state guidance.

This release is built specifically for AI Dungeon's isolated scripting sandbox. It preserves the mature CODEX engine while removing the old archive-wide duplicate runtime mirrors that caused adventure-start failures on large libraries.

## What is retained

### Mature CODEX
The full mature CODEX detector/refresh path remains the public-lore engine. It supports:

- Character, Location, Item/Technology and Faction detection
- large stopword/noise libraries
- explicit-introduction fast paths
- Unicode names and designations
- alias learning and canonicalization
- entity-type reconciliation
- evidence rescue
- direct scaffolding
- evidence-backed refresh
- manual-card protection
- trigger collision handling
- write verification/backoff
- stale-candidate pruning
- bounded shared Story Card indexing
- 5,000-card hard-ceiling safety

Explicit multi-word names are protected. A title such as `Dr. Linnea Frost`, an item such as `the Glass Key`, and a faction such as `Orion Mutual Aid Society` remain intact instead of collapsing into partial names.

### UNSAID — NPC minds
Active/recent NPCs can retain bounded private state including thoughts, goals, plans, fears, beliefs, values, secrets, important memories, mood/tension continuity, character-local knowledge and private opinions. The player character is excluded from autonomous NPC-mind creation.

### CROSSED WIRES — directional relationships
Relationships are directional. `A → B` and `B → A` are separate. The engine tracks trust, affection, attraction, respect, fear, resentment, jealousy, suspicion, loyalty, intimacy, dependence, comfort and boundary pressure, plus meaningful event history.

Visible interactions can update relationships even when the model omits hidden metadata. The script never invents the player's private feelings.

### TWISTS AND TURNS
Twists remain evidence-led. Duplicate clues do not count as independent support; counter-evidence can weaken readiness; archive-only lore does not automatically become a present-day threat.

### ECHO / WORLD / Canon compatibility
The public integration/config surface remains present, but the old archive-wide duplicate ECHO/WORLD/coordinator implementations have been replaced with bounded scene-local facades. This is deliberate: carrying multiple generations of the same engine exceeded the sandbox memory budget. CODEX remains the authoritative public-lore engine; minds, relationships and live continuity live in bounded persistent state.

## Why this edition starts reliably

The previous oversized build could pass desktop Node tests yet fail before an AI Dungeon adventure started because every hook had to compile and execute too much code/state in an isolated sandbox.

This release keeps the mature CODEX/UNSAID/TWISTS core and makes active-character/world processing lazy and scene-local. `Library.js` remains over 10,000 functional lines, but dormant archive characters are not all materialized into live minds/relationships at startup.

## Install

1. Open the AI Dungeon Scenario editor.
2. Open **Scripting**.
3. Replace the four script tabs with:
   - `Library.js`
   - `Input.js`
   - `Context.js`
   - `Output.js`
4. Save all four tabs.
5. Optional: import `CONFIG_CARD_IMPORTS.json` to pre-create the five configuration Story Cards.
6. Start a test adventure.
7. Run `/ce doctor`.

Do not concatenate the four files into one tab.

## Configuration cards

The release reserves and supports five owned config cards:

1. `CROSSED ECHOES — Config — UNSPOKEN TURNS`
2. `CROSSED ECHOES — Config — CODEX`
3. `CROSSED ECHOES — Config — CROSSED WIRES`
4. `CROSSED ECHOES — Config — ECHO VEIL`
5. `CROSSED ECHOES — Config — INTEGRATION`

The script preserves room for all five when approaching the Story Card hard ceiling.

## Useful commands

- `/ce` — overall status
- `/ce doctor` — runtime diagnostic
- `/ce help` — command overview
- `/unsaid status` — mind/CODEX status
- `/unsaid health` — write/config health
- `/peek <name>` — force a private-thought check
- `/card <name>` — force a CODEX creation/refresh request
- `/alias <character> = <alias>` — add alias
- `/unalias <character> = <alias>` — remove alias
- `/wire <name>` — inspect directional relationships
- `/wires` — inspect all tracked relationships
- `/threads` — inspect twist threads
- `/twist <name>` — request an evidence-backed payoff candidate
- `/plant <name> [category]` — deliberately plant a twist direction

Administrative commands are consumed locally instead of being sent into story prose.

## How to verify it is working

Run `/ce doctor` immediately after starting. Then test one explicit new Character, Location, Faction and Item. Strong explicit introductions should create the full names rather than partial duplicates.

Interact meaningfully with one NPC and use `/wire <name>`. Positive and negative actions should change the NPC's directional bond toward the other person.

Use two independent mystery clues and inspect `/threads`; repeating the same clue should not mature the thread by itself.

## Story Card Notes

Dynamic Notes/title persistence is treated as optional presentation rather than authoritative storage. Public canon belongs in CODEX Entry. Private minds and relationship state live in persistent script state. If metadata writes are unavailable, the script uses supported Entry/state paths rather than silently depending on Notes.

## Large libraries

The release is archive-lazy. CODEX can search a large Story Card library without creating a live mind for every dormant Character. At the 5,000-card ceiling, automatic writes fail closed instead of overwriting unrelated lore.

## Files

- `Library.js` — mature CODEX / UNSAID / TWISTS plus startup-safe relationship and compatibility kernels
- `Input.js` — player-input processing and commands
- `Context.js` — bounded context scheduler
- `Output.js` — lean output parser/delivery shell and CODEX refresh path
- `CONFIG_CARD_IMPORTS.json` — optional five-card config import
- `CONFIG_NOTES.md` — configuration reference
- `QUICK_START.txt` — short install checklist
- `TEST_REPORT.txt` — release validation
- `tests/` — selected regression and constrained-runtime tests
