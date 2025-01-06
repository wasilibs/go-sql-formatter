package main

import (
	"os"

	"github.com/wasilibs/go-sql-formatter/v15/internal/runner"
	"github.com/wasilibs/go-sql-formatter/v15/internal/wasm"
)

func main() {
	os.Exit(runner.Run("sql-formatter-cli", os.Args[1:], wasm.SQLFormatterCLI, os.Stdin, os.Stdout, os.Stderr, "."))
}
