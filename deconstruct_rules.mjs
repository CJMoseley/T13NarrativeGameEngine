
import fs from 'fs';
import path from 'path';

const rulesPath = 'plugins/t13ne/data/json/other/rules.json';
const outputDir = 'plugins/t13ne/data/rules';

function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-');
}

async function deconstructRules() {
    try {
        if (!fs.existsSync(outputDir)) {
            await fs.promises.mkdir(outputDir, { recursive: true });
        }

        const rulesRaw = await fs.promises.readFile(rulesPath, 'utf8');
        const rules = JSON.parse(rulesRaw);

        for (const rule of rules) {
            const { RulePage } = rule.data;
            if (!RulePage) continue;

            const filename = `${sanitizeFilename(RulePage)}.json`;
            const filePath = path.join(outputDir, filename);

            await fs.promises.writeFile(filePath, JSON.stringify(rule, null, 2), 'utf8');
            console.log(`Created rule file: ${filePath}`);
        }

        console.log('Successfully deconstructed rules.json.');

    } catch (error) {
        console.error('An error occurred during rule deconstruction:', error);
        process.exit(1);
    }
}

deconstructRules();
