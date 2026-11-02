// T13 Gematria WASM Core using the canonical single-character and digraph map.

static unsigned int singleGematria(unsigned char c) {
    if (c >= 'A' && c <= 'Z') c = (unsigned char)(c + ('a' - 'A'));
    switch (c) {
        case 'a': case 'i': case 'j': case 'q': case 'y': return 1;
        case 'b': case 'c': case 'k': case 'r': return 2;
        case 'g': case 'l': return 3;
        case 'd': case 'm': case 't': return 4;
        case 'e': case 'n': return 5;
        case 's': case 'u': case 'v': case 'w': case 'x': return 6;
        case 'o': case 'z': return 7;
        case 'f': case 'h': case 'p': return 8;
        default: return 0;
    }
}

static unsigned int digraphGematria(unsigned char first, unsigned char second) {
    if (first >= 'A' && first <= 'Z') first = (unsigned char)(first + ('a' - 'A'));
    if (second >= 'A' && second <= 'Z') second = (unsigned char)(second + ('a' - 'A'));
    if (first == 'b' && second == 'h') return 2;
    if (first == 'g' && second == 'h') return 3;
    if (first == 's' && second == 'h') return 3;
    if ((first == 'c' && second == 'h') || (first == 'p' && second == 'h')) return 8;
    if (first == 't' && (second == 'h' || second == 's' || second == 'z')) return 9;
    return 0;
}

static unsigned int reduceGematria(unsigned int value) {
    while (value > 13) {
        unsigned int reduced = 0;
        while (value > 0) {
            reduced += value % 10;
            value /= 10;
        }
        value = reduced;
    }
    return value;
}

unsigned int crunchGematria(const char* str, unsigned int len) {
    if (!str || len == 0) return 0;

    unsigned int sum = 0;
    unsigned int i = 0;
    while (i < len) {
        if (i + 1 < len) {
            unsigned int digraph = digraphGematria((unsigned char)str[i], (unsigned char)str[i + 1]);
            if (digraph > 0) {
                sum += digraph;
                i += 2;
                continue;
            }
        }
        sum += singleGematria((unsigned char)str[i]);
        i += 1;
    }

    return reduceGematria(sum);
}
