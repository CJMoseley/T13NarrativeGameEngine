#ifndef PRNG_SHARED_H
#define PRNG_SHARED_H

#include <string>
#include <cstdint>
#include <cmath>
#include <algorithm>
#include <vector>

class Xoshiro256ss {
public:
    uint64_t s[4];

    Xoshiro256ss(std::string seedStr) {
        seed(seedStr);
    }

    void seed(std::string seedStr) {
        uint64_t h = 1469598103934665603ULL;
        for (char c : seedStr) {
            h ^= (uint64_t)c;
            h *= 1099511628211ULL;
        }

        for (int i = 0; i < 4; i++) {
            s[i] = splitmix64(h + i);
        }

        if (s[0] == 0 && s[1] == 0 && s[2] == 0 && s[3] == 0) {
            s[0] = 0x0123456789ABCDEFULL;
            s[1] = 0xFEDCBA9876543210ULL;
            s[2] = 0xF0E1D2C3B4A59687ULL;
            s[3] = 0x89ABCDEF01234567ULL;
        }
    }

    uint64_t nextUint64() {
        const uint64_t result = rotl(s[1] * 5, 7) * 9;
        const uint64_t t = s[1] << 17;

        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];

        s[2] ^= t;
        s[3] = rotl(s[3], 45);

        return result;
    }

    double nextDouble() {
        return (nextUint64() >> 11) / 9007199254740992.0;
    }

    int nextInt(int min, int max) {
        if (max < min) std::swap(min, max);
        uint64_t range = (uint64_t)(max - min + 1);
        return (int)(nextUint64() % range) + min;
    }

    std::vector<uint64_t> getState() {
        return {s[0], s[1], s[2], s[3]};
    }

    void setState(const std::vector<uint64_t>& state) {
        if (state.size() == 4) {
            for (int i = 0; i < 4; i++) s[i] = state[i];
        }
    }

private:
    static inline uint64_t rotl(const uint64_t x, int k) {
        return (x << k) | (x >> (64 - k));
    }

    static uint64_t splitmix64(uint64_t z) {
        z = (z + 0x9E3779B97F4A7C15ULL);
        z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
        z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
        return z ^ (z >> 31);
    }
};

class Mulberry32 {
public:
    uint32_t state;

    Mulberry32(uint32_t seedVal) {
        state = seedVal;
    }

    double nextDouble() {
        state = (state + 0x6D2B79F5) | 0;
        uint32_t t = state ^ (state >> 15);
        t = (uint32_t)((uint64_t)t * (1 | state));
        t = (t + (uint32_t)((uint64_t)(t ^ (t >> 7)) * (61 | t))) | 0;
        return (uint32_t)(t ^ (t >> 14)) / 4294967296.0;
    }
};

#endif
