# T13NE Comprehensive Proficiency Extraction Guide

## Overview
This document guides the extraction of comprehensive proficiencies from all 24 T13NE facets. Each facet definition in `public/plugins/t13ne/data/facets/{facet}.js` contains numerous fields that each generate one or more unique proficiencies.

## Core Methodology
Proficiency Names should be as follows ["Prof_Name","Prof_Name Facet Source Proficiency", "Synonyms"]
    "FacetIndex": 0, --noted for tagging purposes
    "FacetInitial": "A", -- can be ignored
    "FacetName": "Awe", -- should be noted but not used
    "FacetGeometry": 3, -- can be ignored here
    "Yang": true, -- can be ignored here
    "Description": -- should be extracted it may contain clear proficiencies such as Nouns, Adjectives and Verbs that are specifically indicated as having Awe attributes.
    "Suit": 1, -- can be ignored
    "AntiFacet": 9, -- can be ignored
    "FacetAdjectives": [ -- all the following adjectives can be extracted as individual proficiencies

        { "Boon": 0, -- noted for naming purposes
         "Adjective": "Soulless", -- proficiency ["Soulless","Soulless Awe Zero Boon Adjective Proficiency","Hearltess, Hard, Callous, Cold, Cruel, Feral, Insensitive, Subhuman"]
         "Desc_Adjective": "Plain", -- a proficiency note that this should be tagged with Facets[0,2] as all Descendants are Crafted ["Plain","Plain Awe Zero Boon Descendant Adjective Proficiency","Conventional, Dull, Ordinary, Simple, Traditional, Average, Common, Commonplace, Routine, Vanilla, Homely, Lowly, Modest, Quotidian, Usual, White-bread, Workaday"]
          "Location_Adjective": "Featureless" -- prof (tagged Facets [0,22] as both Awe and Yonder (as all Locations are Yonder Descendants)) ["Featureless","Featureless Awe Zero Boon Location Adjective  Proficiency", "Forgettable, Nameless, Bland, Characterless, Stark, Plain, Unadorned"] },
       Zero Boon or Low Boon, Medium Boon and High Boon can be use With Low 1-10 medium 11-15 high 16-21 very-high 22+
    ],
    "Action": "Entrancing", -- ["Entrancing", "Entrancing Awe Action Proficiency","enticing, fascinating, appealing, charming, enchanting, magical"]
    "Action_Text":  -- from awe the following additional profs can be extracted: "attention,fascination, beauty, charm, love, terror, beguilement, enthralling, hypnosis, magical effects",
    "Attack": "Duck", -- "Duck","Duck Awe Attack Proficiency", "covering fire, suppresion fire, suppressive fire"
    "Attack_Modes": "(👤💦☠️)", --ignored
    "Attack_Text": "", -- may contain proficiencies does not in every case. Awe does not.
    "Critical": "Flashy <span class=\"t13ne-redcard\">K&diams;</span>", -- ["Flashy", "Flashy Awe Critical Proficiency", "garish, gaudy, glittering, glittery, jazzy, ostentatious, showy, snazzy,tacky"]
    "Critical_Text": "", -- can be ignored
    "Core": "Enhancer", -- ["Enhancer", "Enhancer Awe Core Proficiency", "advancer, booster, correcter, developer, helper, improver, innovator, reformer"]
    "Core_Text": "", -- can be ignored 
    "Descendants": "Spiritual", ["Spiritual", "Spiritual Awe Descendants Proficiency", "divine, metaphysical, sacred, devotional, holy, intangible, ethereal, ghostly, incorporeal, immaterial"]
    "Descendants_Text": "Spirits, spiritual objects, texts, totems, relics.", -- Awe Descendants_Text suggest these proficiencies. Note that Descendants are not always Timeless or Core, many will be obviously from a specific genre, they should be tagged as such 
    "Edge": "Numinous", -- prof ["Numinous", "Numinous Awe Edge Proficiency", "airy, asomatous, devotional, discarnate, disembodied, divine, ethereal, extramundane, ghostly, holy, immaterial, incorporeal, intangible, metaphysical, nonmaterial, nonphysical,otherworldly, platonic, pure, rarefied, refined, sacred, supernal, unfleshly, unphysical, unworldly"]

    "Edge_Text": -- Nothing useful in Awe Edge_text
    "Emotion_Negative": [
      -- note all Emotions are Tagged with Facets [0,5,9] as they are Awe Jeer and Fury always.]
        { "Name": "Fear", "Description": "A sense of anticipation or foreboding of pain or danger." }, --prof ["Fear", "Fear Awe Negative Emotion Proficiency", "alarmed, concerned, scared, uneasy, jittery"] note that the description here can act as a sensible starter description for the emotion proficiency. The Proficiency Description should describe the knowledge of Fear and what it can do, rather than the emotion itself.
        { "Name": "Terror", "Description": "An overwhelming or paralysing sense of fear or dread." }, --prof ["Terror", "Terror Awe Negative Proficiency", "dread, anxiety, intimidated, panicked"]
        { "Name": "Horror", "Description": "Fear or Terror mixed with revulsion or disgust." } --prof ["Horror", "Horror Awe Negative Proficiency", "aversion, hatred, loathing, detestation"]
    ],
    "Emotion_Positive": [
        { "Name": "Fascination", "Description": "A sense of interest in something." }, --prof similar to the Negative Emotions
        { "Name": "Wonder", "Description": "A sense of interest and amazement combined." },
        { "Name": "Reverence", "Description": "Wonder mixed with deep respect and a hint of fear." }
    ],
    "Failure": "Haunted", --Failure Prof
    "Failure_Text": "", -- can be ignored
    "Fumble": "Embarrassment <span class=\"t13ne-redcard\">2&diams;</span>", -- Embarrassment Awe Fumble Proficiency 
    "Fumble_Text": "embarrassing, anxiety causing, Remember that time when... you threw up on the boss at the Christmas party?, ...thought that Girl Scout was trying to kill us?, ...were fighting that guy and he stole your belt and beat you with it?, humiliating, shameful", --suitable extracted Profs
    "Glow": "Numinous", -- can be ignored as the Glow always matches the Edge in name and we don't need a duplication.
    "Glow_Text": , --ignored
    "Gnarl": "Emotions", -- "emotions awe gnarl proficiency"
    "Gnarl_Text": "", --may contain proficiency suggestions, but usualy will not
    "Herald": "Feelings", --Prof ["Feelings", "Feelings Awe Herald Proficiency", "affections, conscience, emotions, inside, interior, internal, sentiments, soul, spirit, sympathies"]
    "Herald_Text": "gut instincts, intuitions, fleeting visions, Spirit realm, visions, dark shapes" --extracted list of profs to create,
    "Hitch": "Irrational", --Prof ["Irrational", "Irrational Awe Hitch Proficiency", "Illogical, senseless, aberrant, absurd, crazy, foolish, insane, preposterous, ridiculous, unreasonable, unwise, wrong"]
    "Hitch_Text": "manias, philias, phobias, Scared-to-Death, Heart-broken, Too crazy to live" -- this list extracted from Hitch Text are all profs and many suggest more specific ones such as arachnophobia, meglaomania, monomania, paraphilia, zoophobia, etc.

    "Hitch_Rules": {
        "Quirk": "irrational behaviour, irrational emotion,phobic reaction, hallucination, tick, yelling, screaming, jumping", --Awe Hitch Quirk Profs
        "Flaw": "Curse, religious ritual, personal flaws,", --Awe Hitch Flaw Profs
        "Woe": "unhealthy thoughts, unhealthy behaviours, intense emotions," -- Awe Hitch Woe Profs
    },
    "Hurdle": "Spiritual Crisis", --Prof ["Spiritual Crisis", "Spiritual Crisis Awe Hurdle Proficiency", "bad trip, quarter-life crisis, culture shock, spiit possession, flashback"]
    "Hurdle_Text": "mystical event, religious event, spiritual event, spiritual experimentation, guru",
    "Incarna": "Spirit (Ka)", --Prof ["Spirit (Ka)", "Spirit (Ka) Awe Incarna Proficiency", "soul, ghost, spirit guide, familiar"]
    "Incarna_Text": "The Ka, living soul, death, Egypt, lost soul, ghost, spectre, nature spirit, Genius Loci, Familiar Spirit.", -- extracted Awe Incarna Profs
    "Location": "Spiritual", --Prof ["Spiritual locations", "Spiritual Location Awe Location Proficency", "temples, shrines, churches, mosques, sanctuaries, Holy sites, groves"]
    "Location_Text": "religious buildings, sacred sites, hallowed ground, beauty spot, Spirit-realm.", --extracted Awe Location Profs
    "Lore": "Trait", --Prof ["Trait", "Trait Awe Lore Proficiency", "characteristic, attribute, feature, quality, aspect, quirk"]
    "Lore_Text": "Generous, Loyal, Bold, Self-Controlled, Abrasive, Witty", --extracted Awe Lore Profs
    "Monster": "Spirit", --Prof ["Spirit Monster", "Spirit Monster Awe Monster Proficiency","ghost, spectre, phantom, wraith, poltergeist, shade, apparition"]
    "Monster_Text": "nature spirits, location spirits, ghosts, faeries, psychics, Mediums, Shaman, Witch", - extracted Awe Monster Profs
    "Narration": "Pathetic Fallacy", --prof ["Pathetic Fallacy", "Pathetic Fallacy Awe Narration", "pantheticism, paralogism, personification"]
    "Narration_Text": "", --may contain example profs, but Awe does not
    "Narrative_Moment": "Inner-Life", --Prof ["Inner-Life", "Inner-Life Awe Narrative Moment Proficiency", "introspective, spirituality, intrapersonal"]
    "Narrative_Text": "spiritual life, church-goer, true believer, optimist, hopeful, lapsed believer, doubter, agnostic, pragmatist, realist, pessimist, humanist, atheist, pray, holiday, meditating, daydreaming, blasphemes, swears,", -- extracted Awe Narrative Moment Profs
    "Ordeal": "Spiritual", --Prof ["Spiritual Ordeals", "Spiritual Ordeals Awe Ordeal Proficiency", "spiritual trial, spiritual tribulation, spiritual test, spiritual crucible"]
    "Ordeal_Text": "Shamanistic Awakening, Near Death Experience, Test of Faith, Existential Crisis, Dark Night of the Soul", -- extracted Awe Ordeal Profs
    "Persona": {
        "Name": "Idol", --Prof ["Idol", "Idol Awe Persona Proficiency", "icon, figurehead, star, superstar, luminary, legend, god"]
        "Motivation": "respected, honoured, worshipped, adored, positive social interactions, cheers, laughs, boos, jeers, attention-seeking", -- extracted list of Awe Persona Motivation Profs
        "Avoid": "alone, ignored, attention-seeking behaviour", -- extracted Awe Persoan Avoid Profs
        "Shadow": "drama, hype, forgetting, Ego, overbearing, upstage, actor, taking offence", --extracted Awe Persona Shadow Profs
        "Gain_Chi": "seek out company, speak, drawing attention, stirring drama"
    },
    "Psychosocial": "Supernature", --prof ["Supernature", "Supernature Awe Psychosocial Proficiency", "supernatural, supernity, extraordinary, sublime, transcendant"]
    "Psychosocial_Text": "extra sensory perception, telepathy, remote viewing, mediumship, shamanic sight, Collective Unconscious, memetic patterns, Jungian Archetypes, supernatural beliefs,  psychic powers, trance like, levitating glowing form",
    "Quest": "Brave / Charm", --2 Profs ["Brave", "Brave Awe Quest Proficiency", "confront, tackle, challenge, courage, bravery"], ["Charm", "Charm Awe Quest Proficiency", "fascinate, becharm, enamor, influence, appeal, catch, spell, enchant"]`
    "Quest_Text": "", -- may contain Profs, but Awe does not
    "Question": "Feelings", -- Prof ["Feelings","Feelings Awe Question Proficiency", "notion, spirit, belief, emotions, sentiments, sensations, moods, passions"]
    "Question_Text": "", -- no suggested Profs 
    "Resolved_Hitch": "Invocation", --Prof ["Invocation", "Invocation Awe Resolved Hitch Proficiency", "supplication, prayer, entreaty, petition, plea, appeal"]
    "Resolved_Text": "invoke the spirits, invoke spiritual laws, invoke religious laws", -- suggested Awe Resolved Hitch Profs
    "Rule": "Psychosocial States", --Prof ["Psychosocial States", "Psychosocial States Awe Rule Proficiency", "emotions, moods, mental states, affective states, moody"]
    "Rule_Text": "Dishonoured, Entranced, Shunned, Charmed, Ensorcelled, Ruined, Ostracised, Exiled, Love" -- suggested Awe Rule Profs
    "Style": "Elegant", --Prof ["Elegant", "Elegant Awe Style Proficiency","tasty, ritzy, soignee, high-toned, recherche, exquisite, deluxe, stately, dignified"]
    "Style_Text": "high society, nobles, politicians, graceful movements", --suggested Awe Style Profs
    "Success": "Artistic", --Prof ["Artistic","Artistic Awe Success Proficiency", "tasteful, aesthetic, pleasing, esthetic, esthetical, in good taste, creative, imaginative, arty, painterly, artful"]
    "Success_Text": "Emotional impact", --suggested Awe Success Profs
    "Sway": "Splendour", --Prof ["Splendour","Splendour Awe Sway Proficiency", "magnificence, grandness, grandeur, splendor, brilliance"]
    "Sway_Text": "beauty, nobility, dignity, impress, keep your cool, maintain respect", -- suggested Awe Sway Profs
    "Tangle": "Emotions", -- prof ["Emotions", "Emotions Awe Tangle Proficiency","emotions, sentiments, moods, passions, sensations, fervor, reactions, excitement"]
    "Tangle_Text": "Negative Emotions, Positive Emotions", --suggested Awe Tangle Profs
    "Test": "Attitude / Art  / Charm / Cool / Spirit", --Profs ["Attitude", "Attitude Awe Test Proficiency", "posture, position, mental attitude, stance, outlook, perspective, viewpoint, demeanor, disposition, mindset"], ["Art", "Art Awe Test Proficiency", "artwork, artistry, fine art, graphics, prowess, artistic creation, artistic production, nontextual matter, superior skill"], ["Charm", "Charm Awe Test Proficiency", "Charm, charisma, enchantment, attractiveness, grace, glamour, bewitching, captivating, beguiling, charming"], ["Cool", "Cool Awe Test Proficiency", "cold, chill, chilly, composed, great, coolheaded, neat, assured, nifty"], ["Spirit", "Spirit Awe Test Proficiency", "soul, psyche, essence, heart"]   
    "Test_Text": "", -- no unique profs suggested by Awe Test_Text
    "Tone": "Emotional", --profs ["Emotional", "Emotional Awe Tone Proficiency", "emotive,affective, sentimental, affectional, overemotional, excited, effusive, soulful, mind-blowing, maudlin, mawkish, moody, demonstrative, temperamental, agitated, hot-blooded, gushing, aroused"]
    "Tone_Text": "tragedy, melancholy, the blues, sad stories", --suggested Awe Tone Profs
    "Turn": "Change-of-Heart", --Prof ["Change-of-Heart", "Change-of-Heart Awe Turn Proficiency", "change-of-mind, about-face, change of tune, conversion, recantation, redecision"]
    "Turn_Text": "change sides, change tack, change direction", --suggested Awe Turn Profs
    "Twisted": "Spirit", --profs ["Spirit", "Spirit Awe Twisted Proficiency", "spirited, spirity, supernatural, superstitious, mystical, occult, magical, mystique, mysticism, mystic, mystical, spiritual, spiritualistic, spiritually inclined, spiritually minded, spiritually oriented, spiritually predisposed, spiritually-minded, spiritually-oriented, spiritually-predisposed"] 
    "Twisted_Text": "Twisted Spirit, Twisted Persona, promote fears, supernatural beings, hoax supernatural events, fake supernatural events, supernatural events", --suggested Awe Twisted Profs
    "Annex_Channel": "Enhancing", --Prof ["Enhancing", "Enhancing Awe Channel Proficiency", "heighten, raise, improving, augmenting, boosting, emriching, intensifying"]
    "Annex_Channel_Text": "Amaze, Attract, Beguile, Behave, Captivate, Charm, Dazzle, Emote, Enchant, Enrich, Enhance, Entrance, Evoke, Express, Exhilarate, Feel, Glow, Haunt, Horrify, Inspire, Imbue, Impress, Overwhelm, Reveal, Scare, Shine, Surpass, Terrify, Venerate", --suggested Awe Annex Channel Profs
    "Annex_Root": "Awesome", --prof ["Awesome", "Awesome Awe Root Proficiency", "awe-inspiring, amazing, awful, impressive, awing, astounding, astonishing, breath-taking, incredible, magnificent, marvellous, mind-blowing, spectacular, stupendous, terrific, tremendous, wondrous, formidable, phenomenal, extraordinary"]
    "Annex_Root_Text": "Aesthetic, Alluring, Attractive, Awful, Awesome, Beautiful, Brave, Courageous, Creative, Divine, Dreadful, Emotional, Fearful, Great, Haunting, Horrifying, Majestic, Moodiness, Paranormal, Psychic, Psychological, Regal, Sentimental, Soulful, Spellbinding, Spiritual, Splendid, Terrifying, Valiant, Wonderful", --suggested Awe Annex Root Profs
    "Nimbed": "Spiritual", -- prof ["Spiritual", "Spiritual Awe Nimbed Proficiency", "apparational, unworldly, supernatural, phantasmal, spectral, religious, ghostlike, sacred, unearthly"]
    "Nimbed_Text": "spiritual context, religious context, religious precepts", --suggested Awe Nimbed Profs
    "Umbral": "Awful", --prof ["Awful", "Awful Awe Umbral Proficiency", "horrendous, hateful, terrible, frightful, abominable, direful, atrocious, dreadful, fearsome, horrific, frightening, dreaded, alarming, dire, bad, lousy, nasty, filthy, horrible, unpleasant"]
    "Umbral_Text": "" -- no suggested Awe Umbral Profs in this one



### Extraction Principle
**Every field in a facet definition can generate proficiencies.** The field NAME becomes context, the field VALUE becomes the proficiency name, and the field DESCRIPTION (if present as a `*_Text` field) provides additional proficiency context. This procedure cannot be duplicated by a script as it requires too much context awareness at all steps. However the data can be handled in chunks to break up the workload. Working through each Key individually. This is the only way to ensure that all proficiencies are generated correctly.

### Extraction Process
1. Create a new proficiency definition file (e.g. `Facet_Awe_Key_Value_pair.json`)
2. Copy and paste the JSON from the source file into this new file
3. Edit the JSON to convert each Value. Keys will only provide Context to the Proficiency Name. Values will provide the Proficiency Names, and Descriptions must be written by hand but may be influenced by the text and Facet description.
4. Proficiencies should only be created if they are unique. Note that the Awe example above creates several "identical" proficiencies. For example "Emotions" occurs as a Gnarl Prof and as a Tangle Prof. Spiritual occurs in many places, both as Spritual Locations, Spirit Descendants, and Spiritual nimbed itself, as well as being suggested in Channel and Root. Where possible these should be merged.


### Field Categories & Examples

#### 1. **Adjective Arrays** (`FacetAdjectives`)
Array of objects with `Adjective`, `Desc_Adjective`, `Location_Adjective` properties.
- Extract EACH of these three as separate proficiencies
- Example: `{ "Adjective": "Soulless", "Desc_Adjective": "Plain", "Location_Adjective": "Featureless" }` → 3 proficiencies

#### 2. **Emotion Lists**
- `Emotion_Negative`: Extract each emotion name as proficiency (type: `Emotion_Negative`)
- `Emotion_Positive`: Extract each emotion name as proficiency (type: `Emotion_Positive`)
- Example from Awe:
  - Fear, Terror, Horror (Negative)
  - Fascination, Wonder, Reverence (Positive)

#### 3. **Single-Value Fields with Descriptions**
Fields in format `"FieldName": "Value"` paired with `"FieldName_Text": "Description"`:
- Action / Action_Text
- Attack / Attack_Text
- Critical / Critical_Text
- Core / Core_Text
- Descendants / Descendants_Text
- Edge / Edge_Text
- Failure / Failure_Text
- Fumble / Fumble_Text
- Gnarl / Gnarl_Text
- Hitch /  Hitch_Text
 Hitch_Rules: Hitch Rules and Hitch Text should be parsed for additional potential Proficiencies such as "Heart-broken", "Phobia", "Arachnophobia", "Entomophobia" and Zoophobia are suggested (amongst others), but may not add one always. There should be no references to "Quirks", "Flaws" or "woes" in any proficiencies.
- Hurdle / Hurdle_Text
- Incarna / Incarna_Text
- Location / Location_Text
- Lore / Lore_Text
- Monster / Monster_Text
- Narration / Narration_Text
- Narrative_Moment / Narrative_Text
- Ordeal / Ordeal_Text
- Persona / (nested object with Name, Motivation, Avoid, Shadow, Gain_Chi)
- Psychosocial / Psychosocial_Text
- Quest / Quest_Text (may have multiple values separated by /)
- Question / Question_Text
- Resolved_Hitch / Resolved_Text
- Rule / Rule_Text
- Style / Style_Text
- Success / Success_Text
- Sway / Sway_Text
- Tangle / Tangle_Text
- Test / Test_Text (may have multiple values separated by /)
- Tone / Tone_Text
- Turn / Turn_Text
- Twisted / Twisted_Text
- Annex_Channel / Annex_Channel_Text (may have multiple values separated by /)
- Annex_Root / Annex_Root_Text (may have multiple values separated by /)
- Nimbed / Nimbed_Text
- Umbral / Umbral_Text

**Naming Convention:**

-Proficiencies are named with 3 names arranged in an array.
["Prof_Name","Prof_Name Facet Source Proficiency","Synonyms for Prof_Name in order of contextual matching"]
- Prof_Name is typically a single word, but can be a phrase of similar where contextually correct. Generally Proficiencies should not contain 'The' or 'A'

#### 4. **Complex Fields**
Some fields contain lists or comma-separated values that should each become proficiencies:
- `Quest`: May list multiple (e.g., "Brave / Charm") → extract as "Brave" and "Charm", type: "Quest"
- `Test`: May list multiple (e.g., "Attitude / Art / Charm / Cool / Spirit") → extract each
- `Annex_channel`: always lists multiple
- `Annex_root`: always lists multiple
- `Emotion_Negative` / `Emotion_Positive`:
 and the Arrays in hitch Rules describing various disabilities and disorders

#### 5. **Nested Objects (Persona)**
Extract from Persona object:
- Name: The persona name
- Motivation: Each motivation listed (e.g., "Respected", "Honoured", "Worshipped", "Adoration")
- Avoid: The avoid theme (e.g., "Loneliness")
- Shadow: The shadow theme (e.g., "Drama")

#### 6. **Text Extraction from _Text Fields**
From `*_Text` fields, extract key concepts:
- Herald_Text: Look for "intuition", "gut instincts", "visions" → create proficiencies
- Hitch_Text: Look for "phobia", "mania" as types
- Psychosocial State Examples: In Rule_Text, extract states like "Dishonoured", "Entranced", "Shunned", "Charmed", "Ensorcelled", "Ruined", "Ostracised", "Exiled"
- these concepts will often suggest a list of more specific proficiencies. Phobia for example implies all phobias are Awe Irrational Hitches and Proficiencies. 

## ID Numbering Scheme

**Sequential Global IDs**: Proficiencies are numbered 0-N across all 24 facets, NOT per-facet. Proficiencies do not need to added in order (for example it is not necessary to work through all Awe Proficienceis before adding Burden, Craft, etc. In fact it may be best to work through each section of each Facet in turn (adjectives first, then channel and root) as this is likely to generate the most base proficiencies without duplication.)

### Facet ID Ranges (Provisional)
-

**Note:** Do NOT pre-calculate ranges. Extract all proficiencies first, then assign sequential IDs.

## JSON File Structure

```json
[
 {"id":0,
"prof":{
    "Name":["Sample Proficiency","Sample Facet Source Proficiency","demonstration, exhibition, display, showcase, illustration, "],
     "Description":"A sample proficiency an example of the smallest unit of knowledge about any given subject. Proficiencies can be grouped into Annexes, which are the SKills, Talents, Powers and Super-Powers of the Characters. Annexes can also be placed in Descendants, which are the equipment, training and experiences that further enhance a Character. Every aspect of the Game, no matter how many proficiencies it is created from, can also be a single proficiency itself. Some Proficiencies can be based within a single Facet, most are available in many Facets, as any Annex Proficiency will be available to all the Facets that donated Proficiencies. Location Proficiencies such as \"Spiritual Locations\" are always Yonder profs as well as Awe (or whatever)",
    "Tags":{
        "Facets":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
        "Genres":["0"],
        "Eras":["0"],
        "Scopes":["1"],
        "Types":["32"]
    }
}}
 ...
]
```



### CRITICAL NAMING & DESCRIPTION RULES

**❌ WRONG EXAMPLES:**
- Name: "Soulless Awe" (includes facet name)
- Name: "Spiritual Location" (singular - wrong pluralization)
- Name: "Entrancing Action" (appending field name everywhere - wrong)
- Description: "Adjective of Awe—Soulless" (metadata format)
- Tags: `"type": ["Adjective"]` (string names instead of numeric IDs)

**✅ CORRECT EXAMPLES:**
- Name: "Soulless" (just the proficiency name)
- Name: "Spiritual Locations" (plural form - pluralization matters)
- Name: "Entrancing" (just the value, no field appending)
- Description: The proficiency description should ideally reflect the unit of knowledge that is covered by that Name. This is very like tokens in an LLM where sometimes we need separate proficiencies for certain contexts and other times we can merge them together. The Field Text can provide useful context here, but should never be copied directly if it mentions system terms such as Hitches, Nimbeds, Umbrals etc. 
- Tags: `"type": ["32"]` (numeric ID for Proficiency, from types.json)

**Field Appending Rule:**
- **DO append** for: Locations ("Spiritual Locations"), contextual Ordeals ("Spiritual Ordeals") where such context makes sense.
- **DON'T append** for: Actions, Attacks, Critical, Core, Descendants, Edge, Failure, Fumble, etc.
- **Just use the value** for adjectives, emotions, and most field-based proficiencies

### Tag Structure (Uses Numeric IDs from Tagging System)

**Scopes** (0-9):
- `"1"` = Omniversal (use for most base proficiencies)
- `"2"` = Limited restricted by temporal era, genre or similar.
- `"3"` = Referee. Some Proficiencies are just not diagetic enough to face the public, they are referee only, as they govern abilities that are system specific (such as Proficiencies in specific game Rules). Such Proficiencies are typically not used by player characters.
- `"4"` = Multiversal. Slightly restricted proficiencies, but mostly they will be available everywhere.
- `"5"` = Game. If proficiencies are registered into the plugin from outside they are usually Game specific and marked as such.
- `"6"` = Universal. Typically things are only available in their universes.
- `"7"` = Location. Some Proficiencies are only important inside the Location where they exist. Military Ranks for exmaple are only important in territories that military controls.

**Genres** (0-72+):
- `"0"` = Experimental (should not be used in this exercise)
- `"1"` = T13 Core (use for most base proficiencies)
- `"2"` = Speculative Fiction (a lot of Proficiencies can be tagged this)
- `"3"` = Contemporary Fiction (most real world profs would be this)
- `"4"` = Weird Fiction (blends 2 and 3 together and birthed a lot more genres)
- `"5"` = Fantasy (magic, dragons, faeries and a lot od mythical and monstrous beings live here)
- `"6"` = Science-Fiction (rayguns, spaceships, robots, etc some are increasingly contemporary)
- `"7"` = Horror (supernatural monsters and abilities) 

genres get increasingly specific as we get higher, and anything tagged as Genre "1" should also be tagged as Genre "2" or higher as well. Highly specific Genres will have highly specific proficiencies that may reflect a broader genre as well. Cyberpunk for example makes a bigger deal over cybernetic implants than Sci-Fi or Science-Fiction, and such implants are a Fantasy trope originally, (Wayland of the silver arm, etc). 

**Eras** (0-44+):
- `"0"` = Unknown (shouldn't be used in this exercise)
- `"1"` = Timeless (use for most base proficiencies)
- `"2"` = Modern (modern day profs)
- `"3"` = Future (speculative and potential profs)
- `"4"` = Past (historical profs)
- `"5"` = Pre-history (stone age and earlier Profs)
- `"6"` = Ancient History (ancient profs)
- `"7"` = Medieval History (middle ages - high fantasy)

 Eras are not stored in any chronological or logical order, so please consult the documentation.

**Types** (Numeric IDs):
- `"32"` = Proficiency When we are making Proficiencies ALL should be tagged type 32. Even Proficiencies that are created for Hitches, Monsters, are still Profociencies and should be tagged as type "32"
- You may add other numeric IDs from types.json as appropriate ("29" for a Hitch for example would tag "29","32" etc)

**Tags Location**: `public/plugins/t13ne/data/tagging/{scopes.json, genres.json, eras.json, types.json}`

### Notes on correct Tagging
Facets: All Facets that are applicable should be Tagged. 
  - Note that ALL Emotions from all Facets should be tagged as Awe, Jeer and Fury as well the actual Facet they are from. 
  - All Descendant Proficiencies are also Craft Tagged
  - All Location Proficiencies are also Yonder Tagged
  - All Styles and Personas are also Awe Tagged
  - All Attacks, Ordeals and Tests are also Trial Tagged
  - All Monsters are also Miasma Tagged
  - All Actions and Motivations are also Zeal Tagged
  - All Criticals and Fumbles are also Liberty Tagged
  - All Failures and Successes are also Virtue tagged
  - All Rules and Quests are also Wyrd tagged
  - All Questions are also Enigma tagged 
  - All Gnarls and Tangles are Gossamer Tagged
  - All Lores are Orthodox tagged
  - All Hurdles are also Inertia tagged
  - All Sway are also Burden Tagged
  - All Incarnas and Cores are also Nature tagged
  - All Persona Avoids are also Rook tagged
  - All Psychosocial proficiencies are also tagged Dominion
  - All Heralds are also tagged Key
  - All Twisteds are also tagged Sin
  


### Example Tag Values (from Tagging System)
For most standard proficiencies:
```json
"tags": {
  "facets": ["0"],     // Awe
  "scope": ["1"],      // Omniversal
  "genre": ["1"],      // T13 Core
  "era": ["1"],        // Timeless
  "type": ["32"]       // Proficiency
}
```

For hitches/failures:
```json
"tags": {
  "facets":["0"],      // Awe
  "scope": ["1"],      // Omniversal
  "genre": ["1"],      // T13 Core
  "era": ["1"],        // Timeless
  "type": ["30", "32"]       // Hitch & Proficiency
}
```
### basic procedure

1. **Read the facet definition** from `public/plugins/t13ne/data/facets/{facet-name}.js`
2. **Extract FacetAdjectives**:
   - List all Adjective values
   - List all Desc_Adjective values
   - List all Location_Adjective values
3. **Extract Emotion lists** (if present):
   - Emotion_Negative items
   - Emotion_Positive items
4. **Extract single-value fields** with their descriptions:
   - For each field from the list above:
     - If it has a Value + _Text pair, use the Value as proficiency name
     - Create context string from field name + value
5. **Extract complex field lists**:
   - Split comma/slash-separated values
   - Create separate proficiency for each
6. **Extract nested objects** (Persona):
   - Extract Name, Motivations, Avoid themes, Shadow themes
7. **Extract text-mined concepts**:
   - From descriptions, find special keywords (phobia, mania, intuition, visions, etc.) expand special keywords (phobias, manias, intuitions, etc)
8. **Compile and assign sequential IDs**:
   - Start from last ID + 1
   - Maintain facet references
9. **Create JSON file** at: `public/plugins/t13ne/data/json/proficiencies/proficiencies-list/N/profsX.json` where X and N are incrementing numbers starting at 0. (50 files per directory, 100 Profs per File.)

### Notes 

1. **Naming Convention**: Use ONLY the proficiency name, no facet reference
   - ✅ "Soulless", not "Soulless Awe"
   - ✅ "Numinous Edge", not "Awe Numinous Edge"
   - ✅ Use field name for context only: "Spiritual Location" (Location field + Spiritual value)

2. **Descriptions**: 
   For each Proficiency the Description should reflect a dictionary defintion of the the word that the Proficiency is named for, as a base. However this base description should be altered to reflect the following where appropriate. 
   -  The Narration and Tone of the Facet should affect the Proficiency description. Awe for example should make the description artistic, emotional, persuasive and perhaps grandiose and perhpas even a little poetic. Burden should make the description feel value based, as a perception of quality and quantity, Craft should be deftly constructed, literary and finessed... Such that Jeer descriptions are Funny and Fury Descriptions are Emotive, Orthodox are pedantically precise, Liberty descriptions may be loose and a little unfocused, Enigma's descriptions should be vague and ambiguous, cryptic at times, but not impossible to understand, each Facet adds its own flavour to the descriptions that Proficiencies that emerge from it (even if they may also be tagged into other Facets as well). Wyrd descriptions, can be legalese, or magical, mythical, and perhaps both at the same time. 
   - The description is about the Proficiency, which acts as the quanta of knowledge abouthte subject of the Proficiency. So a "Sword" proficiency description might read, more about "Swordsmanship" than a physical description of a sword. It should also contain that physical description, but as a part.

3. **Field Appending**: Only append field name context for specific types for the Short Name
   - ✅ Locations: "Spiritual Locations" (append, plural)
   - ✅ Contextual Ordeals: "Spiritual Ordeals" (append only when contextual)
   - ❌ Actions: "Entrancing", not "Entrancing Action"
   - ❌ Attacks, Criticals, Core, Edge, Failure, Fumble, etc.: just use the value

4. **Facet ID**: Always matches the facet being extracted (0-23), but may be augmented with additional tags (Locations always are tagged "22" for Yonder.)

5. **IDs are Global**: Continue sequential numbering across all facets
   -Do not restart if you make a mistake, there is no correct order to add Proficiencies to the files, so you may miss a few and add them in later. 


## File Locations

- **Facet Definitions**: `public/plugins/t13ne/data/facets/{facet-name}.js`
- **Proficiency Output**: `public/plugins/t13ne/data/json/proficiencies/proficiencies-list/{facet-id}/{facet-name}-proficiencies.json`
- **Reference**: `public/plugins/t13ne/data/facets/` (read all .js files for structure understanding)


## Tools & Commands

### Reading Facet Files
```javascript
// Command to read facet definition
read_file({
  filePath: "\\WormholeRacersJS\\public\\plugins\\t13ne\\data\\facets\\{facet-name}.js",
  startLine: 1,
  endLine: 200
})
```

### Creating Proficiency Files
```javascript
// Use create_file or replace_string_in_file depending on whether file exists
// Always maintain JSON format with sequential IDs and proper structure
// files should be groouped into 100 per file and named prof0.json incrementing each 10 with no more than 50 in each directory.
```
## Progress Tracking

not begun
---

