CC = emcc
OPT = -O3
FLAGS = --bind -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web,worker,node
OUT_DIR = src/t13ne/wasm

all: $(OUT_DIR)/prng.js $(OUT_DIR)/core.js $(OUT_DIR)/audio.js

$(OUT_DIR)/prng.js: src/cpp/prng/prng.cpp
	mkdir -p $(OUT_DIR)
	$(CC) $(OPT) $(FLAGS) $< -o $@

$(OUT_DIR)/core.js: src/cpp/core/core.cpp
	mkdir -p $(OUT_DIR)
	$(CC) $(OPT) $(FLAGS) $< -o $@

$(OUT_DIR)/audio.js: src/cpp/audio/audio.cpp
	mkdir -p $(OUT_DIR)
	$(CC) $(OPT) $(FLAGS) $< -o $@

clean:
	rm -f $(OUT_DIR)/*.js $(OUT_DIR)/*.wasm
