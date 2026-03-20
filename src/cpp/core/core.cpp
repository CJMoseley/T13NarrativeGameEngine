#include <string>
#include <vector>
#include <map>
#include <cstdint>
#include <emscripten/bind.h>

using namespace emscripten;

// Forward declarations
struct T13PlotData;

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

struct GeometryData {
    int geometryNumber;
    int chi;
    int octave;
    std::string name;
};

// Hardened classes with better memory management and safety
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

    value_object<GeometryData>("GeometryData")
        .field("geometryNumber", &GeometryData::geometryNumber)
        .field("chi", &GeometryData::chi)
        .field("octave", &GeometryData::octave)
        .field("name", &GeometryData::name);

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
