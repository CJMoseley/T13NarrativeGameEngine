import fs from 'fs';
import path from 'path';

const PROFS_DIR = 'plugins/t13ne/data/json/proficiencies/Profs/0';
const files = fs.readdirSync(PROFS_DIR);

files.forEach(f => {
    if (!f.endsWith('.json')) return;
    const filePath = path.join(PROFS_DIR, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let changed = false;
    Object.values(data).forEach(entry => {
        const prof = entry.prof || entry;
        if (prof.Name && typeof prof.Name === 'string') {
            prof.Name = [prof.Name, prof.Name, ""];
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Updated names in ${f}`);
    }
});
