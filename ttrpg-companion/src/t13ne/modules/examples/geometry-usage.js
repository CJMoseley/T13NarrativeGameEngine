// Example usage of the ported geometry and dice modules
// Assumes the ported modules live at ../t13ne-geometry.js and ../t13ne-dice.js

import * as T13Geometry from '../t13ne-geometry.js';
import T13Dice from '../t13ne-dice.js';

// Example 1: calculate a full geometry for a single name
function exampleFullGeo(){
    const name = 'Alice Example';
    const geo = T13Geometry.calculateFullGeo(name);
    console.log('Full geometry for', name, geo);
}

// Example 2: deterministic impressions using a seed
function exampleDeterministicImpressions(){
    const names = ['Alice','Bob','Carol','Dave'];
    // set a seed for deterministic RNG
    T13Dice.setSeed('demo-seed-42');
    // modifiers = 'rng' triggers the RNG-generated modifiers path in the port
    const impressions = T13Geometry.calculateImpressions(names, 0, 'rng');
    console.log('Deterministic impressions (seed=demo-seed-42):', impressions);
}

// Example 3: non-RNG â€” pass explicit modifiers array
function exampleExplicitModifiers(){
    const names = ['Alice','Bob','Carol'];
    // build an explicit modifiers array (same shape as the PHP port expects)
    // here we create a simple small modifier list
    const mods = [0, 1, -1, 2, -2, 0];
    const impressions = T13Geometry.calculateImpressions(names, 0, mods);
    console.log('Impressions with explicit modifiers:', impressions);
}

// Run examples when loaded as a module in the browser
export function runExamples(){
    exampleFullGeo();
    exampleDeterministicImpressions();
    exampleExplicitModifiers();
}

// If loaded directly via `<script type="module"> import './examples/geometry-usage.js'; geometryExamples.runExamples(); </script>`
// call `runExamples()` from the importer.





