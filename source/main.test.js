import { spawn } from "node:child_process";
import { rmSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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

test("does the apply-patch option work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/${Date.now()}-mainjs-does-the-apply-patch-option-work.git`;

  // A simple patch that adds a new file
  const patchContent = `
diff --git a/NEW_FILE.txt b/NEW_FILE.txt
new file mode 100644
index 0000000..e69de29
`;

  const patchBase64 = Buffer.from(patchContent, "utf-8").toString("base64");

  const cliProcess = spawn("node", [
    "source/main.js",
    "mirror",
    "--apply-patch",
    patchBase64,
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

test("does the append-file option work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = `./temp/${Date.now()}-mainjs-does-the-append-file-option-work.git`;

  const filePath = "APPENDED_FILE.txt";
  const fileContent = "This is some appended content.";

  const cliProcess = spawn("node", [
    "source/main.js",
    "mirror",
    "--append-file",
    `${filePath}=${fileContent}`,
    sourceRepo,
    destRepo,
  ]);

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);

    // Clone the bare repository to access the files
    const cloneDestRepo = `${destRepo}-clone`;
    const cloneResult = spawnSync("git", ["clone", destRepo, cloneDestRepo], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    expect(cloneResult.status).toBe(0);

    // Verify that the file was appended correctly
    const appendedFilePath = `${cloneDestRepo}/${filePath}`;
    const appendedContent = readFileSync(appendedFilePath, "utf-8");
    expect(appendedContent).toBe(fileContent + "\n"); // echo adds a newline

    // Clean up both repositories
    rmSync(destRepo, { recursive: true, force: true });
    rmSync(cloneDestRepo, { recursive: true, force: true });

    done();
  });
}, 10000); // 10 second timeout
