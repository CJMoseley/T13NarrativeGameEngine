/**
 * scripts/generate_audio_manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WavDecoder from 'wav-decoder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const AUDIO_ROOT = 'media/audio';
const SCAN_DIR = path.join(PUBLIC_DIR, AUDIO_ROOT);
const OUTPUT_FILE = path.join(SCAN_DIR, 'audio_assets_manifest.json');

const VALID_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.webm'];

function freqToNote(freq) {
    if (!freq || freq <= 0) return 'Unknown';
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const c0 = A4 * Math.pow(2, -4.75);
    const semitones = 12 * Math.log2(freq / c0);
    const noteIndex = Math.round(semitones) % 12;
    const octave = Math.floor(semitones / 12);
    return notes[noteIndex] + octave;
}

function detectPitch(buffer, sampleRate) {
    let size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.005) return null;

    const maxSamples = Math.min(size, 8192);
    const buf = buffer.slice(0, maxSamples);

    let bestOffset = -1;
    let maxCorr = 0;

    for (let offset = 20; offset < maxSamples / 2; offset++) {
        let corr = 0;
        for (let i = 0; i < maxSamples - offset; i += 2) {
            corr += buf[i] * buf[i + offset];
        }
        if (corr > maxCorr) {
            maxCorr = corr;
            bestOffset = offset;
        }
    }

    if (bestOffset > 0) {
        return sampleRate / bestOffset;
    }
    return null;
}

function generateId(filePath, rootDir) {
    const relative = path.relative(rootDir, filePath);
    const parsed = path.parse(relative);
    
    // Preservation of some symbols for musical context
    let slug = parsed.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '_')
        .replace(/[^a-z0-9_#\-]/g, '') // Allowed # and -
        .replace(/_+/g, '_')
        .replace(/_$/, '');

    const dirParts = parsed.dir.split(path.sep);
    if (dirParts.length > 0 && dirParts[0] !== '') {
        const pathSlug = dirParts.map(p => 
            p.toLowerCase()
             .replace(/\s+/g, '_')
             .replace(/[^a-z0-9_#\-]/g, '')
        ).join('/');
        return `${pathSlug}/${slug}`;
    }
    
    return slug;
}

function scanDirectory(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            scanDirectory(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (VALID_EXTENSIONS.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

async function run() {
    console.log(`[Agent] Scanning ${SCAN_DIR}...`);
    const allFiles = scanDirectory(SCAN_DIR);
    console.log(`[Agent] Found ${allFiles.length} actual audio files on disk.`);

    let oldManifest = { samples: {} };
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            oldManifest = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        } catch (e) {}
    }

    const newManifest = {
        samples: {},
        generatedAt: Date.now()
    };

    let addedCount = 0;
    let analyzedCount = 0;
    let preservedCount = 0;

    for (const fullPath of allFiles) {
        if (fullPath === OUTPUT_FILE) continue;

        const id = generateId(fullPath, SCAN_DIR);
        const webPath = '/' + path.relative(PUBLIC_DIR, fullPath).split(path.sep).join('/');

        // Match by path to preserve analysis
        let existing = null;
        for (const val of Object.values(oldManifest.samples)) {
             if (val.path === webPath) {
                 existing = val;
                 break;
             }
        }

        const entry = {
            filename: path.basename(fullPath),
            path: webPath,
            format: path.extname(fullPath).substring(1)
        };

        if (existing && existing.analysis) {
            entry.analysis = existing.analysis;
            preservedCount++;
        }

        newManifest.samples[id] = entry;

        if (!entry.analysis && entry.format === 'wav') {
            try {
                const buffer = fs.readFileSync(fullPath);
                const audioData = await WavDecoder.decode(buffer);
                const channelData = audioData.channelData[0];
                const freq = detectPitch(channelData, audioData.sampleRate);
                if (freq) {
                    entry.analysis = {
                        freq: parseFloat(freq.toFixed(2)),
                        note: freqToNote(freq)
                    };
                    analyzedCount++;
                }
            } catch (e) {}
        }

        if (!existing) addedCount++;
    }

    console.log(`[Agent] Done. Preserved: ${preservedCount}, Added: ${addedCount}, Analyzed: ${analyzedCount}.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newManifest, null, 2));
    console.log(`[Agent] Manifest written to ${OUTPUT_FILE}`);
}

run();
