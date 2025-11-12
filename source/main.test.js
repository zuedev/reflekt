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

test("does the force option work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/${Date.now()}-mainjs-does-the-force-option-work.git`;

  // First, create the mirror without force
  const initialCliProcess = spawn("node", [
    "source/main.js",
    "mirror",
    sourceRepo,
    destRepo,
  ]);

  initialCliProcess.on("close", (initialCode) => {
    expect(initialCode).toBe(0);

    // Now, try to create the mirror again with the force option
    const forceCliProcess = spawn("node", [
      "source/main.js",
      "mirror",
      "--force",
      sourceRepo,
      destRepo,
    ]);

    forceCliProcess.on("close", (forceCode) => {
      expect(forceCode).toBe(0);

      // Clean up the created mirror repository
      rmSync(destRepo, { recursive: true, force: true });

      done();
    });
  });
});
