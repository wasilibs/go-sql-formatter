import readline from "node:readline";

async function run() {
  const lines = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  const imports = [];
  const others = [];

  for await (const line of lines) {
    if (
      line.startsWith("import ") &&
      (line.endsWith(' "std";') || line.endsWith(' "os";'))
    ) {
      imports.push(line);
    } else {
      others.push(line);
    }
  }

  for (const line of imports) {
    console.log(line);
  }
  for (const line of others) {
    console.log(line);
  }
}

await run();
