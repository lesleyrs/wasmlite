TITLE = wasmlite
DEBUG = 1

ESBUILD = esbuild --format=esm --bundle libjs/loader.js --minify
ifeq ($(DEBUG),1)
ESBUILD += --sourcemap
endif

js:
	@$(ESBUILD)

html:
	@(echo "<!DOCTYPE html><style>:root{color-scheme:light dark;}</style><title>$(TITLE)</title><script type='module'>"; $(ESBUILD); echo "</script>") | tr -d '\n'

serve:
	esbuild --servedir=.

crt1:
	clang --target=wasm32 -nostdlib -Wall -Oz -c libc/crt1.c -o libc/lib/crt1.o
