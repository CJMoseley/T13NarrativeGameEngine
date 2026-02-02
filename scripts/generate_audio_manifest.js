/**
 * scripts/generate_audio_manifest.js
 * 
 * AGENTIC MODE: Scans the public/media/audio directory and generates
 * a source-of-truth manifest.json. 
 * UPDATED: Now preserves existing entries (analysis data) and only adds new files.
 * 
 * Usage: node scripts/generate_audio_manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const AUDIO_ROOT = 'media/audio';
const SCAN_DIR = path.join(PUBLIC_DIR, AUDIO_ROOT);
const OUTPUT_FILE = path.join(SCAN_DIR, 'audio_assets_manifest.json');

const VALID_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.webm'];

// Helper to create a clean ID from a filename
// e.g., "Moog Bass 1 (C2).wav" -> "bass/moog_bass_1__c2"
function generateId(filePath, rootDir) {
    const relative = path.relative(rootDir, filePath);
    const parsed = path.parse(relative);
    
    // Create a slug from the name
    let slug = parsed.name
        .toLowerCase()
        .replace(/\s+/g, '_')       // Spaces to underscores
        .replace(/[()]/g, '_')      // Parentheses to underscores
        .replace(/[^a-z0-9_]/g, '') // Remove other special chars
        .replace(/_+/g, '_')        // Collapse multiple underscores
        .replace(/_$/, '');         // Trim trailing underscore

    // Prepend parent folder name for context (e.g., "bass/...")
    const dirParts = parsed.dir.split(path.sep);
    if (dirParts.length > 0 && dirParts[0] !== '') {
        // FIX: Use full path for ID to preserve hierarchy
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

console.log(`[Agent] Scanning ${SCAN_DIR}...`);

const allFiles = scanDirectory(SCAN_DIR);

// Load existing manifest if present to preserve analysis data
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

allFiles.forEach(fullPath => {
    // Skip the manifest file itself if it exists
    if (fullPath === OUTPUT_FILE) return;

    const id = generateId(fullPath, SCAN_DIR);
    
    // Create the web-accessible path (relative to public root, starting with /)
    // We use forward slashes for URLs regardless of OS
    const relativePath = path.relative(PUBLIC_DIR, fullPath).split(path.sep).join('/');
    const webPath = '/' + relativePath;

    // Migration Logic: Check if this file exists under a different ID (old flat ID)
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

    // Only add if not exists, or update path if exists but preserve other data (like analysis)
    if (!manifest.samples[id]) {
        manifest.samples[id] = {
            filename: path.basename(fullPath),
            path: webPath,
            format: path.extname(fullPath).substring(1)
        };
        console.log(`[Agent] Added new sample: ${id}`);
    } else {
        // Update path just in case it moved, but keep analysis
        manifest.samples[id].path = webPath;
    }
});

console.log(`[Agent] Found ${Object.keys(manifest.samples).length} samples.`);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

console.log(`[Agent] Manifest written to ${OUTPUT_FILE}`);
console.log(`[Agent] Run your app. The Music Module should now load these exact paths.`);
