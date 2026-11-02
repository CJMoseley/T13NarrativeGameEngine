# T13 narrative game platform: planning index

Status: discovery and proposed design, 2026-11-02. This is a working plan, not a claim that the engine or any product is complete.

The goal is a JavaScript-first platform for creating and running narrative-driven games: T13 is the underlying rules and narrative model; Wormhole Racers is a real-time game made with it; the companion is a way to author and play T13 together online. The platform should eventually support other genres and game projects without copying the engine or baking Wormhole Racers assumptions into it.

- [Current-state assessment](./current-state.md): evidence, limitations and risks.
- [Roadmap and backlog](./roadmap.md): prioritized work, dependencies and completion gates.
- [Platform architecture specification](./platform-specification.md): proposed boundaries and contracts.
- [Product and implementation specifications](./product-specifications.md): testable vertical slices for rules, VTT, racing and authoring.

These documents describe a target and a sequence of experiments; they do not authorize a big-bang rewrite. Existing behavior and user data must be preserved through incremental migration. Where T13 rules or product behavior are ambiguous, record a decision with the rules owner before encoding it as fact.
