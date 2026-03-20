#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <emscripten/bind.h>
#include "../common/prng_shared.h"

using namespace emscripten;

struct CardData {
    std::string card;
    int suit;
    int pips;
    std::string id;
};

struct SpreadPosition {
    std::string role;
    std::string description;
};

struct CardAtPosition {
    CardData card;
    SpreadPosition position;
};

struct SpreadResult {
    std::string id;
    std::string spreadId;
    std::vector<CardAtPosition> cards;
};

class HardenedDeck {
public:
    std::vector<CardData> currentDeck;
    std::vector<CardData> discardPile;
    Mulberry32 rng;

    HardenedDeck(uint32_t seed) : rng(seed) {}

    void addCard(CardData card) {
        currentDeck.push_back(card);
    }

    void shuffle() {
        for (int i = (int)currentDeck.size() - 1; i > 0; i--) {
            int j = (int)(rng.nextDouble() * (i + 1));
            std::swap(currentDeck[i], currentDeck[j]);
        }
    }

    std::vector<CardData> draw(int num) {
        std::vector<CardData> drawn;
        for (int i = 0; i < num; i++) {
            if (currentDeck.empty()) {
                if (discardPile.empty()) break;
                currentDeck = discardPile;
                discardPile.clear();
                shuffle();
            }
            drawn.push_back(currentDeck.back());
            currentDeck.pop_back();
        }
        return drawn;
    }

    void discard(CardData card) {
        discardPile.push_back(card);
    }

    SpreadResult getSpread(std::string spreadId, std::string instanceId, int numCards, const std::vector<SpreadPosition>& positions) {
        std::vector<CardData> drawn = draw(numCards);
        SpreadResult result;
        result.id = instanceId;
        result.spreadId = spreadId;
        for (size_t i = 0; i < drawn.size(); ++i) {
            CardAtPosition cap;
            cap.card = drawn[i];
            if (i < positions.size()) {
                cap.position = positions[i];
            } else {
                cap.position = {"Card", ""};
            }
            result.cards.push_back(cap);
        }
        return result;
    }
};

EMSCRIPTEN_BINDINGS(cards_module) {
    value_object<CardData>("CardData")
        .field("card", &CardData::card)
        .field("suit", &CardData::suit)
        .field("pips", &CardData::pips)
        .field("id", &CardData::id);

    value_object<SpreadPosition>("SpreadPosition")
        .field("role", &SpreadPosition::role)
        .field("description", &SpreadPosition::description);

    value_object<CardAtPosition>("CardAtPosition")
        .field("card", &CardAtPosition::card)
        .field("position", &CardAtPosition::position);

    value_object<SpreadResult>("SpreadResult")
        .field("id", &SpreadResult::id)
        .field("spreadId", &SpreadResult::spreadId)
        .field("cards", &SpreadResult::cards);

    register_vector<CardData>("VectorCardData");
    register_vector<SpreadPosition>("VectorSpreadPosition");
    register_vector<CardAtPosition>("VectorCardAtPosition");

    class_<HardenedDeck>("HardenedDeck")
        .constructor<uint32_t>()
        .function("addCard", &HardenedDeck::addCard)
        .function("shuffle", &HardenedDeck::shuffle)
        .function("draw", &HardenedDeck::draw)
        .function("discard", &HardenedDeck::discard)
        .function("getSpread", &HardenedDeck::getSpread);
}
