/**
 * scripts/generate_audio_manifest.js
 *
 * AGENTIC MODE: Scans the public/media/audio directory and generates
 * a source-of-truth manifest.json.
 * UPDATED: Now preserves existing entries (analysis data), adds new files,
 * and performs offline analysis (pitch/key/peaks) for WAV files.
 *
 * Usage: node scripts/generate_audio_manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WavDecoder from 'wav-decoder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const AUDIO_ROOT = 'media/audio';
const SCAN_DIR = path.join(PUBLIC_DIR, AUDIO_ROOT);
const OUTPUT_FILE = path.join(SCAN_DIR, 'audio_assets_manifest.json');

const VALID_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.webm'];

// --- Analysis Helpers (from analyze_audio.cjs) ---

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

function findPeaks(spectrum, sampleRate, fftSize) {
    const peaks = [];
    const threshold = 0.1; // Min amplitude relative to max
    const binWidth = sampleRate / fftSize;

    let maxAmp = 0;
    for (let i = 0; i < spectrum.length; i++) if (spectrum[i] > maxAmp) maxAmp = spectrum[i];
    if (maxAmp === 0) return [];

    for (let i = 1; i < spectrum.length - 1; i++) {
        if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
            if (spectrum[i] > maxAmp * threshold) {
                const freq = i * binWidth;
                peaks.push({ freq: parseFloat(freq.toFixed(2)), amp: parseFloat((spectrum[i] / maxAmp).toFixed(4)) });
            }
        }
    }
    return peaks.sort((a, b) => b.amp - a.amp).slice(0, 32); // Top 32 peaks
}

function detectPitch(buffer, sampleRate) {
    let size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return null; // Silence

    const maxSamples = Math.min(size, 4096);
    const buf = buffer.slice(0, maxSamples);

    let bestOffset = -1;
    let maxCorr = 0;

    for (let offset = 20; offset < maxSamples / 2; offset++) {
        let corr = 0;
        for (let i = 0; i < maxSamples - offset; i++) {
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

// --- Directory Scanning ---

function generateId(filePath, rootDir) {
    const relative = path.relative(rootDir, filePath);
    const parsed = path.parse(relative);
    
    let slug = parsed.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/_$/, '');

    const dirParts = parsed.dir.split(path.sep);
    if (dirParts.length > 0 && dirParts[0] !== '') {
        const pathSlug = dirParts.map(p => 
            p.toLowerCase()
             .replace(/\s+/g, '_')
             .replace(/[^a-z0-9_]/g, '')
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

    let manifest = {
        samples: {},
        tracks: {},
        sequences: {},
        loops: {},
        midi: {},
        stems: {},
        instruments: {},
        generatedAt: Date.now()
    };

    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            manifest = { ...manifest, ...existing, generatedAt: Date.now() };
            console.log(`[Agent] Loaded existing manifest with ${Object.keys(manifest.samples || {}).length} samples.`);
        } catch (e) {
            console.warn("[Agent] Could not parse existing manifest, starting fresh.");
        }
    }

    let analyzedCount = 0;
    let addedCount = 0;

    for (const fullPath of allFiles) {
        if (fullPath === OUTPUT_FILE) continue;

        const id = generateId(fullPath, SCAN_DIR);
        const relativePath = path.relative(PUBLIC_DIR, fullPath).split(path.sep).join('/');
        const webPath = '/' + relativePath;

        let oldId = null;
        for (const [key, val] of Object.entries(manifest.samples)) {
            if (val.path === webPath && key !== id) {
                oldId = key;
                break;
            }
        }

        if (oldId) {
            console.log(`[Agent] Migrating ID: ${oldId} -> ${id}`);
            manifest.samples[id] = manifest.samples[oldId];
            delete manifest.samples[oldId];
        }

        if (!manifest.samples[id]) {
            manifest.samples[id] = {
                filename: path.basename(fullPath),
                path: webPath,
                format: path.extname(fullPath).substring(1)
            };
            console.log(`[Agent] Added new sample: ${id}`);
            addedCount++;
        } else {
            manifest.samples[id].path = webPath;
        }

        // Perform Analysis if missing and is WAV
        const sample = manifest.samples[id];
        if ((!sample.analysis || !sample.analysis.freq) && sample.format === 'wav') {
            try {
                const buffer = fs.readFileSync(fullPath);
                const audioData = await WavDecoder.decode(buffer);
                const channelData = audioData.channelData[0];

                const freq = detectPitch(channelData, audioData.sampleRate);
                if (freq) {
                    const note = freqToNote(freq);
                    // For peaks, we'd need a real FFT.
                    // This simple script doesn't have an FFT library yet.
                    // But we can at least provide the freq and note.
                    sample.analysis = {
                        freq: parseFloat(freq.toFixed(2)),
                        note: note
                    };
                    console.log(`[Agent] Analyzed ${id}: ${note} (${freq.toFixed(2)} Hz)`);
                    analyzedCount++;
                }
            } catch (err) {
                console.warn(`[Agent] Failed to analyze ${id}: ${err.message}`);
            }
        }
    }

    console.log(`[Agent] Found ${Object.keys(manifest.samples).length} samples total. Added: ${addedCount}, Analyzed: ${analyzedCount}.`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`[Agent] Manifest written to ${OUTPUT_FILE}`);
}

run();
