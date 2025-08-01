TITLE = wasmlite
DEBUG = 1

ESBUILD = esbuild --format=esm --bundle libjs/loader.js --minify --define:BUNDLER=1
ifeq ($(DEBUG),1)
ESBUILD += --sourcemap
endif

js:
	@$(ESBUILD)

html:
	@(echo "<!DOCTYPE html><title>$(TITLE)</title><style>:root{color-scheme:light dark;}</style><script type='module'>"; $(ESBUILD); echo "</script>") | tr -d '\n'

serve:
	esbuild --servedir=.

cp:
	$(MAKE) -s html > ../Client3/index.html
	$(MAKE) -s html > ../forks/PL3D-KC/index.html
	$(MAKE) -s html > ../forks/doomgeneric/doomgeneric/index.html
	$(MAKE) -s html > ../forks/quakegeneric/source/index.html
	$(MAKE) -s html > ../forks/gdkGBA/index.html
	$(MAKE) -s html > ../forks/LakeSnes/index.html
	$(MAKE) -s html > ../forks/agbemu/index.html
	$(MAKE) -s html > ../forks/ntremu/index.html
	$(MAKE) -s html > ../forks/agnes/examples/index.html
	$(MAKE) -s html > ../forks/Peanut-GB/examples/sdl2/index.html
