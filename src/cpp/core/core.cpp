#include <string>
#include <vector>
#include <map>
#include <cstdint>
#include <algorithm>
#include <emscripten/bind.h>

using namespace emscripten;

namespace Gematria {
    const std::map<char, int> VALUES = {
        {'a', 1}, {'j', 1}, {'q', 1}, {'y', 1}, {'i', 1},
        {'b', 2}, {'k', 2}, {'r', 2}, {'c', 2},
        {'g', 3}, {'l', 3},
        {'d', 4}, {'m', 4}, {'t', 4},
        {'e', 5}, {'n', 5},
        {'s', 6}, {'u', 6}, {'v', 6}, {'w', 6}, {'x', 6},
        {'o', 7}, {'z', 7},
        {'f', 8}, {'h', 8}, {'p', 8}
    };

    int crunch(int num) {
        while (num > 13) {
            int sum = 0;
            std::string s = std::to_string(num);
            for (char c : s) {
                if (std::isdigit(c)) sum += (c - '0');
            }
            num = sum;
        }
        return num;
    }

    int calculate(std::string str) {
        int sum = 0;
        for (char c : str) {
            char lc = std::tolower(c);
            if (VALUES.count(lc)) sum += VALUES.at(lc);
        }
        return crunch(sum);
    }
}

struct StatPair {
    int facet;
    int antiFacet;
    int facetBoon;
    int antiFacetBoon;
};

class HardenedTapestry {
public:
    std::vector<StatPair> stats;
    int scale;

    HardenedTapestry(int s) : scale(s) {}

    void setStat(int index, int facet, int antiFacet, int fBoon, int aBoon) {
        if (index >= stats.size()) stats.resize(index + 1);
        stats[index] = {facet, antiFacet, fBoon, aBoon};
    }

    int getBoonForFacet(int facetId) {
        for (const auto& pair : stats) {
            if (pair.facet == facetId) return pair.facetBoon + scale;
            if (pair.antiFacet == facetId) return pair.antiFacetBoon + scale;
        }
        return 13 + scale;
    }
};

struct T13PlotData {
    std::string id;
    std::string name;
    std::string rank;
    std::string variety;
    int tensionLevel;
    int yarnPoints;
    bool isActive;
    bool isResolved;
    std::string goal;
    std::vector<std::string> characters;
    std::vector<std::string> subPlots;
    std::string parentPlotId;
};

struct T13GameData {
    std::string id;
    std::string name;
    std::string type;
    std::string description;
    std::string seed;
    std::vector<std::string> plots;
    std::vector<std::string> characters;
    uint64_t created;
    uint64_t lastModified;
};

class HardenedPlot {
public:
    T13PlotData data;

    HardenedPlot(T13PlotData d) : data(d) {}

    void addSubPlot(std::string subPlotId) {
        if (std::find(data.subPlots.begin(), data.subPlots.end(), subPlotId) == data.subPlots.end()) {
            data.subPlots.push_back(subPlotId);
        }
    }

    void updateTension(int newLevel) {
        if (newLevel >= 0 && newLevel <= 11) {
            data.tensionLevel = newLevel;
        }
    }

    T13PlotData getData() const { return data; }
};

class HardenedGame {
public:
    T13GameData data;
    std::map<std::string, HardenedPlot*> plotMap;

    HardenedGame(T13GameData d) : data(d) {}

    void registerPlot(T13PlotData pData) {
        if (plotMap.find(pData.id) == plotMap.end()) {
            plotMap[pData.id] = new HardenedPlot(pData);
            data.plots.push_back(pData.id);
        }
    }

    HardenedPlot* getPlot(std::string id) {
        if (plotMap.count(id)) return plotMap[id];
        return nullptr;
    }

    T13GameData getData() const { return data; }

    ~HardenedGame() {
        for (auto const& [key, val] : plotMap) {
            delete val;
        }
    }
};

EMSCRIPTEN_BINDINGS(core_module) {
    function("gematria_crunch", &Gematria::crunch);
    function("gematria_calculate", &Gematria::calculate);

    register_vector<std::string>("VectorString");

    value_object<StatPair>("StatPair")
        .field("facet", &StatPair::facet)
        .field("antiFacet", &StatPair::antiFacet)
        .field("facetBoon", &StatPair::facetBoon)
        .field("antiFacetBoon", &StatPair::antiFacetBoon);

    register_vector<StatPair>("VectorStatPair");

    class_<HardenedTapestry>("HardenedTapestry")
        .constructor<int>()
        .function("setStat", &HardenedTapestry::setStat)
        .function("getBoonForFacet", &HardenedTapestry::getBoonForFacet);

    value_object<T13GameData>("T13GameData")
        .field("id", &T13GameData::id)
        .field("name", &T13GameData::name)
        .field("type", &T13GameData::type)
        .field("description", &T13GameData::description)
        .field("seed", &T13GameData::seed)
        .field("plots", &T13GameData::plots)
        .field("characters", &T13GameData::characters)
        .field("created", &T13GameData::created)
        .field("lastModified", &T13GameData::lastModified);

    value_object<T13PlotData>("T13PlotData")
        .field("id", &T13PlotData::id)
        .field("name", &T13PlotData::name)
        .field("rank", &T13PlotData::rank)
        .field("variety", &T13PlotData::variety)
        .field("tensionLevel", &T13PlotData::tensionLevel)
        .field("yarnPoints", &T13PlotData::yarnPoints)
        .field("isActive", &T13PlotData::isActive)
        .field("isResolved", &T13PlotData::isResolved)
        .field("goal", &T13PlotData::goal)
        .field("characters", &T13PlotData::characters)
        .field("subPlots", &T13PlotData::subPlots)
        .field("parentPlotId", &T13PlotData::parentPlotId);

    class_<HardenedPlot>("HardenedPlot")
        .constructor<T13PlotData>()
        .function("addSubPlot", &HardenedPlot::addSubPlot)
        .function("updateTension", &HardenedPlot::updateTension)
        .function("getData", &HardenedPlot::getData);

    class_<HardenedGame>("HardenedGame")
        .constructor<T13GameData>()
        .function("registerPlot", &HardenedGame::registerPlot)
        .function("getPlot", &HardenedGame::getPlot, allow_raw_pointers())
        .function("getData", &HardenedGame::getData);
}
