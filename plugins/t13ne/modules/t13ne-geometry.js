// t13ne-geometry.js
// ES module: core geometry data and pure functions ported from PHP class T13Geometry

import T13Dice from '../modules/t13ne-dice.js';
import T13Name from '../modules/t13ne-names.js';

class T13Geometry {
    constructor(codexLoader) {
        this.codex = codexLoader;

        // Data properties to be loaded
        this.numerology = [];
        this.intervalRatios = [];
        this.keys = [];
        this.Geometries = [];
        this.Pitches = [];
        this.RomanChords = [];
        this.Progressions = [];
        this.CharacterEffects = [];
        this.Chords = [];
        this.tonalModes = [];
    }

    async initialize() {
        const unwrap = (data) => {
            if (Array.isArray(data)) {
                if (data.length > 0 && data[0].data && data[0].id) {
                    return data.map(item => item.data);
                }
                return data;
            }
            return [];
        };
        
        this.numerology = unwrap(await this.codex.getData('numerology'));
        this.intervalRatios = unwrap(await this.codex.getData('interval_ratios'));
        this.keys = unwrap(await this.codex.getData('keys'));
        
        const geos = unwrap(await this.codex.getData('geometries'));
        if (geos.length > 0 && geos[0].Geometry !== undefined) {
             geos.sort((a, b) => a.Geometry - b.Geometry);
        }
        this.Geometries = geos;

        this.Pitches = unwrap(await this.codex.getData('pitches'));
        this.RomanChords = unwrap(await this.codex.getData('romanChords'));
        this.Progressions = unwrap(await this.codex.getData('progressions'));
        this.CharacterEffects = unwrap(await this.codex.getData('character_effects'));
        this.Chords = unwrap(await this.codex.getData('chords'));
        this.tonalModes = unwrap(await this.codex.getData('tonalModes'));
    }

    // Utility helpers
    arrayify(value) {
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value === 'string') {
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    // fall through to comma-separated
                }
            }
            return value.split(',').map(s => s.trim());
        }
        if (value === null || value === undefined) {
            return [];
        }
        return [value];
    }
    
    makeUniqueArray(arr) {
        if (!Array.isArray(arr)) return [];
        // This is tricky if array contains objects. The original likely did not.
        // Assuming simple values or object references that are unique.
        return [...new Set(arr)];
    }

    contains(haystack, needle) {
        if (!Array.isArray(haystack) || !Array.isArray(needle)) {
            return false;
        }
        return needle.every(elem => haystack.includes(elem));
    }


    crunchNumbers(num){
      num = Number(num) || 0;
      while (num > 13){
        num = String(num).split('').reduce((a,b)=>a + Number(b||0), 0);
      }
      return Number(num);
    }

    tidyName(name){
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

    countOccurrences(haystack, needle){
      if (!needle) return 0;
      let idx = 0, count = 0;
      while(true){
        idx = haystack.indexOf(needle, idx);
        if (idx === -1) break;
        count++; idx += needle.length;
      }
      return count;
    }

    getGeometryFromString(name){
      let geo = 0;
      name = this.tidyName(name);
      for (const num of this.numerology){
        if (name.includes(num.Letter)){
          geo += this.countOccurrences(name, num.Letter) * num.Number;
        }
      }
      geo = this.crunchNumbers(geo);
      return Number(geo);
    }

    getKey(tone){
      let t = Number(tone);
      const toneInt = Math.trunc(t);
      const noteIndex = toneInt % 12;
      const octave = Math.floor(toneInt / 12);

      const baseKey = Object.assign({}, this.keys[noteIndex]);
      const octaveOffset = octave - 4; // Our base frequencies are in the 4th octave
      baseKey.Frequency = baseKey.Frequency * Math.pow(2, octaveOffset);
      return {
        Key: baseKey,
        KeyNo: octave,
        T13NEDescription: baseKey.T13NEDescription || ''
      };
    }

    getInterval(note, root){
      const t = Math.abs(parseInt(note) - parseInt(root));
      let ret;
      if (t < 20){
        ret = this.intervalRatios[t];
      } else {
        let tt = t % 12;
        if (tt === 0) tt = 12;
        ret = Object.assign({}, this.intervalRatios[tt]);
        ret.Name = 'Compound-' + ret.Name;
        ret.Description = 'This interval is a compound of at least one Octave and ' + ret.Description;
        ret.Interval = t;
        ret.Ratio = ret.Ratio / (1 + Math.floor(t/12));
      }
      return { Interval: ret, root: root, note: note };
    }

    getIntervals(tones, root=0){
      if (typeof tones === 'string') tones = this.arrayify(tones);
      if (Array.isArray(tones)){
        const ret = [];
        for (let i=0;i<tones.length;i++){
          for (let j=i+1;j<tones.length;j++){
            ret.push(this.getInterval(Number(tones[j])+Number(root), Number(tones[i])+Number(root)));
          }
        }
        return this.makeUniqueArray(ret);
      }
      return [];
    }

    getChord(notes, mode, root){
      // notes may be array or string
      let tones = notes;
      if (Array.isArray(notes)) tones = notes.slice();
      if (typeof notes === 'string') tones = this.arrayify(notes);
      const intervals = this.getIntervals(tones, root);
      const c = tones.length;
      if (c < 6 && c > 1){
        const notesStr = tones.join(',');
        for (const chord of this.Chords){
          if (chord.Notes === notesStr){
            return {
              Root: root,
              Chord: chord,
              Mode: mode,
              T13NEDescription: chord.T13NEDescription || ''
            };
          }
        }
      }
      // Tone cluster fallback
      let intext = 'Tone Cluster: contains intervals: ' + JSON.stringify(intervals.map(i=>i.Interval.Name));
      return {
        Root: root,
        Chord: { Type:'Tone Cluster', Description: 'Tone cluster', Root: root, Notes: tones, Symbol:'TC', _debug: intext },
        Mode: mode,
        T13NEDescription: 'A complex and dissonant grouping of notes, chaotic and unpredictable.'
      };
    }

    getTones(search, distance){
      const matches = [];
      const searches = (Array.isArray(search) ? search.reduce((a,b)=>a+Number(b||0),0) : 0) + Number(distance||0);
      const numb = Array.isArray(search)? search.length : 0;
      this.tonalModes.forEach((mode, id)=>{
        const c = (mode.ModalNumbers||[]).length;
        if (numb <= c){
          if (mode.Type !== 'Chromatic' && this.contains(mode.ModalNumbers, search)){
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
        const last = this.tonalModes.length - 1;
        return { tonalmode: last, modaltones: Array.from({length:14}, (_,i)=>i), tonename: 'Chromatic' };
      }
    }

    correctTones(tones){
      if (Array.isArray(tones)){
        const unique = Array.from(new Set(tones.map(Number)));
        unique.sort((a,b)=>a-b);
        const bass = Number(unique[0]) || 0;
        const notes = unique.map(t => Number(t) - bass);
        return { Root: bass, Tones: notes };
      }
      return null;
    }

    calculateChord(tones){
      if (Array.isArray(tones) && tones.length > 2){
        const correct = this.correctTones(tones);
        const mode = this.getTones(correct.Tones, 1);
        const chord = this.getChord(correct.Tones, mode, correct.Root);
        return chord;
      }
      return null;
    }

    calculateHarmonics(geo=1, soul=3, facade=4, nascent=2, length=10, aka=[]){
      const ac = Array.isArray(aka)? aka.length : 0;
      let ghost = (Number(geo)+Number(soul)+Number(facade)+Number(nascent)+Number(length));
      if (ac > 2){
        const uniq = Array.from(new Set(aka.map(Number)));
        const av = Math.floor(uniq.reduce((a,b)=>a+b,0) / uniq.length);
        ghost = av;
      }else{
        ghost = this.crunchNumbers(ghost);
      }
      let notes = [Number(geo), Number(soul), Number(facade), Number(nascent), Number(ghost)];
      notes.sort((a,b)=>a-b);
      let key = notes[0];
      // merge unique with aka
      const merged = Array.from(new Set([...notes, ...(Array.isArray(aka)? aka.map(Number):[])]));
      merged.sort((a,b)=>a-b);
      const corrected = merged.map(note => (13 + Number(note) - key) % 13).sort((a,b)=>a-b);
      const mode = this.getTones(corrected, merged.reduce((a,b)=>a+Number(b||0),0));
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
        harmonics = Array.from(new Set([...(merged), ...(this.Geometries[key%13].Harmonic||[])]));
      }
      if (dissonants.length < 1){
        dissonants = Array.from(new Set([1 + ((geo + soul + facade + nascent + length) % 13), ...(this.Geometries[key%13].Dissonant||[])]));
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
        wolf = hlist[Math.abs(geo + facade + soul + nascent) % hlist.length];
        nemesis = dlist[Math.abs(geo + soul + facade + ghost) % dlist.length];
      }
      key = Math.abs((46 + key - nemesis + wolf - geo + soul - facade + ghost - nascent + length) % 88);
      return { notes: merged, corrected, key, len: length, Mode: mode, ModalTone: tonalmode, Harmonic: harmonics, Dissonant: dissonants, Perfect: perfect, Wolf: wolf, Sustained: sustained, Nemesis: nemesis, Ghost: ghost };
    }

    writeGeoNum(g){
      return '('+g+((g>9)? '/'+(g-9):'')+')';
    }

    calculateFullGeo(name='', forcegeo=0){
      const t13n = new T13Name(name);
      let commonName = t13n.common;
      let fullname = t13n.full;
      let akas = t13n.aliases;

      let akaNums = [];
      let ret = {};

      if (akas){
        const akalist = this.arrayify(akas);
        akaNums = [];
        akalist.forEach((aka, idx)=>{
          const a = Number(this.getGeometryFromString(aka));
          if (a){
            akaNums.push(a);
          }
        });
      }
      ret.Name = commonName;
      ret.AKAs = Array.isArray(akas) ? akas.join(', ') : (akas || '');
      ret.AKANums = akaNums;
      ret.Full = this.getGeometryFromString(fullname);
      ret.Facade = this.getGeometryFromString(String(fullname).replace(/[aeiouy\s]+/gi,''));
      ret.Soul = this.getGeometryFromString(String(fullname).replace(/[bcdfghjklmnpqrstvwxz\s]+/gi,''));
      ret.Nascent = this.getGeometryFromString(String(fullname).slice(0,1));
      ret.Len = String(commonName).length;
      ret.Flen = String(fullname).length;
      ret.Fullname = String(fullname) + this.writeGeoNum(ret.Full);
      if (Array.isArray(forcegeo)) forcegeo = forcegeo[0];
      let g;
      if (forcegeo) {
        g = forcegeo;
      } else if (typeof name === 'number') {
        g = (name < 14 && name > 0) ? name : 0;
      } else {
        g = this.getGeometryFromString(commonName);
      }
      ret.GeometryNumber = g;
      ret.Geo = this.Geometries[g] || this.Geometries[0];
      if (akaNums && akaNums.length){
        ret.GeoHarmonics = this.calculateHarmonics(g, ret.Soul, ret.Facade, ret.Nascent, ret.Flen, akaNums);
      }else{
        ret.GeoHarmonics = this.calculateHarmonics(g, ret.Soul, ret.Facade, ret.Nascent, ret.Len);
      }
      return ret;
    }

    calculateGeoKey(name, forcegeo=0){
      const geo = this.calculateFullGeo(name, forcegeo);
      return this.getKey(geo.GeoHarmonics.key);
    }

    writeGeo(name, showname=true, forcegeo=0){
      const geo = this.calculateFullGeo(name, forcegeo);
      const harmonies = (geo.GeoHarmonics.Harmonic||[]).join(', ');
      const dissonants = (geo.GeoHarmonics.Dissonant||[]).join(', ');
      const tone = this.tonalModes[geo.GeoHarmonics.ModalTone] || {Type:'Unknown', Description:''};
      const g = geo.GeometryNumber;
      const geoText = `<div class="t13ne-geo"><strong>Name:</strong> ${geo.Name} <div class="t13ne-geo-desc">${this.Geometries[g].Geometry_Description || ''}</div></div>`;
      return { GeoName: this.Geometries[g].Name, GeoText: geoText, Name: name, Harmonics: geo.GeoHarmonics };
    }

    writeBlock(/* omitted: detailed HTML rendering; keep minimal for now */){
      return '<div class="t13ne-geo-block">Geometry block (summary)</div>';
    }

    updateImpressionGrid(grid, x, y, value, display=false){
      value = Number(String(value).replace(/^\+/, '')) || 0;
      if (!grid[x]) grid[x] = [];
      if (!grid[x][y]) grid[x][y] = { Value: 0, Mod: 0 };
      if (typeof grid[x][y].Value === 'number') grid[x][y].Value += value;
      return grid;
    }

    calculateImpressions(names, forcegeos='0', modifiers='0'){
      const nameList = this.arrayify(names || []);
      const geos = this.arrayify(forcegeos || '0');
      let rngNote = null;
      let mods;
      if (typeof modifiers === 'string'){
        if (modifiers === 'rng'){
          const n = nameList.length;
          const nn = n * n;
          mods = [];
          for (let i=0;i<nn;i++){
            mods[i] = T13Dice.RNG(0,10,-5);
          }
          rngNote = 'Modifiers applied:'+JSON.stringify(mods);
        }else{
          mods = this.arrayify(modifiers);
        }
      }else{
        mods = modifiers;
      }
      const geolist = [];
      const glist = [];
      const grid = [];
      // build geolist
      nameList.forEach((name, id)=>{
        const thisgeo = this.writeGeo(name, true, geos[id % (geos.length || 1)] || 0);
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
          if ((g1.Harmonic||[]).includes(other.GeoName)) this.updateImpressionGrid(grid, i, j, 1);
          if ((g1.Dissonant||[]).includes(other.GeoName)) this.updateImpressionGrid(grid, i, j, -1);
          // interval effect via keys
          const interval = this.getInterval((other.Harmonics && other.Harmonics.key) || 0, (geo.Harmonics && geo.Harmonics.key) || 0);
          if (interval && interval.Interval && typeof interval.Interval.Effect === 'number') this.updateImpressionGrid(grid, i, j, interval.Interval.Effect);
        });
      });
      const result = { grid, geolist };
      if (rngNote) result.rng = rngNote;
      return result;
    }

    /**
     * Generates a combined description object based on the geometry of the provided name.
     * Uses different aspects of the geometry (Full, Soul, Facade, Nascent) to select
     * specific description fields from the Geometries data based on the type provided.
     * 
     * @param {string|Array} name - The name to analyze (can be [scientific, common, akas]).
     * @param {string} type - The type of entity ('Species', 'Society', 'Location', 'Character', 'Object').
     * @returns {object} An object containing descriptions for main, soul, facade, initial, and ghost aspects.
     */
    getLoreDescriptions(name, type = 'Character') {
      const geo = this.calculateFullGeo(name);
      if (!geo || !geo.Geo) return {};
      
      let field = 'Geometry_Description';
      if (type === 'Species') field = 'Species_Description';
      else if (type === 'Society') field = 'Social_Description';
      else if (type === 'Location' || type === 'Descendant' || type === 'Object') field = 'Descendant_Description';
      
      const getDescription = (num) => {
          const g = this.Geometries[num];
          return g ? (g[field] || '') : '';
      };
      
      const getName = (num) => {
          const g = this.Geometries[num];
          return g ? g.Name : '';
      };

      const ghostIndex = geo.GeoHarmonics ? geo.GeoHarmonics.Ghost : 0;
      
      // Extract Key/Pitch Info
      let keyInfo = null;
      let keyDescription = '';
      if (geo.GeoHarmonics && typeof geo.GeoHarmonics.key === 'number') {
          const keyResult = this.getKey(geo.GeoHarmonics.key);
          if (keyResult && keyResult.Key) {
              keyInfo = keyResult.Key;
              keyDescription = keyResult.T13NEDescription || (keyInfo.T13NEDescription || '');
          }
      }

      // Extract Chord Info
      let chordInfo = null;
      let chordDescription = '';
      if (geo.GeoHarmonics && geo.GeoHarmonics.corrected) {
          const chordResult = this.calculateChord(geo.GeoHarmonics.corrected);
          if (chordResult && chordResult.Chord) {
              chordInfo = chordResult.Chord;
              chordDescription = chordResult.T13NEDescription || (chordInfo.T13NEDescription || '');
          }
      }

      return {
        main: getDescription(geo.GeometryNumber),
        soul: getDescription(geo.Soul),
        facade: getDescription(geo.Facade),
        nascent: getDescription(geo.Nascent),
        hidden: getDescription(ghostIndex),
        key: keyInfo,
        keyDescription: keyDescription,
        chord: chordInfo,
        chordDescription: chordDescription,
        harmonics: {
            perfect: { number: geo.GeoHarmonics.Perfect, name: getName(geo.GeoHarmonics.Perfect) },
            nemesis: { number: geo.GeoHarmonics.Nemesis, name: getName(geo.GeoHarmonics.Nemesis) }
        },
        numbers: {
            full: geo.GeometryNumber,
            soul: geo.Soul,
            facade: geo.Facade,
            nascent: geo.Nascent,
            ghost: ghostIndex
        }
      };
    }
    
    // convenience alias
    getGeoFromString(name) {
        return this.getGeometryFromString(name);
    }
}

export default T13Geometry;