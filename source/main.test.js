import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

test("does the mirror command work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/${Date.now()}-mainjs-does-the-mirror-command-work.git`;

  const cliProcess = spawn("node", [
    "source/main.js",
    "mirror",
    sourceRepo,
    destRepo,
  ]);

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);

    // Clean up the created mirror repository
    rmSync(destRepo, { recursive: true, force: true });

    done();
  });
});
