import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to project root
const rulesDir = path.resolve(__dirname, '../src/t13ne/data/json/rules');
const outputDir = path.resolve(__dirname, '../rulebook');
const outputFile = path.resolve(outputDir, 'index.html');

console.log('Starting T13 Rules Compiler...');
console.log(`Reading rules from: ${rulesDir}`);
console.log(`Output file will be: ${outputFile}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
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
                rules.push({
                    id: json.id,
                    title: json.data.RulePage,
                    description: json.data.Description,
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

console.log(`Loaded ${rules.length} rule files successfully.`);

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
            --bg-surface: rgba(22, 17, 39, 0.6);
            --bg-hover: rgba(56, 44, 97, 0.4);
            --border-glow: rgba(138, 92, 246, 0.3);
            --border-glow-active: rgba(138, 92, 246, 0.8);
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
                radial-gradient(at 10% 20%, rgba(49, 10, 104, 0.15) 0px, transparent 50%),
                radial-gradient(at 90% 80%, rgba(99, 102, 241, 0.1) 0px, transparent 50%);
            color: var(--text-primary);
            font-family: 'Outfit', sans-serif;
            height: 100vh;
            display: flex;
            overflow: hidden;
        }

        /* Sidebar Styling */
        aside {
            width: var(--sidebar-width);
            background: rgba(15, 11, 28, 0.8);
            border-right: 1px solid var(--border-glow);
            display: flex;
            flex-direction: column;
            height: 100%;
            backdrop-filter: blur(12px);
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

        /* Main Content Container */
        main {
            flex: 1;
            height: 100%;
            overflow-y: auto;
            padding: 48px;
            display: flex;
            justify-content: center;
        }

        .content-card {
            width: 100%;
            max-width: 850px;
            background: var(--bg-surface);
            border: 1px solid var(--border-glow);
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            align-self: flex-start;
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
            line-height: 1.7;
            font-size: 1.05rem;
            color: #d1cbdc;
        }

        .rule-body p {
            margin-bottom: 16px;
        }

        .rule-body h2 {
            font-family: 'Jura', sans-serif;
            font-size: 1.5rem;
            color: #a78bfa;
            margin-top: 28px;
            margin-bottom: 12px;
        }

        .rule-body h3 {
            font-family: 'Jura', sans-serif;
            font-size: 1.25rem;
            color: #818cf8;
            margin-top: 24px;
            margin-bottom: 8px;
        }

        .rule-body ul, .rule-body ol {
            margin-left: 24px;
            margin-bottom: 18px;
        }

        .rule-body li {
            margin-bottom: 6px;
        }

        .rule-body code {
            background: rgba(10, 7, 20, 0.6);
            border: 1px solid rgba(138, 92, 246, 0.2);
            color: #f472b6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
        }

        .rule-body table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
            background: rgba(10, 7, 20, 0.4);
            border-radius: 8px;
            overflow: hidden;
        }

        .rule-body th, .rule-body td {
            padding: 12px 16px;
            border: 1px solid rgba(138, 92, 246, 0.15);
            text-align: left;
        }

        .rule-body th {
            background: rgba(138, 92, 246, 0.1);
            color: var(--text-accent);
            font-family: 'Jura', sans-serif;
            font-weight: 600;
        }

        .rule-body tr:hover {
            background: rgba(138, 92, 246, 0.05);
        }

        /* Responsive styling */
        @media (max-width: 768px) {
            body {
                flex-direction: column;
            }
            aside {
                width: 100%;
                height: 300px;
                border-right: none;
                border-bottom: 1px solid var(--border-glow);
            }
            main {
                padding: 20px;
            }
            .content-card {
                padding: 24px;
            }
            .rule-title {
                font-size: 1.7rem;
            }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(10, 7, 20, 0.3);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(138, 92, 246, 0.25);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(138, 92, 246, 0.5);
        }
    </style>
</head>
<body>

    <!-- Sidebar Navigation -->
    <aside>
        <div class="sidebar-header">
            <h1>T13 Rules</h1>
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search rules..." oninput="filterRules()">
            </div>
        </div>
        <div class="rules-list" id="rulesList">
            <!-- Dynamic list generated by script -->
        </div>
    </aside>

    <!-- Main Viewport -->
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
        // Rules database packaged as an inline JS object
        const rulesDb = ${JSON.stringify(rules)};

        // Populate sidebar links
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

        // Load a specific rule into the viewport
        let currentActiveLink = null;
        function loadRule(index) {
            const rule = rulesDb[index];
            document.getElementById('ruleTitle').textContent = rule.title;
            document.getElementById('ruleBody').innerHTML = rule.description;
            
            // Update active styling
            if (currentActiveLink) currentActiveLink.classList.remove('active');
            const links = document.getElementsByClassName('rule-link');
            // Find active element in the full list
            for (let link of links) {
                if (link.dataset.slug === rule.slug) {
                    link.classList.add('active');
                    currentActiveLink = link;
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    break;
                }
            }

            // Update URL hash for sharing links
            window.location.hash = rule.slug;
        }

        // Filter sidebar links based on search query (title + contents)
        function filterRules() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const links = document.getElementsByClassName('rule-link');
            
            rulesDb.forEach((rule, index) => {
                const link = links[index];
                const matchesTitle = rule.title.toLowerCase().includes(query);
                const matchesBody = rule.description.toLowerCase().includes(query);
                
                if (matchesTitle || matchesBody) {
                    link.style.display = 'block';
                } else {
                    link.style.display = 'none';
                }
            });
        }

        // Initialize and handle URL hashes on load
        window.onload = () => {
            initSidebar();
            
            const hash = window.location.hash.substring(1);
            if (hash) {
                const index = rulesDb.findIndex(r => r.slug === hash);
                if (index !== -1) {
                    loadRule(index);
                } else {
                    loadRule(0); // Load first rule by default
                }
            } else {
                // Find and load 'Core Concepts' first if it exists, otherwise load index 0
                const ccIndex = rulesDb.findIndex(r => r.title.toLowerCase() === 'core concepts');
                if (ccIndex !== -1) {
                    loadRule(ccIndex);
                } else if (rulesDb.length > 0) {
                    loadRule(0);
                }
            }
        };

        // Handle browser back/forward buttons
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

// Write the compiled HTML page
try {
    fs.writeFileSync(outputFile, htmlContent, 'utf8');
    console.log(`Rulebook compiled successfully to: ${outputFile}`);
    console.log('Compilation complete.');
} catch (error) {
    console.error('Error writing compiled HTML file:', error);
    process.exit(1);
}
