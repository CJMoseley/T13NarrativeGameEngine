// t13ne-geometry.js
// ES module: core geometry data and pure functions ported from PHP class T13Geometry

import T13Types from './t13ne-types.js';
import T13Dice from './t13ne-dice.js';
import Geometries from './data/geometries.js';
import Pitches from './data/pitches.js';
import RomanChords from './data/romanChords.js';
import Progressions from './data/progressions.js';
import CharacterEffects from './data/characterEffects.js';
import Chords from './data/chords.js';


// Core data (partial/full as needed)
const numerology = [
  { Letter: 'bh', Number: 2 },
  { Letter: 'gh', Number: 3 },
  { Letter: 'sh', Number: 3 },
  { Letter: 'ch', Number: 8 },
  { Letter: 'ph', Number: 8 },
  { Letter: 'th', Number: 9 },
  { Letter: 'ts', Number: 9 },
  { Letter: 'tz', Number: 9 },
  { Letter: 'a', Number: 1 },
  { Letter: 'b', Number: 2 },
  { Letter: 'c', Number: 2 },
  { Letter: 'd', Number: 4 },
  { Letter: 'e', Number: 5 },
  { Letter: 'f', Number: 8 },
  { Letter: 'g', Number: 3 },
  { Letter: 'h', Number: 8 },
  { Letter: 'i', Number: 1 },
  { Letter: 'j', Number: 1 },
  { Letter: 'k', Number: 2 },
  { Letter: 'l', Number: 3 },
  { Letter: 'm', Number: 4 },
  { Letter: 'n', Number: 5 },
  { Letter: 'o', Number: 7 },
  { Letter: 'p', Number: 8 },
  { Letter: 'q', Number: 1 },
  { Letter: 'r', Number: 2 },
  { Letter: 's', Number: 6 },
  { Letter: 't', Number: 4 },
  { Letter: 'u', Number: 6 },
  { Letter: 'v', Number: 6 },
  { Letter: 'w', Number: 6 },
  { Letter: 'x', Number: 6 },
  { Letter: 'y', Number: 1 },
  { Letter: 'z', Number: 7 },
  { Letter: '-', Number: 0 },
  { Letter: "'", Number: 0 },
  { Letter: '.', Number: 0 }
];

const intervalRatios = [
  { Name: 'Unison', Ratio: 1, Effect: 1, Interval: 0, Description: 'Unison is the same note twice, as such it has no harmonics or dissonance, which gives it no power, and no emotional content. The relationship has a smoothness and peace to it, but has will and insistence too.' },
  { Name: 'Minor-Second', Ratio: (16.0/15.0), Effect: -4, Interval: 1, Description: 'The Minor-Second is a difference of one semi-tone. This gives is a melancholic relationship, displeasurable, dull and dark, there is a certain weak, uptight, anguish to it. This is a reltionship that has humiliation and pain baked in. There is a sense of roughness, derangement, shyness or illness to this relationship, that may express as occasional fear or anger.' },
  { Name: 'Major-Second', Ratio: (9.0/8.0), Effect: -2, Interval: 2, Description: 'The Major-Second is a difference of a whole tone. This reltionship is dissonant, a pain-filled torment, but has hints of stability, which gives it tension — a sense of longing and eagerness. This is the sensation of asking a question and waiting for an anwer, there is a sense of motion and vulgarity to this. It is a wish and a displeasure simultaneously.' },
  { Name: 'Minor-Third', Ratio: (6.0/5.0), Effect: 1, Interval: 3, Description: 'The Minor-Third is a difference of three semi-tones, and brings a tragic dissonance with a sad harmony. This is a deeply emotional and sometimes tragic relationship, perhaps painful at times, but still sweet. It is a lament of discouraging sadness wrapped in heavy shadows.' },
  { Name: 'Major-Third', Ratio: (5.0/4.0), Effect: 3, Interval: 4, Description: 'The Major-Third is a difference of two tones, and this brings a rich harmonic strength. This is usually a bright, joyful relationship, full of positive energy and laughter, but that same energy and strength cannot become furious, quite due to the inherent hope and balance.' },
  { Name: 'Perfect Fourth', Ratio: (4.0/3.0), Effect: 4, Interval: 5, Description: 'The Perfect Fourth is a difference of five semi-tones and has a perfection about it (hence the name). This is a strong, bouyant relationship, but is not without active tension, pathos and sad times, but they serve to make it stronger. The Perfect Fourth can be firm, hard and cold, even indifferent to emotions, but it is always successful.' },
  { Name: 'Tri-tone', Ratio: (25.0/18.0), Effect: -5, Interval: 6, Description: "The Tritone, or Devil's interval, is three whole tones wide and has a violent dissonance to it. The relationship is filled with mysterious tension, restless, anxious, excitement and uncertainty, it has suprises, a soupçon of pretension, more than an air of destructive danger, and devilishly spicy heat. All of which can be terrible or great depending upon the context." },
  { Name: 'Perfect Fifth', Ratio: (3.0/2.0), Effect: 5, Interval: 7, Description: 'The Perfect Fifth, stretches over seven semi-tones and is the epitome of opposites attracting, hence the Perfect in the name. The relationship is completely stable, healthy, and pleasurable, it is not prone to any fights or internally caused sadness, as it is internally cheerful, gentle and bright. Loving, certain and calm, it is the essence of balance, but can feel hollow.' },
  { Name: 'Minor-Sixth', Ratio: (8.0/5.0), Effect: -1, Interval: 8, Description: 'The Minor-Sixth and its four tone interval brings some dark dissonance to the relationship. There is anguish, upsets, discontentment and instability to the relationship, it floats between pleasure and pain, and can be stressful and strained or shadowed and pitiful.' },
  { Name: 'Major-Sixth', Ratio: (5.0/3.0), Effect: 3, Interval: 9, Description: 'The Major-Sixth and its nine semi-tone interval brings tension as the relationship wants to resolve to Perfection, but cannot. There is a sweetness to the relationship, but no stability, it is a radiant will-they won\'t-they situation that can satisfy in the short term, but lacking true stability may fly apart at anytime.' },
  { Name: 'Minor-Seventh', Ratio: (16.0/9.0), Effect: -2, Interval: 10, Description: 'The Minor-Seventh is marked by the five whole tones of interval. This is a sad, painful, and unsatisifying relationship, but that has warmth, romance and love. Such relationships may leave both partners bewildered, strained and stressed when they are over, but while they are happening it is just a dynamic exaltation of love.' },
  { Name: 'Major-Seventh', Ratio: (15.0/8.0), Effect: -4, Interval: 11, Description: 'The Major-Seventh is an eleven semi-tone interval (or one semi-tone down from the octave). It is a bitter, tense relationship, often gloomy, wicked, and prideful and generable disagreeable, but it can be marked by some optimism, pride, hope and rebellion that lends it brightness.' },
  { Name: 'Octave', Ratio: 2, Effect: 5, Interval: 12, Description: 'A whole Octave seperates these notes and this brings perfect consonance. The relationship is generally an easy, stable one, but it is not without energy and strength, in fact the Octave relationship can be too intense, too strong, a majesty that becomes solemn or evern severe sometimes. It is courageous and heroic while being stable and solid.' }
];

// Minimal keys set (ported from PHP). This matches the PHP structure enough for core functions.
const keys = [
  { Key: 'C', Description: 'A pure key of innocence...', Alt: 'B\u266F', Syllable: 'Do', Colour: ['Red','#FF0000'], Frequency: 261.63, Sharps: 0, Flats: 0, Relative_Minor: 9, Fifth: 7, Fourth: 5, index: 0 },
  { Key: 'C#', Description: 'An emotionally constrained key...', Alt: 'D\u266D', Syllable: 'Di/Ra', Colour: ['Violet','#CF9BFF'], Frequency: 277.18, Sharps: 7, Flats: 5, Relative_Minor: 10, Fifth: 8, Fourth: 6, index: 1 },
  { Key: 'D', Description: 'A key of triumph...', Alt: 'E\u1D11F', Syllable: 'Re', Colour: ['Yellow','#F8F9FA'], Frequency: 293.66, Sharps: 2, Flats: 0, Relative_Minor: 11, Fifth: 9, Fourth: 7, index: 2 },
  { Key: 'D#', Description: 'A key of intimacy...', Alt: 'E\u266D', Syllable: 'Ri/Ma', Colour: ['Flesh','#65659A'], Frequency: 311.13, Sharps: 0, Flats: 3, Relative_Minor: 0, Fifth: 10, Fourth: 8, index: 3 },
  { Key: 'E', Description: 'A key of delights...', Alt: 'F\u266D', Syllable: 'Mi', Colour: ['Sky-blue','#E4FBFF'], Frequency: 329.63, Sharps: 4, Flats: 0, Relative_Minor: 1, Fifth: 11, Fourth: 9, index: 4 },
  { Key: 'F', Description: 'A key of compliance...', Alt: 'E\u266F', Syllable: 'Fa', Colour: ['Deep-Red','#434345'], Frequency: 349.23, Sharps: 0, Flats: 1, Relative_Minor: 2, Fifth: 0, Fourth: 10, index: 5 },
  { Key: 'F#', Description: 'A key of besting difficulties...', Alt: 'G\u266D', Syllable: 'Fi/Se', Colour: ['Bright-Blue','#00CDFF'], Frequency: 369.99, Sharps: 6, Flats: 6, Relative_Minor: 3, Fifth: 1, Fourth: 11, index: 6 },
  { Key: 'G', Description: 'A key of peaceful emotion...', Alt: 'G', Syllable: 'Sol/So', Colour: ['Orange','#FF6500'], Frequency: 392.00, Sharps: 1, Flats: 0, Relative_Minor: 4, Fifth: 2, Fourth: 0, index: 7 },
  { Key: 'G#', Description: 'The key of eternity...', Alt: 'A\u266D', Syllable: 'Si/Lo', Colour: ['Magenta','#FF00FF'], Frequency: 415.30, Sharps: 0, Flats: 4, Relative_Minor: 5, Fifth: 3, Fourth: 1, index: 8 },
  { Key: 'A', Description: 'A key of hope...', Alt: 'B\u1D11F', Syllable: 'La', Colour: ['Green','#2FCD30'], Frequency: 440.00, Sharps: 3, Flats: 0, Relative_Minor: 6, Fifth: 4, Fourth: 2, index: 9 },
  { Key: 'A#', Description: 'A cheerful key...', Alt: 'B\u266D', Syllable: 'Li/Te', Colour: ['Steel','#8D8B8D'], Frequency: 466.16, Sharps: 0, Flats: 2, Relative_Minor: 7, Fifth: 5, Fourth: 3, index: 10 },
  { Key: 'B', Description: 'A key of wild passions...', Alt: 'C\u266D', Syllable: 'Ti/Si', Colour: ['Blue','#0000FE'], Frequency: 493.88, Sharps: 5, Flats: 7, Relative_Minor: 8, Fifth: 6, Fourth: 4, index: 11 },
  { Key: 'C', Description: 'A pure key of innocence...', Alt: 'B\u266F', Syllable: 'Do', Colour: ['Red','#FF0000'], Frequency: 261.63, Sharps: 0, Flats: 0, Relative_Minor: 9, Fifth: 7, Fourth: 5, index: 12 }
];

// Utility helpers
function crunchNumbers(num){
  num = Number(num) || 0;
  while (num > 13){
    num = String(num).split('').reduce((a,b)=>a + Number(b||0), 0);
  }
  return Number(num);
}

function tidyName(name){
  if (typeof name !== 'string') name = JSON.stringify(name);
  name = name.toLowerCase().trim();
  const patterns = [/[áâàåä]/g, /[ðéêèë]/g, /[íîìï]/g, /[óôòøõö]/g, /[úûùü]/g, /æ/g, /ç/g, /ß/g];
  const replacements = ['a','e','i','o','u','ae','c','ss'];
  for (let i=0;i<patterns.length;i++){
    name = name.replace(patterns[i], replacements[i]);
  }
  name = name.replace(/[^A-Za-z,.]/g,'');
  return name;
}

function countOccurrences(haystack, needle){
  if (!needle) return 0;
  let idx = 0, count = 0;
  while(true){
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) break;
    count++; idx += needle.length;
  }
  return count;
}

function getGeometryFromString(name){
  let geo = 0;
  name = tidyName(name);
  for (const num of numerology){
    if (name.includes(num.Letter)){
      geo += countOccurrences(name, num.Letter) * num.Number;
    }
  }
  geo = crunchNumbers(geo);
  return Number(geo);
}

function getKey(tone){
  let t = Number(tone);
  const toneInt = Math.trunc(t);
  const noteIndex = toneInt % 12;
  const octave = Math.floor(toneInt / 12);

  const baseKey = Object.assign({}, keys[noteIndex]);
  const octaveOffset = octave - 4; // Our base frequencies are in the 4th octave
  baseKey.Frequency = baseKey.Frequency * Math.pow(2, octaveOffset);
  return { Key: baseKey, KeyNo: octave };
}

function getInterval(note, root){
  const t = Math.abs(parseInt(note) - parseInt(root));
  let ret;
  if (t < 20){
    ret = intervalRatios[t];
  } else {
    let tt = t % 12;
    if (tt === 0) tt = 12;
    ret = Object.assign({}, intervalRatios[tt]);
    ret.Name = 'Compound-' + ret.Name;
    ret.Description = 'This interval is a compound of at least one Octave and ' + ret.Description;
    ret.Interval = t;
    ret.Ratio = ret.Ratio / (1 + Math.floor(t/12));
  }
  return { Interval: ret, root: root, note: note };
}

function getIntervals(tones, root=0){
  if (typeof tones === 'string') tones = T13Types.arrayify(tones);
  if (Array.isArray(tones)){
    const ret = [];
    for (let i=0;i<tones.length;i++){
      for (let j=i+1;j<tones.length;j++){
        ret.push(getInterval(Number(tones[j])+Number(root), Number(tones[i])+Number(root)));
      }
    }
    return T13Types.makeUniqueArray(ret);
  }
  return [];
}

function getChord(notes, mode, root){
  // notes may be array or string
  let tones = notes;
  if (Array.isArray(notes)) tones = notes.slice();
  if (typeof notes === 'string') tones = T13Types.arrayify(notes);
  const intervals = getIntervals(tones, root);
  const c = tones.length;
  if (c < 6 && c > 1){
    const notesStr = tones.join(',');
    for (const chord of Chords){
      if (chord.Notes === notesStr){
        return { Root: root, Chord: chord, Mode: mode };
      }
    }
  }
  // Tone cluster fallback
  let intext = 'Tone Cluster: contains intervals: ' + JSON.stringify(intervals.map(i=>i.Interval.Name));
  return { Root: root, Chord: { Type:'Tone Cluster', Description: 'Tone cluster', Root: root, Notes: tones, Symbol:'TC', _debug: intext }, Mode: mode };
}

function getTones(search, distance){
  const matches = [];
  const searches = (Array.isArray(search) ? search.reduce((a,b)=>a+Number(b||0),0) : 0) + Number(distance||0);
  const numb = Array.isArray(search)? search.length : 0;
  T13Types.tonalModes.forEach((mode, id)=>{
    const c = (mode.ModalNumbers||mode.ModalNumbers||[]).length;
    if (numb < c){
      if (mode.Type !== 'Chromatic' && T13Types.contains(search, mode.ModalNumbers)){
        matches.push({ id, Mode: mode });
      }
    }
  });
  matches.sort((a,b)=> (a.Mode.ModalNumbers.length - b.Mode.ModalNumbers.length));
  const c = Math.ceil(matches.length/3) || 0;
  if (c > 0){
    const pick = matches[searches % c];
    return { tonalmode: pick.id, modaltones: pick.Mode.ModalNumbers, tonename: pick.Mode.Type };
  }else{
    const last = T13Types.tonalModes.length - 1;
    return { tonalmode: last, modaltones: Array.from({length:14}, (_,i)=>i), tonename: 'Chromatic' };
  }
}

function correctTones(tones){
  if (Array.isArray(tones)){
    const unique = Array.from(new Set(tones.map(Number)));
    unique.sort((a,b)=>a-b);
    const bass = Number(unique[0]) || 0;
    const notes = unique.map(t => Number(t) - bass);
    return { Root: bass, Tones: notes };
  }
  return null;
}

function calculateChord(tones){
  if (Array.isArray(tones) && tones.length > 2){
    const correct = correctTones(tones);
    const mode = getTones(correct.Tones, 1);
    const chord = getChord(correct.Tones, mode, correct.Root);
    return chord;
  }
  return null;
}

function calculateHarmonics(geo=1, soul=3, facade=4, initial=2, length=10, aka=[]){
  const ac = Array.isArray(aka)? aka.length : 0;
  let ghost = (Number(geo)+Number(soul)+Number(facade)+Number(initial)+Number(length));
  if (ac > 2){
    const uniq = Array.from(new Set(aka.map(Number)));
    const av = Math.floor(uniq.reduce((a,b)=>a+b,0) / uniq.length);
    ghost = av;
  }else{
    ghost = crunchNumbers(ghost);
  }
  let notes = [Number(geo), Number(soul), Number(facade), Number(initial), Number(ghost)];
  notes.sort((a,b)=>a-b);
  let key = notes[0];
  // merge unique with aka
  const merged = Array.from(new Set([...notes, ...(Array.isArray(aka)? aka.map(Number):[])]));
  merged.sort((a,b)=>a-b);
  const corrected = merged.map(note => (13 + Number(note) - key) % 13).sort((a,b)=>a-b);
  const mode = getTones(corrected, merged.reduce((a,b)=>a+Number(b||0),0));
  const tonalmode = mode.tonalmode;
  const modaltones = mode.modaltones;
  let harmonics = [];
  let dissonants = [];
  for (let i=0;i<14;i++){
    const num = 1 + ((i + key - 1) % 13);
    if (modaltones.includes(i)) harmonics.push(num);
    else dissonants.push(num);
  }
  if (harmonics.length < 1 || dissonants.length < 1){
    harmonics = Array.from(new Set([...(merged), ...(Geometries[key%13].Harmonic||[])]));
  }
  if (dissonants.length < 1){
    dissonants = Array.from(new Set([1 + ((geo + soul + facade + initial + length) % 13), ...(Geometries[key%13].Dissonant||[])]));
    harmonics = harmonics.filter(h=>!dissonants.includes(h));
  }
  harmonics.sort((a,b)=>a-b);
  dissonants.sort((a,b)=>a-b);
  // perfect and sustained selection
  let perfect = 0, sustained = 0, wolf = 0, nemesis = 0;
  function testPick(val, arr){
    if (arr.includes(val)) return val;
    if (arr.includes(val-9)) return val-9;
    return null;
  }
  perfect = testPick(soul, harmonics) ?? testPick(ghost, harmonics) ?? testPick(facade, harmonics) ?? (harmonics.length? harmonics[soul % harmonics.length] : 0);
  sustained = testPick(soul, dissonants) ?? testPick(ghost, dissonants) ?? testPick(facade, dissonants) ?? (dissonants.length? dissonants[facade % dissonants.length] : 0);
  const hlist = harmonics.filter(h=>h !== perfect);
  const dlist = dissonants.filter(d=>d !== sustained);
  if (hlist.length && dlist.length){
    wolf = hlist[Math.abs(geo + facade + soul + initial) % hlist.length];
    nemesis = dlist[Math.abs(geo + soul + facade + ghost) % dlist.length];
  }
  key = Math.abs((46 + key - nemesis + wolf - geo + soul - facade + ghost - initial + length) % 88);
  return { notes: merged, corrected, key, len: length, Mode: mode, ModalTone: tonalmode, Harmonic: harmonics, Dissonant: dissonants, Perfect: perfect, Wolf: wolf, Sustained: sustained, Nemesis: nemesis, Ghost: ghost };
}

function writeGeoNum(g){
  return '('+g+((g>9)? '/'+(g-9):'')+')';
}

function calculateFullGeo(name='', forcegeo=0){
  let akas = [];
  let akaNums = [];
  let ret = {};
  let fullname;
  if (typeof name === 'number') fullname = String(name);
  if (typeof name === 'string'){
    const arr = T13Types.arrayify(name);
    // Use arrayify to see if user passed an array-like string
    if (arr.length > 1) name = arr;
  }
  if (Array.isArray(name)){
    const cn = name.length;
    switch(cn){
      case 0: name = 'Unknown'; break;
      case 1:
        akas = name; fullname = name[0]; name = name[0]; break;
      case 2:
        akas = name; fullname = name[1]; name = name[0]; break;
      case 3:
        akas = T13Types.arrayify(name[2]); fullname = name[1]; name = name[0]; break;
      default:
        akas = name; fullname = name[1]; name = name[0]; break;
    }
  }
  if (!fullname) fullname = name;
  if (akas){
    const akalist = Array.isArray(akas) ? Array.from(new Set(akas)) : T13Types.arrayify(akas);
    akaNums = [];
    akalist.forEach((aka, idx)=>{
      const a = Number(getGeometryFromString(aka));
      if (a){
        akaNums.push(a);
      }
    });
  }
  ret.Name = name;
  ret.AKAs = Array.isArray(akas)? akas.join(', ') : (akas || '');
  ret.AKANums = akaNums;
  ret.Full = getGeometryFromString(fullname);
  ret.Facade = getGeometryFromString(String(fullname).replace(/[aeiouy\s]+/gi,''));
  ret.Soul = getGeometryFromString(String(fullname).replace(/[bcdfghjklmnpqrstvwxz\s]+/gi,''));
  ret.Initial = getGeometryFromString(String(fullname).slice(0,1));
  ret.Len = String(name).length;
  ret.Flen = String(fullname).length;
  ret.Fullname = String(fullname) + writeGeoNum(ret.Full);
  if (Array.isArray(forcegeo)) forcegeo = forcegeo[0];
  let g;
  if (typeof name === 'string' && !forcegeo){
    g = getGeometryFromString(name);
  } else if (typeof name === 'number' && !forcegeo){
    g = (name < 14 && name > 0) ? name : 0;
  } else {
    g = forcegeo;
  }
  ret.GeometryNumber = g;
  ret.Geo = Geometries[g] || Geometries[0];
  if (akaNums && akaNums.length){
    ret.GeoHarmonics = calculateHarmonics(g, ret.Soul, ret.Facade, ret.Initial, ret.Flen, akaNums);
  }else{
    ret.GeoHarmonics = calculateHarmonics(g, ret.Soul, ret.Facade, ret.Initial, ret.Len);
  }
  return ret;
}

function calculateGeoKey(name, forcegeo=0){
  const geo = calculateFullGeo(name, forcegeo);
  return getKey(geo.GeoHarmonics.key);
}

function writeGeo(name, showname=true, forcegeo=0){
  const geo = calculateFullGeo(name, forcegeo);
  const harmonies = (geo.GeoHarmonics.Harmonic||[]).join(', ');
  const dissonants = (geo.GeoHarmonics.Dissonant||[]).join(', ');
  const tone = T13Types.tonalModes[geo.GeoHarmonics.ModalTone] || {Type:'Unknown', Description:''};
  const g = geo.GeometryNumber;
  const geoText = `<div class="t13ne-geo"><strong>Name:</strong> ${geo.Name} <div class="t13ne-geo-desc">${Geometries[g].Geometry_Description || ''}</div></div>`;
  return { GeoName: Geometries[g].Name, GeoText: geoText, Name: name, Harmonics: geo.GeoHarmonics };
}

function writeBlock(/* omitted: detailed HTML rendering; keep minimal for now */){
  return '<div class="t13ne-geo-block">Geometry block (summary)</div>';
}

function updateImpressionGrid(grid, x, y, value, display=false){
  value = Number(String(value).replace(/^\+/, '')) || 0;
  if (!grid[x]) grid[x] = [];
  if (!grid[x][y]) grid[x][y] = { Value: 0, Mod: 0 };
  if (typeof grid[x][y].Value === 'number') grid[x][y].Value += value;
  return grid;
}

function calculateImpressions(names, forcegeos='0', modifiers='0'){
  const nameList = T13Types.arrayify(names || []);
  const geos = T13Types.arrayify(forcegeos || '0');
  let rngNote = null;
  let mods;
  if (typeof modifiers === 'string'){
    if (modifiers === 'rng'){
      const n = nameList.length;
      const nn = n * n;
      mods = [];
      for (let i=0;i<=nn;i++){
        mods[i] = T13Dice.RNG(0,10,-5);
      }
      rngNote = 'Modifiers applied:'+JSON.stringify(mods);
    }else{
      mods = T13Types.arrayify(modifiers);
    }
  }else{
    mods = modifiers;
  }
  const geolist = [];
  const glist = [];
  const grid = [];
  // build geolist
  nameList.forEach((name, id)=>{
    const thisgeo = writeGeo(name, true, geos[id % (geos.length || 1)] || 0);
    // Harmonics object has HARMONICS mapping in our writeGeo
    if (thisgeo.Harmonics && thisgeo.Harmonics.Harmonic){
      thisgeo.Harmonics.Harmonic.forEach(h=>{});
    }
    geolist.push(thisgeo);
    glist.push(thisgeo.GeoName);
  });
  // initialize grid
  const num = geolist.length;
  for (let i=0;i<num;i++){
    grid[i] = [];
    for (let j=0;j<num;j++) grid[i][j] = { Value: 0, Mod: 0 };
  }
  // apply any modifier matrix (including RNG generated ones)
  if (Array.isArray(mods) && mods.length>0){
    for (let i=0;i<num;i++){
      for (let j=0;j<num;j++){
        const v = Number(mods[(i*num + j) % mods.length]) || 0;
        grid[i][j].Value += v;
        grid[i][j].Mod = v;
      }
    }
  }
  // apply simple rules based on harmonic/dissonant lists and keys
  geolist.forEach((geo, i)=>{
    geolist.forEach((other, j)=>{
      if (i === j) return;
      const g1 = geo.Harmonics || {};
      const g2 = other.Harmonics || {};
      // if other's geoname in my Harmonic list
      if ((g1.Harmonic||[]).includes(other.GeoName)) updateImpressionGrid(grid, i, j, 1);
      if ((g1.Dissonant||[]).includes(other.GeoName)) updateImpressionGrid(grid, i, j, -1);
      // interval effect via keys
      const interval = getInterval((other.Harmonics && other.Harmonics.key) || 0, (geo.Harmonics && geo.Harmonics.key) || 0);
      if (interval && interval.Interval && typeof interval.Interval.Effect === 'number') updateImpressionGrid(grid, i, j, interval.Interval.Effect);
    });
  });
  const result = { grid, geolist };
  if (rngNote) result.rng = rngNote;
  return result;
}

const T13Geometry = {
  numerology,
  intervalRatios,
  keys,
  crunchNumbers,
  tidyName,
  getGeometryFromString,
  getKey,
  getInterval,
  getIntervals,
  getChord,
  getTones,
  correctTones,
  calculateChord,
  calculateHarmonics,
  calculateFullGeo,
  calculateGeoKey,
  writeGeo,
  writeBlock,
  updateImpressionGrid,
  calculateImpressions,
  T13Types,
  Geometries,
  Pitches,
  RomanChords,
  Progressions,
  CharacterEffects,
  Chords,
  // convenience alias
  getGeoFromString: getGeometryFromString
};

export default T13Geometry;
