import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log("Script started (ESM).");

// Use the current working directory so the script is portable across machines
const projectRoot = process.cwd();
const cardsPath = path.join(projectRoot, 'public', 'plugins', 't13ne', 'data', 'cards', 'cards.json');
const individualDir = path.join(projectRoot, 'public', 'plugins', 't13ne', 'data', 'cards', 'individual');

console.log(`Reading from: ${cardsPath}`);

if (!fs.existsSync(cardsPath)) {
    console.error("cards.json not found!");
    process.exit(1);
}

try {
    const cardsData = fs.readFileSync(cardsPath, 'utf8');
    console.log(`File read. Size: ${cardsData.length} bytes.`);

    // Check for BOM
    if (cardsData.charCodeAt(0) === 0xFEFF) {
        console.log("BOM detected and ignored.");
    }

    let cards;
    try {
        cards = JSON.parse(cardsData);
        console.log(`JSON parsed successfully. Found ${cards.length} items.`);
    } catch (e) {
        console.error("JSON parse failed:", e.message);
        process.exit(1);
    }

    let repairedCount = 0;
    let createdCount = 0;
    let verifiedCount = 0;
    let errorCount = 0;

    cards.forEach((card, index) => {
        try {
            if (!card.Suit || !card.Card) {
                console.warn(`Card at index ${index} missing Suit or Card property. Skipping.`);
                return;
            }

            const suit = card.Suit;
            const value = card.Card.toLowerCase().replace(/\s+/g, '-');

            let filename = `${suit}-${value}.json`;

            const filePath = path.join(individualDir, filename);
            const cardJson = JSON.stringify(card, null, '\t');

            let needsWrite = false;
            let status = 'Verified';

            if (!fs.existsSync(filePath)) {
                needsWrite = true;
                status = 'Created';
                createdCount++;
            } else {
                const existingContent = fs.readFileSync(filePath, 'utf8');
                // Normalize newlines and trim for comparison
                const normExisting = existingContent.replace(/\r\n/g, '\n').trim();
                const normNew = cardJson.replace(/\r\n/g, '\n').trim();

                if (normExisting !== normNew) {
                    needsWrite = true;
                    status = 'Repaired';
                    repairedCount++;
                } else {
                    verifiedCount++;
                }
            }

            if (needsWrite) {
                fs.writeFileSync(filePath, cardJson);
                // Reduce log noise, only log changes
                console.log(`[${status}] ${filename}`);
            }

        } catch (err) {
            console.error(`Error processing card index ${index}:`, err);
            errorCount++;
        }
    });

    console.log('--- Summary ---');
    console.log(`Verified: ${verifiedCount}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Repaired: ${repairedCount}`);
    console.log(`Errors: ${errorCount}`);

} catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
}
