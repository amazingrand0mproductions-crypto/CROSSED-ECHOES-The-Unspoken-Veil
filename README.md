# CROSSED ECHOES

**Living characters. Persistent relationships. Long-form twists. Automatic world memory.**

CROSSED ECHOES is an AI Dungeon scripting system designed to make a scenario feel as though its characters, relationships, mysteries and world are actually continuing between turns instead of resetting whenever the prose moves on.

Its central rule is simple: **if the script tracks something important, that information should be able to influence what happens next.**

---

## 📚 CODEX — Automatic Story Card Intelligence

CODEX watches the story for genuinely established people, locations, items and factions, then builds and refreshes Story Cards from evidence already present in the adventure.

It is designed to distinguish real entities from ordinary prose, headings and throwaway words. Repeated mentions, explicit introductions, aliases, dialogue cues, scene relevance and cross-system agreement all contribute to confidence before a card is created.

### 🧱 Junk Firewall

Automatic cards now pass a multi-stage evidence firewall. **Capitalization or “looks like a name” is never sufficient on its own.** Unknown candidates must prove both identity and entity type through character behaviour, explicit naming, location grammar, item use/ownership, faction behaviour, scenario declarations, or independent system confirmation. Dialogue openers, pronouns, headings, field labels, ordinary verbs/adjectives, technical prose, clause fragments and generic phrases are rejected before card creation.

The same strict gate applies to very large Story Card libraries. CODEX also re-audits its own provisional cards and can remove a generated false positive later, while protected/manual lore remains untouched. Explicit introductions still allow unusual real names and intentionally generic named projects.

CODEX can preserve supported details such as:

- identity, aliases and role
- appearance and personality
- powers, abilities and weaknesses
- goals, affiliations and relationships
- ownership, status and location
- important history and current circumstances
- location layout, atmosphere and hazards
- item properties, limits and significance
- faction leadership, purpose, allies and rivals

Existing good information is preserved during refreshes. Manual cards are protected when configured, unsupported fields are omitted rather than invented, and trigger collisions are handled without overwriting unrelated lore.

Relevant public Story Card facts can also become **active canon pressure**, helping the model respect established abilities, relationships, ownership, setting and continuity in later generations.

---

## ❤️ CROSSED WIRES — A Relationship Graph That Remembers the Past

CROSSED WIRES does more than assign one label such as *friend* or *mother*. It builds a **directional, multi-role relationship graph** and then lets the emotional state around those roles evolve.

A pair can hold several established roles at the same time. Two characters might be **siblings + coworkers + rivals**, or **former partners + current allies**. Ending one role does not erase every other connection or the history that came with it.

### Existing relationships are recovered instead of starting from zero

When the script enters an already-developed adventure, it actively backfills relationship canon from the information AI Dungeon makes available, including:

- premade Character/NPC Story Cards and their relationship fields
- relationship blocks such as `Relationships:`, `Family:`, `Friends:`, `Allies:` and `Rivals:`
- direct structured fields such as `Mother:`, `Children:`, `Mentor:`, `Boss:`, `Guardian:` and similar roles
- the opening/start history and available recent Adventure history
- Plot Essentials and other persistent lore that reaches model Context
- Story Summary / persistent pre-history context
- Author's Note / context-tail relationship canon when present
- the current Input and visible model Output as the story continues

That means a long-running scenario does not need every relationship to happen again after installing the script. If the existing canon already says two people are sisters, ex-spouses, mentor/mentee, roommates or rivals, CROSSED WIRES can recover that bond before the next scene needs it.

### Broad built-in relationship coverage

The built-in taxonomy covers family and kinship, romance and relationship history, friendship and social bonds, rivals/enemies, household relationships, education and mentorship, work and command structures, legal and medical/care relationships, protection/guardianship, political/feudal relationships, religious relationships, criminal/coercive relationships, creator/creation and supernatural bonds, ownership/caretaking relationships, clients/providers and many other scenario types.

Examples include parents/children, biological/adoptive/foster/step family, siblings and twins, grandparents and great-grandparents, aunts/uncles, nieces/nephews, cousins, in-laws, godparents, spouses, fiancés, dating partners, exes, separated spouses, friends-with-benefits, crush direction, best/close/childhood/former friends, confidants, allies, companions, frenemies, rivals, enemies, neighbours, roommates, mentor/mentee, teacher/student, coach/trainee, advisor/advisee, master/apprentice, coworkers, teammates, business partners, boss/employee, captain/crew, landlord/tenant, creditor/debtor, buyer/seller, lawyer/client, doctor/patient, therapist/client, caregiver/dependent, handler/asset, sponsor/protégé, guardian/ward, protector/protectee, captor/captive, investigator/suspect, ruler/subject, liege/vassal, clergy/congregant, accomplices, informants, creator/creation, summoner/summoned and more.

No finite list can cover every fictional relationship, so **explicit custom roles are also preserved** when they appear in trusted structured lore. A scenario can therefore establish something unusual such as *oathbound sentinel*, *blood-sworn witness* or *pack-second* without CROSSED WIRES forcing it into the wrong category. Custom roles are not guessed from ordinary prose.

### Directional feelings stay separate from factual roles

CROSSED WIRES can track:

- trust
- affection
- attraction
- respect
- loyalty
- resentment
- jealousy
- suspicion
- fear
- intimacy
- dependence
- comfort
- boundary pressure

These values are directional. **Mara → Elias** can be warm and trusting while **Elias → Mara** is suspicious or resentful. Public roles can be reciprocal while private attitudes are not.

Structured Story Cards can seed an explicitly written attitude in one direction without inventing the other character's feelings. Live visible events then change the relationship over time: help, protection, betrayal, lies, apologies, attacks, boundary violations, reconciliation and other consequential interactions can leave durable pressure. Historical events exposed in Adventure history can also be backfilled once, so an old betrayal does not vanish simply because the script was installed later.

### Relationships can change without deleting history

CROSSED WIRES understands explicit role evolution such as dating, engagement, marriage, separation, divorce, breakups, estrangement, reconciliation and ended friendships. Former roles are retained as bounded history rather than silently overwritten.

A stale premade card also does not automatically resurrect a relationship the live story has already ended. If the Story Card itself is deliberately edited later, the changed canon is detected and can refresh the graph.

### Anti-inference safeguards

The relationship engine deliberately refuses several tempting shortcuts:

- a shared surname does not automatically mean family
- two people standing in the same scene does not make them friends
- flirting or kissing alone does not automatically create a formal romantic role
- an NPC's feelings do not create the player's private feelings
- negative statements such as “they are not sisters” or “they are not dating” do not create the denied relationship
- relationship pressure can shape a twist, but it is not factual proof of the twist

When relevant, established roles and accumulated sentiment become **behavioural guidance in Context**. A suspicious ally should verify claims. An estranged parent should carry shared history without automatically acting warm. A former mentor can retain familiarity without still having present authority. A loyal friend may accept more risk to help.

The point is not to collect relationship statistics. It is to make old relationships, changing feelings and shared history **matter to the next scene**.

---

## 🧠 NPC MINDS — Characters With Private Continuity

NPCs can maintain private inner state instead of behaving like blank dialogue generators every turn.

An NPC mind can retain bounded information such as:

- goals
- plans
- wants
- fears
- beliefs
- values
- commitments
- secrets
- important memories
- knowledge and uncertainty
- unresolved emotional pressure

Relevant private state can influence what an NPC notices, prioritises, says, avoids, hides, chooses and reacts to.

Private information stays private unless the visible story reveals it. Other characters are not granted telepathy, and the player character is deliberately excluded from autonomous NPC-mind generation.

The result is designed to create characters who can carry grudges, remember promises, pursue plans, change priorities and react differently because of what has already happened.

---

## 🌀 TWISTS AND TURNS — Built, Not Randomly Dropped

Twists are treated as developing threads rather than instant random reveals.

A thread can progress through:

**seed → develop → ready → payoff**

The system tracks distinct evidence, age, counter-evidence, pacing and cooldowns. Repeating the same clue does not magically count as several clues, and strict logic can require genuine grounding before a reveal is allowed.

Foreshadowing can therefore accumulate over many turns before finally paying off. Relationship pressure, NPC psychology, Story Card canon and visible story evidence can reinforce compatible threads without being treated as proof on their own.

Compound twists can combine compatible threads when the story already provides a believable connection. Mature twist categories can be separately controlled.

The goal is long-form plotting that feels earned rather than a surprise generator firing every few turns.

---

## 🌘 ECHO VEIL — Visible Motives That Persist

ECHO VEIL carries forward motives and intentions that have actually appeared in the visible story.

If an NPC has clearly been trying to protect someone, avoid a place, investigate a mystery or accomplish a task, that visible motivation can continue to shape behaviour even after the exact sentence falls out of immediate context.

ECHO VEIL is intentionally different from NPC Minds: it deals with **visible continuity**, not hidden psychology.

---

## 🌍 WORLD ENGINE — Scene and Location Continuity

WORLD ENGINE helps the adventure remember where the current scene actually is.

Typed Location, Place and Setting Story Cards can establish a scene anchor that persists until visible travel, teleportation, displacement or another genuine location change occurs.

This reduces arbitrary scene jumps and helps locations matter as continuing spaces rather than disposable backdrops.

---

## 🛡️ CANON SENTINEL — Recent Events Stay Relevant

Canon Sentinel carries forward a bounded set of recent visible events after they begin to fall out of immediate context.

It is designed to preserve consequences without pretending every spoken claim is objective truth. A character saying something remains a claim unless the story establishes it as fact, and newer visible events always outrank older remembered continuity.

---

## 💠 LIVE PULSE — See the Engine Working

Live Pulse gives the player a quiet, spoiler-safe indication that meaningful internal changes are really happening.

It can surface events such as:

- a relationship changing
- an NPC mind updating
- CODEX successfully creating or refreshing a card
- a twist thread deepening
- a twist reaching payoff readiness

It never needs to expose the actual private thought or reveal the answer to a developing twist. The player can see that the machinery is active without turning the story into a debug log.

`/pulse` shows current activity. `/pulse smart` is the recommended normal mode, `/pulse verbose` shows more activity, and `/pulse off` hides the notifications without disabling the underlying systems.

---

## ⚙️ TWO CONFIG CARDS — CLEAN AND AUTHORITATIVE

CROSSED ECHOES uses **two configuration Story Cards only**.

### ⚙️ CROSSED ECHOES — Config — CORE

The CORE card controls:

- TWISTS AND TURNS
- NPC Minds / UNSAID
- CROSSED WIRES relationships
- ECHO VEIL
- WORLD ENGINE
- Canon Sentinel
- cross-system behaviour and performance safeguards

Its Notes explain every exposed option, accepted value, default behaviour and important trade-off.

### 📚 CROSSED ECHOES — Config — CODEX

The CODEX card controls:

- automatic entity detection
- Story Card size
- mention and observation thresholds
- creation pacing
- refresh behaviour
- manual-card protection
- detection strictness
- alias learning
- evidence rescue
- scaffold behaviour

Its Notes also explain every exposed option and its safe range.

There are no separate CROSSED WIRES, ECHO VEIL, TWISTS or Integration config cards competing with CORE. Relationship settings have one authority, CODEX settings have one authority, and diagnostics are not presented as configuration.

---

## 🔗 SYSTEMS WORK TOGETHER

CROSSED ECHOES is designed as one connected engine rather than a collection of unrelated trackers.

A Story Card can establish that two characters are siblings. CROSSED WIRES can then preserve that role while tracking changing trust and resentment. NPC Minds can remember the argument that caused the resentment. ECHO VEIL can preserve the visible intention to make amends. A developing twist can use separate evidence involving the same characters. CODEX can keep the public facts stable. Live Pulse can confirm that each system is changing without spoiling the private state.

That interaction is the point of the script: **memory should create consequences.**

---

## 🎭 BUILT FOR DIFFERENT KINDS OF SCENARIOS

The systems are scenario-neutral. They do not require superheroes, fantasy, modern drama, horror, science fiction or any other specific setting.

They work from the adventure's own characters, Story Cards, visible events, relationships, locations and established rules. A detective mystery can build suspicion and evidence. A romance can develop trust and boundaries. A political story can track alliances and betrayals. A fantasy campaign can remember factions, relics and locations. A superhero story can keep powers, family relationships and long-running conspiracies coherent.

The script adapts to the scenario instead of forcing the scenario to adapt to the script.

---

## 🎮 PLAYER COMMANDS

Useful player-facing controls include:

- `/status` — overall CROSSED ECHOES status
- `/pulse` — recent engine activity
- `/pulse smart|verbose|off` — Live Pulse mode
- `/peek <name>` — request an NPC private-state check
- `/card <name>` — request CODEX creation or refresh
- `/alias <character> = <alias>` — add an explicit alias
- `/unalias <character> = <alias>` — remove an alias
- `/wire <name>` — inspect one character's directional relationships
- `/wires` — inspect tracked relationships
- `/threads` — inspect spoiler-safe twist development
- `/twist <name>` — request an evidence-backed payoff candidate
- `/plant <name> [category]` — deliberately begin a plotting direction

Commands are administrative controls and are consumed by the script rather than treated as ordinary story prose.

---

## 🌒 THE CROSSED ECHOES IDEA

A character should remember what happened to them.

A relationship should matter after the scene where it changed.

A secret should be able to develop before it is revealed.

A location should still be the same location next turn.

A Story Card should affect canon rather than simply exist in a menu.

And when the script spends time tracking something, **that information should have a reason to exist in the story.**
