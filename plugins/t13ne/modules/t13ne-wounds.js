import Logger from '@/js/core/Logger.js';
import CodexLoader from '../modules/CodexLoader.js';

/**
 * T13NE Wounds Module
 * Manages the generation and description of physical and psychological wounds.
 */
class T13NE_Wounds {
	constructor() {
		this.initialized = false;
	}

	async initialize() {
		if (this.initialized) return;
		this.initialized = true;
		Logger.message("T13NE_Wounds: Initialized.");
	}

	/**
	 * Generates a wound description.
	 * @param {string} lvl - The wound level index.
	 * @param {string} mode - The display mode ('svg', 'jsvg', or default).
	 * @returns {string} HTML description of the wound.
	 */
	getWound(lvl, mode) {
		const Wounds = CodexLoader.getData("wounds");
		if (!Wounds || !Wounds[lvl]) {
			Logger.warn(`T13NE_Wounds: Wound level '${lvl}' not found.`);
			return "Unknown Wound";
		}

		const level = Wounds[lvl];
		if (mode === 'svg' || mode === 'jsvg') {
			return `<div><strong class="t13ne-woundname">${level['Name']}</strong><details><summary></summary><p class="t13ne-base-pips">Base Pips to summon: ${level['Base_Pips']}</p><p class="t13ne-min-pips">Limit Card Pips: ${level['Base_Pips']}</p><p class="t13ne-desc">${level['Description']}</p><details class="t13ne-roll"><summary>Rules</summary>${level['Wound_Roll']}</details><details class="t13ne-ordeal"><summary>Ordeal Rules</summary>${level['Wound_Ordeal']}</details><details class="t13ne-psych"><summary>Psych Wounds</summary><details class="t13ne-negative"><summary>Negative Psych</summary><p class="t13ne-normal"><strong>Normal</strong>${level['Negative_Normal']}</p><p class="t13ne-extreme"><strong>Extreme</strong>${level['Negative_Extreme']}</p></details><details class="t13ne-positive"><summary>Positive Psych</summary><p class="t13ne-normal"><strong>Normal</strong>${level['Positive_Normal']}</p><p class="t13ne-extreme"><strong>Extreme</strong>${level['Positive_Extreme']}</p></details></details></details></div>`;
		} else {
			return `<div><details><summary><strong>Wound: </strong><span class="t13ne-woundname">${level['Name']}</span></summary><p class="t13ne-base-pips">Base Pips to summon: ${level['Base_Pips']}</p><p class="t13ne-min-pips">Limit Card Pips: ${level['Base_Pips']}</p><p class="t13ne-desc">${level['Description']}</p><details class="t13ne-roll"><summary>Rules: </summary>${level['Wound_Roll']}</details><details class="t13ne-ordeal"><summary>Ordeal Rules: </summary>${level['Wound_Ordeal']}</details><details class="t13ne-psych"><summary>Psych Wounds</summary><details class="t13ne-negative"><summary>Negative Psych</summary><p class="t13ne-normal"><strong>Normal: </strong>${level['Negative_Normal']}</p><p class="t13ne-extreme"><strong>Extreme: </strong>${level['Negative_Extreme']}</p></details><details class="t13ne-positive"><summary>Positive Psych</summary><p class="t13ne-normal"><strong>Normal: </strong>${level['Positive_Normal']}</p><p class="t13ne-extreme"><strong>Extreme: </strong>${level['Positive_Extreme']}</p></details></details></details></div>`;
		}
	}
}

export default new T13NE_Wounds();