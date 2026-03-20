#include <string>
#include <vector>
#include <map>
#include <emscripten/bind.h>

using namespace emscripten;

struct StateTransitionResult {
    std::string state;
    std::string transition;
};

class NarrativeEvaluator {
public:
    static StateTransitionResult evaluate(std::string currentState, int tensionLevel, int yarnPoints, bool isHooked, bool isResolved) {
        // Core T13 State Logic ported to C++
        if (isResolved) return {"Resolved", "RESOLVE"};

        if (currentState == "Frame") {
            if (isHooked) return {"Loom", "HOOKS_SET"};
        } else if (currentState == "Loom") {
            if (tensionLevel >= 7) return {"Zenith", "CLIMAX_APPROACHING"};
        } else if (currentState == "Zenith") {
            if (isResolved || yarnPoints >= 20) return {"Resolved", "RESOLUTION"};
        }

        // Scene Logic
        if (currentState == "Ends") {
            return {"Fray", "ENGAGE"};
        } else if (currentState == "Fray") {
            if (tensionLevel > 5) return {"Snag", "COMPLICATE"};
            if (isResolved) return {"Complete", "RESOLVE"};
        } else if (currentState == "Snag") {
            if (tensionLevel < 4) return {"Fray", "RELAX"};
            if (isResolved) return {"Complete", "RESOLVE"};
        }

        return {currentState, ""};
    }

    static int calculateStressRelief(std::string dramaType, int roll1, int roll2) {
        if (dramaType == "Atmospheric") return 1;
        if (dramaType == "Narrative Moment") return roll1;
        if (dramaType == "Hazard") return std::max(2, roll1);
        if (dramaType == "Prod") return 2;
        if (dramaType == "Break") return 999;
        if (dramaType == "Ratchet") return roll1 + roll2;
        return 0;
    }
};

EMSCRIPTEN_BINDINGS(narrative_module) {
    value_object<StateTransitionResult>("StateTransitionResult")
        .field("state", &StateTransitionResult::state)
        .field("transition", &StateTransitionResult::transition);

    class_<NarrativeEvaluator>("NarrativeEvaluator")
        .class_function("evaluate", &NarrativeEvaluator::evaluate)
        .class_function("calculateStressRelief", &NarrativeEvaluator::calculateStressRelief);
}
