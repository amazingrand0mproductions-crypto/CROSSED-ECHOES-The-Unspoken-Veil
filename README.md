# CROSSED ECHOES v2.0

**Persistent NPC minds, directional relationships, social pressure, evidence-led twists, and automatic CODEX Story Cards for AI Dungeon.**

CROSSED ECHOES v2.0 is a ground-up rebuild. It does not use Story Card Notes as a database and does not depend on undocumented Story Card metadata. Persistent simulation state lives in `state.CE2`; Story Cards are used only for public lore, configuration, optional private dashboards, and inspectable diagnostics.

## What it does

### NPC minds
Active NPCs can maintain a private brain containing:

- core personality traits
- current mood
- wants and goals
- fears and beliefs
- plans
- private first-person thoughts
- important memories
- private opinions about specific people
- character-local knowledge

Minds are created lazily for relevant NPCs rather than for an entire Story Card library at once. The player character is never allowed to become an autonomous NPC mind.

### Directional relationships
Relationships are stored per direction. `Alice → Bob` and `Bob → Alice` are separate records.

Tracked dimensions include trust, affection, attraction, respect, fear, resentment, jealousy, suspicion, loyalty, intimacy, and tension. Established relationship roles can also be imported from Character Story Cards.

Visible actions can develop relationships even when the AI does not emit a hidden state tag. The engine resolves actor and recipient so being helped, attacked, comforted, betrayed, praised, or rescued changes the correct character's view.

### Living social threads
NPC-to-NPC relationships can create persistent social pressure such as affection, suspicion, resentment, jealousy, fear, or loyalty. These pressures are fed back as subtext rather than forced events, allowing side relationships to continue without making every scene revolve around the player.

### Witness-bounded knowledge
World truth is not treated as universal character knowledge. NPCs learn through things they witnessed, were told, discovered, read, or can reasonably infer. Knowledge is stored separately from private opinion and from relationship metrics.

### TWISTS AND TURNS
Twists follow an evidence ladder:

`seeded → developing → ripe → resolved`

Supported thread classes include hidden identity, secret allegiance, conspiracy, cover-up, betrayal, survival, and hidden agenda.

A ripe thread does **not** automatically reveal itself. Resolution requires enough independent clues plus direct visible confirmation such as a verified record, admission, forensic match, recovered order, ownership proof, or living witness. Suspicion remains distinct from proof.

### CODEX
CODEX detects recurring public entities and can create Story Cards for grounded story lore such as:

- Characters
- Locations
- Factions / organizations
- Items

Generated cards contain public, story-supported information only. Private thoughts never go into CODEX lore. Creator-written Story Cards are protected by default.

### Private mind dashboards
When enabled, NPC minds can be mirrored into inert `CE Private` Story Cards using the supported Story Card **Entry** field. These cards are for player inspection; their internal trigger keys are designed not to activate as ordinary lore.

The authoritative mind remains in `state.CE2`, so deleting a dashboard does not redefine the NPC's underlying simulation state.

### Optimized Context support
CROSSED ECHOES owns a small marked block inside Front Memory and preserves creator-written Front Memory around it. The Context hook is append-only: it leaves the host prompt intact and adds a bounded private director packet only when space permits.

## Installation

AI Dungeon exposes four scripting fields. Copy the matching files from this package:

1. `Library.js` → **Library**
2. `Input.js` → **Input**
3. `Context.js` → **Context**
4. `Output.js` → **Output**

Enable scripts and start/continue an adventure. On first use, the engine creates a configuration Story Card with the key:

`__crossed_echoes_v2_config__`

## Commands

- `/ce` or `/ce status` — engine status
- `/ce help` — command list
- `/mind <name>` — refresh a private mind inspection card
- `/relations` — inspect recent relationships
- `/relations <name>` — inspect relationships involving one character
- `/threads` — inspect twist threads and resolved payoffs
- `/codex` — CODEX queue/status
- `/card <name>` — request a CODEX card for a detected entity
- `/ce debug on`
- `/ce debug off`

Commands are handled by the script and should not advance the story.

## Core design rules

1. **State is the database.** Story Cards are not used as the authoritative store for private simulation state.
2. **Player agency is protected.** The engine never creates a player mind or player-origin hidden relationship psychology.
3. **Private and public information are separate.** CODEX contains public lore; minds contain private interior state.
4. **Knowledge is local.** Characters do not inherit facts merely because the author or another NPC knows them.
5. **Relationships are directional.** Actor, recipient, witness, and social consequence are resolved separately.
6. **Twists require evidence.** The engine can maintain uncertainty without forcing a mastermind, betrayal, resurrection, or reveal.
7. **Manual lore is respected.** Existing creator cards are protected by default.
8. **Large libraries degrade safely.** At the Story Card ceiling, simulation continues from persistent state instead of replacing existing lore.

## Verification

The release build is tested against:

- isolated Input / Context / Output hooks
- JSON state round-trips
- retry/replacement of the same action
- action-count rewind / undo
- documented Story Card fields only (`id`, `keys`, `entry`, `type`)
- ignored or malformed hidden model tags
- player-identity conflicts
- manual Story Card protection
- relationship directionality
- knowledge isolation
- evidence-led twist resolution and undo
- subsystem-disable configuration
- 12 different story genres
- large Story Card libraries near the 5,000-card limit
- a 120-turn / 360-hook long-campaign stress run

See `TEST_REPORT.md` for the release results.

## Why v2 was rebuilt

The previous architecture accumulated multiple persistence layers and compatibility shims. v2 intentionally reduces the engine to a small set of explicit state machines with one source of truth for each concern. This makes the behavior easier to inspect, test, and maintain.

Research influences are documented in `RESEARCH_AND_DESIGN.md`. The implementation in this package is original.
