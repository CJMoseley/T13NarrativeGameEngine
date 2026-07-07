# Proficiency Assessment and Proposal (Revised)

## Executive Summary
The T13 Narrative Game Engine currently contains approximately 3,800 Proficiency entries. However, ~95% are system-generated structural labels (Boon Adjectives and Facet Components). The engine is "mimetically sparse" regarding player-facing subjects and their corresponding scientific studies.

## Key Rules & Philosophy
1.  **Study vs. Subject:** All formal studies, sciences, and disciplines (especially those ending in *-ology* or *-istry*) belong in the **Orthodox (Facet 14)** facet. The fundamental entities they study belong in their respective parent facets (e.g., *Plants* in Nature vs. *Botany* in Orthodox).
2.  **Annex Combinations:** Annexes that combine facets (e.g., a "Combat" Skill) automatically create/utilize proficiencies in each facet. Standalone proficiencies for these combinations should generally be avoided unless they serve as base building blocks.
3.  **Tagging over Duplication:** Universal concepts should be tagged with `T13Core (Genre 1)` and `Timeless (Era 1)` rather than duplicated for each genre.

---

## Part 1: Proposed New Atomic Proficiencies (Total: 54)
I have identified 54 essential Atomic Proficiencies missing from the engine. These are categorized by Facet and follow the "Study vs. Subject" rule.

### 1. Studies (Orthodox - Facet 14)
These represent formal disciplines and sciences:
*   **Scientific:** Archaeology, Sociology, Psychology, Linguistics, Physics, Mathematics, Biology, Medicine, Botany, Zoology, Anatomy, Physiology, Ecology, Chemistry, Pharmacology, Toxicology, Metallurgy, Cryptography, Ballistics (Study of Projectiles), Astronomy, Astrogation, Forensics.
*   **Formal:** Rhetoric, Accountancy, Engineering, Mechanics, Electronics, Investigation.

### 2. Subjects (Parent Facets)
These provide the "Subject" building blocks that are currently missing:
*   **Burden (1):** Property.
*   **Craft (2):** Metals, Machines, Circuits, Structures, Tools, Assembly.
*   **Enigma (4):** Codes.
*   **Miasma (12):** Toxins, Chemicals.
*   **Nature (13):** Plants, Animals, Ecosystems, Growth.
*   **Phoenix (15):** Heat, **Healing**, **Regeneration**, **Resurrection**.
*   **Quiet (16):** Archives.
*   **Rook (17):** Shields, Fortifications, Bastions.
*   **Wyrd (21):** Doom.
*   **Yonder (22):** Coordinates, Stars, **Projectiles** (Moved from Trial).

---

## Part 2: Proposed Up-Tagging Strategy (Total: 51)
The following 51 existing proficiencies represent universal concepts but are currently "genre-locked" (i.e., they lack the T13Core tag). I propose adding the `T13Core (Genre 1)` and `Timeless (Era 1)` tags to these entries.

### Full List of Candidate IDs for Up-Tagging:
259, 267, 345, 353, 442, 510, 525, 527, 608, 683, 686, 694, 776, 854, 861, 936, 944, 1019, 1027, 1091, 1099, 1107, 1179, 1187, 1188, 1251, 1259, 1267, 1268, 1339, 1346, 1401, 1410, 1418, 1425, 1497, 1505, 1577, 1585, 1665, 1734, 1742, 1806, 1814, 1822, 1880, 1897, 1905, 1906, 1977, 1985.

### Significant Highlights:
*   **ID 267:** Building / Crafting / Fixing / Jury-Rig / Work
*   **ID 353:** Manipulation / Control / Politics / Self-control
*   **ID 944:** Perception / Spot Hidden / Lock-picking
*   **ID 1187:** Foraging / Hunting / Stalking / Survival
*   **ID 1346:** Burning / Cleaning / Cooking / Healing / Regeneration
*   **ID 1505:** Blocking / Defending / Guarding / Protecting
*   **ID 1985:** Accelerating / Determination / Driving / Travelling

---

## Recommended Action
Implement the "Tag-and-Supplement" strategy:
1.  **Create:** A supplemental JSON file for the 54 missing Atomic Proficiencies.
2.  **Up-Tag:** Run a batch update to add T13Core/Timeless tags to the 51 identified generic entries.
3.  **Refine:** Ensure all studies (e.g., Botany, Ballistics) are definitively mapped to Facet 14 (Orthodox).
