// Roman chords data ported from PHP $RomanChords
export default [
  { Name: 'I', Degree: 'Tonic', Quality: 'Major', indexer: 0, Chord: 'Major-Triad', Notes: [0,4,7], Description: 'The Tonic is essentially the Root Note or First Degree of the Major Scale and Chord.', Character_Expression: 'The Character is at home here, this is their natural environment.' },
  { Name: 'i', Degree: 'Tonic', Quality: 'Minor', indexer: 0, Chord: 'Minor-Triad', Notes: [0,3,7], Description: 'This is the Root of the Minor Scale and Chord. Progressions that begin in Minor typically indicate instability, sadness, loss or emotional weight.', Character_Expression: 'The Character is from here, but this isn\'t what anyone would call home.' },
  { Name: 'I7', Degree: 'Tonic', Quality: 'Major', indexer: 0, Chord: 'Dominant-Seventh', Notes: [0,4,7,10], Description: 'The Tonic but with a soulful or deeper emotional quality.' },
  { Name: 'ii', Degree: 'Supertonic', Quality: 'Major', indexer: 2, Chord: 'Minor-Triad', Notes: [2,5,9], Description: 'The Supertonic is the second Degree of the Scale and is one whole step above the Tonic.' },
  { Name: 'ii°', Degree: 'Supertonic', Quality: 'Minor', indexer: 2, Chord: 'Diminished-Triad', Notes: [2,5,8], Description: 'Diminished Supertonic often replaces the ii Minor chord to bring soulful depth and tragic sadness to a progression.' },
  { Name: 'ii7', Degree: 'Supertonic', Quality: 'Minor', indexer: 2, Chord: 'Dominant-Seventh', Notes: [2,6,9,12] },
  { Name: '♭II', Degree: 'Supertonic', Quality: 'Phrygian', indexer: 1, Chord: 'Major-Triad', Notes: [1,5,8] },
  { Name: 'iii', Degree: 'Mediant', Quality: 'Major', indexer: 4, Chord: 'Minor-Triad', Notes: [4,8,11] },
  { Name: '♭III', Degree: 'Mediant', Quality: 'Minor', indexer: 3, Chord: 'Major-Triad', Notes: [3,7,10] },
  { Name: 'IV', Degree: 'Subdominant', Quality: 'Major', indexer: 5, Chord: 'Major-Triad', Notes: [5,9,12] },
  { Name: 'V', Degree: 'Dominant', Quality: 'Major', indexer: 7, Chord: 'Major-Triad', Notes: [7,11,14] },
  { Name: 'vi', Degree: 'Submediant', Quality: 'Major', indexer: 9, Chord: 'Minor-Triad', Notes: [9,12,16] },
  { Name: 'vii°', Degree: 'Leading-Tone', Quality: 'Major', indexer: 11, Chord: 'Diminished-Seventh', Notes: [11,14,17,20] }
];
