import packageJson from "../package.json" with { type: "json" };
import { Command } from "commander";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command("mirror")
  .description("Create a mirror of a repository")
  .option("--force", "Force overwrite of destination repository if it exists")
  .option(
    "--apply-patch <patch>",
    "Apply a patch to the mirrored repository before pushing (encoded as base64)",
  )
  .option(
    "--append-file <file=content>",
    "Append a file with specified content to the mirrored repository before pushing (can be used multiple times)",
    (value, previous) => {
      if (previous === undefined) {
        return [value];
      } else {
        return previous.concat([value]);
      }
    },
  )
  .option(
    "--github-create-repo",
    "Create the destination repository on GitHub if it does not exist (use --github-token for authentication)",
  )
  .option(
    "--github-token <token>",
    "GitHub token for authentication when creating a repository",
  )
  .argument("<source>", "The source repository")
  .argument("<destination>", "The destination repository")
  .action(async (source, destination, options) => {
    try {
      // Generate a unique operation ID for temporary directory
      const opid = Math.random().toString(36).substring(2, 8);

      const gitCloneProcess = spawnSync(
        "git",
        ["clone", source, `./temp/${opid}`],
        { stdio: ["pipe", "pipe", "pipe"] },
      );

      if (gitCloneProcess.status !== 0) throw new Error("Git clone failed");

      // Fetch all remote branches and track them locally
      const gitFetchAllProcess = spawnSync("git", ["fetch", "--all"], {
        cwd: `./temp/${opid}`,
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (gitFetchAllProcess.status !== 0)
        throw new Error("Git fetch all failed");

      // Create local tracking branches for all remote branches
      const gitListRemoteBranchesProcess = spawnSync("git", ["branch", "-r"], {
        cwd: `./temp/${opid}`,
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (gitListRemoteBranchesProcess.status === 0) {
        const remoteBranches = gitListRemoteBranchesProcess.stdout
          .toString()
          .split("\n")
          .map((branch) => branch.trim())
          .filter((branch) => branch && !branch.includes("HEAD ->"))
          .map((branch) => branch.replace("origin/", ""));

        // Create local branches for each remote branch (except the current one)
        for (const branch of remoteBranches) {
          if (branch !== "main" && branch !== "master") {
            spawnSync("git", ["checkout", "-b", branch, `origin/${branch}`], {
              cwd: `./temp/${opid}`,
              stdio: ["pipe", "pipe", "pipe"],
            });
          }
        }
      }

      // if the destination is a relative path, resolve it
      if (destination.startsWith("./")) {
        destination = resolve(destination);

        // does the destination need to be initialized?
        if (existsSync(destination) === false) {
          const gitInitProcess = spawnSync(
            "git",
            ["init", "--bare", destination],
            {
              stdio: ["pipe", "pipe", "pipe"],
            },
          );

          if (gitInitProcess.status !== 0)
            throw new Error("Git init of destination failed");
        }
      }

      // do we need to apply a patch?
      if (options.applyPatch) {
        const patch = Buffer.from(options.applyPatch, "base64").toString(
          "utf-8",
        );

        const gitApplyProcess = spawnSync("git", ["apply", "-"], {
          input: patch,
          cwd: `./temp/${opid}`,
          stdio: ["pipe", "pipe", "pipe"],
        });

        if (gitApplyProcess.status !== 0)
          throw new Error("Git apply patch failed");
      }

      // do we need to append any files?
      if (options.appendFile) {
        for (const fileEntry of options.appendFile) {
          const separatorIndex = fileEntry.indexOf("=");
          if (separatorIndex === -1) {
            throw new Error(
              `Invalid format for --append-file option: ${fileEntry}. Expected format is <file=content>`,
            );
          }
          const filePath = fileEntry.substring(0, separatorIndex);
          const fileContent = fileEntry.substring(separatorIndex + 1);

          const fullFilePath = resolve(`./temp/${opid}`, filePath);
          const dirPath = dirname(fullFilePath);

          // Ensure the directory exists
          mkdirSync(dirPath, { recursive: true });

          // Write the content to the file
          writeFileSync(fullFilePath, fileContent + "\n", { flag: "a" });
        }

        // Commit the changes
        const gitAddProcess = spawnSync("git", ["add", "."], {
          cwd: `./temp/${opid}`,
          stdio: ["pipe", "pipe", "pipe"],
        });

        if (gitAddProcess.status !== 0)
          throw new Error("Git add for appended files failed");

        const gitCommitProcess = spawnSync(
          "git",
          ["commit", "-m", `reflekt --append-file`],
          {
            cwd: `./temp/${opid}`,
            stdio: ["pipe", "pipe", "pipe"],
          },
        );

        if (gitCommitProcess.status !== 0)
          throw new Error("Git commit for appended files failed");
      }

      // do we need to create the destination repository on GitHub?
      if (options.githubCreateRepo) {
        const githubUrlMatch = destination.match(
          /github\.com[:/](.+?)\/(.+?)(\.git)?$/,
        );

        if (githubUrlMatch) {
          const owner = githubUrlMatch[1];
          const repo = githubUrlMatch[2];

          // does the repository already exist on GitHub?
          let repositoryExists = false;
          try {
            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  Authorization: `Bearer ${options.githubToken}`,
                },
              },
            );

            if (response.ok) {
              repositoryExists = true;
              console.log(
                `Repository ${owner}/${repo} already exists on GitHub.`,
              );
            } else if (response.status !== 404) {
              throw new Error(
                `Failed to check repository existence: ${response.statusText}`,
              );
            }
            // If 404, repository doesn't exist, we'll create it
          } catch (error) {
            if (error.code === "ENOTFOUND" || error.message.includes("fetch")) {
              throw new Error("Failed to connect to GitHub API");
            }
            throw error;
          }

          // Only create the repository if it doesn't already exist
          if (!repositoryExists) {
            // check if the owner is a user or an organization
            const ownerResponse = await fetch(
              `https://api.github.com/users/${owner}`,
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  Authorization: `Bearer ${options.githubToken}`,
                },
              },
            );

            if (!ownerResponse.ok) {
              throw new Error(
                `Failed to check if ${owner} is a valid GitHub user/organization: ${ownerResponse.statusText}`,
              );
            }

            const ownerData = await ownerResponse.json();
            const isOrganization = ownerData.type === "Organization";

            // Use the appropriate endpoint based on whether it's a user or organization
            const apiEndpoint = isOrganization
              ? `https://api.github.com/orgs/${owner}/repos`
              : `https://api.github.com/user/repos`;

            const requestBody = isOrganization
              ? { name: repo, private: true }
              : { name: repo, private: true, owner: owner };

            const createRepoResponse = await fetch(apiEndpoint, {
              method: "POST",
              headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${options.githubToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            if (!createRepoResponse.ok) {
              let errorMessage = "GitHub repository creation failed";
              try {
                const errorResponse = await createRepoResponse.json();
                if (errorResponse.message) {
                  errorMessage += `: ${errorResponse.message}`;
                }
              } catch (e) {
                errorMessage += `: ${createRepoResponse.statusText}`;
              }
              throw new Error(errorMessage);
            }
          }
        } else {
          throw new Error(
            "Destination URL is not a valid GitHub repository URL",
          );
        }
      }

      const gitPushProcess = spawnSync(
        "git",
        ["push", destination, "--all", ...(options.force ? ["--force"] : [])],
        {
          cwd: `./temp/${opid}`,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      if (gitPushProcess.status !== 0) throw new Error("Git push failed");

      // Also push all tags
      const gitPushTagsProcess = spawnSync(
        "git",
        ["push", destination, "--tags", ...(options.force ? ["--force"] : [])],
        {
          cwd: `./temp/${opid}`,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      if (gitPushTagsProcess.status !== 0)
        throw new Error("Git push tags failed");

      // Clean up the temporary directory
      rmSync(`./temp/${opid}`, { recursive: true, force: true });
    } catch (error) {
      console.error("An error occurred during the mirroring process:", error);
      process.exit(1);
    }
  });

program.parse();
