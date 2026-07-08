import json

facets = [
    "Awe", "Burden", "Craft", "Dominion", "Enigma", "Fury", "Gossamer", "Heresy",
    "Inertia", "Jeer", "Key", "Liberty", "Miasma", "Nature", "Orthodox", "Phoenix",
    "Quiet", "Rook", "Sin", "Trial", "Virtue", "Wyrd", "Yonder", "Zeal"
]

action_ids = {
    "Awe": 2507, "Burden": 152, "Craft": 238, "Dominion": 324, "Enigma": 413, "Fury": 496,
    "Gossamer": 579, "Heresy": 665, "Inertia": 747, "Jeer": 833, "Key": 915, "Liberty": 998,
    "Miasma": 1078, "Nature": 1158, "Orthodox": 1238, "Phoenix": 1318, "Quiet": 1397,
    "Rook": 1476, "Sin": 1556, "Trial": 1636, "Virtue": 1713, "Wyrd": 1793, "Yonder": 1876, "Zeal": 1956
}

core_ids = {
    "Awe": 2513, "Burden": 155, "Craft": 241, "Dominion": 327, "Enigma": 416, "Fury": 499,
    "Gossamer": 582, "Heresy": 668, "Inertia": 750, "Jeer": 836, "Key": 918, "Liberty": 1001,
    "Miasma": 1081, "Nature": 1161, "Orthodox": 1241, "Phoenix": 1321, "Quiet": 1400,
    "Rook": 1479, "Sin": 1559, "Trial": 1639, "Virtue": 1716, "Wyrd": 1796, "Yonder": 2407, "Zeal": 1959
}

skill_map_data = [
    ["Performance", "Luxury", "Jewelry", "Diplomacy", "Disguise", "Oratory", "Poetry", "Provocation", "Stoicism", "Comedy", "Theology", "Inspiration", "Horror", "Taming", "Etiquette", "Resurrection", "Meditation", "Devotion", "Temptation", "Intimidation", "Preaching", "Ritual", "Telepathy", "Evangelism"],
    ["Appraisal", "Trading", "Masonry", "Management", "Smuggling", "Crushing", "Tailoring", "Black-Market", "Storage", "Haggling", "Accounting", "Donation", "Pollution", "Farming", "Banking", "Restoration", "Hoarding", "Guarding", "Greed", "Mercenary", "Tithe", "Contract", "Logistics", "Transport"],
    ["Art", "Gem-cutting", "Engineering", "Architecture", "Trapping", "Pyrotechnics", "Weaving", "Innovation", "Maintenance", "Forgery", "Research", "Design", "Alchemy", "Woodworking", "Masonry", "Surgery", "Clockwork", "Armoring", "Sabotage", "Weaponsmithing", "Iconography", "Legislation", "Cartography", "Mechanics"],
    ["Leadership", "Commerce", "Urban-Planning", "Politics", "Espionage", "Conquest", "Governance", "Revolution", "Discipline", "Propaganda", "Strategy", "Emancipation", "Corruption", "Forestry", "Bureaucracy", "Welfare", "Pacification", "Security", "Tyranny", "Warfare", "Law", "Jurisdiction", "Colonization", "Mobilization"],
    ["Mystery", "Discovery", "Invention", "Conspiracy", "Stealth", "Ambush", "Illusion", "Infiltration", "Secrecy", "Deception", "Cryptography", "Escape", "Poisoning", "Camouflage", "Tradition", "Occult-Healing", "Silence", "Undercover", "Vice", "Assassination", "Sanctity", "Prophecy", "Scouting", "Tracking"],
    ["Intimidation", "Plundering", "Demolition", "Riot", "Terror", "Brawling", "Storm-chasing", "Anarchy", "Resilience", "Insult", "Tactics", "Rebellion", "Blight", "Survival", "Martial-Law", "Frenzy", "Calm", "Siege", "Wrath", "Combat", "Zealotry", "Vengeance", "Range", "Charge"],
    ["Poetry", "Apportation", "Needlework", "Etiquette", "Illusion", "Breeze", "Acrobatics", "Change", "Floating", "Wit", "Philosophy", "Flight", "Effluvia", "Botany", "Protocol", "Rejuvenation", "Serenity", "Warding", "Vanity", "Fencing", "Grace", "Fate", "Astronomy", "Haste"],
    ["Provocation", "Black-Market", "Modification", "Sedition", "Spycraft", "Mutation", "Unorthodoxy", "Chaos", "Dissent", "Mockery", "Discovery", "Liberty", "Infection", "Hybridization", "Reform", "Reincarnation", "Quiet-Rebellion", "Sabotage", "Sin", "Guerrilla", "Iconoclasm", "Paradox", "Outsider", "Fanaticism"],
    ["Stoicism", "Hoarding", "Fortification", "Stability", "Obscurity", "Endurance", "Suspension", "Resistance", "Immovability", "Indifference", "Focus", "Anchoring", "Stagnation", "Hibernation", "Tradition", "Preservation", "Silence", "Defense", "Sloth", "Blocking", "Patience", "Constraint", "Distance", "Slow-motion"],
    ["Comedy", "Haggling", "Parody", "Propaganda", "Deception", "Taunting", "Satire", "Ridicule", "Cynicism", "Mimicry", "Analysis", "Irony", "Slander", "Animal-Mimicry", "Critique", "Gallows-Humor", "Sarcasm", "Blame", "Temptation", "Duel-of-wits", "Blasphemy", "Judgment", "Alienation", "Mock-Zeal"],
    ["Inspiration", "Accounting", "Science", "Strategy", "Investigation", "Tactics", "Philosophy", "Innovation", "Concentration", "Analysis", "Logic", "Genius", "Diagnosis", "Biology", "Law", "Medicine", "Insight", "Security-Audit", "Cunning", "Precision", "Ethics", "Mathematics", "Navigation", "Speed-Reading"],
    ["Charisma", "Free-Trade", "Customization", "Democracy", "Escape", "Wildness", "Agility", "Rebellion", "Unbound", "Humor", "Curiosity", "Autonomy", "Immunity", "Wilderness-Survival", "Liberalism", "Rebirth", "Freedom", "Evading", "Hedonism", "Skirmishing", "Tolerance", "Choice", "Travel", "Zeal"],
    ["Horror", "Corruption", "Bio-hazard", "Tyranny", "Poisoning", "Plague", "Decay", "Mutation", "Stagnation", "Mockery", "Forensics", "Infection", "Toxicology", "Parasitology", "Necromancy", "Undeath", "Entropy", "Rot", "Sin", "Atrocity", "Desecration", "Curse", "Wasteland-Survival", "Frenzy"],
    ["Taming", "Agriculture", "Woodworking", "Ecology", "Camouflage", "Hunting", "Weather-Sense", "Evolution", "Resilience", "Mimicry", "Biology", "Survival", "Poison", "Botany", "Taxonomy", "Healing", "Hibernation", "Natural-Defense", "Instinct", "Predation", "Herbalism", "Instinct", "Navigation", "Riding"],
    ["Etiquette", "Banking", "Masonry", "Bureaucracy", "Tradition", "Discipline", "Protocol", "Reform", "Order", "Ceremony", "Law", "Constitution", "Dogma", "Preservation", "Organization", "Consecration", "Calm", "Hierarchy", "Penance", "Strategy", "Priesthood", "Legislation", "Diplomacy", "Conviction"],
    ["Inspiration", "Restoration", "Repair", "Relief", "Rebirth", "Fury", "Renewal", "Reincarnation", "Recovery", "Resurrection", "Medicine", "Redemption", "Immunity", "Healing", "Ritual", "Regeneration", "Peace", "Salvage", "Penance", "Surgery", "Salvation", "Karma", "Rebirth", "Zeal"],
    ["Meditation", "Hoarding", "Fine-detail", "Peacekeeping", "Stealth", "Calm", "Serenity", "Contemplation", "Stillness", "Silence", "Intuition", "Contentment", "Apathy", "Solitude", "Order", "Rest", "Concentration", "Warding", "Humility", "Precision", "Prayer", "Reflection", "Isolation", "Patience"],
    ["Protection", "Treasury", "Armoring", "Security", "Undercover", "Fortitude", "Shielding", "Sabotage-Defense", "Defense", "Guarding", "Tactics", "Liberty-Defense", "Quarantine", "Survival", "Watch", "First-Aid", "Vigilance", "Fortification", "Justice", "Shield-Wall", "Sanctuary", "Law-Enforcement", "Garrison", "Alertness"],
    ["Temptation", "Greed", "Sabotage", "Corruption", "Vice", "Wrath", "Sloth", "Rebellion", "Gluttony", "Envy", "Pride", "Liberty", "Lust", "Desecration", "Transgression", "Ruin", "Indifference", "Betrayal", "Villainy", "Murder", "Defiance", "Iniquity", "Exile", "Zealotry"],
    ["War-cry", "Mercenary", "Weaponry", "Strategy", "Ambush", "Brawling", "Fencing", "Guerrilla", "Defense", "Intimidation", "Tactics", "Skirmishing", "Atrocity", "Hunting", "Martial-Law", "Surgery", "Precision", "Guarding", "Murder", "Melee", "Chivalry", "Duel", "Archery", "Athletics"],
    ["Preaching", "Charity", "Craftsmanship", "Diplomacy", "Sanctity", "Righteous-Fury", "Grace", "Iconoclasm", "Patience", "Blasphemy-Defense", "Ethics", "Tolerance", "Exorcism", "Herbalism", "Priesthood", "Healing", "Prayer", "Sanctuary", "Redemption", "Chivalry", "Goodness", "Law", "Missionary", "Evangelism"],
    ["Ritual", "Contract", "Magic", "Politics", "Occultism", "Vengeance", "Fate", "Paradox", "Constraint", "Judgment", "Mathematics", "Choice", "Curse", "Instinct", "Legislation", "Karma", "Reflection", "Law-Enforcement", "Iniquity", "Duel", "Purity", "Divination", "Destiny", "Zeal"],
    ["Telepathy", "Logistics", "Cartography", "Colonization", "Scouting", "Range", "Astronomy", "Outsider", "Distance", "Alienation", "Navigation", "Travel", "Wasteland-Survival", "Tracking", "Diplomacy", "Rebirth", "Isolation", "Garrison", "Exile", "Archery", "Missionary", "Destiny", "Exploration", "Astronavigation"],
    ["Evangelism", "Transport", "Mechanics", "Mobilization", "Tracking", "Charge", "Haste", "Fanaticism", "Slow-motion", "Mock-Zeal", "Speed-Reading", "Zeal", "Frenzy", "Riding", "Conviction", "Zeal", "Patience", "Alertness", "Zealotry", "Athletics", "Evangelism", "Zeal", "Astronavigation", "Running"]
]

types_map = {
    "Awe": "Art", "Burden": "Economic", "Craft": "Technical", "Dominion": "Social", "Enigma": "Subterfuge",
    "Fury": "Force", "Gossamer": "Grace", "Heresy": "Change", "Inertia": "Static", "Jeer": "Performance",
    "Key": "Analysis", "Liberty": "Freedom", "Miasma": "Corruption", "Nature": "Natural", "Orthodox": "Admin",
    "Phoenix": "Medical", "Quiet": "Peace", "Rook": "Security", "Sin": "Vice", "Trial": "Combat",
    "Virtue": "Religious", "Wyrd": "Mystic", "Yonder": "Field", "Zeal": "Physical"
}

all_skills = {}
id_start = 5000

for i, root in enumerate(facets):
    for j, channel in enumerate(facets):
        skill_id = id_start + (i * 24) + j
        short = skill_map_data[i][j]
        type_name = types_map[root]

        if channel == "Trial": type_name = "Martial"
        elif channel == "Nature": type_name = "Science" if root == "Key" else "Wild"
        elif channel == "Craft": type_name = "Trade"
        elif channel == "Virtue": type_name = "Moral"
        elif channel == "Awe": type_name = "Psychological"
        elif channel == "Enigma": type_name = "Tactical"

        full_name = f"{short} {root} {channel} {type_name} Skill Annex"

        root_prof_id = str(core_ids[root])
        channel_prof_id = str(action_ids[channel])

        skill_entry = {
            "id": skill_id,
            "prof": {
                "Name": [
                    short,
                    full_name,
                    ""
                ],
                "Description": f"A Skill Annex combining the {root} essence with the {channel} expression, forming the {short} skill.",
                "Tags": {
                    "Facets": [str(i), str(j)],
                    "Scopes": ["1"],
                    "Genres": ["1"],
                    "Eras": ["1"],
                    "Types": ["32"]
                },
                "sourceAnnex": {
                    "name": short,
                    "type": "Skill",
                    "knot": [
                        [root_prof_id, 16], # ROOT
                        [channel_prof_id, 32] # CHANNEL
                    ]
                }
            }
        }
        all_skills[str(skill_id)] = skill_entry

with open('src/t13ne/data/json/annexes/base_skills.json', 'w') as f:
    json.dump(all_skills, f, indent=2)
