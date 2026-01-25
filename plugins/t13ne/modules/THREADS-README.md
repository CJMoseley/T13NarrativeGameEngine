# T13NE Threads System

The Threads System is the core management system for Proficiencies, Annexes, Notes, Diegetic text, and Maps in the T13NE plugin.

## Overview

**Proficiencies** are the smallest unit of knowledge in T13NE. They can be combined to create **Annexes**:
- 2 Proficiencies = **Skill**
- 3-4 Proficiencies = **Talent**
- 5+ Proficiencies = **Power** or **Super-Power**

When proficiencies are combined into an Annex, a new proficiency is automatically created in all parent Facets to represent that Annex.

## Architecture

### ProficiencyCatalogue
Central registry for all proficiencies with:
- **ID management** - Auto-incrementing ID system
- **Fast lookups** - Indexed by name and facet
- **CRUD operations** - Create, read, update, delete
- **Search** - Full-text search across name and description
- **Persistence tracking** - Knows when changes need saving

### AnnexBuilder
Manages the combination of proficiencies into Annexes:
- **Validation** - Ensures minimum proficiency requirements
- **Type determination** - Automatically calculates Annex type
- **Facet integration** - Creates proficiencies in parent facets
- **Relationship tracking** - Maintains bidirectional references

### ThreadsSystem
Main entry point that coordinates:
- **Initialization** - Async loading of all data
- **State management** - Provides access to catalogue and builder
- **Export** - Full system state as JSON

## Usage

### From T13NE Plugin

The Threads System is automatically loaded as part of T13NE:

```javascript
import T13NE from '/plugins/t13ne/T13NE.js';

// After T13NE.loadModules()
const threads = T13NE.getModule('Threads');
const catalogue = threads.getProficiencies();
const annexes = threads.getAnnexes();
```

### Direct Import (for UI or utilities)

```javascript
import { ThreadsSystem } from '@plugins/t13ne/modules/t13ne-threads.js';

const threads = new ThreadsSystem();
await threads.initialize();
```

## API Reference

### ProficiencyCatalogue

#### `async load()`
Loads proficiencies from JSON files.

#### `getProficiency(id: string): Object | null`
Retrieve a proficiency by ID.

#### `getProficienciesByName(name: string): Array<Object>`
Find proficiencies by name (case-insensitive).

#### `getProficienciesByFacet(facetId: string | number): Array<Object>`
Get all proficiencies for a specific facet.

#### `createProficiency(data: Object): string`
Create a new proficiency.

**Data object:**
```javascript
{
  name: string,
  description: string,
  facet: string | number,
  tags: Object,
  metadata: Object
}
```

**Returns:** The new proficiency ID

#### `updateProficiency(id: string, updates: Object): boolean`
Update an existing proficiency.

#### `deleteProficiency(id: string): boolean`
Delete a proficiency. Returns success status.

#### `getAllProficiencies(): Array<Object>`
Get all proficiencies.

#### `search(keyword: string): Array<Object>`
Full-text search for proficiencies.

#### `toJSON(): Array`
Export all proficiencies as JSON.

### AnnexBuilder

#### `createAnnex(data: Object): string`
Create an annex from proficiencies.

**Data object:**
```javascript
{
  name: string,
  description: string,
  proficiencyIds: Array<string>,  // minimum 2
  facets: Array<string | number>   // parent facets
}
```

**Returns:** The new Annex ID

**Note:** Automatically creates a proficiency in each parent facet representing this Annex.

#### `getAnnex(id: string): Object | null`
Retrieve an annex by ID.

#### `getAllAnnexes(): Array<Object>`
Get all annexes.

#### `getProficienciesInAnnex(annexId: string): Array<Object>`
Get all proficiencies that make up an annex.

### ThreadsSystem

#### `async initialize(): Promise<boolean>`
Initialize and load the system. Returns success status.

#### `getProficiencies(): ProficiencyCatalogue`
Get the proficiency catalogue.

#### `getAnnexes(): AnnexBuilder`
Get the annex builder.

#### `exportState(): Object`
Export entire system state.

#### `ready(): boolean`
Check if system is initialized.

## Data Structure

### Proficiency Object
```javascript
{
  id: string,
  name: string,
  description: string,
  facet: string | number,
  tags: {
    scope: Array,
    genre: Array,
    era: Array,
    type: Array
  },
  annexes: Array<string>,  // Annex IDs this belongs to
  createdAt: string,       // ISO timestamp
  metadata: Object
}
```

### Annex Object
```javascript
{
  id: string,
  name: string,
  description: string,
  type: 'Skill' | 'Talent' | 'Power',
  proficiencyIds: Array<string>,
  parentFacets: Array<string | number>,
  proficiencyId: string,  // ID of proficiency created for this annex
  createdAt: string,      // ISO timestamp
  metadata: Object
}
```

## Web Interface

Access the interactive Proficiency Manager at:
```
http://localhost:8000/public/plugins/t13ne/proficiency-manager.html
```

Features:
- **Browse** all proficiencies
- **Create** new proficiencies
- **Create** annexes from proficiencies
- **Search** and filter by facet
- **Export** catalogue
- **View details** of each proficiency

## Data Files

Proficiencies are loaded from:
```
/public/plugins/t13ne/data/json/proficiencies/list.json
```

Facet definitions used by the manager:
```
/public/plugins/t13ne/data/json/facets/facets.json
```

## Vite Integration

The Threads System is Vite-compliant:
- ✅ Uses absolute paths (`/plugins/...`)
- ✅ Compatible with Vite's asset handling
- ✅ Works with ES modules
- ✅ Integrates with the T13NE plugin loader
- ✅ No `import.meta.url` relative paths

## Future Enhancements

The system is designed to be extensible:
- **Notes** - Attach notes to proficiencies
- **Maps** - Create visual maps of proficiency relationships
- **Persistence** - Save custom proficiencies to backend
- **Validation** - Rule-based proficiency constraints
- **History** - Track changes and revisions
