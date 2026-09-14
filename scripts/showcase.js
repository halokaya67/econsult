// Opens the flow record's dashboard in the default browser. No dependencies, so a clean clone can
// run it straight after `npm install`.
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

// `module.filename` rather than `__dirname`: the repo's ESLint config declares no Node globals.
const DASHBOARD = path.join(
  path.dirname(module.filename),
  "..",
  "specs",
  "001-econsult-flow",
  "artifacts",
  "index.html",
);

function openerFor(platform, target) {
  if (platform === "darwin") return { command: "open", args: [target] };
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", "", target] };
  return { command: "xdg-open", args: [target] };
}

function printFallback(reason) {
  console.log(`Could not open a browser automatically (${reason}).`);
  console.log(`Open this file instead: ${DASHBOARD}`);
}

function main() {
  if (!existsSync(DASHBOARD)) {
    console.error(`The dashboard is missing: ${DASHBOARD}`);
    process.exit(1);
  }

  console.log(`Opening the flow showcase: ${DASHBOARD}`);

  const { command, args } = openerFor(process.platform, DASHBOARD);
  const opener = spawn(command, args, { stdio: "ignore" });

  opener.on("error", (error) => printFallback(error.message));
  opener.on("exit", (code) => {
    if (code !== 0) printFallback(`${command} exited with ${code}`);
  });
}

main();
