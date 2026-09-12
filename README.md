# 🌒 CROSSED ECHOES — The Unspoken Veil: Reforged

**Deep NPC minds, directional relationships, evidence-led twists, mature automatic CODEX Story Cards, world continuity and long-adventure memory for AI Dungeon.**

CROSSED ECHOES: Reforged keeps the mature CODEX and continuity machinery from the full CROSSED ECHOES line, then rebuilds the private character simulation around it. It is designed for long-running adventures where characters should remember what happened, relationships should change because of visible events, mysteries should develop from evidence, and important people/places/items/factions should become usable Story Cards without flooding the library with junk.

The production build is intentionally large. `Library.js` contains the full detection, classification, stopword, alias, persistence, relationship, twist, world, canon and character-simulation machinery rather than replacing mature systems with a small abstraction.

## Core architecture

CROSSED ECHOES separates **public world truth** from **private character state**.

- **CODEX** owns public Story Card lore: Characters, Locations, Items and Factions.
- **REFORGED MINDS** own private NPC psychology in persistent script state.
- **CROSSED WIRES** owns directional relationship history and social pressure.
- **TWISTS AND TURNS** owns evidence-backed long-form twist threads.
- **ECHO VEIL** owns continuity, consequences and unresolved narrative pressure.
- **WORLD ENGINE** models scene/world continuity without forcing unrelated events into the active camera.
- **CANON SENTINEL** protects established facts, knowledge boundaries and player-agency rules.

Private psychology is never promoted into public lore merely because the script knows it.

## 🧭 Player identity and agency

The player character is resolved centrally before autonomous NPC state is created. Strong opening-story identity declarations take priority over stale copied metadata, while platform/Character Card identity remains available as a fallback when the opening does not establish a protagonist.

The resolved player:

- never receives an autonomous private NPC mind;
- never receives invented hidden relationship feelings;
- can be the target of NPC→YOU relationship history;
- can participate in evidence-backed twists and world consequences;
- remains protected from invented intentional dialogue, choices or voluntary actions by the agency guard.

If an older save misclassified the current player as an NPC, the migration path removes player-owned NPC psychology while preserving legitimate NPC→player continuity.

## 🧠 Reforged NPC minds

Active NPCs receive a segmented private brain rather than a single mood string. Persistent state can include:

- public personality anchors from Character cards;
- current mood;
- wants and longer-term goals;
- fears and pressures;
- beliefs and interpretations;
- plans;
- secrets/withheld information when actually supported;
- values and self-reflection;
- important episodic memories;
- relationship-specific opinions;
- character-local knowledge with provenance;
- remembered boundaries;
- accepted private thought packets.

The thought protocol is private and stripped from visible story prose. If the model ignores a private-thought request, visible relationship and behavioural continuity still continue from normal story text.

### Private mind inspector cards

For active/important NPCs, Reforged can maintain an inert Story Card of type `CROSSED ECHOES PRIVATE` whose Entry mirrors the current private mind. Its trigger is script-only and intentionally impossible in ordinary prose.

These cards are excluded from CODEX entity indexing and twist evidence. They are an **inspection surface**, not world canon.

The normal public Character card remains CODEX-owned and is not overwritten with private psychology.

## ❤️ Directional relationships

Relationships are directional. `A → B` and `B → A` are separate histories.

Tracked dimensions include:

- trust
- affection
- attraction
- respect
- fear
- resentment
- jealousy
- suspicion
- loyalty
- intimacy
- dependence
- comfort
- boundary pressure

Visible events can change the relationship even if no hidden model tag is emitted. Supported event families include support, comfort, rescue, protection, affection, flirting, praise, trust, disclosure, promises, arguments, threats, harm, betrayal, deception, abandonment, rejection, apologies, forgiveness, reconciliation, rivalry, jealousy, sacrifice, teamwork and boundary violations.

The engine distinguishes actor from recipient. A supportive act can improve how the recipient feels toward the actor without inventing the actor's private feelings. Player actions only update valid NPC→YOU state; the player does not receive autonomous hidden psychology.

Existing roles can be imported from Story Cards, including family, friendship, romance, ex-partner, roommate, colleague, teammate, mentor/student, guardian/ward, professional and other explicit bonds. Family direction and compatible simultaneous roles are preserved rather than flattened into one generic score.

## 🧠 Knowledge firewall

World truth is not automatically character knowledge.

Knowledge transfer is recipient-local and stores provenance. Telling, revealing, explaining, showing, warning or informing an NPC can add information to that NPC's knowledge without granting it to unrelated characters.

Character-local knowledge is kept separate from private belief. An NPC may know a fact, suspect an interpretation, or privately fear a possibility; those are different states.

## 🌀 TWISTS AND TURNS

TWISTS develops long-form threads from independent evidence instead of announcing random surprises.

The engine supports:

- distinct clue families;
- evidence/source tracking;
- counter-evidence;
- suspicion vs proof separation;
- strict payoff safety;
- cooldowns;
- compound-twist bridge requirements;
- archive/history suppression;
- actor/entity scoping;
- retry/undo safety;
- established-fact writeback only after genuine confirmation.

Repeated paraphrases do not count as unlimited new proof. A thread can mature only from sufficiently independent support.

## 📚 Mature CODEX retained

Reforged retains the mature CODEX rather than replacing it with a minimal entity detector.

### Detection

CODEX combines:

- explicit introductions and naming grammar;
- Unicode-aware proper-name parsing;
- honorific/person grammar;
- quoted and unquoted codenames;
- alias learning;
- repeated mentions;
- dialogue/action grammar;
- semantic type evidence;
- operational/project/company grammar;
- cross-system consensus;
- large stopword/common-noun/noise libraries;
- sentence-starter and heading rejection;
- casing-drift recovery;
- first-sight strong entity rescue.

Explicit multi-word identities receive first refusal, so names such as professional full names, multi-word organisations, named devices, locations and projects are protected from being truncated just because one component is also a common English word.

### Entity types

CODEX creates and refreshes:

- **Character**
- **Location**
- **Item**
- **Faction**

Semantic typing includes ordinary settings as well as high-concept material such as projects, timelines, organisations, transport/logistics entities, manufactured classes, artifacts and named operational destinations.

### Creation and fairness

CODEX supports:

- strong-introduction fast tracking;
- direct evidence scaffolds;
- evidence-only rescue after malformed model card markup;
- pending candidate queues;
- importance/fairness arbitration;
- stale-candidate decay;
- burst-introduction handling;
- refresh scheduling for existing managed cards;
- retry/backoff after refused writes.

Strong explicit player-authored naming is a deterministic correctness path and is not skipped merely because a large archive consumed the soft background-work budget.

### Refresh and manual protection

Managed CODEX cards can refresh from newer visible evidence. Manual Story Cards are protected from accidental takeover, trigger collisions are resolved conservatively, and existing cards are not silently replaced simply because a fuzzy alias resembles them.

CODEX uses the supported Story Card core (`keys`, `entry`, `type`, plus host-provided identity where available) as the reliable runtime contract. Optional richer metadata remains presentation-only when the host preserves it.

### 5,000-card behaviour

The engine reserves required config capacity and refuses unsafe automatic writes at the Story Card ceiling. It does not steal or repurpose unrelated lore. Reforged private minds remain available in script state even when no additional inspector card can be created.

Deep-mind adoption is **scene-lazy**: the mature CODEX index can cover a huge library, but private brains are materialized only for characters that enter the live/recent cast. This keeps large archives practical without throwing away CODEX coverage.

## 🌍 ECHO VEIL, WORLD ENGINE and CANON SENTINEL

ECHO VEIL tracks unresolved consequences, current goals, mysteries, absence/presence, recent assignments and long-arc pressure. It distinguishes questions/theories from confirmed facts and contains anti-loop protection for repeated model prose.

WORLD ENGINE adds bounded scene/world continuity across ordinary and high-concept genres. It can model off-screen pressure, factions, variants, power ecology, causal webs and emergent arcs while keeping the current player-facing scene dominant.

CANON SENTINEL protects current canon boundaries, chronology, knowledge firewalls and player choices from stale or contradictory context.

## ⚙️ Configuration

The existing five CROSSED ECHOES config Story Cards remain the public configuration surface:

- `CROSSED ECHOES — Config — UNSPOKEN TURNS`
- `CROSSED ECHOES — Config — CODEX`
- `CROSSED ECHOES — Config — CROSSED WIRES`
- `CROSSED ECHOES — Config — ECHO VEIL`
- `CROSSED ECHOES — Config — CROSSED ECHOES`

The full option reference is in `CONFIG_NOTES.md`. CODEX keeps its dedicated detection, fast-track, evidence-rescue, card-size, refresh and protection settings. Reforged minds inherit the mature UNSAID activation/cooldown/behaviour settings; directional relationships inherit CROSSED WIRES enable/romance/jealousy/context controls.

## ⌨️ Commands

Public controls use `/` commands. The existing command families remain available, including the unified CROSSED ECHOES status/doctor controls, UNSAID/CODEX controls, CROSSED WIRES controls, TWISTS controls and WORLD ENGINE status/doctor/pulse controls.

Use `/crossedechoes help` inside an adventure for the current command reference.

## 📦 Installation

AI Dungeon uses four script tabs. Copy the matching files from the same release:

1. `Library.js` → Library
2. `Input.js` → Input
3. `Context.js` → Context
4. `Output.js` → Output

Do not mix tabs from different CROSSED ECHOES releases.

Existing mature CROSSED ECHOES state/config cards are retained and migrated where possible. The Reforged private-character state creates its own bounded state namespace while bridging supported continuity back into the mature systems.

## ✅ Verification philosophy

This build is tested with isolated Input/Context/Output hooks, JSON state round-trips, replacement-style Story Card writes, malformed persisted state, retry/undo behaviour, false-positive entity prose, cross-genre scenes, large libraries and hard Story Card ceilings.

The release also includes a dedicated Reforged character-kernel regression covering player exclusion, private thought storage, directional relationships, boundaries, knowledge provenance, anti-repeat, undo, private-card isolation and 5,000-card behaviour.

See `TEST_REPORT.txt` for the exact release results.

## Files

- `Library.js` — complete shared engine and detection libraries
- `Input.js` — player-input processing
- `Context.js` — private context delivery, scheduling and continuity
- `Output.js` — output parsing, persistence and visible-story repair
- `CONFIG_NOTES.md` — configuration reference
- `STORY_CARD_FORMAT.md` — Story Card formats/ownership rules
- `QUICK_START.txt` — installation checklist
- `TEST_REPORT.txt` — verification results
- `BUILD_MANIFEST.json` — release metadata/checksums
- `SHA256SUMS.txt` — file hashes

---

**CROSSED ECHOES: Reforged keeps the mature CODEX as the public world-memory system and makes private character simulation deeper rather than replacing CODEX with a smaller social engine.**
