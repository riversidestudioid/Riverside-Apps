import { spawnSync } from "node:child_process";
const commands = ["docker", "podman", "colima", "nerdctl", "orbctl", "orb"];
const found = commands.filter(
  (command) =>
    !spawnSync("/bin/zsh", ["-c", 'command -v "$1"', "--", command], {
      encoding: "utf8",
    }).status,
);
if (found.includes("docker")) {
  const version = spawnSync(
    "docker",
    ["version", "--format", "{{.Server.Version}}"],
    { encoding: "utf8", timeout: 8000 },
  );
  console.log(
    JSON.stringify(
      {
        detected: found,
        dockerApiReady: version.status === 0,
        serverVersion: version.status === 0 ? version.stdout.trim() : null,
        instructions: "docs/STAGE_3_ADMIN.md",
      },
      null,
      2,
    ),
  );
} else
  console.log(
    JSON.stringify(
      {
        detected: found,
        dockerApiReady: false,
        instructions: "docs/STAGE_3_ADMIN.md",
      },
      null,
      2,
    ),
  );
