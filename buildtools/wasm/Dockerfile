FROM node:20-bookworm AS buildjs

WORKDIR /app

RUN corepack enable

COPY buildtools/wasm/package.json buildtools/wasm/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY buildtools/wasm/sql-formatter-cli.ts ./
COPY buildtools/wasm/tsconfig.json ./
RUN pnpm run build
COPY buildtools/wasm/patch.txt ./
RUN patch -p0 < patch.txt

FROM ghcr.io/webassembly/wasi-sdk:wasi-sdk-21

RUN apt-get update && apt-get install -y binaryen curl patch xz-utils

WORKDIR /quickjs
RUN curl -L https://github.com/bellard/quickjs/archive/f25e5d4094a11cf098670417e8a16ffb7cbadda0.tar.gz | tar -xz --strip-components=1 -C /quickjs
RUN make
RUN make install
RUN make clean
COPY buildtools/wasm/patch-quickjs.txt ./
RUN patch -p1 < patch-quickjs.txt
ENV CUSTOM_CFLAGS $CFLAGS -DEMSCRIPTEN -D_WASI_EMULATED_SIGNAL
RUN make libquickjs.a
RUN $RANLIB libquickjs.a

WORKDIR /app
COPY --from=buildjs /app/dist/sql-formatter-cli.js ./
RUN qjsc -e sql-formatter-cli.js -o sql-formatter-cli.c
RUN $CC $CFLAGS -O2 -o sql-formatter-cli-noopt.wasm sql-formatter-cli.c -lquickjs -I/usr/local/include/quickjs -L/quickjs -Wl,--global-base=1024
RUN wasm-opt -o sql-formatter-cli.wasm --low-memory-unused --flatten --rereloop --converge -O3 sql-formatter-cli-noopt.wasm

CMD [ "cp", "sql-formatter-cli.wasm", "/out"]
