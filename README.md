# go-sql-formatter

go-sql-formatter is a distribution of [sql-formatter][1], that can be built with Go. It does not actually reimplement any
functionality of sql-formatter in Go, instead packaging it with the lightweight JS runtime [QuickJS][3], and
executing with the pure Go Wasm runtime [wazero][2]. This means that `go install` or `go run`
can be used to execute it, with no need to rely on separate package managers such as pnpm,
on any platform that Go supports.

## Installation

Precompiled binaries are available in the [releases](https://github.com/wasilibs/go-sql-formatter/releases).
Alternatively, install the plugin you want using `go install`.

```bash
$ go install github.com/wasilibs/go-sql-formatter/cmd/sql-formatter@latest
```

To avoid installation entirely, it can be convenient to use `go run`

```bash
$ go run github.com/wasilibs/go-sql-formatter/cmd/sql-formatter@latest -o formatted.sql unformatted.sql
```

_Due to [potential build breakage](https://github.com/golang/go/issues/71192) unrelated to this project,
`go tool` is not supported._

Note that due to the sandboxing of the filesystem when using Wasm, currently only files that descend
from the current directory when executing the tool are accessible to it, i.e., `../sql/my.sql` or
`/separate/root/my.sql` will not be found.

[1]: https://github.com/sql-formatter-org/sql-formatter
[2]: https://wazero.io/
[3]: https://bellard.org/quickjs/
