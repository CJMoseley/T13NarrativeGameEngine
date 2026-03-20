#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <cmath>
#include <map>
#include <algorithm>

using namespace emscripten;

struct Note {
    double freq;
    double duration;
    int interval;
    std::string pitchName;
};

struct Composition {
    std::string name;
    std::string key;
    double baseFreq;
    std::vector<int> scale;
    std::vector<Note> sequence;
    double tempo;
};

class MarkovComposer {
public:
    MarkovComposer() {}

    Composition generate(std::string name, double baseFreq, std::vector<int> scale, std::vector<double> syllableRhythm, uint32_t seed) {
        uint32_t state = seed;
        auto nextDouble = [&state]() {
            state = (state + 0x6D2B79F5) | 0;
            uint32_t t = state ^ (state >> 15);
            t = (uint32_t)((uint64_t)t * (1 | state));
            t = (t + (uint32_t)((uint64_t)(t ^ (t >> 7)) * (61 | t))) | 0;
            return (uint32_t)(t ^ (t >> 14)) / 4294967296.0;
        };

        std::vector<std::vector<double>> transitionMatrix = generateMatrix(scale);
        int length = std::max((int)syllableRhythm.size(), 8);
        std::vector<Note> sequence;
        int currentIndex = 0;

        for (int i = 0; i < length; i++) {
            std::vector<double> probabilities = transitionMatrix[currentIndex];
            double random = nextDouble();
            double cumulativeProb = 0;
            int nextNoteIndex = 0;
            for (int j = 0; j < probabilities.size(); j++) {
                cumulativeProb += probabilities[j];
                if (random < cumulativeProb) {
                    nextNoteIndex = j;
                    break;
                }
            }
            int interval = scale[nextNoteIndex];
            double freq = baseFreq * std::pow(2.0, interval / 12.0);
            double duration = (i < syllableRhythm.size()) ? syllableRhythm[i] : 0.5;

            sequence.push_back({freq, duration, interval, ""});
            currentIndex = nextNoteIndex;
        }

        return {name + "'s Theme", "C", baseFreq, scale, sequence, 100.0};
    }

private:
    std::vector<std::vector<double>> generateMatrix(const std::vector<int>& scale) {
        std::vector<std::vector<double>> matrix;
        for (int i = 0; i < scale.size(); i++) {
            std::vector<double> weights;
            double totalWeight = 0;
            for (int j = 0; j < scale.size(); j++) {
                int interval = (scale[j] - scale[i] + 12) % 12;
                double weight = 1.0;
                if (interval == 0) weight += 4.0;
                else if (interval <= 2 || interval >= 10) weight += 5.0;
                else if (interval == 5 || interval == 7) weight += 2.0;
                weights.push_back(weight);
                totalWeight += weight;
            }
            for (double& w : weights) w /= totalWeight;
            matrix.push_back(weights);
        }
        return matrix;
    }
};

class AdditiveSynth {
public:
    static void process(uintptr_t outputPtr, int bufferSize, int channelCount, float frequency, float sampleRate, float* wavetable, int tableLen, float& phase, bool active) {
        float* output = reinterpret_cast<float*>(outputPtr);
        if (!active || tableLen < 2) {
            std::fill(output, output + (bufferSize * channelCount), 0.0f);
            return;
        }

        float phaseIncrement = (frequency * tableLen) / sampleRate;

        for (int i = 0; i < bufferSize; i++) {
            int i0 = (int)std::floor(phase) % tableLen;
            int i1 = (i0 + 1) % tableLen;
            float frac = phase - std::floor(phase);

            float sample = wavetable[i0] * (1.0f - frac) + wavetable[i1] * frac;

            for (int ch = 0; ch < channelCount; ch++) {
                output[ch * bufferSize + i] = sample;
            }

            phase = std::fmod(phase + phaseIncrement, (float)tableLen);
        }
    }
};

EMSCRIPTEN_BINDINGS(audio_module) {
    value_object<Note>("Note")
        .field("freq", &Note::freq)
        .field("duration", &Note::duration)
        .field("interval", &Note::interval)
        .field("pitchName", &Note::pitchName);

    value_object<Composition>("Composition")
        .field("name", &Composition::name)
        .field("key", &Composition::key)
        .field("baseFreq", &Composition::baseFreq)
        .field("scale", &Composition::scale)
        .field("sequence", &Composition::sequence)
        .field("tempo", &Composition::tempo);

    register_vector<int>("VectorInt");
    register_vector<double>("VectorDouble");
    register_vector<Note>("VectorNote");

    class_<MarkovComposer>("MarkovComposer")
        .constructor<>()
        .function("generate", &MarkovComposer::generate);

    // For direct memory access in AdditiveSynth, we'll expose a wrapper if needed,
    // but the hot loop is better handled with a simpler C-style function if we want raw speed.
}
