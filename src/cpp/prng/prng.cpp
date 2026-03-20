#include <emscripten/bind.h>
#include "../common/prng_shared.h"

using namespace emscripten;

// Binding code
EMSCRIPTEN_BINDINGS(prng_module) {
    register_vector<uint64_t>("VectorUint64");

    class_<Xoshiro256ss>("Xoshiro256ss")
        .constructor<std::string>()
        .function("seed", &Xoshiro256ss::seed)
        .function("nextUint64", &Xoshiro256ss::nextUint64)
        .function("nextDouble", &Xoshiro256ss::nextDouble)
        .function("nextInt", &Xoshiro256ss::nextInt)
        .function("getState", &Xoshiro256ss::getState)
        .function("setState", &Xoshiro256ss::setState);

    class_<Mulberry32>("Mulberry32")
        .constructor<uint32_t>()
        .function("nextDouble", &Mulberry32::nextDouble);
}
