import fs from 'fs';
import path from 'path';

const CODEX_PATH = 'plugins/t13ne/data/json/library-codex.json';
const PROFS_DIR = 'plugins/t13ne/data/json/proficiencies/Profs/0';

const codex = JSON.parse(fs.readFileSync(CODEX_PATH, 'utf8'));

if (!codex.proficiencies) codex.proficiencies = { files: {} };
if (!codex.proficiencies.files) codex.proficiencies.files = {};

// Clean up old entries if any
Object.keys(codex.proficiencies.files).forEach(f => {
    if (f.startsWith('Profs/')) delete codex.proficiencies.files[f];
});

const files = fs.readdirSync(PROFS_DIR);
files.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
});

files.forEach(f => {
    const num = parseInt(f.match(/\d+/)[0]);
    codex.proficiencies.files[`Profs/0/${f}`] = {
        description: `Batch of proficiencies starting at ID ${num * 50}`
    };
});

fs.writeFileSync(CODEX_PATH, JSON.stringify(codex, null, 2));
console.log(`Updated library-codex.json with ${files.length} proficiency batch files.`);
