import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.json')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('src/t13ne/data/json');
let errors = 0;
files.forEach(f => {
    try {
        const content = fs.readFileSync(f, 'utf8');
        if (content.trim()) {
            JSON.parse(content);
        } else {
            console.log(`EMPTY: ${f}`);
            errors++;
        }
    } catch (e) {
        console.log(`INVALID: ${f} - ${e.message}`);
        errors++;
    }
});

if (errors === 0) {
    console.log("All JSON files are valid.");
} else {
    console.log(`Found ${errors} issues.`);
    process.exit(1);
}
