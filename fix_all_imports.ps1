$map = @{
    "t13ne-dice.js" = "@/src/t13ne/modules/mechanics/t13ne-dice.js";
    "t13ne-boon.js" = "@/src/t13ne/modules/mechanics/t13ne-boon.js";
    "t13ne-cards.js" = "@/src/t13ne/modules/mechanics/t13ne-cards.js";
    "t13ne-cards-api.js" = "@/src/t13ne/modules/mechanics/t13ne-cards-api.js";
    "t13ne-facets.js" = "@/src/t13ne/modules/mechanics/t13ne-facets.js";
    "t13ne-sway.js" = "@/src/t13ne/modules/mechanics/t13ne-sway.js";
    "t13ne-sway-data.js" = "@/src/t13ne/modules/mechanics/t13ne-sway-data.js";
    "t13ne-stress.js" = "@/src/t13ne/modules/mechanics/t13ne-stress.js";
    "t13ne-resources.js" = "@/src/t13ne/modules/mechanics/t13ne-resources.js";
    "t13ne-tests.js" = "@/src/t13ne/modules/mechanics/t13ne-tests.js";
    "t13ne-iching.js" = "@/src/t13ne/modules/mechanics/t13ne-iching.js";
    "t13ne-tension.js" = "@/src/t13ne/modules/mechanics/t13ne-tension.js";
    "T13SwayAccount.js" = "@/src/t13ne/modules/mechanics/T13SwayAccount.js";
    "T13SwayPurse.js" = "@/src/t13ne/modules/mechanics/T13SwayPurse.js";
    "t13ne-knots.js" = "@/src/t13ne/modules/mechanics/t13ne-knots.js";
    
    "t13ne-prng.js" = "@/src/t13ne/modules/systems/t13ne-prng.js";
    "t13ne-state-machine.js" = "@/src/t13ne/modules/systems/t13ne-state-machine.js";
    "t13ne-commands.js" = "@/src/t13ne/modules/systems/t13ne-commands.js";

    "t13ne-stakes.js" = "@/src/t13ne/modules/systems/ordeals/t13ne-stakes.js";
    "t13ne-ordeals.js" = "@/src/t13ne/modules/systems/ordeals/t13ne-ordeals.js";

    "CodexLoader.js" = "@/src/t13ne/modules/codex/CodexLoader.js";
    "CodexDB.js" = "@/src/t13ne/modules/codex/CodexDB.js";
    
    "t13ne-reasoning.js" = "@/src/t13ne/modules/ai/t13ne-reasoning.js";
    
    "T13Tapestry.js" = "@/src/t13ne/modules/world/T13Tapestry.js";

    "t13ne-plots.js" = "@/src/t13ne/modules/narrative/t13ne-plots.js";
    "t13ne-narrative-weaving.js" = "@/src/t13ne/modules/narrative/t13ne-narrative-weaving.js";
    "t13ne-chars.js" = "@/src/t13ne/modules/characters/t13ne-chars.js";
    "t13ne-names.js" = "@/src/t13ne/modules/characters/t13ne-names.js";
}

$files = Get-ChildItem src\t13ne\modules -Recurse -Filter *.js
foreach ($file in $files) {
    try {
        $c = Get-Content $file.FullName -Raw
        $orig = $c
        
        # Fix T13NE.js (Absolute)
        $c = [Regex]::Replace($c, "from\s+['""](\.\./)+T13NE\.js['""]", "from '@/src/t13ne/T13NE.js'")
        # Also fix incorrect alias to modules root
        $c = [Regex]::Replace($c, "from\s+['""]@/src/t13ne/modules/T13NE\.js['""]", "from '@/src/t13ne/T13NE.js'")

        # Iterate map
        foreach ($key in $map.Keys) {
            $target = $map[$key]
            $safeKey = [Regex]::Escape($key)
            
            # 1. Fix incorrect ALIAS mapping (pointing to root of modules)
            # Match: from '@/src/t13ne/modules/t13ne-dice.js'
            $pattern1 = "['""]@/src/t13ne/modules/$safeKey['""]"
            $c = [Regex]::Replace($c, $pattern1, "'$target'")
            
            # 2. Fix old relative paths pointing to modules root generically
            # Match: from '../modules/t13ne-dice.js' (assuming they were converted to that or existed as that)
            # Or even just /modules/filename
            $pattern2 = "['""]\.\./modules/$safeKey['""]"
            $c = [Regex]::Replace($c, $pattern2, "'$target'")
        }

        if ($c -ne $orig) {
            Set-Content -Path $file.FullName -Value $c -Encoding UTF8 -Force
            Write-Host "Fixed imports in $($file.Name)"
        }
    } catch {
        Write-Warning "Skipped $($file.Name): $_"
    }
}
