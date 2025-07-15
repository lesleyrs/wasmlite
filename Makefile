TITLE = wasmlite
DEBUG = 1

ESBUILD = esbuild --format=esm --bundle libjs/loader.js --minify
ifeq ($(DEBUG),1)
ESBUILD += --sourcemap
endif

js:
	@$(ESBUILD)

html:
	@(echo "<!DOCTYPE html><title>$(TITLE)</title><style>:root{color-scheme:light dark;}</style><script type='module'>"; $(ESBUILD); echo "</script>") | tr -d '\n'

serve:
	esbuild --servedir=.

crt1:
	clang --target=wasm32 -nostdlib -Wall -Oz -c libc/crt1.c -o libc/lib/crt1.o

cp:
	$(MAKE) -s html > ../Client3/index.html
	$(MAKE) -s html > ../forks/PL3D-KC/index.html
	$(MAKE) -s html > ../forks/doomgeneric/doomgeneric/index.html
	$(MAKE) -s html > ../forks/quakegeneric/source/index.html
	$(MAKE) -s html > ../forks/gdkGBA/index.html
	$(MAKE) -s html > ../forks/LakeSnes/index.html
	$(MAKE) -s html > ../forks/agbemu/index.html
	$(MAKE) -s html > ../forks/ntremu/index.html
