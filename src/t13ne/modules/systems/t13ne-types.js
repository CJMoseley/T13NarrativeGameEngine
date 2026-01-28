// Minimal port of select helpers and arrays from class-t13-ne-types.php
// Exports: arrayify, contains, makeUniqueArray, tonalModes, numberTypes

function arrayify(input){
  if (input == null) return [];
  if (Array.isArray(input)) return input.slice();
  if (typeof input === 'object') return [input];
  // try JSON
  try{
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
  }catch(e){}
  // split on common delimiters
  const parts = input.split(/\r?\n|,|;|\||\t/).map(s=>s.trim()).filter(Boolean);
  return parts;
}

function contains(haystack, needle){
  if (typeof haystack === 'string' && typeof needle === 'string'){
    return haystack.toLowerCase().includes(needle.toLowerCase());
  }
  if (typeof haystack === 'string' && Array.isArray(needle)){
    for (const n of needle){
      if (haystack.toLowerCase().includes(String(n).toLowerCase())) return true;
    }
    return false;
  }
  if (Array.isArray(haystack) && typeof needle === 'string'){
    return haystack.some(item => String(item).toLowerCase().includes(needle.toLowerCase()));
  }
  if (Array.isArray(haystack) && Array.isArray(needle)){
    return needle.every(n => haystack.includes(n));
  }
  return false;
}

function makeUniqueArray(arr){
  const seen = new Set();
  const out = [];
  for (const item of arr){
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    if (!seen.has(key)) { seen.add(key); out.push(item); }
  }
  return out;
}

const T13NETypes = {
  arrayify,
  contains,
  makeUniqueArray,
};

export default T13NETypes;





