import fs from 'fs';
import path from 'path';

const ichingJsonPath = 'plugins/t13ne/data/json/iching/iching.json';
const wilhelmCsvPath = 'plugins/t13ne/data/iching_wilhelm.csv';
const outputDir = 'plugins/t13ne/data/json/iching/hexagrams';
const libraryCodexPath = 'plugins/t13ne/data/json/library-codex.json';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const ichingData = JSON.parse(fs.readFileSync(ichingJsonPath, 'utf8'));
const wilhelmRaw = fs.readFileSync(wilhelmCsvPath, 'utf8');

function parseWilhelmCsv(csv) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        }
        if (char === '\n' && !inQuotes) {
            lines.push(currentLine);
            currentLine = '';
        } else {
            currentLine += char;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines.map(line => {
        const parts = [];
        let part = '';
        let q = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') q = !q;
            if (c === ';' && !q) {
                parts.push(part);
                part = '';
            } else {
                part += c;
            }
        }
        parts.push(part);

        const cleanParts = parts.map(p => {
            let s = p.trim();
            if (s.startsWith('"') && s.endsWith('"')) {
                s = s.substring(1, s.length - 1).replace(/""/g, '"');
            }
            return s;
        });

        const linesJson = cleanParts[12] ? JSON.parse(cleanParts[12]) : {};
        const linesArray = [];
        for (let i = 1; i <= 6; i++) {
            linesArray.push({
                Number: i,
                Interpretation: linesJson[i] || { text: "", comments: "" }
            });
        }

        return {
            Number: parseInt(cleanParts[0]),
            Entity: cleanParts[1],
            Binary: cleanParts[2],
            Name: cleanParts[3],
            Pinyin: cleanParts[5],
            Hanzi: cleanParts[6],
            Philosophy: cleanParts[9],
            The_Image: cleanParts[10] ? JSON.parse(cleanParts[10]) : { text: "", comments: "" },
            The_Judgment: cleanParts[11] ? JSON.parse(cleanParts[11]) : { text: "", comments: "" },
            Lines: linesArray
        };
    });
}

const wilhelmParsed = parseWilhelmCsv(wilhelmRaw);

function extractGains(text) {
    if (!text) return [];
    const gains = [];
    const regex = /<span class="t13ne-([^"-]+)-gain"><strong>Gain ([^<]+)<\/strong>([^<]+)<\/span>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        gains.push({
            Type: match[2].trim(),
            Condition: match[3].trim().replace(/^when\s+/i, '').replace(/\.$/, '').trim(),
            Amount: "Standard",
            Commands: []
        });
    }
    return gains;
}

function parseLineGain(text) {
    if (!text) return null;
    const match = text.match(/Gain\s+(\w+)\s+(?:when\s+)?(.+)$/i);
    if (match) {
        return {
            Type: match[1],
            Condition: match[2].replace(/\.$/, '').trim(),
            Amount: "Standard",
            Commands: []
        };
    }
    return {
        Type: "Unknown",
        Condition: text,
        Amount: "Standard",
        Commands: []
    };
}

function smartTruncate(text, limit) {
    if (!text || text.length <= limit) return text;
    const truncated = text.substring(0, limit);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > limit * 0.8) ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
}

function generateRoleplayingAdvice(hex, wilhelm, gains) {
    const name = hex.Hexagram_Name;
    const philosophy = wilhelm.Philosophy || "";
    const coreText = hex.Hexagram_Text || "";
    const triggers = gains.map(g => g.Condition).join(", ");

    return `Act and roleplay as a character under the profound influence of the Hexagram '${name}'. ` +
           `Internalize this core philosophy: ${smartTruncate(philosophy, 500)} ` +
           `Your current worldview is: "${coreText}". ` +
           `Let your choices be subtly driven by these conditions: ${triggers}. ` +
           `When interacting, mirror the wisdom found in the commentary: "${smartTruncate(wilhelm.The_Judgment.comments, 300)}"`;
}

function generatePlotAdvice(hex, wilhelm, quests) {
    const questText = hex.Quest || "";
    const imageComments = wilhelm.The_Image.comments || "";

    return `As the Narrative Engine/Yarn-Teller, structure the current arc around the theme of '${hex.Hexagram_Name}'. ` +
           `The primary quest objective is: ${questText}. ` +
           `Introduce environmental or social complications that reflect the 'Image' of this hexagram: ${smartTruncate(imageComments, 400)} ` +
           `Use the following line-specific challenges to pace the story: ${quests.map(q => q.Quest).join(" | ")}`;
}

function generateLineRoleplayingAdvice(lineNum, hex, wilhelm, lineGain) {
    const lineName = hex[`Line${lineNum}`] || "Line " + lineNum;
    const interpretation = wilhelm.Lines[lineNum - 1]?.Interpretation?.comments || "";
    const condition = lineGain ? lineGain.Condition : "no specific condition";

    return `Roleplaying Line ${lineNum} (${lineName}): Mirror the internal state described in the commentary: "${smartTruncate(interpretation, 250)}" Your actions should be framed by the goal: ${condition}.`;
}

function generateLinePlotAdvice(lineNum, hex, wilhelm, lineQuest) {
    const lineName = hex[`Line${lineNum}`] || "Line " + lineNum;
    const questText = lineQuest ? lineQuest.Quest : "Follow the hexagram's general path.";

    return `Plot Complication Line ${lineNum} (${lineName}): Introduce a challenge based on the interpretation: "${smartTruncate(wilhelm.Lines[lineNum - 1]?.Interpretation?.comments || "", 250)}" The specific quest objective for this stage is: ${questText}`;
}

const hexagramFiles = {};

ichingData.forEach((item, index) => {
    const original = item.data;
    const hexNum = index + 1;
    const wilhelm = wilhelmParsed.find(w => w.Number === hexNum) || {
        The_Image: { text: "", comments: "" },
        The_Judgment: { text: "", comments: "" },
        Lines: Array.from({length: 6}, (_, i) => ({ Number: i + 1, Interpretation: { text: "", comments: "" }}))
    };

    const gains = extractGains(original.Gain);
    const lineGains = [];
    for (let i = 1; i <= 6; i++) {
        const lg = original[`Line${i}Gain`];
        if (lg) {
            const p = parseLineGain(lg);
            lineGains.push({ Line: i, ...p });
        }
    }

    const lineQuests = [];
    for (let i = 1; i <= 6; i++) {
        const lq = original[`Line${i}Quest`];
        if (lq) {
            lineQuests.push({ Line: i, Quest: lq, Commands: [] });
        }
    }

    const finalHex = {
        Hexagram: {
            Number: hexNum,
            Name: original.Hexagram_Name,
            Entity: original.Entity,
            Logical: original.Logical,
            Trigrams: original.Trigrams,
            Hexagram_Text: original.Hexagram_Text,
            Unchanging: original.Unchanging,
            Line1: original.Line1 || "",
            Line2: original.Line2 || "",
            Line3: original.Line3 || "",
            Line4: original.Line4 || "",
            Line5: original.Line5 || "",
            Line6: original.Line6 || ""
        },
        Hexagram_Character: {
            Gains: gains,
            LineGains: lineGains
        },
        Hexagram_Quest: {
            Quest_Text: original.Quest || "",
            Quest_Complete: original.QuestComplete || "",
            Line_Quests: lineQuests
        },
        Hexagram_Wilhelm: {
            Philosophy: wilhelm.Philosophy || "",
            The_Image: wilhelm.The_Image,
            The_Judgment: wilhelm.The_Judgment,
            Line_Interpretations: Object.fromEntries(wilhelm.Lines.map(l => [l.Number, l.Interpretation]))
        },
        Hexagram_AI: {
            Roleplaying_Guidance: generateRoleplayingAdvice(original, wilhelm, gains),
            Plot_Complication_Guidance: generatePlotAdvice(original, wilhelm, lineQuests),
            Line_Advice: Object.fromEntries([1, 2, 3, 4, 5, 6].map(num => {
                const lg = lineGains.find(l => l.Line === num);
                const lq = lineQuests.find(l => l.Line === num);
                return [num, {
                    Roleplaying: generateLineRoleplayingAdvice(num, original, wilhelm, lg),
                    Plot: generateLinePlotAdvice(num, original, wilhelm, lq)
                }];
            }))
        }
    };

    const fileName = `hex_${hexNum}.json`;
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(finalHex, null, 2));
    hexagramFiles[fileName] = { description: `Hexagram ${hexNum}: ${finalHex.Hexagram.Name}` };
});

const libraryCodex = JSON.parse(fs.readFileSync(libraryCodexPath, 'utf8'));
if (libraryCodex.iching) {
    libraryCodex.iching.files = {
        "trigrams.json": libraryCodex.iching.files["trigrams.json"] || { description: "Data for the eight trigrams of the I-Ching." }
    };
    for (const [file, meta] of Object.entries(hexagramFiles)) {
        libraryCodex.iching.files[`hexagrams/${file}`] = meta;
    }
}
fs.writeFileSync(libraryCodexPath, JSON.stringify(libraryCodex, null, 2));

console.log("Revised refactoring complete.");
