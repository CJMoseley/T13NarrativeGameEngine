import T13Geometry from './t13ne-geometry.js';
import T13Dice from './t13ne-dice.js';

function pretty(obj){ return JSON.stringify(obj, null, 2); }

// Example 1: single full geo
const name = 'Alice Example';
const full = T13Geometry.calculateFullGeo(name);
console.log('calculateFullGeo:', full);
document.getElementById('fullgeo').textContent = pretty(full);

// Example 2: impressions for a few names
const names = ['Alice Example','Bob Tester','Carmen Doe'];

function renderImpressions(result){
	console.log('calculateImpressions:', result);
	const out = Object.assign({}, result);
	document.getElementById('impressions').textContent = pretty(out);
}

// initial (no rng)
let impressions = T13Geometry.calculateImpressions(names);
renderImpressions(impressions);

// Wire seed control
document.getElementById('regen').addEventListener('click', ()=>{
	const seed = document.getElementById('seed').value.trim();
	if (seed){
		T13Dice.setSeed(seed);
	}
	// Force RNG modifiers
	impressions = T13Geometry.calculateImpressions(names, '0', 'rng');
	renderImpressions(impressions);
});

// Extra: expose to window for manual testing in console
window.T13Geometry = T13Geometry;
window.T13Dice = T13Dice;
window.demo = { full, impressions };





