const fs = require('fs');
const path = require('path');
const WavDecoder = require('wav-decoder');

const manifestPath = path.join(__dirname, 'public/data/media/audio/audio_assets_manifest.json');
const baseDir = path.join(__dirname, 'public/data/media/audio');

// Load Manifest
if (!fs.existsSync(manifestPath)) {
    console.error('Manifest not found!');
    process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Helper: Note from Freq
function freqToNote(freq) {
    if (!freq) return null;
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const c0 = A4 * Math.pow(2, -4.75);
    const semitones = 12 * Math.log2(freq / c0);
    const noteIndex = Math.round(semitones) % 12;
    const octave = Math.floor(semitones / 12);
    return notes[noteIndex] + octave;
}

// Helper: Find Peaks for Chord Detection
function findPeaks(spectrum, sampleRate) {
    const peaks = [];
    const threshold = 0.1; // Min amplitude relative to max

    // Simple peak finding
    let maxAmp = 0;
    for (let i = 0; i < spectrum.length; i++) if (spectrum[i] > maxAmp) maxAmp = spectrum[i];

    for (let i = 1; i < spectrum.length - 1; i++) {
        if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
            if (spectrum[i] > maxAmp * threshold) {
                const freq = i * sampleRate / (spectrum.length * 2);
                peaks.push({ freq, amp: spectrum[i] });
            }
        }
    }
    return peaks.sort((a, b) => b.amp - a.amp).slice(0, 5); // Top 5 peaks
}

// Helper: Guess Chord from Note Names
function guessChord(notes) {
    // Very simplified chord guesser
    const uniqueNotes = [...new Set(notes.map(n => n.slice(0, -1)))]; // Remove octave
    if (uniqueNotes.length < 3) return null;

    // Check rudimentary triads (C E G -> C Major)
    // This requires a proper music theory map, for this basic script we might just return the notes.
    return uniqueNotes.join('-');
}

// Time Domain Pitch Detection (YIN or Autocorrelation simplified)
function detectPitch(buffer, sampleRate) {
    let size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return null; // Silence

    // Autocorrelation
    // Limit buffer size for performance
    const maxSamples = Math.min(size, 4096);
    const buf = buffer.slice(0, maxSamples);

    let bestOffset = -1;
    let maxCorr = 0;

    for (let offset = 20; offset < maxSamples / 2; offset++) {
        let corr = 0;
        for (let i = 0; i < maxSamples - offset; i++) {
            corr += buf[i] * buf[i + offset];
        }
        // Normalize
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

async function analyzeAsset(category, id, item) {
    const filePath = path.join(baseDir, category, item.filename);

    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    if (path.extname(filePath).toLowerCase() !== '.wav') {
        return; // Only WAV supported by this simple decoder for now
    }

    try {
        const buffer = fs.readFileSync(filePath);
        const audioData = await WavDecoder.decode(buffer);
        const channelData = audioData.channelData[0]; // Mono analysis

        const freq = detectPitch(channelData, audioData.sampleRate);
        if (freq) {
            const note = freqToNote(freq);
            item.analysis = {
                freq: parseFloat(freq.toFixed(2)),
                key: note
            };
            console.log(`Analyzed ${id}: ${note} (${freq.toFixed(2)} Hz)`);
        } else {
            console.log(`Analyzed ${id}: Pitch undefined`);
            item.analysis = { key: 'Unknown' };
        }
    } catch (e) {
        console.error(`Error decoding ${id}:`, e.message);
    }
}

async function run() {
    console.log("Analyzing audio assets...");

    const cats = ['samples', 'loops']; // Only analyze audio files
    for (const cat of cats) {
        if (!manifest[cat]) continue;
        for (const id in manifest[cat]) {
            // Skip if already analyzed to save time (unless force flag?)
            // if (manifest[cat][id].analysis) continue; 

            await analyzeAsset(cat, id, manifest[cat][id]);
        }
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    console.log("Analysis complete. Manifest updated.");
}

run();
