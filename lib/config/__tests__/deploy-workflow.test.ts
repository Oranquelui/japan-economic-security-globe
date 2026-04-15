import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

describe("deploy workflow", () => {
  test("runs a Cloudflare deploy on pushes to main", () => {
    const workflowPath = path.join(process.cwd(), ".github", "workflows", "ci.yml");
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("deploy:");
    expect(workflow).toContain("needs: verify");
    expect(workflow).toContain("github.event_name == 'push'");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("CLOUDFLARE_API_TOKEN");
    expect(workflow).toContain("CLOUDFLARE_ACCOUNT_ID");
    expect(workflow).toContain("npm run deploy");
  });
});
