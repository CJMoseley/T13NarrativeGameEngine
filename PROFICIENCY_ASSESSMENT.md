# Proficiency Assessment and Proposal

## Executive Summary
The T13 Narrative Game Engine currently contains approximately 3,800 Proficiency entries. However, the vast majority (~95%) are system-generated structural labels (Boon Adjectives and Facet Components). While these provide a functional mechanical framework, the engine is "mimetically sparse" regarding player-facing skills and specialized knowledge for various genres and eras.

## Current Findings
- **Tag Siloing:** Many essential concepts (e.g., "Survival", "Building") exist but are locked to obscure genres (Comedy) or eras (Victorian), making them invisible in general gameplay.
- **Study vs. Subject Gap:** The engine lacks the fundamental pairing of theoretical studies and their practical subjects.
- **Genre/Era Deficit:** Science-Fiction, Fantasy, and Horror lack the discrete Atomic Proficiencies (e.g., Astrogation, Heraldry, Occultism) needed to distinguish them from a generic setting.

## Part 1: Proposed New Atomic Proficiencies (Total: 51)
To fill the primary mimetic holes, I propose adding 51 new Atomic Proficiencies. Following the engine's philosophy, **Studies** are mapped to **Orthodox (14)**, while **Subjects** remain in their parent facets.

### 1. Studies (Orthodox - Facet 14)
- **Scientific:** Archaeology, Sociology, Psychology, Linguistics, Physics, Mathematics, Biology, Medicine, Botany, Zoology, Anatomy, Physiology, Ecology, Chemistry, Pharmacology, Toxicology, Metallurgy, Cryptography, Ballistics, Astronomy, Astrogation, Forensics.
- **Formal:** Rhetoric, Accountancy, Engineering, Mechanics, Electronics, Investigation.

### 2. Subjects (Parent Facets)
- **Burden (1):** Property.
- **Craft (2):** Metals, Machines, Circuits, Structures, Tools, Assembly.
- **Enigma (4):** Codes.
- **Miasma (12):** Toxins, Chemicals.
- **Nature (13):** Plants, Animals, Ecosystems, Growth.
- **Phoenix (15):** Heat.
- **Quiet (16):** Archives.
- **Rook (17):** Shields, Fortifications, Bastions.
- **Trial (19):** Projectiles.
- **Wyrd (21):** Doom.
- **Yonder (22):** Coordinates, Stars.

## Part 2: Proposed Up-Tagging Strategy (Total: 51)
The following 51 existing proficiencies represent universal concepts but are currently "genre-locked". They should be updated with the `T13Core (Genre 1)` and `Timeless (Era 1)` tags to ensure they are available in all games.

| ID | Name | Existing Genre Tag |
| :--- | :--- | :--- |
| 267 | Building / Crafting / Fixing / Jury-Rig / Work | Speculative Fiction (2) |
| 353 | Manipulation / Control / Politics / Self-control | Contemporary (3) |
| 442 | Confuse / Hide / Misdirection / Riddle | Weird Fiction (4) |
| 944 | Perception / Spot Hidden / Lock-picking | Adventure (10) |
| 1027 | Carousing / Dreaming / Law-breaking / Partying | Thriller (11) |
| 1187 | Foraging / Hunting / Stalking / Survival | Comedy (13) |
| 1267 | Examination / Knowing / Researching / Studying | Tragedy (14) |
| 1505 | Blocking / Defending / Guarding / Protecting | Techno-thriller (17) |
| 1665 | Battling / Competing / Fighting / Tactics / Warring | Medical Thriller (19) |
| 1822 | Intuition / Judging / Law-making / Prophecy | Murder Mystery (21) |
| 1985 | Accelerating / Determination / Driving / Travelling | Caper (23) |

## Recommended Action
Implement the "Tag-and-Supplement" strategy:
1. Create a supplemental JSON file for the 51 missing Atomic Proficiencies.
2. Run a batch update script to add Genre 1/Era 1 tags to the 51 identified generic entries.
3. Ensure all "-ology" studies are definitively mapped to Facet 14 (Orthodox).
