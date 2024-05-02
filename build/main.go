package main

import (
	"github.com/goyek/x/boot"
	"github.com/wasilibs/tools/tasks"
)

func main() {
	tasks.Define(tasks.Params{
		LibraryName: "protoc",
		LibraryRepo: "protocolbuffers/protobuf",
		GoReleaser:  true,
	})
	boot.Main()
}
