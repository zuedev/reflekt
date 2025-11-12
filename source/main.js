import packageJson from "../package.json" with { type: "json" };
import { Command } from "commander";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command("mirror")
  .description("Create a mirror of a repository")
  .option("--force", "Force overwrite of destination repository if it exists")
  .argument("<source>", "The source repository")
  .argument("<destination>", "The destination repository")
  .action((source, destination, options) => {
    try {
      // Generate a unique operation ID for temporary directory
      const opid = Math.random().toString(36).substring(2, 8);

      const gitCloneProcess = spawnSync(
        "git",
        ["clone", "--mirror", source, `./temp/${opid}`],
        { stdio: "inherit" },
      );

      if (gitCloneProcess.status !== 0) throw new Error("Git clone failed");

      // if the destination is a relative path, resolve it
      if (destination.startsWith("./")) {
        destination = resolve(destination);

        // does the destination need to be initialized?
        if (existsSync(destination) === false) {
          const gitInitProcess = spawnSync(
            "git",
            ["init", "--bare", destination],
            { stdio: "inherit" },
          );

          if (gitInitProcess.status !== 0)
            throw new Error("Git init of destination failed");
        }
      }

      const gitPushProcess = spawnSync(
        "git",
        [
          "push",
          "--mirror",
          destination,
          options.force ? "--force" : "",
        ].filter(Boolean),
        {
          cwd: `./temp/${opid}`,
          stdio: "inherit",
        },
      );

      if (gitPushProcess.status !== 0) throw new Error("Git push failed");

      // Clean up the temporary directory
      rmSync(`./temp/${opid}`, { recursive: true, force: true });
    } catch (error) {
      console.error("An error occurred during the mirroring process:", error);
    }
  });

program.parse();
