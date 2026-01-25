
const fs = require('fs');
const path = require('path');

const cardsFilePath = path.join(__dirname, 'public', 'plugins', 't13ne', 'data', 'cards', 'cards.json');
const outputDir = path.join(__dirname, 'public', 'plugins', 't13ne', 'data', 'cards', 'individual');
const manifestFilePath = path.join(__dirname, 'public', 'plugins', 't13ne', 'data', 'cards', 'cards-manifest.json');

// Ensure the output directory exists
fs.mkdirSync(outputDir, { recursive: true });

fs.readFile(cardsFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading cards.json:', err);
    process.exit(1);
  }

  try {
    const cards = JSON.parse(data);
    const manifest = {}; // Change manifest to an object for better lookup: { "ID": "filename.json" }

    cards.forEach((card) => { // Removed `index` as it's not used
      // Use card.Suit directly and convert to lowercase for filename
      const suit = card.Suit ? card.Suit.toLowerCase() : 'unknown';
      const cardName = card.Card.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); // Sanitize card name
      const filename = `${suit}-${cardName}-${card.ID}.json`; // Add ID to filename for uniqueness
      const filepath = path.join(outputDir, filename);

      fs.writeFile(filepath, JSON.stringify(card, null, 2), (err) => {
        if (err) {
          console.error(`Error writing ${filename}:`, err);
        }
      });

      manifest[card.ID] = filename; // Store filename keyed by card ID
    });

    fs.writeFile(manifestFilePath, JSON.stringify(manifest, null, 2), (err) => {
      if (err) {
        console.error('Error writing manifest file:', err);
        process.exit(1);
      } else {
        console.log('Successfully created individual card files and manifest.');
      }
    });

  } catch (parseErr) {
    console.error('Error parsing cards.json:', parseErr);
    process.exit(1);
  }
});

