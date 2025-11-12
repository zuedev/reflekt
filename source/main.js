import packageJson from "../package.json" with { type: "json" };
import { Command } from 'commander';
import { spawn } from "child_process";

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
    console.log(`Mirroring ${source} to ${destination}`);

    const gitProcess = spawn("git", ["clone", "--mirror", source, destination], { stdio: "inherit" });

    gitProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Mirror created successfully.");
      } else {
        console.error(`Git process exited with code ${code}`);
      }
    });
  });

program.parse();
