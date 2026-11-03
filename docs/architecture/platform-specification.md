# Proposed platform architecture

Status: proposal, not an existing API. JavaScript and browser deployment are the primary target; keep platform-specific APIs behind adapters so other JavaScript hosts and optional native/WASM services remain possible. No renderer, network service, AI provider or game genre is mandatory for the rules core.

## Product boundaries

1. **Rules and narrative runtime:** T13 entities, mechanics, outcomes, plots, ordeals, deterministic random streams, commands and state. Runs without DOM, rendering, networking or an AI service.
2. **Platform services:** session authority, storage, codex/assets, permissions, networking, scheduling, diagnostics and optional AI. Dependencies are injected into a session.
3. **Presentation and simulation:** browser UI, 2D/3D scenes, physics, input, audio and workers. A game adapter translates domain intents and simulation observations into approved T13 commands and turns resulting events into presentation effects.
4. **Authoring environment:** create, validate, preview, version and package games, scenarios, worlds and T13 content. The VTT uses the same content and runtime, with referee-specific tools.
5. **Products:** Wormhole Racers and tabletop companion are independently bootstrapped applications built on the platform. Neither should define another product's rules.

This is a destination, not a mandate to replace existing modules. First wrap and test existing behavior, then extract seams incrementally.

## Proposed session contract

Use explicit versioned, JSON-serializable messages. The following illustrates shape only; names and payload schemas must be agreed and implemented before becoming compatibility promises.

```js
command = { version: 1, id, sessionId, actorId, expectedRevision, type, payload }
event = { version: 1, id, sessionId, commandId, revision, type, payload, visibility }
snapshot = { version: 1, sessionId, revision, rulesVersion, contentVersions, randomState, state }
```

- A session authority authenticates the participant, validates command shape, permissions, expected revision and T13 preconditions, then accepts or rejects with a structured reason. Repeated command IDs must not apply twice.
- Accepted commands produce ordered events and a new revision. Publish only authorized projections; referee secrets must not be sent to a player merely hidden in UI. Do not send all secrets to a peer who is not authorized to hold them.
- Save explicit state and RNG stream state, not functions, DOM or AI-client objects. Define event retention and snapshot policy before claiming full event sourcing. Restore and migrate atomically; reject unsupported future versions with a visible error.
- Fixed seeds and identical validated inputs must reproduce core results. Record external AI output and other nondeterministic decisions when they affect authoritative state. AI suggests; a rules command or referee confirmation commits changes.
- Keep personal/local tabletop use possible without assuming hostile participants, but label offline trust limitations. A referee-hosted browser is authoritative only within its chosen trust model; a malicious host cannot be made trustworthy through client checks.

## Simulation and narrative adapter

Simulation publishes timestamped observations with stable IDs and participant/scene references. The game adapter filters/coalesces noisy events, translates permitted observations to domain intents, and maps accepted T13 outcomes back to simulation or presentation. Define idempotency, ordering, time boundaries and units for every adapter event.

The experimental physical Value Test accepts already-calculated Values from multiple contributors and an opposing Value. If the total is larger, it applies a caller-supplied force to a registered PhysX body once; a tie is returned for adjudication. This does not establish a universal Value-to-force conversion or guarantee movement. The caller must supply calibrated units, choose when to invoke the operation, and handle authority, timing and repeated application. Percentage Tests, Facet mismatch complications, Character lookup and game integration are not implemented by this operation.

The Cards API can explicitly interpret a six-card Quest spread using `interpretQuestSpread(spread)`, also exposed through `Spread:InterpretQuest` with the spread in command context. In line order from bottom to top, the two Tao bits on each card define the situation and solution hexagrams. This author-confirmed mapping corrects the legacy PHP trigram arithmetic. The result retains cards, position contexts, both source hexagrams and changing-line Quest text; it does not automatically create a Plot, choose effects, or advance a Quest.

Character I-Ching calculation requires twelve Facet pairs and initialized hexagram data. Equal pairs may be resolved by a caller-provided Yin/Yang choice or by a random roll. `getCharacterRules` exposes the first hexagram's Gain conditions, changing-line Gains, or its Unchanging power as source data; it does not adjudicate conditions or execute those powers. Existing saved hexagrams are not recalculated automatically.

Example: a racing collision produces a collision observation; the game-specific policy proposes an ordeal/stakes or damage-related intent; the authority applies the relevant T13 rules; resulting consequences update the narrative and, where specified, ship state. The rules owner must define the actual mapping and referee override behavior. Never assume each physics frame becomes an ordeal.

## Games, content and tools

- A versioned game package declares identity, engine and rules compatibility, entry points, content dependencies, assets, capabilities and migrations. Validate references and report missing or incompatible dependencies before start.
- Extension lifecycle: discover, validate, initialize, start, stop and dispose; define owned resources and failure isolation. Existing Vite discovery is an implementation to adapt, not a stable third-party plugin API.
- Editor and runtime use the same schema validators and stable entity IDs. Drafts are distinct from published packages; preview uses an isolated session. Import/export, migrations, attribution and provenance must be explicit.
- Distinguish rules data, scenario content, local user preferences, private referee material and live session state. Packaged code execution and untrusted content require an explicit trust/sandbox policy.

## Content verification and game authority

The following captures the Author's intended authority model; it is not yet
an implemented verification or permission system.

- **Core:** the current canonical Core set is the verification baseline.
  The existing catalogue may still have missing Proficiencies, so absence
  from the current inventory is not proof that a Core identity is available
  for reuse. Authorized maintainers can issue new canonical Core versions.
- **Modules and settings:** Authors verify modules and their requirements for
  a setting. Authors also verify a video game's setting and integrations.
  Verification applies to the identified content and version; it does not
  grant permission to replace a Core identity.
- **Local games:** referees verify content for their tabletop games and
  sessions. Depending on the game type and its organization, Yarn-tellers
  may have a separate verification step. Their exact responsibilities and
  relationship to referee approval remain to be defined per game type.
- **Game types:** a game type may define its verification workflow, roles,
  permissions and sandbox policy. The platform must support this variation
  without assuming all games have the same referee or Yarn-teller workflow.
  The trusted host must enforce the selected policy; a peer cannot grant
  itself authority simply by claiming a role or supplying a policy.

Verification of content, identity authentication, session authorization and
execution isolation are separate concerns. Approval does not by itself
authenticate a sender, authorize transfer of private data, or make executable
code safe. Policies must distinguish data visibility and permitted operations
from capabilities offered by the host; game-specific flexibility does not
expose local personal files or credentials to peers.

The package and adapter contracts must support games other than Wormhole
Racers, including different display models and external game engines. A
setting's verification and integrations must not depend on the VTT or the
Wormhole Racers renderer. Exact verifier credentials, delegation, policy
composition, conflict handling and offline trust remain design decisions,
not established implementations.

## Networking and distributed work

Define transport independently from authority: local, host-mediated WebRTC and server-backed adapters may share the same session protocol. Signaling and STUN/TURN availability, encryption in transit, disconnect/reconnect, authorization and deployment costs must be documented and tested. Do not promise fully serverless connectivity across every network.

Distributed compute is optional and separate from authoritative game decisions. A future scheduler should use capability/consent registration, typed allowlisted jobs, versioned inputs, IDs, deadlines, cancellation, bounded resources, retries and result validation. Peers must not be sent arbitrary executable code or referee-private data without an explicit trust model. Local execution is the default fallback; a disconnect cannot corrupt authoritative state. Benchmark results are hints, not proof of correctness.

## Initial architecture decisions to resolve

Record owner-approved decisions before freezing public interfaces: canonical engine source and packaging; rules authority; multiplayer topology and trust model; referee/player visibility; race-to-ordeal mapping; save and content version policy; optional AI role; and which game-creation tools constitute the first release. Support JavaScript-first deployment without claiming Unity/Unreal feature parity or a native runtime.
