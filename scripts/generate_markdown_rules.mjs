import fs from 'fs';
import path from 'path';

// Paths
const rulesDataDir = './src/t13ne/data/json/rules';
const jsonBasePath = './src/t13ne/data/json';
const outputDir = './docs/rules';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Fallback data for conflictSpreads
const conflictSpreadsFallback = [
    {
        "Type": "Simple",
        "Alternate": "Conflict(2x2)",
        "Max_Facets": 2,
        "Description": "The Simplest of Conflict spreads, limited in what it can display. Ideal for simple stories. There are limited Facets involved and that makes these ideal for short stories and especially the early sub-Plots of a larger Conflict / Plot",
        "Sides": "Dominant, Pressed, Above, DeeperShadows"
    },
    {
        "Type": "Internalised",
        "Alternate": "Conflict(3x3)",
        "Max_Facets": 4,
        "Description": "The ideal size for smaller stories with multiple sides and medium complexity. Internalised Conflicts have at least one side have some internal strife (often the Dominant or Pressed side).",
        "Sides": "Dominant, Pressed, Above, Internal, Shadows, DeeperShadows"
    },
    {
        "Type": "Balanced",
        "Alternate": "Conflict(4x4)",
        "Max_Facets": 8,
        "Description": "The ideal complexity of plot for most on going Story Arcs (up to Volume Size), allows for a good number of differing Characters.",
        "Sides": "Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows"
    },
    {
        "Type": "Complete",
        "Alternate": "Conflict(5x5)",
        "Max_Facets": 12,
        "Description": "Most Conflicts don't require more detail than a Complete Conflict. The Sides will have plenty of Embodiments and they can interact in complex ways as there will often be Shared Facets on multiple sides, that suggests interactions and Tensions.",
        "Sides": "Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows"
    },
    {
        "Type": "Complex",
        "Alternate": "Conflict(6x6)",
        "Max_Facets": 18,
        "Description": "A more complex spread, intended for very large Complex plots, usually with lots of twists and turns in the narrative as Characters change Sides and Alliances throughout the Tale.",
        "Sides": "Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows"
    },
    {
        "Type": "Exceptional",
        "Alternate": "Conflict(7x7)",
        "Max_Facets": 24,
        "Description": "An Exceptionally complex Plot usually reserved for the largest and most complex Plots, although you may get good usage of Exceptional Conflicts in Political Volumes, which rely on Complex interactions between the Sides.",
        "Sides": "Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows"
    }
];

// Global data caches
let diceDataCache = null;
let cardsCache = null;
let cardSpreadsCache = null;
let facetsCache = null;
let numerologyCache = null;
let geometriesCache = null;

// --- Helper Functions ---

function sanitizeForFilename(name) {
    if (!name) return '';
    return name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-');
}

function unwrap(data) {
    if (Array.isArray(data)) {
        if (data.length > 0 && data[0].data !== undefined && data[0].id !== undefined) {
            return data.map(item => item.data);
        }
        return data;
    }
    return [];
}

// Recursive fallback search for arrays in codex
function findDataInCodex(arrayName) {
    const lowerName = arrayName.toLowerCase();

    if (lowerName === 'conflictspreads') {
        return conflictSpreadsFallback;
    }

    const nameMap = {
        'hitchtiers': 'tiers',
        'intervalratios': 'interval_ratios',
        'charactereffects': 'character_effects',
    };

    const targetFileName = `${nameMap[lowerName] || arrayName}.json`;

    const traverse = (dir) => {
        const list = fs.readdirSync(dir);
        for (const item of list) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                // Ignore the rules directory to avoid self-recursion or loading rule files
                if (item === 'rules') continue;
                const res = traverse(fullPath);
                if (res) return res;
            } else if (item.toLowerCase() === targetFileName.toLowerCase()) {
                try {
                    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    return unwrap(parsed);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    };
    return traverse(jsonBasePath);
}

// Convert HTML tables to Markdown tables
function htmlTableToMarkdown(htmlTable) {
    // A simple robust parser for standard HTML tables
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

    let trMatch;
    while ((trMatch = trRegex.exec(htmlTable)) !== null) {
        const rowHtml = trMatch[1];
        const row = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
            let cellText = tdMatch[1]
                .replace(/<[^>]+>/g, '') // strip nested HTML tags
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            row.push(cellText);
        }
        if (row.length > 0) {
            rows.push(row);
        }
    }

    if (rows.length === 0) return '';

    let md = '\n';
    const header = rows[0];
    md += `| ${header.join(' | ')} |\n`;
    md += `| ${header.map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < rows.length; i++) {
        // Ensure row has same column count as header
        const row = rows[i];
        const paddedRow = Array.from({ length: header.length }, (_, idx) => row[idx] || '');
        md += `| ${paddedRow.join(' | ')} |\n`;
    }
    return md + '\n';
}

// HTML Entity decoding and Clean Conversion to Markdown
function cleanHtmlToMarkdown(html) {
    if (!html) return '';

    let text = html;

    // Remove raw inline SVG tags first so they do not clutter markdown tables/text
    text = text.replace(/<svg[^>]*>([\s\S]*?)<\/svg>/gi, '\n*[Diagram: SVG Illustration]*\n');

    // Convert standard Gutenberg block comments to nothing
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // Convert standard HTML formatting to Markdown
    text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
    text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
    text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
    text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

    // Bold & Italics
    text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

    // Paragraphs
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

    // Lists (unordered and ordered)
    // We can replace <li> with * or -
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '* $1\n');
    text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n');
    text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n');

    // HTML Table Conversion
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    text = text.replace(tableRegex, (match) => htmlTableToMarkdown(match));

    // Blockquotes
    text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');

    // Figures and figure captions
    text = text.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n*Figure: $1*\n');
    text = text.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '\n$1\n');

    // Decode Common Entities
    const entities = {
        '&mdash;': '—',
        '&ndash;': '–',
        '&nbsp;': ' ',
        '&times;': '×',
        '&#39;': "'",
        '&rsquo;': "'",
        '&lsquo;': "'",
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&quot;': '"',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&diams;': '♦',
        '&spades;': '♠',
        '&clubs;': '♣',
        '&hearts;': '♥'
    };
    for (const [entity, value] of Object.entries(entities)) {
        text = text.replace(new RegExp(entity, 'g'), value);
    }

    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

// --- Boon Calculation Logic (from t13ne-boon.js) ---

function getBoonValue(boon) {
    let mul = 1;
    if (boon < 0) {
        boon = Math.abs(boon);
        mul = -1;
    }
    if (boon === 0) return 0;
    return mul * Math.round(boon * (Math.pow(2, (Math.pow(boon, (1 / 3))))));
}

function getBoonReduced(boon, score = false) {
    if (boon < 0) return 0; // standard positive boon math
    if (boon <= 2) {
        return boon / 2;
    }
    let retval = 0;
    for (let i = 0; i <= boon; i++) {
        const b = getBoonValue(i / 2);
        if (b <= boon) {
            if (score) {
                retval = i / 2;
            } else {
                retval = Math.floor(i / 2);
            }
        }
        if (b >= boon) {
            return retval;
        }
    }
    return retval;
}

function getBoonDraw(boon) {
    return getBoonReduced(getBoonReduced(boon));
}

function getDiceForBoon(boon) {
    if (!diceDataCache) {
        try {
            diceDataCache = JSON.parse(fs.readFileSync('./src/t13ne/data/json/tests/dice.json', 'utf8'));
        } catch (e) {
            console.error('Failed to load dice.json:', e);
            return 'N/A';
        }
    }
    const boonNumber = parseInt(boon, 10);
    let bestMatch = null;
    let maxBoonFound = -1;

    for (const die of diceDataCache) {
        const currentBoon = parseInt(die.Boon, 10);
        if (currentBoon === boonNumber) {
            return die.Die;
        }
        if (currentBoon < boonNumber && currentBoon > maxBoonFound) {
            maxBoonFound = currentBoon;
            bestMatch = die;
        }
    }
    return bestMatch ? bestMatch.Die : '1d2';
}

function generateBoonTable(min = 1, max = 40) {
    let md = '\n| Draw 🃏 | Score | Boon | Value | Super-Value | Dice 🎲 |\n';
    md += '| :---: | :---: | :---: | :---: | :---: | :---: |\n';
    for (let i = min; i <= max; i++) {
        const draw = getBoonDraw(i);
        const score = getBoonReduced(i);
        const value = getBoonValue(i);
        const superVal = getBoonValue(value);
        const dice = getDiceForBoon(i);
        md += `| ${draw} | ${score} | **${i}** | ${value.toLocaleString()} | ${superVal.toLocaleString()} | ${dice} |\n`;
    }
    md += '\n';
    return md;
}

// --- Card Suit & Unicode Character Helpers ---

function getUnicodeCardSymbol(card) {
    if (card.Unicode) {
        // e.g. "&#x1f0c1;" -> hex "1f0c1"
        const hexMatch = card.Unicode.match(/&#x([0-9a-fA-F]+);/);
        if (hexMatch) {
            try {
                return String.fromCodePoint(parseInt(hexMatch[1], 16));
            } catch (e) {
                // fallback
            }
        }
    }
    // Static Fallback
    const suits = { '0': '✱', '1': '♦', '2': '♥', '3': '♣', '4': '♠' };
    return suits[card.Suit] || '🃏';
}

function getSuitName(suitId) {
    const suits = { '0': 'Wildcard', '1': 'Diamonds', '2': 'Hearts', '3': 'Clubs', '4': 'Spades' };
    return suits[suitId] || 'Unknown Suit';
}

// --- Shortcode Parsers ---

function parseAttributes(shortcodeStr) {
    const attrs = {};
    const regex = /(\w+)\s*=\s*["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(shortcodeStr)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
}

function processShortcodes(markdownContent) {
    const shortcodeRegex = /\[t13ne\s+([^\]]+)\]/gi;
    return markdownContent.replace(shortcodeRegex, (fullMatch, matchBody) => {
        const attrs = parseAttributes(matchBody);
        const type = attrs.type || '';

        if (type === 'table' || type === 'displaytable' || type === 'tabledisplay') {
            const arrayName = attrs.array;
            if (!arrayName) return `\n*[Error: Shortcode missing array attribute]*\n`;
            const data = findDataInCodex(arrayName);
            if (!data || !Array.isArray(data)) {
                return `\n*[Data for table '${arrayName}' not found or invalid]*\n`;
            }

            // Format Table
            const title = attrs.title || arrayName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            let mdTable = `\n### ${title}\n\n`;

            if (data.length === 0) {
                mdTable += `*No items in this dataset.*\n`;
                return mdTable;
            }

            const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
            // Filter out internal fields
            const filteredKeys = allKeys.filter(k => !k.startsWith('_') && k !== 'id' && k !== 'idNo');

            mdTable += `| ${filteredKeys.join(' | ')} |\n`;
            mdTable += `| ${filteredKeys.map(() => '---').join(' | ')} |\n`;

            for (const item of data) {
                const row = filteredKeys.map(k => {
                    let val = item[k];
                    if (val === undefined || val === null) return '';
                    if (typeof val === 'object') {
                        return JSON.stringify(val).replace(/\|/g, '\\|');
                    }
                    // Clean HTML inside values
                    return cleanHtmlToMarkdown(String(val)).replace(/\n/g, '<br>').replace(/\|/g, '\\|');
                });
                mdTable += `| ${row.join(' | ')} |\n`;
            }
            mdTable += '\n';
            return mdTable;
        }

        if (type === 'boontable') {
            return generateBoonTable(1, 40);
        }

        if (type === 'facet') {
            if (!facetsCache) {
                try {
                    facetsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/json/facets/facets.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load facets.json:', e);
                    return `\n*[Error loading Facets table]*\n`;
                }
            }
            let md = `\n### Facet List\n\n`;
            md += `| Index | Facet | Initial | Alignment | Opposite (Anti-Facet) | Description |\n`;
            md += `| :---: | :--- | :---: | :---: | :--- | :--- |\n`;

            const facetNames = facetsCache.map(f => f.FacetName);

            for (const f of facetsCache) {
                const align = f.Yang ? 'Yang (Active)' : 'Yin (Receptive)';
                const antiName = facetNames[f.AntiFacet] || `Index ${f.AntiFacet}`;
                md += `| ${f.FacetIndex} | **${f.FacetName}** | ${f.FacetInitial} | ${align} | ${antiName} | ${f.Description} |\n`;
            }
            md += '\n';
            return md;
        }

        if (type === 'facetsuitaspect' || type === 'facetaspects') {
            const aspect = attrs.aspect || '';
            if (!facetsCache) {
                try {
                    facetsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/json/facets/facets.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load facets.json:', e);
                    return `\n*[Error loading Facet Aspects]*\n`;
                }
            }

            // Map aspect parameter to the exact key in facets.json
            const aspectMapping = {
                'annex': ['Annex_Root_Text', 'Annex_Channel_Text'],
                'tangles': ['Tangle_Text'],
                'tangle': ['Tangle_Text'],
                'umbrals': ['Umbral_Text'],
                'umbral': ['Umbral_Text'],
                'nimbeds': ['Nimbed_Text'],
                'nimbed': ['Nimbed_Text'],
                'edge': ['Edge_Text'],
                'glow': ['Glow_Text'],
                'success': ['Success_Text'],
                'incarna': ['Incarna_Text'],
                'descendants': ['Descendants_Text'],
                'tone': ['Tone_Text'],
                'hitch': ['Hitch_Text'],
                'gnarl': ['Gnarl_Text'],
                'attack': ['Attack_Text'],
                'sway': ['Sway_Text'],
                'narrative_moment': ['Narrative_Text']
            };

            const keysToLookup = aspectMapping[aspect.toLowerCase()] || [];
            if (keysToLookup.length === 0) {
                return `\n> **Aspect Info [${aspect}]**\n> *No aspect specific text mapped for "${aspect}".*\n\n`;
            }

            let md = `\n### ${attrs.Title || (aspect.charAt(0).toUpperCase() + aspect.slice(1) + ' by Facet')}\n\n`;
            for (const f of facetsCache) {
                const entries = keysToLookup.map(k => f[k]).filter(Boolean);
                if (entries.length > 0) {
                    md += `#### ${f.FacetName} (${aspect.charAt(0).toUpperCase() + aspect.slice(1)})\n`;
                    for (const entry of entries) {
                        md += `${cleanHtmlToMarkdown(entry)}\n\n`;
                    }
                }
            }
            return md;
        }

        if (type === 'chicosttable') {
            let md = `\n### Chi Cost Calculation Table\n\n`;
            md += `| Component | Cost Specification / Formula | Description |\n`;
            md += `| :--- | :--- | :--- |\n`;
            md += `| **Base Cost (Skill)** | +2 Chi | Simple skill binding Root & Channel |\n`;
            md += `| **Base Cost (Talent)** | +4 Chi | Early-game hero capabilities |\n`;
            md += `| **Base Cost (Power)** | +6 Chi | High-tier abilities |\n`;
            md += `| **Base Cost (Super-Annex)** | +8 Chi | Extremely high narrative influence |\n`;
            md += `| **Annex Boon** | +[Boon Rating] Chi | Added directly as Chi cost |\n`;
            md += `| **Proficiencies** | +2 Chi each | Added to the Annex |\n`;
            md += `| **Nimbed Boons** | +[Nimbed Boon] Chi | Adds tricks / edges |\n`;
            md += `| **Umbral Boons** | -[Umbral Boon] Chi | Reduces overall cost due to drawback |\n`;
            md += `\n*Formula Summary:* \`Chi Cost = Base Cost + Boon + Proficiencies Cost + Nimbeds - Umbrals\`\n\n`;
            return md;
        }

        if (type === 'cardtable') {
            const aspect = attrs.aspect || '';
            if (!cardsCache) {
                try {
                    cardsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/cards/cards.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load cards.json:', e);
                    return `\n*[Error loading cards]*\n`;
                }
            }

            let md = `\n### ${attrs.title || (aspect + ' Card Associations Table')}\n\n`;

            if (aspect === 'Stress' || aspect === 'Trauma') {
                md += `| Card 🃏 | Type | Description | Rules / Effects |\n`;
                md += `| :--- | :--- | :--- | :--- |\n`;
                for (const c of cardsCache) {
                    const uni = getUnicodeCardSymbol(c);
                    const name = `${c.Card} of ${getSuitName(c.Suit)}`;
                    const aspData = c[aspect] || {};
                    if (aspData.Type) {
                        const type = aspData.Type;
                        const desc = cleanHtmlToMarkdown(aspData.Description || '');
                        const rules = cleanHtmlToMarkdown(aspData.Rules || '');
                        md += `| ${uni} **${name}** | **${type}** | ${desc.replace(/\n/g, '<br>')} | ${rules.replace(/\n/g, '<br>')} |\n`;
                    }
                }
                md += '\n';
                return md;
            }

            if (aspect === 'Hook,Hook_Aspect') {
                md += `| Card 🃏 | Hook | Hook Description | Hook Aspect | Aspect Description |\n`;
                md += `| :--- | :--- | :--- | :--- | :--- |\n`;
                for (const c of cardsCache) {
                    const uni = getUnicodeCardSymbol(c);
                    const name = `${c.Card} of ${getSuitName(c.Suit)}`;
                    const yarn = c.Yarn || {};
                    const hook = yarn.Hook || 'N/A';
                    const hookDesc = cleanHtmlToMarkdown(yarn.Hook_Description || '').replace(/\n/g, '<br>');
                    const hookAsp = yarn.Hook_Aspect || 'N/A';
                    const aspDesc = cleanHtmlToMarkdown(yarn.Aspect_Description || '').replace(/\n/g, '<br>');
                    md += `| ${uni} **${name}** | **${hook}** | ${hookDesc} | **${hookAsp}** | ${aspDesc} |\n`;
                }
                md += '\n';
                return md;
            }

            if (aspect.includes('About') || aspect.includes('Info')) {
                md += `| Card 🃏 | About (Fact) | Vector (How) | Info (Embodiment) | Alternate (Special) | Detail |\n`;
                md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
                for (const c of cardsCache) {
                    const uni = getUnicodeCardSymbol(c);
                    const name = `${c.Card} of ${getSuitName(c.Suit)}`;
                    const rev = (c.Yarn && c.Yarn.Revelations) || {};
                    const about = rev.About || 'N/A';
                    const vector = rev.Vector || 'N/A';
                    const info = rev.Info || 'N/A';
                    const alt = rev.Alternate || 'N/A';
                    const detail = rev.Detail || 'N/A';
                    md += `| ${uni} **${name}** | ${about} | ${vector} | ${info} | ${alt} | ${detail} |\n`;
                }
                md += '\n';
                return md;
            }

            md += `*Aspect [${aspect}] cards details summary.*\n\n`;
            return md;
        }

        if (type === 'name') {
            const nameParam = attrs.name || 'Joe Bloggs';
            const firstPart = nameParam.split('|')[0].trim().replace(/[“”"']/g, '');

            if (!numerologyCache) {
                try {
                    numerologyCache = unwrap(JSON.parse(fs.readFileSync('./src/t13ne/data/json/geometry/numerology.json', 'utf8')));
                    geometriesCache = unwrap(JSON.parse(fs.readFileSync('./src/t13ne/data/json/geometry/geometries.json', 'utf8')));
                } catch (e) {
                    console.error('Failed to load geometry arrays:', e);
                    return `\n*[Error loading Gematria reference]*\n`;
                }
            }

            // Gematria logic
            const tidy = firstPart.toLowerCase().replace(/[^a-z]/g, '');
            let total = 0;
            const lettersBreakdown = [];
            for (const char of tidy) {
                const match = numerologyCache.find(n => n.Letter && n.Letter.toLowerCase() === char);
                if (match) {
                    const val = parseInt(match.Number, 10);
                    total += val;
                    lettersBreakdown.push(`${char.toUpperCase()} (${val})`);
                }
            }

            let geomNumber = total;
            while (geomNumber > 13) {
                geomNumber = String(geomNumber).split('').reduce((a, b) => a + parseInt(b, 10), 0);
            }

            const geoObj = geometriesCache.find(g => parseInt(g.Geometry, 10) === geomNumber) || { Name: 'Unknown Geometry', Geometry_Description: '' };

            let md = `\n> 🔮 **Gematria Breakdown for Name: "${firstPart}"**\n`;
            md += `> - **Formula:** ${lettersBreakdown.join(' + ')} = ${total}\n`;
            md += `> - **Reduced Geometry Number:** **${geomNumber}**\n`;
            md += `> - **Geometry Name:** **${geoObj.Name}**\n`;
            md += `> - **Soul Description:** *${cleanHtmlToMarkdown(geoObj.Geometry_Description || '')}*\n\n`;
            return md;
        }

        if (type === 'spread') {
            const spreadId = attrs.spread || '';
            const handsize = attrs.handsize || 'Unknown';

            if (!cardSpreadsCache) {
                try {
                    cardSpreadsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/cardspreads.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load cardspreads.json:', e);
                }
            }

            if (!cardsCache) {
                try {
                    cardsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/cards/cards.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load cards.json:', e);
                }
            }

            const spreadDef = cardSpreadsCache?.spreads?.find(s => s.id === spreadId);
            if (!spreadDef) {
                return `\n> 🃏 **Card Spread: ${spreadId.charAt(0).toUpperCase() + spreadId.slice(1)}** *(Handsize: ${handsize})*\n\n`;
            }

            let md = `\n> 🃏 **Card Spread: ${spreadDef.name}** *(Handsize: ${handsize || spreadDef.numCards})*\n`;
            md += `> *${spreadDef.id.charAt(0).toUpperCase() + spreadDef.id.slice(1)} spread positions and example draw:*\n`;

            // Simulating drawing cards deterministically starting at some cards for illustration
            const cardsToDraw = spreadDef.cardPositions.length;
            const drawn = [];
            for (let i = 0; i < cardsToDraw; i++) {
                // Pick diverse consecutive cards
                const cardIndex = (i * 11) % cardsCache.length;
                drawn.push(cardsCache[cardIndex]);
            }

            spreadDef.cardPositions.forEach((pos, idx) => {
                const card = drawn[idx];
                const cardUni = getUnicodeCardSymbol(card);
                const cardName = `${card.Card} of ${getSuitName(card.Suit)}`;

                md += `>\n`;
                md += `> 📍 **Position: ${pos.role}**\n`;
                md += `> - **Position Description:** *${pos.description}*\n`;
                md += `> - **Example Drawn Card:** ${cardUni} **${cardName}**\n`;

                // Print EXACT properties for that position ONLY
                const includeFields = pos.aiExtractionOptions?.fieldsToInclude || [];
                includeFields.forEach(field => {
                    // Check top-level or Yarn level
                    let textVal = card[field];
                    if (textVal === undefined && card.Yarn) {
                        textVal = card.Yarn[field];
                    }
                    if (textVal === undefined && card.Yarn?.Revelations) {
                        textVal = card.Yarn.Revelations[field];
                    }
                    if (textVal !== undefined) {
                        md += `> - **${field.replace(/_/g, ' ')}:** *${cleanHtmlToMarkdown(String(textVal))}*\n`;
                    }
                });
            });
            md += `\n`;
            return md;
        }

        if (type === 'suitable') {
            let md = `\n### Card Suit Correspondences\n\n`;
            md += `| Suit Character | Suit Name | Traditional Tarot Suit | Key Themes |\n`;
            md += `| :---: | :--- | :--- | :--- |\n`;
            md += `| ♦ | **Diamonds** | Coins / Pentacles | Travel, Money, Business, Contracts, Deals, Voyages, Beauty & Art. |\n`;
            md += `| ♥ | **Hearts** | Cups | Love, Relationships, Affections, Family, Sympathy, Peace. |\n`;
            md += `| ♣ | **Clubs** | Wands | Power, Fame, Politics, Ability, Action. |\n`;
            md += `| ♠ | **Spades** | Swords | Misfortune, Suffering, Loss, Lawsuits, Conflict, War. |\n`;
            md += `\n`;
            return md;
        }

        if (type === 'bookofchanges') {
            let md = `\n### ☯ Book of Changes (I-Ching Hexagrams)\n`;
            md += `*The I-Ching system maps actions onto the 64 hexagrams of the Book of Changes, representing transitions, developments, and cosmological states. Each hexagram offers profound Referee support to guide narratives when actions encounter critical thresholds.*\n\n`;
            return md;
        }

        if (type === 'cards') {
            if (!cardsCache) {
                try {
                    cardsCache = JSON.parse(fs.readFileSync('./src/t13ne/data/cards/cards.json', 'utf8'));
                } catch (e) {
                    console.error('Failed to load cards.json:', e);
                    return `\n*[Error loading cards]*\n`;
                }
            }

            let md = `\n## 🃏 Complete T13 Card Reference Guide\n\n`;
            md += `This section provides the full listing of all 54 playing cards in the T13 engine, including their Unicode representation, mechanical statistics (Pips, Wound Levels, Facets), and their narrative and Yarn meanings.\n\n`;

            for (const card of cardsCache) {
                const uni = getUnicodeCardSymbol(card);
                const suitName = getSuitName(card.Suit);
                const name = `${card.Card} of ${suitName}`;

                md += `### ${uni} ${name}\n`;
                md += `- **Suit:** ${suitName}\n`;
                md += `- **Pips (Value):** ${card.Pips || 'N/A'}\n`;
                md += `- **Wound Level:** ${card.Wound_Level !== undefined ? card.Wound_Level : 'N/A'}\n`;
                if (card.Facet) {
                    md += `- **Associated Facets:** ${card.Facet}\n`;
                }
                if (card.Narrative_Meaning) {
                    md += `- **Narrative Meaning:** *${cleanHtmlToMarkdown(card.Narrative_Meaning)}*\n`;
                }
                if (card.Yarn) {
                    const yarnName = card.Yarn.Yarn_Name || 'Unnamed Yarn';
                    const yarnDesc = card.Yarn.Yarn_Description || '';
                    md += `- **Yarn / Theme:** **${yarnName}** — *${cleanHtmlToMarkdown(yarnDesc)}*\n`;
                }
                md += `\n`;
            }
            return md;
        }

        return `\n*Placeholder for custom visual block: [type="${type}"]*\n`;
    });
}

// --- Main Rule Generator ---

async function run() {
    try {
        console.log('Generating human-readable Markdown rules from JSON...');

        const ruleFiles = fs.readdirSync(rulesDataDir).filter(f => f.endsWith('.json'));
        const rulePagesList = [];

        for (const ruleFile of ruleFiles) {
            const raw = fs.readFileSync(path.join(rulesDataDir, ruleFile), 'utf8');
            const ruleObj = JSON.parse(raw);
            const { RulePage, Description } = ruleObj.data || {};
            if (!RulePage || !Description) continue;

            const sanitizedFilename = `${sanitizeForFilename(RulePage)}.md`;
            const destPath = path.join(outputDir, sanitizedFilename);

            // Convert and Resolve HTML to Markdown
            let markdownBody = cleanHtmlToMarkdown(Description);

            // Resolve Shortcodes
            markdownBody = processShortcodes(markdownBody);

            const finalMarkdown = `# ${RulePage}\n\n${markdownBody}\n\n---\n*Copyright CJ Moseley (2026). All rights reserved.*`;

            fs.writeFileSync(destPath, finalMarkdown, 'utf8');
            console.log("Generated Markdown Rule:", destPath);

            rulePagesList.push({
                title: RulePage,
                filename: sanitizedFilename
            });
        }

        // Generate /docs/rules/README.md Index file
        rulePagesList.sort((a, b) => a.title.localeCompare(b.title));

        let indexMd = `# T13 Tabletop Roleplaying Rules Index\n\n`;
        indexMd += `Welcome to the human-readable Markdown documentation for the T13 Narrative Game Engine. These files contain comprehensive guidelines, definitions, tables, and card references to support Referees and players alike.\n\n`;
        indexMd += `## 📚 Rule Pages Index\n\n`;

        for (const page of rulePagesList) {
            indexMd += `- [**${page.title}**](${page.filename})\n`;
        }

        indexMd += `\n---\n*Copyright CJ Moseley (2026). All rights reserved.*`;
        fs.writeFileSync(path.join(outputDir, 'README.md'), indexMd, 'utf8');
        console.log('Generated Rules Index README.md');

        console.log('Successfully completed Markdown rules conversion.');

    } catch (error) {
        console.error('An error occurred during rule compilation:', error);
        process.exit(1);
    }
}

run();
