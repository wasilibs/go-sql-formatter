package main

import (
	"os"

	"github.com/wasilibs/go-sql-formatter/internal/runner"
	"github.com/wasilibs/go-sql-formatter/internal/wasm"
)

func main() {
	os.Exit(runner.Run("sql-formatter-cli", os.Args[1:], wasm.SQLFormatterCLI, os.Stdin, os.Stdout, os.Stderr, "."))
}
