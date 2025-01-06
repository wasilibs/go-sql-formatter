package sqlformatter

import (
	"bytes"
	_ "embed"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wasilibs/go-sql-formatter/v15/internal/runner"
	"github.com/wasilibs/go-sql-formatter/v15/internal/wasm"
)

//go:embed testdata/formatted.sql
var formattedSQL string

//go:embed testdata/config.json
var formattingConfig string

//go:embed testdata/formatted_with_config.sql
var formattedWithConfigSQL string

//go:embed testdata/unformatted.sql
var unformattedSQL string

func TestHelp(t *testing.T) {
	stdin := bytes.Buffer{}
	stdout := bytes.Buffer{}
	stderr := bytes.Buffer{}

	ret := runner.Run("sql-formatter-cli", []string{"--help"}, wasm.SQLFormatterCLI, &stdin, &stdout, &stderr, ".")
	if ret != 0 {
		t.Errorf("expected 0, got %d", ret)
	}

	// Just do sanity check, we'll check the whole message in compatibility tests vs upstream.
	if !strings.Contains(stdout.String(), "usage:") {
		t.Errorf("expected stdout to contain usage:, got %q", stdout.String())
	}
}

func TestFormat(t *testing.T) {
	tests := []struct {
		args     []string
		outPath  string
		expected string
	}{
		{
			args:     []string{"--output", "formatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedSQL,
		},
		{
			args:     []string{"-o", "formatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedSQL,
		},
		{
			args:     []string{"-oformatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedSQL,
		},
		{
			args:     []string{"--fix", "unformatted.sql"},
			outPath:  "unformatted.sql",
			expected: formattedSQL,
		},
		{
			args:     []string{"--config", "config.json", "--output", "formatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedWithConfigSQL,
		},
		{
			args:     []string{"-c", "config.json", "--output", "formatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedWithConfigSQL,
		},
		{
			args:     []string{"-cconfig.json", "--output", "formatted.sql", "unformatted.sql"},
			outPath:  "formatted.sql",
			expected: formattedWithConfigSQL,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(strings.Join(tc.args, " "), func(t *testing.T) {
			dir := t.TempDir()
			unformattedSQLPath := filepath.Join(dir, "unformatted.sql")
			if err := os.WriteFile(unformattedSQLPath, []byte(unformattedSQL), 0o644); err != nil {
				t.Fatal(err)
			}

			configPath := filepath.Join(dir, "config.json")
			if err := os.WriteFile(configPath, []byte(formattingConfig), 0o644); err != nil {
				t.Fatal(err)
			}

			stdin := bytes.Buffer{}
			stdout := bytes.Buffer{}
			stderr := bytes.Buffer{}
			ret := runner.Run("sql-formatter-cli",
				tc.args,
				wasm.SQLFormatterCLI, &stdin, &stdout, &stderr, dir)
			if ret != 0 {
				t.Errorf("expected 0, got %d", ret)
			}
			if stdout.Len() != 0 {
				t.Errorf("expected stdout to be empty, got %q", stdout.String())
			}

			formattedSQLPath := filepath.Join(dir, tc.outPath)
			formatted, err := os.ReadFile(formattedSQLPath)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(formatted, []byte(tc.expected)) {
				t.Errorf("expected formatted.sql to be formatted, got %q", formatted)
			}
		})
	}
}
