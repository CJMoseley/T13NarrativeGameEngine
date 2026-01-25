import fs from 'fs';
import path from 'path';

const BASE_PATH = 'plugins/t13ne/data/json/proficiencies/';
const NEW_BASE = path.join(BASE_PATH, 'Profs/0');
const OLD_DIRS = [
    path.join(BASE_PATH, 'proficiency-list'),
    path.join(BASE_PATH, 'proficiencies-list')
];

if (!fs.existsSync(NEW_BASE)) {
    fs.mkdirSync(NEW_BASE, { recursive: true });
}

const allProfs = {};

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Handle both object and array formats
        const profs = Array.isArray(data) ? data : Object.values(data);

        profs.forEach(p => {
            if (!p.id && p.prof?.id) p = p.prof; // Handle nested {prof: {id...}}
            const id = p.id;
            if (!id) return;

            // Ensure Name is an array [common, full, aliases]
            if (p.Name && typeof p.Name === 'string') {
                p.Name = [p.Name, p.Name, ""];
            } else if (p.name && typeof p.name === 'string') {
                p.Name = [p.name, p.name, ""];
            }

            const existing = allProfs[id];
            if (!existing) {
                allProfs[id] = p;
            } else {
                // Keep the one with the longest description
                const d1 = (p.Description || p.description || "").length;
                const d2 = (existing.Description || existing.description || "").length;
                if (d1 > d2) {
                    allProfs[id] = p;
                }
            }
        });
    } catch (e) {
        console.error(`Failed to process ${filePath}: ${e.message}`);
    }
}

// 1. Scan old directories
OLD_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const subdirs = fs.readdirSync(dir);
    subdirs.forEach(sd => {
        const fullSd = path.join(dir, sd);
        if (fs.statSync(fullSd).isDirectory()) {
            const files = fs.readdirSync(fullSd);
            files.forEach(f => {
                if (f.endsWith('.json')) {
                    processFile(path.join(fullSd, f));
                }
            });
        }
    });
});

console.log(`Collected ${Object.keys(allProfs).length} unique proficiencies.`);

// 2. Batch and save
const sortedIds = Object.keys(allProfs).sort((a, b) => parseInt(a) - parseInt(b));
const batchSize = 50;

for (let i = 0; i < sortedIds.length; i += batchSize) {
    const batchIds = sortedIds.slice(i, i + batchSize);
    const batchData = {};
    batchIds.forEach(id => {
        batchData[id] = allProfs[id];
    });

    const batchIndex = Math.floor(i / batchSize);
    const fileName = `profs${batchIndex}.json`;
    fs.writeFileSync(path.join(NEW_BASE, fileName), JSON.stringify(batchData, null, 2));
}

console.log(`Migration complete. Saved ${Math.ceil(sortedIds.length / batchSize)} files to ${NEW_BASE}.`);
