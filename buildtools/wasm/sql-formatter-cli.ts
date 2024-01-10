import { FILE, exit, in as stdin, out as stdout, loadFile, open } from "std";

import {
  FormatOptionsWithLanguage,
  format,
  supportedDialects,
} from "sql-formatter";

import { version } from "./package.json";

interface Args {
  fix?: boolean;
  language: string;
  file?: string;
  output?: string;
  config?: string;
}

class SqlFormatterCli {
  private readonly args: Args;

  constructor() {
    this.args = this.parseArgs();
  }

  run() {
    const cfg = this.readConfig();
    const query = this.getInput();
    const formattedQuery = format(query, cfg).trim() + "\n";
    this.writeOutput(this.getOutputFile(this.args), formattedQuery);
  }

  private parseArgs() {
    const args: Args = {
      language: "sql",
    };
    for (let i = 1; i < scriptArgs.length; i++) {
      const [arg, value] = scriptArgs[i].split("=");
      if (arg === "-h" || arg === "--help") {
        this.printHelp();
        exit(0);
      }
      if (arg === "--fix") {
        if (value) {
          this.printErrorHelp();
          console.log(
            "error: argument --fix: ignored explicit argument",
            `'${value}'`,
          );
          exit(1);
        }
        args.fix = true;
        continue;
      }
      const [outPath, newI] = this.readStringArg(
        "-o",
        "--output",
        arg,
        value,
        i,
      );
      if (outPath) {
        args.output = outPath;
        i = newI;
        continue;
      }
      const [configPath, newI2] = this.readStringArg(
        "-c",
        "--config",
        arg,
        value,
        i,
      );
      if (configPath) {
        args.config = configPath;
        i = newI2;
        continue;
      }
      const [dialect, newI3] = this.readStringArg(
        "-l",
        "--language",
        arg,
        value,
        i,
      );
      if (dialect) {
        if (!supportedDialects.includes(dialect)) {
          this.printErrorHelp();
          console.log(
            "error: argument -l/--language: invalid choice:",
            `'${dialect}'`,
            "(choose from",
            supportedDialects.map((d) => `'${d}'`).join(", "),
          );
          exit(1);
        }
        args.language = dialect;
        i = newI3;
        continue;
      }
      if (arg === "--version") {
        console.log(version);
        exit(0);
      }
      args.file = arg;
    }
    return args;
  }

  private readStringArg(
    short: string,
    long: string,
    arg: string,
    value: string,
    i: number,
  ): [string | undefined, number] {
    if (arg === short || arg === long) {
      if (value) {
        return [value, i];
      } else {
        if (i + 1 >= scriptArgs.length || scriptArgs[i + 1].startsWith("-")) {
          this.printErrorHelp();
          console.log("error: argument -o/--output: expected one argument");
          exit(1);
        }
        return [scriptArgs[i + 1], i + 1];
      }
    }
    if (arg.startsWith(short)) {
      let outPath = arg.slice(2);
      if (value) {
        outPath += value;
      }
      return [outPath, i];
    }
    return [undefined, i];
  }

  private readConfig(): FormatOptionsWithLanguage {
    // Unlike upstream, we do not check for TTY since it's not available with WASI. This means
    // a non-interactive execution will differ when no flags are provided, upstream would normally
    // default to reading and writing to stdin/stdout. Such usage should be rare in practice
    // and it is more important to display the help text when no args are passed.
    if (
      Object.entries(this.args).every(
        ([k, v]) => k === "language" || v === undefined,
      )
    ) {
      this.printHelp();
      exit(0);
    }

    if (this.args.config) {
      const configFile = loadFile(this.args.config);
      if (!configFile) {
        console.log(`error: cannot open config file: '${this.args.config}'`);
        exit(1);
      }
      try {
        const configJson = JSON.parse(configFile);
        return { language: this.args.language, ...configJson };
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log(
            `Error: unable to parse JSON at file ${this.args.config}`,
          );
          exit(1);
        }
        console.log(
          "An unknown error has occurred, please file a bug report at:",
        );
        console.log(
          "https://github.com/sql-formatter-org/sql-formatter/issues\n",
        );
        throw e;
      }
    }
    return {
      language: this.args.language as any,
    };
  }

  private getInput() {
    const file = this.args.file ? open(this.args.file, "r") : stdin;
    if (!file) {
      console.log(`error: cannot open input file: '${this.args.file}'`);
      exit(1);
    }
    try {
      return file.readAsString();
    } finally {
      file.close();
    }
  }

  private getOutputFile(args: Args) {
    if (args.output && args.fix) {
      console.log(
        "Error: Cannot use both --output and --fix options simultaneously",
      );
      exit(1);
    }
    if (args.fix && !args.file) {
      console.log("Error: The --fix option cannot be used without a filename");
      exit(1);
    }

    const outPath = args.fix ? args.file : args.output;
    if (outPath) {
      const outFile = open(outPath, "w");
      if (!outFile) {
        console.log(`error: cannot open output file: '${outPath}'`);
        exit(1);
      }
      return outFile;
    }
    return stdout;
  }

  private writeOutput(file: FILE, query: string) {
    try {
      file.puts(query);
    } finally {
      file.close();
    }
  }

  private printHelp() {
    console.log(`usage: sql-formatter-cli.cjs [-h] [-o OUTPUT] [--fix]
                             [-l {bigquery,db2,db2i,hive,mariadb,mysql,n1ql,plsql,postgresql,redshift,spark,sqlite,sql,trino,transactsql,tsql,singlestoredb,snowflake}]
                             [-c CONFIG] [--version]
                             [FILE]

SQL Formatter

positional arguments:
  FILE\t\t\tInput SQL file (defaults to stdin)

optional arguments:
  -h, --help\t\tshow this help message and exit
  -o OUTPUT, --output OUTPUT
\t\t\tFile to write SQL output (defaults to stdout)
  --fix\t\t\tUpdate the file in-place
  -l {bigquery,db2,db2i,hive,mariadb,mysql,n1ql,plsql,postgresql,redshift,spark,sqlite,sql,trino,transactsql,tsql,singlestoredb,snowflake}, --language {bigquery,db2,db2i,hive,mariadb,mysql,n1ql,plsql,postgresql,redshift,spark,sqlite,sql,trino,transactsql,tsql,singlestoredb,snowflake}
\t\t\tSQL Formatter dialect (defaults to basic sql)
  -c CONFIG, --config CONFIG
\t\t\tPath to config json file (will use default configs if unspecified)
  --version\t\tshow program's version number and exit`);
  }

  private printErrorHelp() {
    console.log(`usage: sql-formatter-cli.cjs [-h] [-o OUTPUT] [--fix]
        [-l {bigquery,db2,db2i,hive,mariadb,mysql,n1ql,plsql,postgresql,redshift,spark,sqlite,sql,trino,transactsql,tsql,singlestoredb,snowflake}]
        [-c CONFIG] [--version]
        [FILE]`);
  }
}

const cli = new SqlFormatterCli();
cli.run();
