import packageJson from "../package.json" with { type: "json" };
import { Command } from "commander";
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command("mirror")
  .description("Create a mirror of a repository")
  .option(
    "--init-destination",
    "Initialize the destination repository if it does not exist"
  )
  .argument("<source>", "The source repository")
  .argument("<destination>", "The destination repository")
  .action((source, destination, options) => {
    const opid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    console.log(`Mirroring ${source} to ${destination}...`);

    const gitCloneProcess = spawn(
      "git",
      ["clone", "--mirror", source, `./temp/${opid}`],
      { stdio: "inherit" }
    );

    gitCloneProcess.on("close", async (code) => {
      if (code === 0) {
        console.log("Mirror cloned successfully.");

        // handle --init-destination option
        if (options.initDestination) {
          const gitInitProcess = spawnSync(
            "git",
            ["init", "--bare", destination],
            { stdio: "inherit" }
          );

          if (gitInitProcess.status === 0) {
            console.log("Destination repository initialized successfully.");
          } else {
            console.error(
              `Git init process exited with code ${gitInitProcess.status}`
            );
            return;
          }
        }

        // if the destination is a relative path
        if (destination.startsWith("./")) {
          // Resolve the destination path to an absolute path for git push
          destination = resolve(destination);
        }

        const gitPushProcess = spawn("git", ["push", "--mirror", destination], {
          cwd: `./temp/${opid}`,
          stdio: "inherit",
        });

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
