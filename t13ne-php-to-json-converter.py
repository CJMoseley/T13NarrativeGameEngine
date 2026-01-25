import re
import json

def php_array_to_json(php_array_string):
    # A series of replacements to convert PHP array syntax to JSON
    # This is brittle and may not cover all cases, but should work for the given file
    
    # Replace array() with [] for lists or {} for associative arrays
    # A simple replacement is not enough, need to distinguish between them
    
    # Add quotes around keys
    s = re.sub(r"'(.*?)' *=>", r'"\1":', php_array_string)
    
    # Replace single quotes with double quotes for string values
    # Be careful not to replace quotes inside strings
    # This regex is tricky, let's do it differently.
    
    # Let's try a different approach: exec the php code in a sandbox
    # But I can't do that.
    
    # Let's try to make the string something python can evaluate
    # replace array with dict
    s = php_array_string.replace('array(', 'dict(')
    # replace => with :
    s = s.replace('=>', ':')
    
    # now it's almost python syntax, but still needs work.
    
    # It is better to rely on regex.
    # 1. replace array() with []
    # This is difficult because of nested arrays.
    
    # Let's try to do this with a set of replacements that are safe for this specific file format.
    
    json_str = php_array_string.strip()
    # It starts with 'array(' and ends with ');'
    # For now, I assume I get the content inside array()
    
    # array(..) -> [...] or {...}
    # This is the main problem. A simple regex is not enough.
    
    # Given the constraints, I will do my best with regex.
    
    # Convert keys
    json_str = re.sub(r"'([^']*)'\s*=>", r'"\1":', json_str)
    
    # Convert values, very basic, will fail with escaped quotes
    # json_str = re.sub(r":\s*'([^']*)'", r': "\1"', json_str)

    # Instead of replacing single quotes in values, I'll replace them all, then fix numbers
    json_str = json_str.replace("'", '"')
    
    # Let's try to fix numbers that are now quoted
    json_str = re.sub(r'"(-?\d+(\.\d+)?)"', r'\1', json_str)
    
    # Now, the array() syntax
    # This is very hard. I will assume for now that I can manually
    # find and replace the arrays.
    
    # This is not going to work reliably.
    
    # The user wants me to do this. I must find a way.
    
    # Let's reconsider what I can do with shell commands.
    # No php. What about node? I have no `require` so I can't use fs.
    
    # What if I create a PHP script that outputs the json, and ask the user to run it?
    # I am a non-interactive agent. I can't ask the user.

    # I'm going to have to do this the hard way, one by one.
    # I've already done ordealTerrain.json.
    # Let's do the next one, `ordealTerrainModifiers`.

    # I will not try to create a generic script, as it is too complex.
    # I will handle each variable individually.
    return php_array_string


def main():
    with open('d:/GoogleDrive/Games/wormholeracersJS/WormholeRacersJS/t13ne/includes/partials/types-stub-php', 'r', encoding='utf-8') as f:
        content = f.read()

    # This is a map of PHP variable name to JS file name
    variables = {
        'ordealTerrain': 'ordealTerrain.json',
        'ordealTerrainModifiers': 'ordealTerrainModifiers.json',
        'ordealMotionType': 'ordealMotionType.json',
        'ordealFiringType': 'ordealFiringType.json',
        'ordealEngagementType': 'ordealEngagementType.json',
        'socialOrdealActions': 'socialOrdealActions.json',
        'socialOrdealLevels': 'socialOrdealLevels.json',
        'interactionTypes': 'interactionTypes.json',
        'parasocialTypes': 'parasocialTypes.json',
        'nightmareZones': 'nightmareZones.json',
        'psychologicalDefences': 'psychologicalDefences.json',
        'woundFreshType': 'woundFreshType.json',
        'healingModes': 'healingModes.json',
        'plottingTypes': 'plottingTypes.json',
        'plotResolutions': 'plotResolutions.json',
        'conflictSides': 'conflictSides.json',
        'descendantEdges': 'descendantEdges.json',
        'NPCProficiencies': 'npcProficiencies.json',
        'experienceTiers': 'experienceTiers.json',
        'ageCategories': 'ageCategories.json',
        'charTypes': 'charTypes.json',
        'extraTypes': 'extraTypes.json',
        'pcType': 'pcType.json',
        'heroAbilities': 'heroAbilities.json',
        'heroTypes': 'heroTypes.json',
        'chiClass': 'chiClass.json',
        'groupTypes': 'groupTypes.json',
        'thresholdTypes': 'thresholdTypes.json',
        'thresholdDirections': 'thresholdDirections.json',
        'numberTypes': 'numberTypes.json',
        'tonalModes': 'tonalModes.json',
        'tidalSuccesses': 'tidalSuccesses.json',
        'shockDice': 'shockDice.json',
        'dramaDice': 'dramaDice.json',
        'dramaPools': 'dramaPools.json',
        'fiveChanges': 'fiveChanges.json',
        'characterCompositions': 'characterCompositions.json',
        'compositionTempos': 'compositionTempos.json',
        'narrativeStructures': 'narrativeStructures.json',
        'noProfDice': 'noProfDice.json',
        'profDice': 'profDice.json',
        'hermetics': 'hermetics.json',
        'alchemy': 'alchemy.json',
        'astrologySigns': 'astrologySigns.json',
        'fiveChineseElements': 'fiveChineseElements.json',
        'planets': 'planets.json',
        'characterCatalysts': 'characterCatalysts.json',
        'EidolonTypes': 'eidolonTypes.json',
        'PsychosocialDifficulties': 'psychosocialDifficulties.json',
        'facetSwayPotencyTypes': 'facetSwayPotencyTypes.json',
        'statFacets': 'statFacets.json',
        'facetSwayConversionTypes': 'facetSwayConversionTypes.json',
    }

    for var_name, json_file in variables.items():
        # This regex is very specific to the file format.
        # It looks for `public static $varName = array(` and the matching `);`
        # It assumes there are no other `);` in between. This is a big assumption.
        match = re.search(r"public\s+static\s+\"$var_name+\s*=\s*array\((.*?)\);", content, re.DOTALL)
        if match:
            array_content = match.group(1)
            
            # Here I would do the conversion from PHP array string to JSON string
            # As I've determined this is too complex, I'm abandoning this script.
            
            # For demonstration, let's just write the extracted content
            # with open(f'public/plugins/t13ne/data/json/{json_file}', 'w') as jf:
            #    jf.write(array_content)


if __name__ == '__main__':
    # I am abandoning this script because the conversion is too hard.
    # I will proceed manually.
    pass
