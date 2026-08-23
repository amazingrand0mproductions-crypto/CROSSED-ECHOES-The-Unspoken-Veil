# CROSSED-ECHOES-The-Unspoken-Veil
Three of my AI Dungeon scripts combined into one living narrative engine: UNSPOKEN TURNS + Crossed Wires + ECHO VEIL.

CROSSED ECHOES — The Unspoken Veil

A combined living-narrative engine for AI Dungeon built from UNSPOKEN TURNS, Crossed Wires, and ECHO VEIL.

CROSSED ECHOES — The Unspoken Veil takes the three systems and turns them into one coordinated four-tab script. It is not a simple concatenation. The engines keep their specialist logic, while a shared coordination layer manages priority, context space, scenario interpretation, aftermath, retries, and cross-system handoffs.

The aim is simple: NPCs should remember, relationships should matter, twists should be earned, and consequences should keep moving after the scene that created them.

What is combined

UNSPOKEN TURNS / UNSAID

Handles persistent NPC psychology, private wants, beliefs, tensions, behavioral continuity, and adaptive Story Card/Codex work.

TWISTS AND TURNS

Included inside UNSPOKEN TURNS. Tracks evidence-backed plot threads, foreshadowing, payoff readiness, twist tiers, logical gating, and confirmation so revelations are supported rather than random.

Crossed Wires

Tracks directional relationships and how they change over time: trust, resentment, jealousy, affection, attraction, fear, loyalty, roles, scars, needs, unresolved pressure, arcs, and relationship-driven twists.

ECHO VEIL

Handles the wider living-world layer: scene facts, causality, knowledge boundaries, episodic memory, delayed consequences, unresolved threads, pacing, continuity repair, and off-screen agency.

CROSSED ECHOES coordination layer

Makes the three systems cooperate without allowing one system’s private inference to become another system’s factual evidence.

What the merged engine does differently

CROSSED ECHOES lets signals travel between the engines in controlled ways:

• Established Crossed Wires relationship pressure can raise the priority of a compatible existing plot thread, but it cannot invent or prove a secret.
• UNSAID psychological tension can make an established relationship or character more narratively important, while private thoughts remain private and non-factual.
• ECHO VEIL danger and urgency can reduce opportunistic relationship-twist pressure during high-stakes scenes.
• Social or intimate scenes can modestly increase relationship-beat opportunity when the story has room for it.
• Active ECHO consequences and threads increase salience for characters already involved in them.
• Confirmed plot and relationship twists create cross-system aftermath so later behavior and world pressure reflect what actually happened.
• A convergent-focus system activates only when at least two independent engines point toward the same NPC.
• A focus handoff carries compact established relationship/world continuity for that NPC into the shared private guidance while keeping psychology explicitly non-factual.
• A repeat guard reduces automatic dog-piling on the same character immediately after a major beat.
• A recovery guard gives the story a breathing turn after a confirmed major plot or relationship beat. New automatic major payoffs are held back for one turn while reactions, consequences, and changed behavior get room to land. Explicit commands still work and subtle foreshadowing can continue.
• Scenario consensus combines the detectors instead of letting each subsystem drift toward a different genre interpretation.
• Scenario stability reduces one-turn genre flicker without locking the story to an outdated classification.

Structured-beat arbitration

The combined engine prevents multiple high-complexity workers from fighting over the same model response.

Priority is:

1. Manual UNSAID / Codex control.
2. Player-forced Crossed Wires spark.
3. Supported TWISTS AND TURNS plot payoff or foreshadowing.
4. Automatic Crossed Wires relationship pressure.
5. Automatic UNSAID thought / Codex work.

ECHO VEIL continues underneath as the continuity and causality director because its ordinary operation does not require a competing hidden confirmation format.

After a confirmed major plot or relationship beat, the recovery guard temporarily favors reaction and consequence over another automatic major reveal.

Context budgeting

Running three large systems independently can cause the first one to consume the context space needed by the others. The merged build reserves headroom in stages instead:

• ECHO VEIL yields space for Crossed Wires.
• Crossed Wires preserves room for UNSAID and the shared bridge.
• The coordination packet is bounded and only added when enough room remains.

The supplied tests exercise 8k, 16k, and 32k context budgets.

Installation

In your AI Dungeon scenario, open Scripts and replace the four tabs with the files from this package:

1. Library → Library.js
2. Input → Input.js
3. Context → Context.js
4. Output → Output.js

Do not install the three original packages beside this build. Their code is already contained in these four tabs.

Play one normal story turn. The script will create its config cards automatically.

You can also use CONFIG_CARD_IMPORTS.json if you want the supplied full Notes immediately.

Configuration

The original engine settings remain separated so each specialist system can still be tuned properly. The additional integration card is:

CROSSED ECHOES — The Unspoken Veil — Integration

Its live Entry is intentionally compact and remains below AI Dungeon’s 2,000-character Entry limit. Full option explanations are kept in Notes and in CONFIG_NOTES.md.

Main integration settings:

• enabled — master switch for cross-system coordination only.
• sharedScenario — shared scenario/genre consensus.
• singleBeat — single structured-beat arbitration.
• relationships — Crossed Wires → plot/focus salience bridge.
• psychology — UNSAID → relationship/focus salience bridge.
• consequences — ECHO VEIL → pacing/salience bridge.
• contextBridge — private reconciliation packet.
• focusBridge — multi-system convergent NPC focus.
• focusHandoff — compact established continuity handoff for the focus NPC.
• repeatGuard — damp repeated automatic focus after major beats.
• recoveryGuard — one-turn reaction window after confirmed major beats.
• scenarioStability — reduces one-turn genre flicker.
• contextChars — bridge packet character ceiling.
• aftermathWindow — duration used for aftermath continuity and repeat protection.
• debug — coordinator diagnostic logging.

See CONFIG_NOTES.md for every option across all systems.

Commands

Coordinator status:

```text
!crossedechoes
!crossedechoesstatus
!ce
!cestatus
```

Migration aliases are intentionally preserved:

```text
!threadbound
!threadboundstatus
!tbstatus
!unified
!unifiedstatus
```

Existing UNSPOKEN TURNS / TWISTS AND TURNS commands and the Crossed Wires !wire... command family still work.

Existing-save migration

The merge keeps the original state namespaces, including state.unifiedNarrative, to avoid breaking existing adventures.

If an older save contains either of these cards:

• THREADBOUND — Integration
• UNIFIED NARRATIVE — Integration

it is migrated in place to:

• CROSSED ECHOES — The Unspoken Veil — Integration

Old integration keys and old status commands remain accepted. The migration does not intentionally create a duplicate coordinator card.

Retry / Undo safety

Retrying a generation must not leave rejected hidden state behind.

The combined build preserves the source engines’ retry behavior and also retracts coordinator-created state from the rejected turn, including:

• bridge aftermath records,
• coordinator counters,
• coordinator-created UNSAID tension boosts,
• stale convergent focus.

The replacement generation is then processed cleanly.

Evidence safety

The merge follows several hard rules:

• A private fear is not proof.
• A private desire is not canon knowledge.
• A relationship score is not proof of a betrayal or affair.
• A plot thread is not revealed merely because another engine finds the same NPC interesting.
• ECHO VEIL consequences can affect pacing only from already-recorded story evidence.
• Shared focus is a continuity cue, not a reveal trigger.
• Established story facts always outrank detector guesses.

Verification

From the package directory:

```bash
node run_tests.js
node stress_test.js
```

Current captured result:

• 17/17 integration tests passed
• 60-turn stress simulation passed
• 180 hook executions
• 207 Story Cards in the stress environment
• context-budget coverage at 8k / 16k / 32k
• all live config Entries remain under 2,000 characters
• no hidden protocol leakage detected in the stress run
• all four live JavaScript tabs pass syntax validation

See TEST_REPORT.txt for the packaged report.

Included files

• Library.js
• Input.js
• Context.js
• Output.js
• CONFIG_CARD_IMPORTS.json
• CONFIG_NOTES.md
• QUICK_START.txt
• INTEGRATION_NOTES.txt
• REDDIT_DESCRIPTION.md
• SCENARIO_DESCRIPTION.txt
• run_tests.js
• stress_test.js
• TEST_REPORT.txt
• BUILD_MANIFEST.json
• SHA256SUMS.txt

Source lineage

CROSSED ECHOES — The Unspoken Veil is a combination of three existing scripts:

• UNSPOKEN TURNS
• Crossed Wires
• ECHO VEIL

Their specialist systems remain recognizable inside the merged build. The coordinator exists to make those systems reinforce one another instead of independently pushing the model in competing directions.
