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
  .option(
    "--apply-patch <patch>",
    "Apply a patch to the mirrored repository before pushing (encoded as base64)",
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
  .action((source, destination, options) => {
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

      // do we need to create the destination repository on GitHub?
      if (options.githubCreateRepo) {
        const githubUrlMatch = destination.match(
          /github\.com[:/](.+?)\/(.+?)(\.git)?$/,
        );

        if (githubUrlMatch) {
          const owner = githubUrlMatch[1];
          const repo = githubUrlMatch[2];

          console.log("owner", owner);
          console.log("repo", repo);

          // First, check if the owner is a user or an organization
          const checkOwnerProcess = spawnSync("curl", [
            "-H",
            "Accept: application/vnd.github+json",
            "-H",
            `Authorization: Bearer ${options.githubToken}`,
            `https://api.github.com/users/${owner}`,
          ]);

          if (checkOwnerProcess.status !== 0) {
            throw new Error(
              `Failed to check if ${owner} is a valid GitHub user/organization`,
            );
          }

          const ownerData = JSON.parse(checkOwnerProcess.stdout.toString());
          const isOrganization = ownerData.type === "Organization";

          // Use the appropriate endpoint based on whether it's a user or organization
          const apiEndpoint = isOrganization
            ? `https://api.github.com/orgs/${owner}/repos`
            : `https://api.github.com/user/repos`;

          const requestBody = isOrganization
            ? { name: repo, private: true }
            : { name: repo, private: true, owner: owner };

          const createRepoProcess = spawnSync("curl", [
            "-X",
            "POST",
            "-H",
            "Accept: application/vnd.github+json",
            "-H",
            `Authorization: Bearer ${options.githubToken}`,
            "-d",
            JSON.stringify(requestBody),
            apiEndpoint,
          ]);

          const responseBody = createRepoProcess.stdout.toString();
          console.log("createRepoProcess", responseBody);

          // Check if the response indicates an error
          if (createRepoProcess.status !== 0) {
            let errorMessage = "GitHub repository creation failed";
            try {
              const errorResponse = JSON.parse(responseBody);
              if (errorResponse.message) {
                errorMessage += `: ${errorResponse.message}`;
              }
            } catch (e) {
              // If response isn't JSON, use the raw response
              errorMessage += `: ${responseBody}`;
            }
            throw new Error(errorMessage);
          }

          // Also check if the response body contains an error (curl succeeded but API returned error)
          try {
            const response = JSON.parse(responseBody);
            if (response.message && response.status) {
              throw new Error(`GitHub API error: ${response.message}`);
            }
          } catch (e) {
            // If it's not JSON or doesn't have error fields, assume success
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
