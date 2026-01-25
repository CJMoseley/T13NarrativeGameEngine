import dice from './t13ne-dice.js';

//TODO: md5 is not available, using a placeholder.
function md5(string) {
  console.warn("MD5 function is not implemented.");
  return string;
}

// TODO: getDiceForBoon is not available in t13ne-dice.js, using a placeholder.
function getDiceForBoon(boon, asArray = false) {
    console.warn("getDiceForBoon is not implemented.");
    return `[Dice for Boon ${boon}]`;
}


/**
 * @fileoverview Fired during plugin activation. Boons
 * @version 1.0.0
 * @author CJMoseley <t13@cjmoseley.co.uk>
 * @see {@link http://www.cjmoseley.co.uk}
 * @license GPL-2.0
 * @description This class defines all code necessary to run during the plugin's activation.
 * @namespace T13
 * 
 * 
 */
class T13Boons {
    /**
     * @description gets the absolute boon value from a boon object or number
     * @param {object|number} boon 
     * @returns {number}
     * @memberof T13Boons
     * @static
     * @method getBoonAbsolute
     * 
     */
    static getBoonAbsolute(boon) {
        if (typeof boon === 'object' && boon !== null && 'Scale' in boon && 'Boon' in boon) {
            return parseInt(boon.Scale, 10) + parseInt(boon.Boon, 10);
        } else {
            return boon;
        }
    }

    /**
     * @description adds boons together
     * @param  {...any} boons 
     * @returns {string|number}
     * @memberof T13Boons
     * @static
     * @method addBoons
     * 
     */
    static addBoons(...boons) {
        let value = 0;
        if (boons.length > 0 && typeof boons[0] === 'string') {
            boons = boons[0].split('+');
        }
        for (const boon of boons) {
            value += this.getBoonValue(boon);
        }
        let nboon = this.getBoonReduced(value);
        if (value > this.getBoonValue(nboon)) {
            nboon += 1;
        }
        return nboon;
    }

    /**
     * @description gets half a boon
     * @param {number} boon 
     * @returns {number}
     * @memberof T13Boons
     * @static
     * @method getHalfBoon
     * 
     */
    static getHalfBoon(boon) {
        return this.getBoonReduced(0.5 * this.getBoonValue(boon));
    }

    /**
     * @description gets the value of a boon
     * @param {number} boon 
     * @returns {number|string}
     * @memberof T13Boons
     * @static
     * @method getBoonValue
     * 
     */
    static getBoonValue(boon) {
        boon = this.getBoonAbsolute(boon);
        let mul = 1;
        if (boon < 0) {
            boon = Math.abs(boon);
            mul = -1;
        }
        if (boon === 0) {
            return 0;
        } else if (boon >= 99850) {
            // In the PHP, this returns a script tag. In JS, we assume T13NE object exists.
            if (window.T13NE && window.T13NE.Render && window.T13NE.CE) {
                 window.T13NE.Render(window.T13NE.CE("span",{className:"t13ne-bignumbers"}, this.getBoonValue(boon)));
            } else {
                console.error("T13NE rendering components are not available.");
            }
            return `[Rendering big number for boon ${boon}]`;

        } else {
            return mul * Math.round(boon * (Math.pow(2, (Math.pow(boon, (1 / 3))))));
        }
    }

    /**
     * @description gets the reduced boon value
     * @param {number} boon 
     * @param {boolean} score 
     * @returns {number|string}
     * @memberof T13Boons
     * @static
     * @method getBoonReduced
     */
    static getBoonReduced(boon, score = false) {
        let mul = 1;
        boon = this.getBoonAbsolute(boon);
        if (!isNaN(boon)) {
            if (boon < 0) {
                boon = Math.abs(boon);
                mul = -1;
            }
            if (boon > 1 && boon < 9223372036854775807) {
                let retval;
                for (let i = 0; i <= boon; i++) {
                    const b = this.getBoonValue(i / 2);
                    if (b <= boon) {
                        if (score) {
                            retval = i / 2;
                        } else {
                            retval = Math.floor(i / 2);
                        }
                    }
                    if (b >= boon) {
                        return retval * mul;
                    }
                }
                return retval * mul;
            }
            if (boon <= 2) {
                return mul * boon / 2;
            }
        } else {
            return `Look I don't know how this happened, but that (${boon}) was no Boon.`;
        }
    }

    /**
     * @description gets the boon score
     * @param {number} boon 
     * @returns {number|string}
     * @memberof T13Boons
     * @static
     * @method getBoonScore
     */
    static getBoonScore(boon) {
        return this.getBoonReduced(boon, true);
    }

    /**
     * @description gets the boon draw
     * @param {number} boon 
     * @returns {number|string}
     * @memberof T13Boons
     * @static
     * @method getBoonDraw
     */
    static getBoonDraw(boon) {
        return this.getBoonReduced(this.getBoonReduced(boon));
    }

    /**
     * @description creates a boon table
     * @param {number} min 
     * @param {number} max 
     * @returns {string}
     * @memberof T13Boons
     * @static
     * @method boonTable
     */
    static boonTable(min = 1, max = 26) {
        let ret = '<div class="t13ne-tablewrap"><table class="t13ne-table"><thead><tr><th class="t13ne-draw">Draw 🃏</th><th class="t13ne-score">Score</th><th><span class="t13ne-boon"><strong>Boon</strong></span></th><th class="t13ne-value">Value</th><th class="t13ne-supervalue">Super-Value</th><th class="t13ne-boon-dice"> 🎲 </th></tr></thead><tbody>';
        if (min < 1) {
            min = 1;
        }
        if (max <= min) {
            max = min + 1;
        }
        for (let i = min; i <= max; i++) {
            ret += `<tr><td class="t13ne-draw">${this.getBoonDraw(i)}</td>`;
            ret += `<td class="t13ne-score">${this.getBoonReduced(i)}</td>`;
            ret += `<td class="t13ne-boon"><strong>${i}</strong></td>`;
            ret += `<td class="t13ne-value">${this.getBoonValue(i)}</td>`;
            ret += `<td class-"t13ne-supervalue">${this.getBoonValue(this.getBoonValue(i))}</td>`;
            ret += `<td class="t13ne-boon-dice">${getDiceForBoon(i,false)}</td></tr>`;
        }
        ret += '</tbody><tfoot><tr><td class="t13ne-draw">Draw 🃏</td><td class="t13ne-score">Average Score</td><td class="t13ne-boon"><strong>Boon</strong></td><td class="t13ne-value">Value</td><td class="t13ne-supervalue">Super-Value</td><td class="t13ne-boon-dice"> 🎲 </td></tr></tfoot></table></div>';
        return ret;
    }

    /**
     * @description writes a boon
     * @param {number} boon 
     * @returns {string}
     * @memberof T13Boons
     * @static
     * @method writeBoon
     */
    static writeBoon(boon) {
        return `<span class="t13ne-boon" data-t13ne-boon="${boon}"><strong>${boon}</strong> (Value:${this.getBoonValue(boon).toLocaleString()}) [${this.getBoonReduced(boon).toLocaleString()}/${this.getBoonDraw(boon).toLocaleString()}]</span>`;
    }

    /**
     * @description writes a bane
     * @param {number} boon 
     * @returns {string}
     * @memberof T13Boons
     * @static
     * @method writeBane
     */
    static writeBane(boon) {
        return `<span class="t13ne-bane" data-t13ne-bane="${boon}"><strong>${boon}</strong> (Value:${this.getBoonValue(boon).toLocaleString()}) [${this.getBoonReduced(boon).toLocaleString()}/${this.getBoonDraw(boon).toLocaleString()}]</span>`;
    }

    /**
     * @description writes a full boon
     * @param {number} boon 
     * @param {boolean} t 
     * @param {boolean} bane 
     * @param {boolean} annex 
     * @returns {string}
     * @memberof T13Boons
     * @static
     * @method writeFullBoon
     */
    static writeFullBoon(boon, t = true, bane = false, annex = false) {
        boon = this.getBoonAbsolute(boon);
        if (!isNaN(parseInt(boon, 10))) {
            let value, val, woon, superVal, score, draw, dice;
            if (annex) { //annex passes in Value not Boon
                value = boon;
                val = value.toLocaleString();
                boon = this.getBoonReduced(value);
                woon = boon.toLocaleString();
                superVal = this.getBoonValue(value).toLocaleString();
                score = this.getBoonReduced(boon).toLocaleString();
                draw = this.getBoonDraw(boon).toLocaleString();
                dice = getDiceForBoon(boon);
            } else {
                woon = boon.toLocaleString();
                val = this.getBoonValue(boon).toLocaleString();
                superVal = this.getBoonValue(this.getBoonValue(boon)).toLocaleString();
                score = this.getBoonReduced(boon).toLocaleString();
                draw = this.getBoonDraw(boon).toLocaleString();
                dice = getDiceForBoon(boon);
            }
            let title = '';
            let scoret = 'Score';
            let drawt = 'Draw 🃏';
            if (t) {
                title = 'Boon: ';
                if (bane) {
                    title = 'Bane: ';
                    scoret = 'Marks';
                    drawt = 'Ruins';
                }
            }

            return `<details class="t13ne-bane" data-t13ne-bane="${boon}"><summary><strong>${title} ${woon}</strong>[${score}/${draw}]</summary><section>
			<div class="t13ne-dice"><strong>Dice 🎲: </strong>${dice}</div>
			<div class="t13ne-score"><strong title="Average Rolled Score">${scoret}: </strong>[${score}]</div>
			<div class="t13ne-draw"><strong title="Average Card Draws">${drawt} : </strong>${draw}</div>
			<div class="t13ne-value"><strong>Value: </strong>(${val})</div>
			<div class="t13ne-super-value"><strong>Super-Value: </strong> {${superVal}}</div></section>
			</details>`;
        } else {
            return `This '${boon}' is not a boon!`;
        }
    }

    /**
     * @description compares two boons
     * @param {number} boon 
     * @param {number} vsboon 
     * @returns {string}
     * @memberof T13Boons
     * @static
     .method boonvsboon
     */
    static boonvsboon(boon, vsboon) {
        //the original Boon Test from the 1994 version of the game.
        let ret = "<!-- boon vs boon -->";
        const aval = this.getBoonValue(boon);
        const bval = this.getBoonValue(vsboon);
        const pera = Math.round(100 * (aval / (aval + bval)));
        const uniqueId = md5(Date.now() + 'Yeah, make it a unique ID.' + dice.RNG(0,6000));
        return ret + `<span class="t13ne-boonvsboon"><span class="result">Percentage Chance=${pera}% </span><a href="#" onclick="rolldice('d100');" id="diceroll:${uniqueId}">Roll</a></span> `;
    }
}

export default T13Boons;
