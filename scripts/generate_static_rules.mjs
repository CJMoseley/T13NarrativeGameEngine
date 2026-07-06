import fs from 'fs';
import path from 'path';

const rulesJsonPath = './src/t13ne/data/json/other/rules.json';
const outputDir = './html';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const rules = JSON.parse(fs.readFileSync(rulesJsonPath, 'utf8'));

const hierarchy = {
    "Core Concepts": "core",
    "Boons": "core",
    "Geometry, Gematria and Numerology": "core",
    "Facet Folio": "core",
    "I-Ching": "core",
    "Sway": "mechanics",
    "Tao Sway": "mechanics",
    "Facet Sway": "mechanics",
    "Chi": "mechanics",
    "Yarn": "mechanics",
    "Twists": "mechanics",
    "Sway Table": "mechanics",
    "Proficiencies": "mechanics",
    "Hitches": "mechanics",
    "Annexes": "mechanics",
    "Character Catalysts": "mechanics",
    "Modelling Resources": "mechanics",
    "Test (Value)": "mechanics",
    "Test (Card Draw)": "mechanics",
    "Test (Dice)": "mechanics",
    "Stakes": "mechanics",
    "Success and Failure Levels": "mechanics",
    "Wounds": "mechanics",
    "Death and Immortality": "mechanics",
    "Card Guide": "mechanics",
    "Card Spreads": "mechanics",
    "Conflict Spreads": "mechanics",
    "Ordeals": "ordeals",
    "Ordeal Rounds": "ordeals",
    "Ordeal Stages": "ordeals",
    "Narrative Tricks": "ordeals",
    "Social Ordeals": "ordeals",
    "Alternate Ordeals": "ordeals",
    "Action Spaces": "ordeals",
    "Psychosocial Action Spaces": "ordeals",
    "Creating Characters": "characters",
    "Characters and Plots": "characters",
    "Character Arcs": "characters",
    "Drama": "narrative",
    "Stress": "narrative",
    "Strains and Straining Dice": "narrative",
    "Shocks and Shocked Dice": "narrative",
    "Distress and Traumas": "narrative",
    "Tension": "narrative",
    "Narrative Weaving": "narrative",
    "Plots in T13": "narrative",
    "Plot Descendants": "narrative",
    "Yarn-Tellers, Weavers, and Plots": "narrative",
    "Subplots": "narrative",
    "Tapestries": "meta",
    "Coping With Players": "meta",
    "Types of Games": "meta",
    "Referee's Rules": "meta",
    "Embedded Facet Conflicts": "meta",
    "Learning the Rules": "meta"
};

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function sanitizeContent(content) {
    let sanitized = content.replace(/<!-- \/?wp:.*? -->/g, '');
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    return sanitized.trim();
}

function convertShortcodes(content) {
    content = sanitizeContent(content);
    return content.replace(/\[t13ne\s+([^\]]+)\/\]/g, (match, p1) => {
        const attrs = {};
        const attrRegex = /(\w+)="([^"]*)"/g;
        let m;
        while ((m = attrRegex.exec(p1)) !== null) {
            attrs[m[1]] = m[2];
        }
        const type = attrs.type;
        delete attrs.type;
        const attrStr = Object.entries(attrs).map(([k, v]) => `${k}='${v}'`).join(' ');

        switch(type) {
            case 'boontable': return `<t13-boon-table ${attrStr}></t13-boon-table>`;
            case 'name': return `<t13-gematria-calc ${attrStr}></t13-gematria-calc>`;
            case 'cards': return `<t13-card-list ${attrStr}></t13-card-list>`;
            case 'spread': return `<t13-card-spread ${attrStr}></t13-card-spread>`;
            case 'facet': return `<t13-facet-list ${attrStr}></t13-facet-list>`;
            case 'table':
            case 'displaytable':
            case 'tabledisplay': return `<t13-data-table ${attrStr}></t13-data-table>`;
            case 'facetsuitaspect':
            case 'facetaspects': return `<t13-facet-aspects ${attrStr}></t13-facet-aspects>`;
            default: return `<div class="t13-placeholder" data-type="${type}" ${attrStr}>Interactive Component: ${type}</div>`;
        }
    });
}

function generateNav(currentRelPath) {
    const categories = {
        "core": "Core Concepts",
        "mechanics": "Mechanics",
        "characters": "Characters",
        "narrative": "Narrative",
        "ordeals": "Ordeals",
        "meta": "Meta"
    };

    let nav = '<nav class="rule-nav" aria-label="Rulebook Navigation"><ul>';
    nav += `<li><a href="${currentRelPath}index.html">Home</a></li>`;

    for (const [cat, label] of Object.entries(categories)) {
        nav += `<li><details><summary>${label}</summary><ul>`;
        const catRules = rules.filter(r => hierarchy[r.data.RulePage] === cat);
        for (const rule of catRules) {
            const slug = slugify(rule.data.RulePage);
            nav += `<li><a href="${currentRelPath}${cat}/${slug}.html">${rule.data.RulePage}</a></li>`;
        }
        nav += `</ul></details></li>`;
    }
    nav += '</ul></nav>';
    return nav;
}

const baseTemplate = (title, content, nav, currentRelPath) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="T13 Narrative Engine Rules - ${title}">
    <title>${title} - T13 Rules</title>
    <link rel="stylesheet" href="${currentRelPath}css/ui-styles.css">
    <link rel="stylesheet" href="${currentRelPath}css/rules.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Jura:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script type="module" src="${currentRelPath}js/rule-components.js"></script>
</head>
<body class="t13-rules-page">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header>
        <div class="header-inner">
            <div class="t13-logo" aria-hidden="true"></div>
            <h1>T13 Narrative Engine</h1>
        </div>
    </header>
    <div class="main-container">
        <aside class="sidebar">
            ${nav}
        </aside>
        <main id="main-content" class="rule-content">
            <article>
                <header class="article-header">
                    <h2>${title}</h2>
                </header>
                <section class="rule-body">
                    ${content}
                </section>
                ${title === 'Creating Characters' ? '<t13-character-creator></t13-character-creator>' : ''}
                ${title === 'Plots in T13' ? '<t13-plot-creator></t13-plot-creator>' : ''}
            </article>
        </main>
    </div>
    <footer>
        <div class="footer-inner">
            <p>&copy; 2026 <a href="https://www.cjmoseley.co.uk">CJ Moseley</a>. Terminal Thirteen Narrative Engine. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
`;

rules.forEach(rule => {
    const title = rule.data.RulePage;
    const cat = hierarchy[title] || 'meta';
    const slug = slugify(title);
    const content = convertShortcodes(rule.data.Description);
    const nav = generateNav('../');
    const html = baseTemplate(title, content, nav, '../');

    const dir = path.join(outputDir, cat);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, `${slug}.html`), html);
});

const homeNav = generateNav('./');
const indexHtml = baseTemplate('Rulebook Home', `
    <div class="home-intro">
        <p>Welcome to the official documentation for the <strong>Terminal Thirteen (T13) Narrative Engine</strong>.</p>
        <p>This engine is designed to create complex narrative story lines for roleplaying games, video games, and AI-driven authorship.</p>
        <div class="feature-grid">
            <div class="feature-card">
                <h3>Core Mechanics</h3>
                <p>Learn about Boons, Facets, and the Geometry of names.</p>
            </div>
            <div class="feature-card">
                <h3>Yarn & Cards</h3>
                <p>Master the card spread system that drives the story.</p>
            </div>
            <div class="feature-card">
                <h3>Creation Tools</h3>
                <p>Integrated tools for Character, Annex, and Plot development.</p>
            </div>
        </div>
    </div>
`, homeNav, './');
fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);

console.log('Static rule pages generated successfully.');
