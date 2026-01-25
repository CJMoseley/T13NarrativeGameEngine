
import fs from 'fs';
import path from 'path';

const rulesDataDir = 'plugins/t13ne/data/rules';
const codexPath = 'plugins/t13ne/data/json/library-codex.json';
const jsonBasePath = 'plugins/t13ne/data/json';
const outputDir = 'plugins/t13ne/rules';
const modulesDir = 'plugins/t13ne/modules';

// --- Helper Functions ---

function sanitizeForFilename(name) {
    if (!name) return '';
    return name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-');
}

function sanitizeForClassname(name) {
    if (!name) return '';
    return name.replace(/[^a-z0-9]/gi, '');
}

function findDataInCodex(codex, arrayName) {
    const fileName = `${arrayName}.json`;
    for (const categoryKey in codex) {
        const category = codex[categoryKey];
        if (typeof category !== 'object' || category === null) continue;

        const checkFiles = (files, basePath) => {
            if (files && typeof files === 'object' && files[fileName]) {
                const filePath = path.join(jsonBasePath, basePath, fileName);
                try {
                    if (fs.existsSync(filePath)) {
                        const data = fs.readFileSync(filePath, 'utf8');
                        return JSON.parse(data);
                    }
                } catch (error) {
                    console.error(`Error reading or parsing ${filePath}:`, error);
                    return null;
                }
            }
            return null;
        };

        let result = checkFiles(category.files, categoryKey);
        if (result) return result;

        for (const subKey in category) {
            if (typeof category[subKey] === 'object' && category[subKey] !== null && category[subKey].files) {
                 const deeperPath = path.join(categoryKey, subKey);
                 result = checkFiles(category[subKey].files, deeperPath);
                 if (result) return result;
            }
        }
    }
    const knownPaths = [
        `characters/${fileName}`,
        `conflicts/${fileName}`,
        `hitches/${fileName}`,
        `ordeals/socialordeals/${fileName}`,
        `ordeals/${fileName}`,
        `proficiencies/${fileName}`,
    ];
    for (const p of knownPaths) {
        const fullPath = path.join(jsonBasePath, p);
        if (fs.existsSync(fullPath)) {
            try {
                const data = fs.readFileSync(fullPath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error(`Error reading or parsing ${fullPath}:`, error);
            }
        }
    }
    return null;
}

function generateHtmlTable(data) {
    if (!data || data.length === 0) {
        return '<p>[No data found for this table]</p>';
    }
    if (!Array.isArray(data)) {
        data = [data];
    }
    const headers = Object.keys(data[0]);
    let table = '<table class="t13ne-table">';
    table += '<thead><tr>';
    headers.forEach(header => table += `<th>${header}</th>`);
    table += '</tr></thead>';
    table += '<tbody>';
    data.forEach(row => {
        table += '<tr>';
        headers.forEach(header => {
            const value = row[header] !== null && typeof row[header] === 'object' ? JSON.stringify(row[header], null, 2) : row[header];
            table += `<td>${value}</td>`;
        });
        table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
}

function findRelevantModule(rulePage) {
    const sanitizedRulePage = sanitizeForFilename(rulePage).toLowerCase();

    const manualMapping = {
        'boons': 't13ne-boon.js',
        'geometry-gematria-and-numerology': 't13ne-geometry.js',
        'facet-folio': 't13ne-facets.js',
        'i-ching': 't13ne-geometry.js',
        'tao-sway': 't13ne-sway.js',
        'facet-sway': 't13ne-sway.js',
        'chi': 't13ne-sway.js',
        'yarn': 't13ne-sway.js',
        'twists': 't13ne-sway.js',
        'sway': 't13ne-sway.js',
        'card-guide': 't13ne-cards.js',
        'card-spreads': 't13ne-cards.js',
        'proficiencies': 't13ne-knots.js',
        'hitches': 't13ne-knots.js',
        'annexes': 't13ne-knots.js',
        'patterns-extras-descendants': 't13ne-knots.js',
        'character-catalysts': 't13ne-chars.js',
        'modelling-resources': 't13ne-dice.js',
        'test-value': 't13ne-dice.js',
        'test-card-draw': 't13ne-cards.js',
        'test-dice': 't13ne-dice.js',
        'stakes': 't13ne-ordeals.js',
        'success-and-failure-levels': 't13ne-ordeals.js',
        'wounds': 't13ne-chars.js',
        'death-and-immortality': 't13ne-chars.js',
        'ordeals': 't13ne-ordeals.js',
        'ordeal-rounds': 't13ne-ordeals.js',
        'ordeal-stages': 't13ne-ordeals.js',
        'narrative-tricks': 't13ne-plots.js',
        'social-ordeals': 't13ne-ordeals.js',
        'alternate-ordeals': 't13ne-ordeals.js',
        'action-spaces': 't13ne-ordeals.js',
        'psychosocial-action-spaces': 't13ne-ordeals.js',
        'tapestries': 't13ne-facets.js',
        'subplots': 't13ne-plots.js',
        'character-arcs': 't13ne-chars.js',
        'drama': 't13ne-plots.js',
        'stress': 't13ne-chars.js',
        'strains-and-straining-dice': 't13ne-dice.js',
        'shocks-and-shocked-dice': 't13ne-dice.js',
        'distress-and-traumas': 't13ne-chars.js',
        'tension': 't13ne-plots.js',
        'narrative-weaving': 't13ne-plots.js',
        'characters-and-plots': 't13ne-plots.js',
        'plot-descendants': 't13ne-plots.js',
        'plots-in-t13': 't13ne-plots.js',
        'coping-with-players': null,
        'creating-characters': 't13ne-chars.js',
        'yarn-tellers-weavers-and-plots': 't13ne-plots.js',
        'embedded-facet-conflicts': 't13ne-facets.js',
        'types-of-games': null,
        'referees-rules': null,
        'core-concepts': null,
    };

    return manualMapping[sanitizedRulePage] || null;
}


async function processRules(start, end) {
    try {
        if (!fs.existsSync(outputDir)) {
            await fs.promises.mkdir(outputDir, { recursive: true });
        }

        const allRuleFiles = fs.readdirSync(rulesDataDir).filter(f => f.endsWith('.json'));
        const rulesToProcess = allRuleFiles.slice(start, end);

        const codexRaw = await fs.promises.readFile(codexPath, 'utf8');
        const codex = JSON.parse(codexRaw);

        for (const ruleFile of rulesToProcess) {
            const ruleRaw = await fs.promises.readFile(path.join(rulesDataDir, ruleFile), 'utf8');
            const rule = JSON.parse(ruleRaw);

            const { RulePage, Description } = rule.data;
            if (!RulePage || !Description) continue;

            const filename = `${sanitizeForFilename(RulePage)}.html`;
            const filePath = path.join(outputDir, filename);

            const relevantModule = findRelevantModule(RulePage);

            let htmlContent = `<!-- Associated Module: ${relevantModule || 'None identified'} -->\n`;
             htmlContent += `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${RulePage}</title>
</head>
<body>
    ${Description}
</body>
</html>
`;
            // Replace shortcodes with static tables
            const shortcodeRegex = /\[t13ne type="(\w+)"(?: array="([\w-]+)")?[^\]]*\]/g;
            let match;
            while ((match = shortcodeRegex.exec(htmlContent)) !== null) {
                const [fullMatch, type, arrayName] = match;
                if ((type === 'table' || type === 'displaytable') && arrayName) {
                    const data = findDataInCodex(codex, arrayName);
                    if (data) {
                        htmlContent = htmlContent.replace(fullMatch, generateHtmlTable(data));
                    } else {
                        htmlContent = htmlContent.replace(fullMatch, `<p>[Data for '${arrayName}' not found in codex]</p>`);
                    }
                } else {
                    htmlContent = htmlContent.replace(fullMatch, `<p>[Unsupported shortcode type: '${type}']</p>`);
                }
            }


            await fs.promises.writeFile(filePath, htmlContent, 'utf8');
            console.log(`Generated rule file: ${filePath}`);

            if (relevantModule) {
                console.log(`Found relevant module for ${RulePage}: ${relevantModule}`);
                const modulePath = path.join(modulesDir, relevantModule);
                let moduleContent = await fs.promises.readFile(modulePath, 'utf8');
                const functionName = `handle${sanitizeForClassname(RulePage)}`;
                if (!moduleContent.includes(functionName)) {
                    moduleContent += `
// Dummy function for rule: ${RulePage}
function ${functionName}() {
    /* TODO: Implement logic for this rule */
}
`;
                    await fs.promises.writeFile(modulePath, moduleContent, 'utf8');
                    console.log(`Added dummy function to ${relevantModule}`);
                }

            } else {
                const moduleSanitizedName = sanitizeForClassname(RulePage);
                const moduleName = `t13ne-${sanitizeForFilename(RulePage).toLowerCase()}.js`;
                const modulePath = path.join(modulesDir, moduleName);

                if (!fs.existsSync(modulePath)) {
                     const moduleContent = `
/**
 * T13NE Module for: ${RulePage}
 * This is a dummy module created to handle the rules extraction.
 * TODO: Implement the logic for this module.
 */
class T13NE_${moduleSanitizedName} {
    constructor() {
        this.isLoaded = false;
    }

    async initialize() {
        this.isLoaded = true;
        console.log('${RulePage} module initialized.');
    }
}

export default new T13NE_${moduleSanitizedName}();
`;
                    await fs.promises.writeFile(modulePath, moduleContent, 'utf8');
                    console.log(`Created dummy module: ${modulePath}`);
                }
            }
        }

        console.log(`Batch processed successfully from ${start} to ${end}.`);

    } catch (error) {
        console.error('An error occurred during rule processing:', error);
        process.exit(1);
    }
}

const start = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
const end = process.argv[3] ? parseInt(process.argv[3], 10) : 10;

processRules(start, end);
