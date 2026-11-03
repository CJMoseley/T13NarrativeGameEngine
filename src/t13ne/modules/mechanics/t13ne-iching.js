import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import T13Dice from '/src/t13ne/modules/mechanics/t13ne-dice.js';
import Logger from "/src/t13ne/core/Logger.js";

class T13NE_IChing {
    constructor() {
        this.iching = [];
        this.trigrams = [];
        this.twistedIching = {
            "Entity": "\uD83C\uDF00",
            "Hexagram_Name": "Twisted",
            "Hexagram_Text": "The Character has become Twisted, their I-Ching is now fixed until they can untwist themselves.",
            "Gain": "The Character gains Twists instead of Chi.",
            "Trigrams": [-1, -1],
            "Logical": -1,
            "Quest": "The Character must untwist themselves.",
            "QuestComplete": "The Character is no longer Twisted."
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        try {
            const hexPromises = [];
            for (let i = 1; i <= 64; i++) {
                hexPromises.push(CodexLoader.getData('iching', `hexagrams/hex_${i}.json`));
            }

            const [ichingDataArray, trigramsData] = await Promise.all([
                Promise.all(hexPromises),
                CodexLoader.getData('iching', 'trigrams.json')
            ]);

            if (ichingDataArray.some(h => !h?.Hexagram ||
                !Number.isInteger(h.Hexagram.Logical) || h.Hexagram.Logical < 0 || h.Hexagram.Logical > 63) ||
                new Set(ichingDataArray.map(h => h.Hexagram.Logical)).size !== 64) {
                throw new Error('I-Ching requires all 64 distinct hexagrams.');
            }
            this.iching = ichingDataArray.sort((a, b) => a.Hexagram.Number - b.Hexagram.Number);
            this.trigrams = trigramsData || [];
            this.initialized = true;
            Logger.message(`T13NE_IChing: Initialized successfully with ${this.iching.length} hexagrams.`);
        } catch (error) {
            Logger.error(`T13NE_IChing: Initialization failed: ${error}`);
            throw error;
        }
    }

    async getHexagramData(number) {
        if (!this.initialized) await this.initialize();
        // Number is 1-64
        return this.iching.find(h => h.Hexagram.Number === number);
    }

    getLogical(number) {
        if (!this.initialized) throw new Error('I-Ching must be initialized before looking up hexagrams.');
        const index = this.iching.findIndex(h => h.Hexagram.Logical == number);
        if (index < 0) throw new Error(`Hexagram logical value ${number} was not found.`);
        return index;
    }

    getLogicalTrigram(number) {
        if (!this.initialized) return 0;
        const index = this.trigrams.findIndex(tri => tri.Logical == number);
        return index > -1 ? index : 0;
    }

    calculateIChing(stats, options = {}) {
        if (!this.initialized) {
            throw new Error('I-Ching must be initialized before calculating Character hexagrams.');
        }

        const statPairs = Array.isArray(stats) ? stats : stats?.Stats;
        if (!Array.isArray(statPairs) || statPairs.length !== 12) {
            throw new TypeError('Character I-Ching requires exactly twelve Facet pairs.');
        }
        if (options.chooseTie !== undefined && typeof options.chooseTie !== 'function') {
            throw new TypeError('I-Ching tie choice must be a function.');
        }

        const logical = [0, 0];
        let i = 0;
        for (const statpair of statPairs) {
            const values = [statpair?.Facet_Boon, statpair?.Antifacet_Boon,
                statpair?.Facet_Mutation_Matrix ?? 0, statpair?.Antifacet_Mutation_Matrix ?? 0];
            if (values.some(value => !Number.isFinite(value))) {
                throw new TypeError(`Facet pair ${i + 1} requires finite Boons and mutations.`);
            }
            const facetBoon = values[0] + values[2];
            const antifacetBoon = values[1] + values[3];
            const targetIndex = i < 6 ? 0 : 1;
            const bitPosition = i % 6;

            if (facetBoon > antifacetBoon) {
                logical[targetIndex] |= (1 << bitPosition);
            } else if (facetBoon === antifacetBoon) {
                const choice = options.chooseTie ? options.chooseTie({ index: i, pair: statpair }) : T13Dice.RNG(0, 1);
                if (choice !== 0 && choice !== 1) throw new TypeError('I-Ching tie choice must be 0 or 1.');
                logical[targetIndex] |= choice << bitPosition;
            }
            i++;
        }

        const hex = [this.getLogical(logical[0]), this.getLogical(logical[1])];
        return hex;
    }

    getCharacterRules(hexes) {
        if (!Array.isArray(hexes) || hexes.length !== 2) {
            throw new TypeError('Character I-Ching requires two hexagram indexes.');
        }
        const mask = this.binXor(hexes[0], hexes[1]);
        const record = this.iching[hexes[0]];
        const character = record.Hexagram_Character;
        if (!character || !Array.isArray(character.Gains) || !Array.isArray(character.LineGains)) {
            throw new Error('Hexagram Character rules are missing.');
        }
        return {
            hexagramNumber: record.Hexagram.Number,
            gains: character.Gains,
            changingLines: character.LineGains.filter(line => mask & (1 << (line.Line - 1))),
            unchangingPower: mask === 0 ? record.Hexagram.Unchanging : null
        };
    }

    binXor(pex, fex) {
        if (!this.initialized) throw new Error('I-Ching must be initialized before comparing hexagrams.');
        if (!Number.isInteger(pex) || !Number.isInteger(fex) ||
            !this.iching[pex] || !this.iching[fex]) {
            throw new RangeError('Changing lines require two valid hexagram indexes.');
        }
        const logical1 = this.iching[pex].Hexagram?.Logical;
        const logical2 = this.iching[fex].Hexagram?.Logical;
        if (!Number.isInteger(logical1) || logical1 < 0 || logical1 > 63 ||
            !Number.isInteger(logical2) || logical2 < 0 || logical2 > 63) {
            throw new Error('Hexagrams must have valid six-bit logical values.');
        }
        return logical1 ^ logical2;
    }

    displayTrigram(trigram = 0, questing = false, title = 'Trigram') {
        if (!this.initialized || trigram < 0) return '';
        trigram = trigram % 8;
        const triData = this.trigrams[trigram];
        if (!triData) return '';

        const { Logical, Entity, Trigram_Name, Description, Quest, Quest_Complication, Quest_Steps } = triData;
        const trigramNum = trigram + 1;

        let questHTML = questing ? `
            <p class="t13ne-quest"><strong>Quest: </strong><span class="t13ne-tri-quest">${Quest}</span></p>
            <p class="t13ne-quest-complication"><strong>Quest Complication: </strong><span class="t13ne-tri-quest-complication">${Quest_Complication}</span></p>
            <p class="t13ne-quest-steps"><strong>Quest Steps: </strong><span class="t13ne-tri-quest-steps">${Quest_Steps}</span></p>
        ` : '';

        return `
            <figure class="t13ne-trigram" data-logical="${Logical}">
                <h4>${title}</h4><br/>
                <h3 class="t13ne-tri-entity">${Entity}</h3>
                <span class="t13ne-tri-number">(${trigramNum}). </span>
                <strong class="t13ne-tri-title">${Trigram_Name}</strong>
                <p class="t13ne-tri-desc">${Description}</p>
                ${questHTML}
            </figure>
        `;
    }

    displayHexagram(hex = 0, twisted = false, questing = false, display = true) {
        if (!this.initialized) return display ? '' : { Main: '', hex: '' };
        if (hex === -1) {
            twisted = true;
            hex = 0;
        }
        hex = hex % 64;

        const hexData = twisted ? { Hexagram: this.twistedIching } : this.iching[hex];
        if (!hexData) return display ? '' : { Main: '', hex: '' };

        const { Entity, Name, Hexagram_Text, Trigrams, Logical, Unchanging } = hexData.Hexagram;
        const charData = hexData.Hexagram_Character;
        const questData = hexData.Hexagram_Quest;

        const trigram_Text = `
            <div class="t13ne-trigrams">
                <details>
                    <summary>Trigrams</summary>
                    ${this.displayTrigram(Trigrams[1], questing, 'Upper Trigram')}
                    ${this.displayTrigram(Trigrams[0], questing, 'Lower Trigram')}
                </details>
            </div>`;

        let hexNum = hex + 1 - (twisted ? 1 : 0);

        let hText = '';
        const gainHTML = charData ? charData.Gains.map(g => {
            const cls = g.Type.toLowerCase();
            return `<span class="t13ne-${cls}-gain"><strong>Gain ${g.Type}</strong> when ${g.Condition}.</span>`;
        }).join('<br/>') : '';

        const questStr = questData ? questData.Quest_Text : '';
        const questCompleteStr = questData ? questData.Quest_Complete : '';

        if (questing === 'All') {
            hText = `<p class="t13ne-quest"><strong>Quest: </strong><span class="t13ne-hex-quest">${questStr}</span></p><p class="t13ne-quest-complete"><strong>Quest Complete: </strong><span class="t13ne-hex-quest-complete">${questCompleteStr}</span></p><p><strong>Gains: </strong><br/>${gainHTML}</p>`;
        } else if (questing) {
            hText = `<p class="t13ne-quest"><strong>Quest: </strong><span class="t13ne-hex-quest">${questStr}</span></p><p class="t13ne-quest-complete"><strong>Quest Complete: </strong><span class="t13ne-hex-quest-complete">${questCompleteStr}</span></p>`;
        } else {
            hText = `<p><strong>Gains: </strong><br/>${gainHTML}</p>`;
        }

        const ret = `
            <figure class="t13ne-hexagram" data-logical="${Logical}">
                <h2 class="t13ne-hex-entity">${Entity}</h2>
                <span class="t13ne-hex-number">(${hexNum}).</span> 
                <strong class="t13ne-hex-title">${Name}</strong>
                <p class="t13ne-hex-text">${Hexagram_Text}</p>
                ${trigram_Text}
                ${hText}
            </figure>`;

        return display ? ret : { Main: ret, hex: Entity };
    }

    displayChangingLine(hex1, num, b, questing, all) {
        if (!this.initialized) return '';
        const hexData = this.iching[hex1];
        if (!hexData) return '';

        const lineName = hexData.Hexagram[`Line${num}`] || '';
        const lineGain = hexData.Hexagram_Character.LineGains.find(lg => lg.Line === num);
        const lineQuest = hexData.Hexagram_Quest.Line_Quests.find(lq => lq.Line === num);

        const gainText = lineGain ? `Gain ${lineGain.Type} when ${lineGain.Condition}` : '';
        const questText = lineQuest ? lineQuest.Quest : '';

        let rethtml = `<li class="t13ne-cl-${num}" data-binary="${b}"><strong class="t13ne-changing-strong"> Line ${num} "${lineName}": </strong>`;
        if (questing || all) rethtml += `<br/><span class="t13ne-quest"><strong>Quest line: </strong>${questText}</span>`;
        if (!questing || all) rethtml += `<br/><span class="t13ne-gain"><strong>Character Gain: </strong>${gainText}</span>`;
        rethtml += '</li>';
        return rethtml;
    }

    displayChangingLines(hex1, hex2, twisted = false, questing = false, all = false) {
        if (!this.initialized) return '';
        if (questing === 'All') all = true;

        let rethtml = '';
        const unchanging = this.iching[hex1]?.Hexagram.Unchanging || '';

        if (hex1 === hex2 || twisted || all) {
            rethtml += `<section class="t13ne-hex-unchanging"><strong>Unchanging Edge: </strong><span class="t13ne-hex-unchanging">${unchanging}</span></section>`;
        }
        if (!twisted && (hex1 !== hex2 || all)) {
            const cl = this.binXor(hex1, hex2);
            rethtml += `<section class="t13ne-changinglines" data-cl="${cl}"><strong class="t13ne-changing">Changing Lines</strong><ul class="t13ne-changinglines">`;
            for (let i = 0; i < 6; i++) {
                const b = 1 << i;
                if ((cl & b) || all) {
                    rethtml += this.displayChangingLine(hex1, i + 1, b, questing, all);
                }
            }
            rethtml += '</ul></section>';
        }
        return rethtml;
    }

    /**
     * Extracts context for AI processing.
     */
    getAIContext(hexIndex, lineNum = null) {
        const hexData = this.iching[hexIndex];
        if (!hexData) return null;

        const ctx = {
            hexagram: {
                name: hexData.Hexagram.Name,
                text: hexData.Hexagram.Hexagram_Text,
                philosophy: hexData.Hexagram_Wilhelm?.Philosophy,
                advice: hexData.Hexagram_AI?.Roleplaying_Guidance
            },
            quest: {
                goal: hexData.Hexagram_Quest.Quest_Text,
                advice: hexData.Hexagram_AI?.Plot_Complication_Guidance
            }
        };

        if (lineNum !== null) {
            const lineName = hexData.Hexagram[`Line${lineNum}`];
            const lineInterpretation = hexData.Hexagram_Wilhelm?.Line_Interpretations?.[lineNum];
            const lineGain = hexData.Hexagram_Character.LineGains.find(lg => lg.Line === lineNum);
            const lineQuest = hexData.Hexagram_Quest.Line_Quests.find(lq => lq.Line === lineNum);
            const lineAI = hexData.Hexagram_AI?.Line_Advice?.[lineNum];

            ctx.line = {
                number: lineNum,
                name: lineName,
                interpretation: lineInterpretation,
                gain: lineGain,
                quest: lineQuest?.Quest,
                advice: lineAI?.Roleplaying,
                plotAdvice: lineAI?.Plot
            };
        }

        return ctx;
    }
}

export default new T13NE_IChing();



