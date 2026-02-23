/**
 * T13 FacetWeb Class
 * JavaScript version of T13Statblock
 * 
 * Assumes T13Dice, T13IChing, T13Boons, T13Facets are available globally or imported.
 */

class FacetWeb {

    static universal = null; // Should be loaded from facetweb-universal.json
    static myFacetWebs = []; // Should be loaded from facetweb-character.json

    static getNewFacetWeb() {
        return this.myFacetWebs.length;
    }

    static buildFacetWeb(stat = [13], sway = [0]) {
        let stats = new Array(24).fill(13);
        let count = stat.length;
        let swaya = 1;

        if (Array.isArray(sway)) {
            swaya = sway.length;
        } else {
            if (!isNaN(sway) && sway > 24) {
                sway = [Math.floor(sway / 24)];
            } else {
                sway = [0];
            }
            swaya = 1;
        }

        if (count < 23) {
            for (let i = 0; i < 12; i++) {
                stats[i] = parseInt(stat[i % count]);
                stats[i + 12] = 26 - parseInt(stats[i]);
            }
        } else {
            for (let i = 0; i < 24; i++) {
                stats[i] = parseInt(stat[i % count]);
            }
        }

        return [
            { Facet: 0, Facet_Boon: stats[0], Facet_Sway: sway[0], Facet_Mutation_Matrix: 0, Joined: (stats[0] == (26 - stats[12])), Antifacet_Mutation_Matrix: 0, Antifacet: 9, Antifacet_Boon: stats[12], AntiFacet_Sway: sway[1 % swaya] },
            { Facet: 2, Facet_Boon: stats[1], Facet_Sway: sway[2 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[1] == (26 - stats[13])), Antifacet_Mutation_Matrix: 0, Antifacet: 13, Antifacet_Boon: stats[13], AntiFacet_Sway: sway[3 % swaya] },
            { Facet: 3, Facet_Boon: stats[2], Facet_Sway: sway[4 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[2] == (26 - stats[14])), Antifacet_Mutation_Matrix: 0, Antifacet: 22, Antifacet_Boon: stats[14], AntiFacet_Sway: sway[5 % swaya] },
            { Facet: 5, Facet_Boon: stats[3], Facet_Sway: sway[6 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[3] == (26 - stats[15])), Antifacet_Mutation_Matrix: 0, Antifacet: 16, Antifacet_Boon: stats[15], AntiFacet_Sway: sway[7 % swaya] },
            { Facet: 6, Facet_Boon: stats[4], Facet_Sway: sway[8 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[4] == (26 - stats[16])), Antifacet_Mutation_Matrix: 0, Antifacet: 1, Antifacet_Boon: stats[16], AntiFacet_Sway: sway[9 % swaya] },
            { Facet: 7, Facet_Boon: stats[5], Facet_Sway: sway[10 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[5] == (26 - stats[17])), Antifacet_Mutation_Matrix: 0, Antifacet: 14, Antifacet_Boon: stats[17], AntiFacet_Sway: sway[11 % swaya] },
            { Facet: 10, Facet_Boon: stats[6], Facet_Sway: sway[12 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[6] == (26 - stats[18])), Antifacet_Mutation_Matrix: 0, Antifacet: 4, Antifacet_Boon: stats[18], AntiFacet_Sway: sway[13 % swaya] },
            { Facet: 11, Facet_Boon: stats[7], Facet_Sway: sway[14 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[7] == (26 - stats[19])), Antifacet_Mutation_Matrix: 0, Antifacet: 21, Antifacet_Boon: stats[19], AntiFacet_Sway: sway[15 % swaya] },
            { Facet: 15, Facet_Boon: stats[8], Facet_Sway: sway[16 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[8] == (26 - stats[20])), Antifacet_Mutation_Matrix: 0, Antifacet: 12, Antifacet_Boon: stats[20], AntiFacet_Sway: sway[17 % swaya] },
            { Facet: 18, Facet_Boon: stats[9], Facet_Sway: sway[17 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[9] == (26 - stats[21])), Antifacet_Mutation_Matrix: 0, Antifacet: 20, Antifacet_Boon: stats[21], AntiFacet_Sway: sway[19 % swaya] },
            { Facet: 19, Facet_Boon: stats[10], Facet_Sway: sway[20 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[10] == (26 - stats[22])), Antifacet_Mutation_Matrix: 0, Antifacet: 17, Antifacet_Boon: stats[22], AntiFacet_Sway: sway[21 % swaya] },
            { Facet: 23, Facet_Boon: stats[11], Facet_Sway: sway[22 % swaya], Facet_Mutation_Matrix: 0, Joined: (stats[11] == (26 - stats[23])), Antifacet_Mutation_Matrix: 0, Antifacet: 8, Antifacet_Boon: stats[23], AntiFacet_Sway: sway[23 % swaya] }
        ];
    }

    static setFacetWeb(alt = 0, stats = [13], sway = [0], scale = 0, hex = ['%', '%'], name = 'Unnamed') {
        if (name == "Unamed" || (!isNaN(name) && name == alt && alt > 0)) {
            // Name not set, default to Unnamed in JS context
            name = "Unnamed";
        }

        let swaya = 1;
        if (Array.isArray(sway)) {
            swaya = sway.length;
        } else {
            if (!isNaN(sway) && sway > 24) {
                sway = [sway / 24];
            } else {
                sway = [0];
            }
            swaya = 1;
        }

        if (alt === 0) { alt = this.getNewFacetWeb(); }

        stats = this.buildFacetWeb(stats, sway);

        if (Array.isArray(hex) && (hex[0] == '%')) {
            if (Array.isArray(stats)) {
                hex = T13IChing.calculateIChing(stats);
            } else {
                hex = [T13Dice.RNG(0, 63), T13Dice.RNG(0, 63)];
            }
        }

        this.myFacetWebs[alt] = { 'Name': name, 'Hex': hex, 'Scale': scale, 'Stats': stats, 'Alt': alt };
        // Database saving removed for JS version
        return this.myFacetWebs[alt];
    }

    static plotAdjustLimit(plotSize) {
        switch (Math.round(parseInt(plotSize) / 2)) {
            case 0: return 19;
            case 1:
            case 2:
            case 3: return 20;
            case 4:
            case 5: return 21;
            case 6: return 22;
            case 7: return 23;
            case 8:
            case 9: return 24;
            case 10:
            case 11: return 25;
            case 12: return 26;
            default: return 26;
        }
    }

    static setFacetSway(facetWeb, facet, sway) {
        // Placeholder as per PHP source
        let error = "Worked";
    }

    static plotStats(facetWeb, plotSize, alt = 0) {
        if (isNaN(alt)) { alt = 0; }
        let limit = this.plotAdjustLimit(plotSize);

        if (!Array.isArray(facetWeb)) { facetWeb = this.getFacetWeb(alt, facetWeb); }
        if (facetWeb['Scale'] != Math.floor(plotSize / 1.8)) {
            facetWeb['Scale'] = Math.floor(plotSize / 1.8);
        }

        for (let i = 0; i < 12; i++) {
            facetWeb['Stats'][i]['Joined'] = 0;
            if (facetWeb['Stats'][i]['Facet_Boon'] < 13) {
                facetWeb['Stats'][i]['Facet_Boon'] = 13;
            }
            facetWeb['Stats'][i]['Facet_Boon'] += plotSize;
            if (facetWeb['Stats'][i]['Facet_Boon'] > limit) {
                facetWeb['Stats'][i]['Facet_Boon'] = limit;
            }
            if (facetWeb['Stats'][i]['Antifacet_Boon'] < 13) {
                facetWeb['Stats'][i]['Antifacet_Boon'] = 13;
            }
            facetWeb['Stats'][i]['Antifacet_Boon'] += plotSize;
            if (facetWeb['Stats'][i]['Antifacet_Boon'] > limit) {
                facetWeb['Stats'][i]['Antifacet_Boon'] = limit;
            }
        }
        facetWeb['Hex'] = T13IChing.calculateIChing(facetWeb['Stats']);
        this.myFacetWebs[alt] = facetWeb;
        return this.encodeFacetWeb(alt);
    }

    static randomiseStats(type = 0, alt = 0, scale, statno = 12) {
        let stats = [];
        for (let i = 0; i <= statno; i++) {
            let typer;
            if (type == 0) { typer = T13Dice.RNG(1, 7, 0); } else { typer = type; }
            switch (String(typer)) {
                case '1':
                    stats.push(parseInt(T13Dice.RNG(1, 25, 0)));
                    break;
                case '2':
                    stats.push(parseInt(T13Dice.RNG(1, 12, 0) + T13Dice.RNG(0, 13, 0)));
                    break;
                case '3':
                    stats.push(parseInt(T13Dice.RNG(1, 6, 0) + T13Dice.RNG(1, 6, 0) + T13Dice.RNG(1, 6, 0)));
                    break;
                case '4':
                    stats.push(parseInt(13 + T13Dice.RNG(0, 13, 0) - T13Dice.RNG(0, 13, 0)));
                    break;
                case '5':
                    stats.push(parseInt(8 + T13Dice.RNG(0, 10, 0)));
                    break;
                case '6':
                    stats.push(parseInt(T13Dice.RNG(6, 20, 0)));
                    break;
                default:
                    stats.push(parseInt(T13Boons.getBoonReduced(T13Dice.RNG(1, 200, 0))));
                    break;
            }
        }
        return this.setFacetWeb(alt, stats, scale, '%', alt);
    }

    static orderStats(facetWeb) {
        let order = [];
        if (facetWeb && facetWeb['Stats']) {
            for (let s of facetWeb['Stats']) {
                let obj1 = {}; obj1[s['Facet']] = s['Facet_Boon'] + s['Facet_Mutation_Matrix'];
                order.push(obj1);
                let obj2 = {}; obj2[s['Antifacet']] = s['Antifacet_Boon'] + s['Antifacet_Mutation_Matrix'];
                order.push(obj2);
            }
            // JS sort logic needed here, simplified
            order.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]);
        }
        return order;
    }

    static bestStats(inStats, compare) {
        this.myFacetWebs['Best'] = inStats;
        if (!compare || !compare['Scale']) {
            compare = this.myFacetWebs[0];
        }
        let inscale = inStats['Scale'];
        let coscale = compare['Scale'];

        for (let key in this.myFacetWebs['Best']['Stats']) {
            let best = this.myFacetWebs['Best']['Stats'][key];
            let comp = compare['Stats'][key]; // Assuming structure matches

            if ((best['Facet_Boon'] + inscale + best['Facet_Mutation_Matrix']) < (comp['Facet_Boon'] + coscale + comp['Facet_Mutation_Matrix'])) {
                this.myFacetWebs['Best']['Stats'][key]['Facet_Boon'] = comp['Facet_Boon'] + coscale - inscale;
                this.myFacetWebs['Best']['Stats'][key]['Facet_Mutation_Matrix'] = comp['Facet_Mutation_Matrix'];
            }
            if ((best['Antifacet_Boon'] + inscale + best['Antifacet_Mutation_Matrix']) < (comp['Antifacet_Boon'] + coscale + comp['Antifacet_Mutation_Matrix'])) {
                this.myFacetWebs['Best']['Stats'][key]['Antifacet_Boon'] = comp['Antifacet_Boon'] + coscale - inscale;
                this.myFacetWebs['Best']['Stats'][key]['Antifacet_Mutation_Matrix'] = comp['Antifacet_Mutation_Matrix'];
            }
            this.myFacetWebs['Best']['Stats'][key]['Joined'] = (this.myFacetWebs['Best']['Stats'][key]['Facet_Boon'] == 26 - this.myFacetWebs['Best']['Stats'][key]['Antifacet_Boon']);
        }
        this.myFacetWebs['Best']['Hex'] = T13IChing.calculateIChing(this.myFacetWebs['Best']['Stats']);
        return this.myFacetWebs['Best'];
    }

    static getBoonForFacet(facet = 0, alt = 0, facetWeb = '%') {
        if (facetWeb == '%') {
            facetWeb = this.getFacetWeb(alt);
        }
        if (!isNaN(facet)) {
            facet = T13Facets.facets[facet];
        } else if (typeof facet === 'string') {
            for (let f of T13Facets.facets) {
                if (facet === f || facet == f['FacetInitial'] || facet == f['FacetName'] || facet == f['Persona']['Name'] || facet == f['Core']) {
                    facet = f;
                    break;
                }
            }
        }
        if (!isNaN(facetWeb)) {
            facetWeb = this.getFacetWeb(facetWeb);
        } else if (typeof facetWeb === 'string') {
            this.loadFacetWebFromSC(facetWeb, alt);
            facetWeb = this.myFacetWebs[alt];
        }

        if (Array.isArray(facetWeb) || (typeof facetWeb === 'object' && facetWeb !== null)) {
            let scale = facetWeb['Scale'];
            let stats = facetWeb['Stats'];
            for (let statpair of stats) {
                if (facet['FacetIndex'] === statpair['Facet'] || facet['FacetName'] === statpair['Facet']) {
                    return { 'Scale': scale, 'Boon': parseInt(statpair['Facet_Boon']) + parseInt(statpair['Facet_Mutation_Matrix']) };
                } else if (facet['FacetIndex'] == statpair['Antifacet'] || facet['FacetName'] == statpair['Antifacet']) {
                    return { 'Scale': scale, 'Boon': parseInt(statpair['Antifacet_Boon']) + parseInt(statpair['Antifacet_Mutation_Matrix']) };
                }
            }
        } else {
            return { 'Scale': 0, 'Boon': 13 };
        }
    }

    static writeFacetPair(statpair, scale) {
        let facet = T13Facets.getFacet(statpair['Facet']);
        let antifacet = T13Facets.getFacet(statpair['Antifacet']);
        let maxyang = parseInt(statpair['Facet_Boon']) + parseInt(scale) + parseInt(statpair['Facet_Mutation_Matrix']);
        let maxyin = parseInt(statpair['Antifacet_Boon']) + parseInt(scale) + parseInt(statpair['Antifacet_Mutation_Matrix']);
        let boon = T13Boons.writeFullBoon(maxyang, 1);
        let yang = statpair['Facet_Sway'];
        let sway = T13Facets.facets[statpair['Facet']]['Sway'];
        let yin = statpair['AntiFacet_Sway'];
        let join = statpair['Joined'];
        let asway = T13Facets.facets[statpair['Antifacet']]['Sway'];
        let adjective = T13Facets.getFacetAdjective(statpair['Facet'], maxyang);
        let antiboon = T13Boons.writeFullBoon(maxyin, 1);
        let antiAdjective = T13Facets.getFacetAdjective(statpair['Antifacet'], maxyin);

        let html = `<div class="t13ne-facetpair"><div class="t13ne-left"><span class="t13ne-facet" data-facet-${statpair['Facet']}="${statpair['Facet_Boon']}">${facet}</span> <span class="t13ne-facet-adjective"><strong>${adjective}</strong></span><span class="t13ne-boon">${boon}</span> <span class="t13ne-sway"  data-yang="${yang}" > <strong>${sway}</strong>: ${yang}</span> <span class="t13ne-facet-joined"><input class="t13ne-joined" type="checkbox" value = "${join}" ${join ? 'checked' : ''}/></span></div><div class="t13ne-right"><span class="t13ne-antifacet" data-facet-${statpair['Antifacet']}="${statpair['Antifacet_Boon']}" data-yin="${yin}">${antifacet}</span> <span class="t13ne-antfacet-adjective"><strong>${antiAdjective}</strong></span> <span class="t13ne-antiboon" data-antiboon="${statpair['Antifacet_Boon']}" title="Facet Boon">${antiboon}</span> <span class="t13ne-sway"  data-yin="${yin}" title="Facet Sway"> <strong>${asway}</strong>: ${yin}</span></div></div>`;
        return { 'HTML': html, 'MaxYin': maxyin, 'MaxYang': maxyang };
    }

    static getCurrentCharScale() {
        let facetWeb = this.getFacetWeb(0);
        return facetWeb['Scale'];
    }

    static writeFacetWeb(facetWeb) {
        let statblockj = JSON.stringify(facetWeb);
        let rethtml = `<!--t13ne-facetweb //--><section class="t13ne-facetweb" data-statcode="${this.encodeFacetWeb(facetWeb)}" data-alt="${facetWeb['Alt']}">`;
        let count = 0;

        if (!Array.isArray(facetWeb) && typeof facetWeb === 'object' && !facetWeb.Stats) {
            // Assuming this handles the case where it iterates over all myFacetWebs if passed incorrectly or intended to show all
            for (let altstats of this.myFacetWebs) {
                rethtml += `<figure class="t13ne-alt-block" data-block="${count}" data-statblock='${statblockj}'>`;
                let scale = altstats['Scale'];
                let stats = altstats['Stats'];
                let iching = T13IChing.displayIChing(altstats['Hex']);
                let maxyin = 0;
                let maxyang = 0;
                if (stats) {
                    for (let statpair of stats) {
                        let ret = this.writeFacetPair(statpair, scale);
                        rethtml += ret['HTML'];
                        maxyin += ret['MaxYin'];
                        maxyang += ret['MaxYang'];
                    }
                }
                count++;
                rethtml += `<div class="t13ne-yang t13ne-left"><strong>Max-Yang: </strong>${maxyang}</div><div class="t13ne-yin t13ne-right"><strong>Max-Yin: </strong>${maxyin}</div>`;
                rethtml += `</figure>${iching}`;
            }
        } else {
            rethtml += `<figure class="t13ne-alt-block" data-block="${count}">`;
            let scale = facetWeb['Scale'];
            let stats = facetWeb['Stats'];
            if (!facetWeb['Hex']) { facetWeb['Hex'] = T13IChing.calculateIChing(stats); }
            let iching = T13IChing.displayIChing(facetWeb['Hex']);
            let maxyin = 0;
            let maxyang = 0;
            for (let statpair of stats) {
                let ret = this.writeFacetPair(statpair, scale);
                rethtml += ret['HTML'];
                maxyin += ret['MaxYin'];
                maxyang += ret['MaxYang'];
            }
            rethtml += `<div class="t13ne-yang t13ne-left"><strong>Max-Yang: </strong>${maxyang}</div><div class="t13ne-yin t13ne-right"><strong>Max-Yin: </strong>${maxyin}</div>`;
            rethtml += `</figure>${iching}`;
            count++;
        }
        rethtml += '</section>';
        return rethtml;
    }

    static getFacetWeb(alt = 0, statshortcode = '', getSway = 0) {
        if (isNaN(alt)) { alt = 0; }
        if (statshortcode && !this.myFacetWebs[alt]) {
            this.loadFacetWebFromSC(statshortcode, alt);
        }
        if (this.myFacetWebs[alt]) {
            if (!getSway) {
                return this.myFacetWebs[alt];
            }
        } else {
            // Fallback to default if not found
            if (!getSway) { return this.myFacetWebs[0] || this.universal; }
        }

        if (this.myFacetWebs[alt]) {
            let yin = 0;
            let yang = 0;
            for (let stp of this.myFacetWebs[alt]['Stats']) {
                yang += stp['Facet_Boon'] + this.myFacetWebs[alt]['Scale'] + stp['Facet_Mutation_Matrix'];
                yin += stp['Antifacet_Boon'] + this.myFacetWebs[alt]['Scale'] + stp['Antifacet_Mutation_Matrix'];
            }
            // Merging objects in JS
            return { ...this.myFacetWebs[alt], 'Yin': yin, 'Yang': yang, 'ID': alt };
        }
    }

    static changeFacet(facet = 0, change = 0, stats = 0) {
        let chicost = 0;
        if (!stats['Stats']) {
            if (!isNaN(stats)) {
                stats = this.getFacetWeb(stats);
            }
        }
        // Assuming stats is a reference to an object in myFacetWebs or passed object
        // In JS, objects are passed by reference, so modifying 'stats' modifies the original if it came from myFacetWebs
        // However, the PHP code iterates over self::$mystats.
        for (let fp of this.myFacetWebs) {
            // This logic in PHP iterated over all stats? Or was it meant to iterate over stats of a specific block?
            // PHP: foreach(self::$mystats as &$fp) - this iterates over the blocks.
            // But inside it checks $facet == $fp['Facet']. $fp is a block. A block doesn't have 'Facet'.
            // The PHP code provided seems to have a bug or $mystats structure is different there.
            // Assuming it meant to iterate over the stats of the current block.
            // I will implement it for the passed 'stats' object.
            if (stats && stats.Stats) {
                for (let fp of stats.Stats) {
                    if (facet == fp['Facet']) {
                        fp['Facet_Boon'] += change;
                        chicost += fp['Facet_Boon'] + fp['Facet_Mutation_Matrix'];
                        if (fp['Joined']) {
                            fp['Antifacet_Boon'] += -change;
                            chicost += fp['Antifacet_Boon'] + fp['Antifacet_Mutation_Matrix'];
                        }
                    } else if (facet == fp['Antifacet']) {
                        if (fp['Joined']) {
                            fp['Facet_Boon'] += -change;
                            chicost += fp['Facet_Boon'] + fp['Facet_Mutation_Matrix'];
                        }
                        fp['Antifacet_Boon'] += change;
                        chicost += fp['Antifacet_Boon'] + fp['Antifacet_Mutation_Matrix'];
                    }
                }
            }
        }
        return chicost;
    }

    static displayIChing(input) {
        let stats;
        if (!isNaN(input)) {
            if (input > 0 && input < 65) {
                return T13IChing.displayIChing(input);
            }
            if (input > 64) {
                stats = this.getFacetWeb(input);
            }
        }
        if (Array.isArray(input)) {
            if (input.length == 2 && !isNaN(input[0]) && input[0] >= 0 && input[0] < 65) {
                return T13IChing.displayIChing(input);
            } else {
                // Handle object array or other structures
                if (input['Hex']) return T13IChing.displayIChing(input['Hex']);
            }
        }
        if (typeof input === 'string') {
            stats = this.getFacetWeb(0, input);
        }
        if (stats) {
            if (!stats['Hex']) {
                stats['Hex'] = T13IChing.calculateIChing(stats['Stats']);
            }
            return T13IChing.displayIChing(stats['Hex']);
        }
        return false;
    }

    static loadFacetWebFromSC(statstring, alt = 0) {
        let s = statstring.split(':');
        if (isNaN(alt)) { alt = 0; }
        if (s[1] == "rand" || isNaN(s[0])) {
            s[0] = parseInt(s[0]);
            this.randomiseStats(0, alt, s[0]);
        } else {
            let scale = s[0];
            let st = s[1].split(',');
            let hex = s[2].split('=');
            let sway = (s[3] ? s[3] : [0]);
            this.setFacetWeb(alt, st, sway, scale, hex, alt);
        }
        return this.writeFacetWeb(this.myFacetWebs[alt]);
    }

    static displayFacetWeb(stats, alt) {
        if (alt == 'new' || alt == 'child') {
            // Simplified logic for JS
            alt = this.myFacetWebs.length;
            if (stats == 'new') { stats = '0:rand'; }
            if (stats == 'child') { stats = '-3:rand'; }
        }
        if (stats == 'get') {
            stats = this.getFacetWeb(alt);
        }
        if (isNaN(alt)) { alt = this.myFacetWebs.length; }
        if (Array.isArray(stats) || typeof stats === 'object') {
            this.myFacetWebs[alt] = stats;
            return this.writeFacetWeb(stats);
        } else if (typeof stats === 'string') {
            return this.loadFacetWebFromSC(stats, alt);
        } else if (!isNaN(stats)) {
            stats = this.getFacetWeb(stats);
            return this.writeFacetWeb(stats);
        }
    }

    static writeFacetWebSC(alt) {
        if (isNaN(alt)) { alt = 0; }
        return `[t13ne type="facetweb" stats="${this.encodeFacetWeb(alt)}" alt="${alt}" /]`;
    }

    static encodeFacetWeb(alt) {
        if (isNaN(alt)) { alt = this.myFacetWebs.length - 1; }
        if (!isNaN(alt) && alt > this.myFacetWebs.length - 1) { alt = this.myFacetWebs.length - 1; }

        let scale, statsi, hex;
        if (this.myFacetWebs[alt]) {
            scale = this.myFacetWebs[alt]['Scale'];
            statsi = this.myFacetWebs[alt]['Stats'];
            if (this.myFacetWebs[alt]['Hex']) {
                hex = this.myFacetWebs[alt]['Hex'];
            } else {
                hex = [T13Dice.RNG(0, 63), T13Dice.RNG(0, 63)];
            }
        }

        if (statsi) {
            let stats = [];
            let yangsway = [];
            let antistats = [];
            let yinsway = [];
            for (let statpair of statsi) {
                stats.push(statpair['Facet_Boon']);
                yangsway.push(statpair['Facet_Sway']);
                antistats.push(statpair['Antifacet_Boon']);
                yinsway.push(statpair['AntiFacet_Sway']);
            }
            let st = stats.concat(yangsway, antistats, yinsway).join(',');
            return `${scale}:${st}:${hex[0]}=${hex[1]}`;
        }
    }

    static getAntiFacet(facet) {
        facet = T13Facets.getFacet(facet, 'array');
        return facet['AntiFacet'];
    }

    static mutateFacet(facet, mutation) {
        let chicost = 0;
        // Iterating over all facetwebs? Or specific? PHP code iterated over self::$mystats
        // Assuming we want to mutate all loaded facetwebs or a specific one.
        // The PHP code seems to mutate ALL loaded statblocks.
        for (let fp of this.myFacetWebs) {
            // Again, PHP code iterated over blocks but accessed Facet/Antifacet keys directly which don't exist on block.
            // Assuming it meant to iterate over stats of blocks.
            if (fp.Stats) {
                for (let statpair of fp.Stats) {
                    if (facet == statpair['Facet']) {
                        statpair['Facet_Mutation_Matrix'] += mutation;
                        chicost += statpair['Facet_Mutation_Matrix'];
                    } else if (facet == statpair['Antifacet']) {
                        statpair['Antifacet_Mutation_Matrix'] += mutation;
                        chicost += statpair['Antifacet_Mutation_Matrix'];
                    }
                }
            }
        }
        return chicost;
    }

    static mutateStats(mutationmatrix, stats = 0) {
        if (!stats['Stats']) {
            if (!isNaN(stats)) {
                stats = this.getFacetWeb(stats);
            }
        }
        if (stats['Stats']) {
            for (let statpair of stats['Stats']) {
                statpair['Facet_Mutation_Matrix'] = mutationmatrix[statpair['Facet']];
                statpair['AntiFacet_Mutation_Matrix'] = mutationmatrix[statpair['Antifacet']];
            }
        }
        return stats;
    }
}