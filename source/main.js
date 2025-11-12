import packageJson from "../package.json" with { type: "json" };
import { Command } from "commander";
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command("ping")
  .description("Check if the tool is working")
  .action(() => {
    console.log("Pong!");
  });

program
  .command("mirror")
  .description("Create a mirror of a repository")
  .argument("<source>", "The source repository")
  .argument("<destination>", "The destination repository")
  .action((source, destination) => {
    const opid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    console.log(`Mirroring ${source} to ${destination}...`);

    const gitCloneProcess = spawn(
      "git",
      ["clone", "--mirror", source, `./temp/${opid}`],
      { stdio: "inherit" }
    );

    gitCloneProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Mirror cloned successfully.");

        const gitPushProcess = spawn(
          "git",
          ["push", "--mirror", destination],
          { cwd: `./temp/${opid}`, stdio: "inherit" }
        );

        gitPushProcess.on("close", (pushCode) => {
          if (pushCode === 0) {
            console.log("Mirror pushed successfully.");
            rmSync(`./temp/${opid}`, { recursive: true, force: true });
            console.log("Temporary files cleaned up.");
          } else {
            console.error(`Git push process exited with code ${pushCode}`);
          }
        });
      } else {
        console.error(`Git process exited with code ${code}`);
      }
    });
  });

program.parse();
