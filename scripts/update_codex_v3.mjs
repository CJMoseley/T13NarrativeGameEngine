import fs from 'fs';
import path from 'path';

const codexPath = 'src/t13ne/data/json/library-codex.json';
const dataDir = 'src/t13ne/data/json';

const codex = JSON.parse(fs.readFileSync(codexPath, 'utf8'));

const descriptions = {};
function collectDescriptions(obj) {
    if (obj.files) {
        for (const fileName in obj.files) {
            descriptions[fileName] = obj.files[fileName].description;
        }
    }
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && key !== 'files') {
            collectDescriptions(obj[key]);
        }
    }
}
collectDescriptions(codex);

function getFilesRecursively(dir, baseDir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath, baseDir));
        } else if (file.endsWith('.json')) {
            results.push(path.relative(baseDir, fullPath));
        }
    });
    return results;
}

const allFiles = getFilesRecursively(dataDir, dataDir);

const newCodex = {
    _readme: "This codex serves as a central library for the T13 Narrative Engine's game data. All data has been extracted from the original PHP source files into a structured JSON format. A key feature of this new data structure is the use of a central proficiency registry. The 'proficiencies-master.json' file contains a comprehensive list of all proficiencies in the system, each with a unique ID. All other JSON files that reference proficiencies now do so using these IDs, rather than embedding the full proficiency object. This ensures data consistency and makes the system easier to maintain and expand.",
};

allFiles.forEach(relPath => {
    if (relPath === 'library-codex.json') return;
    
    const parts = relPath.split(path.sep);
    const topKey = parts[0];
    const fileName = parts.slice(1).join('/');
    
    if (!fileName) return;

    if (!newCodex[topKey]) {
        newCodex[topKey] = {
            description: `Directory for ${topKey}`,
            files: {}
        };
    }
    
    newCodex[topKey].files[fileName] = {
        description: descriptions[fileName] || descriptions[path.basename(fileName)] || `Data file ${fileName}`
    };
});

fs.writeFileSync(codexPath, JSON.stringify(newCodex, null, 2));
console.log("Updated library-codex.json based on filesystem.");
