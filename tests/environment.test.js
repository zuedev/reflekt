import { spawn } from "node:child_process";
import { rmSync, existsSync } from "node:fs";

// cleanup from previous test runs
rmSync("./temp/environment-reflekt-clone-test", {
  recursive: true,
  force: true,
});

test("does the environment have git installed?", (done) => {
  spawn("git", ["--version"]).on("exit", (code) => {
    expect(code).toBe(0);
    done();
  });
});

test("can we clone the reflekt repository?", (done) => {
  spawn("git", [
    "clone",
    "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git",
    "./temp/environment-reflekt-clone-test",
  ]).on("exit", (code) => {
    expect(code).toBe(0);
    done();
  });
});

test("does the cloned repository have a README.md file?", () => {
  const fileExists = existsSync(
    "./temp/environment-reflekt-clone-test/README.md",
  );
  expect(fileExists).toBe(true);
});

test("cleanup cloned repository", () => {
  rmSync("./temp/environment-reflekt-clone-test", {
    recursive: true,
    force: true,
  });
  const dirExists = existsSync("./temp/environment-reflekt-clone-test");
  expect(dirExists).toBe(false);
});
