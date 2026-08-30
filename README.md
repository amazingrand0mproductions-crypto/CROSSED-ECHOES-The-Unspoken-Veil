# 🌒 CROSSED ECHOES — The Unspoken Veil

**A living narrative engine for AI Dungeon combining UNSPOKEN TURNS, Crossed Wires and ECHO VEIL.**

CROSSED ECHOES is built for long-running stories where characters, relationships, secrets and consequences are meant to carry forward instead of resetting from scene to scene.

It combines three separate systems into one four-tab AI Dungeon script:

- **🧠 UNSPOKEN TURNS** handles NPC psychology and the things characters do not always say out loud.
- **❤️ Crossed Wires** handles relationships, trust, tension, loyalty, attraction, resentment and long-term bonds.
- **🌘 ECHO VEIL** handles continuity, knowledge, consequences, world state, memory and off-screen pressure.

**TWISTS AND TURNS** is included inside UNSPOKEN TURNS for long-form plot threads, foreshadowing and earned reveals.

**CODEX** handles automatic Story Card detection, creation and maintenance.

The systems keep their own jobs, but they share enough information to follow the same story instead of acting like three separate scripts.

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

---

### 🌀 Twists are seeded instead of thrown in randomly

TWISTS AND TURNS watches for story-supported possibilities and develops them over time.

A twist can be planted, reinforced through later evidence and held back until there is enough support for a payoff.

The system is designed around one important rule:

> **Suspicion is not proof.**

A private fear, relationship problem or interesting NPC can make a plot thread more relevant, but it cannot magically prove that a betrayal, hidden identity, conspiracy or secret is true.

This keeps twists tied to the story that actually happened.

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

Strong introductions can be recognised quickly:

> a detective named Nyra Voss

> the city called Thornhaven

> a sword named Dawnfall

> a guild called The Ashen Circle

Weak or ambiguous guesses need more evidence. Old one-off guesses gradually lose confidence and are eventually removed from the candidate pool, which helps stop junk cards from building up over a long adventure.

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

`/twist` forces the next eligible payoff. `/plant` starts a thread deliberately. `/threads` writes a spoiler-safe brewing overview. The remaining controls tune or inspect the twist engine without advancing the story.

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

## 🧪 Testing

The package includes:

```text
run_tests.js
stress_test.js
```

They cover the integration between the three engines, Story Card generation, entity detection, knowledge boundaries, Retry handling, context budgeting, output cleanup and both Standard and Optimized Context behavior.

Run them with:

```bash
node run_tests.js
node stress_test.js
```

---

## 🌒 Source lineage

**CROSSED ECHOES — The Unspoken Veil** combines three separate AI Dungeon projects:

- **UNSPOKEN TURNS**
- **Crossed Wires**
- **ECHO VEIL**

They still have distinct responsibilities under the hood. CROSSED ECHOES is the layer that lets those responsibilities feed the same long-running story without flattening psychology, relationships, plot and world continuity into the same thing.
