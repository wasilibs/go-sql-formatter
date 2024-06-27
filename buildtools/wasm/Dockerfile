FROM node:20-bookworm AS buildjs

WORKDIR /quickjs
RUN curl -L https://github.com/bellard/quickjs/archive/36911f0d3ab1a4c190a4d5cbe7c2db225a455389.tar.gz | tar -xz --strip-components=1 -C /quickjs
RUN make
RUN make install

WORKDIR /app

RUN corepack enable

COPY buildtools/wasm/package.json buildtools/wasm/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY buildtools/wasm/*.mjs ./
COPY buildtools/wasm/*.ts ./
COPY buildtools/wasm/tsconfig.json ./
RUN pnpm run build

# Match NodeJS default stack size.
RUN qjsc -S 884736 -e dist/sql-formatter-cli.js -o dist/sql-formatter-cli.c

FROM ghcr.io/webassembly/wasi-sdk:sha-8827cdf

RUN apt-get update && apt-get install -y binaryen curl patch xz-utils

WORKDIR /quickjs
RUN curl -L https://github.com/bellard/quickjs/archive/36911f0d3ab1a4c190a4d5cbe7c2db225a455389.tar.gz | tar -xz --strip-components=1 -C /quickjs
COPY buildtools/wasm/patch-quickjs.txt ./
RUN patch -p1 < patch-quickjs.txt
ENV CUSTOM_CFLAGS $CFLAGS -g -DEMSCRIPTEN -D_WASI_EMULATED_SIGNAL
RUN make libquickjs.a
RUN $RANLIB libquickjs.a

WORKDIR /app
COPY --from=buildjs /app/dist/sql-formatter-cli.c ./
RUN $CC $CFLAGS -O2 -o sql-formatter-cli-noopt.wasm sql-formatter-cli.c -lquickjs -I/quickjs -L/quickjs -Wl,--global-base=1024
RUN wasm-opt -o sql-formatter-cli.wasm --low-memory-unused --flatten --rereloop --converge -O3 sql-formatter-cli-noopt.wasm

CMD [ "cp", "sql-formatter-cli.wasm", "/out"]
