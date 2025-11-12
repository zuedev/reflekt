import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

test("does the mirror command work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/mainjs-reflekt-test-mirror-${Date.now()}.git`;

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

test("does the --init-destination environment variable work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/mainjs-reflekt-test-env-${Date.now()}.git`;

  const cliProcess = spawn(
    "node",
    ["source/main.js", "mirror", sourceRepo, destRepo],
    {
      env: {
        ...process.env,
        REFLEKT_INIT_DESTINATION: "true",
      },
    },
  );

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);

    // Clean up the created mirror repository
    rmSync(destRepo, { recursive: true, force: true });

    done();
  });
});

test("does command line flag take precedence over environment variable?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/mainjs-reflekt-test-precedence-${Date.now()}.git`;

  // Set env var to false but use command line flag (should init due to flag)
  const cliProcess = spawn(
    "node",
    ["source/main.js", "mirror", "--init-destination", sourceRepo, destRepo],
    {
      env: {
        ...process.env,
        REFLEKT_INIT_DESTINATION: "false",
      },
    },
  );

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);

    // Clean up the created mirror repository
    rmSync(destRepo, { recursive: true, force: true });

    done();
  });
});

test("does environment variable with 'false' value work correctly?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/mainjs-reflekt-test-false-${Date.now()}.git`;

  const cliProcess = spawn(
    "node",
    ["source/main.js", "mirror", sourceRepo, destRepo],
    {
      env: {
        ...process.env,
        REFLEKT_INIT_DESTINATION: "false",
      },
    },
  );

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);

    // Clean up the created mirror repository
    rmSync(destRepo, { recursive: true, force: true });

    done();
  });
});
