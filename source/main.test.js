import { spawn } from "node:child_process";

test("does ping command output pong?", (done) => {
  const cliProcess = spawn("node", ["source/main.js", "ping"]);

  let output = "";
  cliProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);
    expect(output.trim()).toBe("Pong!");
    done();
  });
});

test("does the mirror command work?", (done) => {
  const sourceRepo = "https://forgejo.sovereign.zue.dev/zuedev/reflekt.git";
  const destRepo = "git@github.com:zuedev/reflekt-test-mirror.git";

  const cliProcess = spawn("node", [
    "source/main.js",
    "mirror",
    sourceRepo,
    destRepo,
  ]);

  cliProcess.on("close", (code) => {
    expect(code).toBe(0);
    done();
  });
});
