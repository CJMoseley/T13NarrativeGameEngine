import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rulesDir = path.resolve(__dirname, '../src/t13ne/data/json/rules');
const outputDir = path.resolve(__dirname, '../rulebook');
const outputFile = path.resolve(outputDir, 'index.html');

console.log('Starting T13 Rules Compiler...');
console.log(`Reading rules from: ${rulesDir}`);
console.log(`Output file will be: ${outputFile}`);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Load Facet and Card data to expand facet/card shortcodes
const facetsDir = path.resolve(__dirname, '../src/t13ne/data/facets');
const cardsDir = path.resolve(__dirname, '../src/t13ne/data/cards');

const facetsMap = {};
if (fs.existsSync(facetsDir)) {
    for (const f of fs.readdirSync(facetsDir)) {
        if (f.endsWith('.js')) {
            try {
                const mod = await import(`../src/t13ne/data/facets/${f}`);
                if (mod.default && mod.default.FacetName) {
                    facetsMap[mod.default.FacetName.toLowerCase()] = mod.default;
                }
            } catch (e) {
                // Ignore load error
            }
        }
    }
}

// 2. Helper to find JSON data tables
function findJsonTable(arrayName) {
    if (!arrayName) return null;
    const lower = arrayName.toLowerCase();
    
    // Fallback data for conflictSpreads
    if (lower === 'conflictspreads') {
        return [
            { "Type": "Simple (2x2)", "Max_Facets": 2, "Sides": "Dominant, Pressed, Above, DeeperShadows", "Description": "The simplest conflict spread, for short stories." },
            { "Type": "Internalised (3x3)", "Max_Facets": 4, "Sides": "Dominant, Pressed, Above, Internal, Shadows, DeeperShadows", "Description": "Ideal for smaller stories with internal strife." },
            { "Type": "Balanced (4x4)", "Max_Facets": 8, "Sides": "Dominant, Pressed, Above, Below, Internal, External, Shadows, DeeperShadows", "Description": "Ideal for ongoing story arcs up to Volume size." },
            { "Type": "Complete (5x5)", "Max_Facets": 12, "Sides": "All 8 sides", "Description": "Standard complexity with shared facets on multiple sides." },
            { "Type": "Complex (6x6)", "Max_Facets": 18, "Sides": "All 8 sides", "Description": "For very large complex plots with alliances shifting." },
            { "Type": "Exceptional (7x7)", "Max_Facets": 24, "Sides": "All 8 sides", "Description": "For epic or political volumes." }
        ];
    }

    const nameMap = {
        'hitchtiers': 'tiers',
        'intervalratios': 'interval_ratios',
        'charactereffects': 'character_effects',
        'tensionlevels': 'tensionLevels'
    };
    const targetFile = `${nameMap[lower] || arrayName}.json`.toLowerCase();

    function searchDir(dir) {
        if (!fs.existsSync(dir)) return null;
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
                if (item.name === 'rules') continue;
                const res = searchDir(full);
                if (res) return res;
            } else if (item.name.toLowerCase() === targetFile) {
                try {
                    const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
                    if (Array.isArray(parsed)) return parsed;
                    if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
                    if (typeof parsed === 'object') {
                        // Return array of entries or values
                        const vals = Object.values(parsed);
                        if (vals.length > 0 && typeof vals[0] === 'object') return vals;
                        return Object.entries(parsed).map(([k, v]) => ({ Key: k, Value: v }));
                    }
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    return searchDir(path.resolve(__dirname, '../src/t13ne/data/json'));
}

function renderHtmlTable(data, title = '') {
    if (!data || !Array.isArray(data) || data.length === 0) return '';
    
    // Get columns from the first object
    const sample = data[0];
    if (typeof sample !== 'object' || sample === null) {
        return `<div class="t13ne-box"><h4>${title}</h4><ul>${data.map(item => `<li>${item}</li>`).join('')}</ul></div>`;
    }
    
    const cols = Object.keys(sample).filter(k => !k.startsWith('_') && k !== 'Image');
    let html = `<div class="table-container">`;
    if (title) html += `<h4 class="table-title">${title}</h4>`;
    html += `<table class="rule-table"><thead><tr>`;
    for (const c of cols) {
        html += `<th>${c.replace(/_/g, ' ')}</th>`;
    }
    html += `</tr></thead><tbody>`;
    for (const row of data) {
        html += `<tr>`;
        for (const c of cols) {
            let val = row[c];
            if (typeof val === 'object' && val !== null) {
                val = Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
            }
            html += `<td>${val !== undefined && val !== null ? val : ''}</td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    return html;
}

// Convert WordPress Gutenberg blocks and T13 shortcodes into full HTML
function processRuleHtml(rawHtml) {
    if (!rawHtml) return '';
    let text = rawHtml;

    // 1. Remove Gutenberg block comments and unescape encoded slashes/quotes
    text = text.replace(/<!-- \/?wp:[^>]* -->/gi, '');
    text = text.replace(/<!--[\s\S]*?-->/gi, '');
    text = text.replace(/\\"/g, '"');

    // 2. Expand [t13ne ...] shortcodes
    text = text.replace(/\[t13ne\s+([^\]]+)\]/gi, (match, p1) => {
        const attrs = {};
        const attrRegex = /(\w+)=["']([^"']*)["']/g;
        let m;
        const cleanP1 = p1.replace(/\/$/, '').trim();
        while ((m = attrRegex.exec(cleanP1)) !== null) {
            attrs[m[1].toLowerCase()] = m[2];
        }

        const type = (attrs.type || '').toLowerCase();
        const arrayName = attrs.array || '';
        const title = attrs.title || arrayName;

        // Table types
        if (type === 'table' || type === 'displaytable' || type === 'tabledisplay') {
            const tableData = findJsonTable(arrayName);
            if (tableData) {
                return renderHtmlTable(tableData, title);
            }
            return `<div class="rule-note"><strong>Table:</strong> ${title || arrayName}</div>`;
        }

        // Facet suit aspect
        if (type === 'facetsuitaspect' || type === 'facetaspects') {
            const aspect = attrs.aspect || '';
            const facetRows = Object.values(facetsMap).map(f => ({
                Facet: f.FacetName,
                Suit: f.Suit,
                [aspect]: f[aspect] || f[`${aspect}_Text`] || ''
            })).filter(r => r[aspect]);

            if (facetRows.length > 0) {
                return renderHtmlTable(facetRows, attrs.title || `${aspect.replace(/_/g, ' ')} by Facet`);
            }
            return `<div class="rule-note"><strong>Facet Aspect:</strong> ${aspect}</div>`;
        }

        // Boon table
        if (type === 'boontable') {
            const liteBoons = findJsonTable('liteBoons');
            if (liteBoons) {
                return renderHtmlTable(liteBoons, 'Boon Thresholds and Levels');
            }
        }

        // Sway table
        if (type === 'swaytable') {
            return `<div class="rule-note"><strong>Sway Reference:</strong> Standard 1-to-1 conversion between Facet Sway and Chi balances during gameplay tests.</div>`;
        }

        // Draw / Cards / Spreads
        if (type === 'draw') {
            return `<div class="card-draw-demo"><strong>Card Draw (${attrs.cards || 1} Cards):</strong> Drawn from the T13 Yarn Deck for test resolution.</div>`;
        }
        if (type === 'spread') {
            return `<div class="card-draw-demo"><strong>Spread Layout (${attrs.spread || 'Standard'}):</strong> Hand size ${attrs.handsize || 'Default'}.</div>`;
        }
        if (type === 'cards') {
            return `<div class="card-draw-demo"><strong>T13 Deck:</strong> Standard 54-card Yarn Deck (Diamonds, Hearts, Clubs, Spades, plus 2 Jokers/Wildcards).</div>`;
        }
        if (type === 'bookofchanges') {
            return `<div class="rule-note"><strong>I-Ching Hexagram Matrix:</strong> 64 hexagrams governing Tao Sway and energetic changes.</div>`;
        }

        return `<div class="rule-note"><strong>${type.toUpperCase()}:</strong> ${Object.entries(attrs).map(([k,v]) => `${k}="${v}"`).join(' ')}</div>`;
    });

    return text.trim();
}

// Read and parse all rule JSON files
const rules = [];
try {
    const files = fs.readdirSync(rulesDir);
    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(rulesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);
            if (json.data && json.data.RulePage && json.data.Description) {
                const processedHtml = processRuleHtml(json.data.Description);
                rules.push({
                    id: json.id,
                    title: json.data.RulePage,
                    description: processedHtml,
                    slug: json.data.RulePage.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                });
            }
        }
    });
} catch (error) {
    console.error('Error reading rules directory:', error);
    process.exit(1);
}

// Sort rules alphabetically by title
rules.sort((a, b) => a.title.localeCompare(b.title));
console.log(`Loaded and converted ${rules.length} rule files successfully.`);

// Generate Single Page Interactive Rulebook Template
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>T13 Narrative System Rules Handbook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Jura:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-base: #0a0714;
            --bg-surface: rgba(22, 17, 39, 0.7);
            --bg-hover: rgba(56, 44, 97, 0.5);
            --border-glow: rgba(138, 92, 246, 0.35);
            --border-glow-active: rgba(138, 92, 246, 0.85);
            --text-primary: #e2e0eb;
            --text-muted: #9f9bba;
            --text-accent: #a78bfa;
            --sidebar-width: 320px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg-base);
            background-image: 
                radial-gradient(at 10% 20%, rgba(49, 10, 104, 0.25) 0px, transparent 50%),
                radial-gradient(at 90% 80%, rgba(99, 102, 241, 0.15) 0px, transparent 50%);
            color: var(--text-primary);
            font-family: 'Outfit', sans-serif;
            height: 100vh;
            display: flex;
            overflow: hidden;
        }

        aside {
            width: var(--sidebar-width);
            background: rgba(15, 11, 28, 0.9);
            border-right: 1px solid var(--border-glow);
            display: flex;
            flex-direction: column;
            height: 100%;
            backdrop-filter: blur(14px);
            z-index: 10;
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-glow);
        }

        .sidebar-header h1 {
            font-family: 'Jura', sans-serif;
            font-size: 1.5rem;
            color: var(--text-accent);
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
            margin-bottom: 12px;
        }

        .search-box {
            position: relative;
            width: 100%;
        }

        .search-box input {
            width: 100%;
            background: rgba(10, 7, 20, 0.8);
            border: 1px solid var(--border-glow);
            border-radius: 6px;
            color: var(--text-primary);
            padding: 10px 14px;
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            transition: all 0.3s ease;
        }

        .search-box input:focus {
            border-color: var(--text-accent);
            box-shadow: 0 0 8px rgba(167, 139, 250, 0.4);
        }

        .rules-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .rule-link {
            display: block;
            padding: 10px 14px;
            color: var(--text-muted);
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.95rem;
            margin-bottom: 4px;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
        }

        .rule-link:hover, .rule-link.active {
            color: var(--text-primary);
            background: var(--bg-hover);
            border-left: 3px solid var(--text-accent);
            padding-left: 11px;
        }

        .rule-link.active {
            text-shadow: 0 0 8px rgba(167, 139, 250, 0.3);
        }

        main {
            flex: 1;
            height: 100%;
            overflow-y: auto;
            padding: 40px;
            display: flex;
            justify-content: center;
        }

        .content-card {
            width: 100%;
            max-width: 900px;
            background: var(--bg-surface);
            border: 1px solid var(--border-glow);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            align-self: flex-start;
            margin-bottom: 40px;
        }

        .rule-title {
            font-family: 'Jura', sans-serif;
            font-size: 2.2rem;
            color: var(--text-accent);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border-glow);
            padding-bottom: 16px;
            text-shadow: 0 0 12px rgba(167, 139, 250, 0.2);
        }

        .rule-body {
            line-height: 1.75;
            font-size: 1.05rem;
            color: #d1cbdc;
        }

        .rule-body p {
            margin-bottom: 18px;
        }

        .rule-body h2 {
            font-family: 'Jura', sans-serif;
            font-size: 1.5rem;
            color: #a78bfa;
            margin-top: 30px;
            margin-bottom: 14px;
            border-bottom: 1px solid rgba(138, 92, 246, 0.2);
            padding-bottom: 6px;
        }

        .rule-body h3 {
            font-family: 'Jura', sans-serif;
            font-size: 1.25rem;
            color: #818cf8;
            margin-top: 24px;
            margin-bottom: 10px;
        }

        .rule-body ul, .rule-body ol {
            margin-left: 28px;
            margin-bottom: 20px;
        }

        .rule-body li {
            margin-bottom: 8px;
        }

        .table-container {
            margin: 24px 0;
            overflow-x: auto;
            border: 1px solid var(--border-glow);
            border-radius: 8px;
            background: rgba(10, 7, 20, 0.6);
        }

        .table-title {
            font-family: 'Jura', sans-serif;
            font-size: 1.1rem;
            color: var(--text-accent);
            padding: 12px 16px;
            background: rgba(138, 92, 246, 0.12);
            border-bottom: 1px solid var(--border-glow);
        }

        .rule-table {
            width: 100%;
            border-collapse: collapse;
        }

        .rule-table th, .rule-table td {
            padding: 10px 14px;
            border-bottom: 1px solid rgba(138, 92, 246, 0.15);
            text-align: left;
            font-size: 0.95rem;
        }

        .rule-table th {
            background: rgba(138, 92, 246, 0.08);
            color: var(--text-accent);
            font-family: 'Jura', sans-serif;
            font-weight: 600;
        }

        .rule-table tr:hover {
            background: rgba(138, 92, 246, 0.05);
        }

        .rule-note {
            background: rgba(138, 92, 246, 0.08);
            border-left: 4px solid var(--text-accent);
            padding: 12px 16px;
            margin: 18px 0;
            border-radius: 0 6px 6px 0;
            color: #c4b5fd;
            font-size: 0.95rem;
        }

        .card-draw-demo {
            background: rgba(59, 130, 246, 0.1);
            border-left: 4px solid #60a5fa;
            padding: 12px 16px;
            margin: 18px 0;
            border-radius: 0 6px 6px 0;
            color: #bfdbfe;
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(10, 7, 20, 0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(138, 92, 246, 0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(138, 92, 246, 0.5); }
    </style>
</head>
<body>
    <aside>
        <div class="sidebar-header">
            <h1>T13 Rules</h1>
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search rules..." oninput="filterRules()">
            </div>
        </div>
        <div class="rules-list" id="rulesList"></div>
    </aside>

    <main>
        <div class="content-card">
            <h1 class="rule-title" id="ruleTitle">Welcome to T13</h1>
            <div class="rule-body" id="ruleBody">
                <p>Select a rule from the left sidebar to view its details.</p>
                <p>Use the search box above the list to quickly find specific rules, tables, or topics.</p>
            </div>
        </div>
    </main>

    <script>
        const rulesDb = ${JSON.stringify(rules)};

        const listContainer = document.getElementById('rulesList');
        function initSidebar() {
            listContainer.innerHTML = '';
            rulesDb.forEach((rule, idx) => {
                const a = document.createElement('a');
                a.className = 'rule-link';
                a.textContent = rule.title;
                a.dataset.slug = rule.slug;
                a.onclick = () => loadRule(idx);
                listContainer.appendChild(a);
            });
        }

        let currentActiveLink = null;
        function loadRule(index) {
            const rule = rulesDb[index];
            if (!rule) return;
            document.getElementById('ruleTitle').textContent = rule.title;
            document.getElementById('ruleBody').innerHTML = rule.description;
            
            if (currentActiveLink) currentActiveLink.classList.remove('active');
            const links = document.getElementsByClassName('rule-link');
            for (let link of links) {
                if (link.dataset.slug === rule.slug) {
                    link.classList.add('active');
                    currentActiveLink = link;
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    break;
                }
            }

            window.location.hash = rule.slug;
        }

        function filterRules() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const links = document.getElementsByClassName('rule-link');
            
            rulesDb.forEach((rule, index) => {
                const link = links[index];
                const matchesTitle = rule.title.toLowerCase().includes(query);
                const matchesBody = rule.description.toLowerCase().includes(query);
                link.style.display = (matchesTitle || matchesBody) ? 'block' : 'none';
            });
        }

        window.onload = () => {
            initSidebar();
            const hash = window.location.hash.substring(1);
            if (hash) {
                const index = rulesDb.findIndex(r => r.slug === hash);
                if (index !== -1) loadRule(index);
                else loadRule(0);
            } else {
                const ccIndex = rulesDb.findIndex(r => r.title.toLowerCase() === 'core concepts');
                if (ccIndex !== -1) loadRule(ccIndex);
                else if (rulesDb.length > 0) loadRule(0);
            }
        };

        window.onhashchange = () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                const index = rulesDb.findIndex(r => r.slug === hash);
                if (index !== -1 && (!currentActiveLink || currentActiveLink.dataset.slug !== hash)) {
                    loadRule(index);
                }
            }
        };
    </script>
</body>
</html>`;

try {
    fs.writeFileSync(outputFile, htmlContent, 'utf8');
    console.log(`Rulebook compiled successfully to: ${outputFile}`);
} catch (error) {
    console.error('Error writing compiled HTML file:', error);
    process.exit(1);
}
