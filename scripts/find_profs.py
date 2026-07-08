import json
import os
import re

facets_file = 'src/t13ne/data/json/facets/facets.json'
profs_dir = 'src/t13ne/data/json/proficiencies/Profs/'

with open(facets_file, 'r') as f:
    facets = json.load(f)

action_core_map = {}
for f in facets:
    action_core_map[f['FacetName']] = {
        'Action': f['Action'],
        'Core': f['Core']
    }

results = {}

def search_profs(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    try:
                        data = json.load(f)
                        for prof_id, prof_obj in data.items():
                            names = prof_obj['prof']['Name']
                            for facet_name, search_terms in action_core_map.items():
                                if facet_name not in results:
                                    results[facet_name] = {'Action': None, 'Core': None}

                                # Search for Action
                                if any(search_terms['Action'] in n and "Action" in n for n in names):
                                    results[facet_name]['Action'] = prof_id

                                # Search for Core
                                if any(search_terms['Core'] in n and "Core" in n for n in names):
                                    results[facet_name]['Core'] = prof_id
                    except:
                        pass

search_profs(profs_dir)

print(json.dumps(results, indent=2))
