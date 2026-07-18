import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";

import packageJson from "../../package.json";
import RootLayout from "../layout";

const ORIGINAL_RELEASE_SHA = process.env.NEXT_PUBLIC_RELEASE_SHA;

afterEach(() => {
  if (ORIGINAL_RELEASE_SHA === undefined) {
    delete process.env.NEXT_PUBLIC_RELEASE_SHA;
    return;
  }

  process.env.NEXT_PUBLIC_RELEASE_SHA = ORIGINAL_RELEASE_SHA;
});

describe("release markers", () => {
  test("renders the deployed commit and package version in observable metadata", () => {
    process.env.NEXT_PUBLIC_RELEASE_SHA = "release-marker-test-sha";

    const markup = renderToStaticMarkup(
      <RootLayout>
        <main />
      </RootLayout>
    );

    expect(markup).toContain('<meta name="release-sha" content="release-marker-test-sha"/>');
    expect(markup).toContain(`<meta name="release-version" content="${packageJson.version}"/>`);
  });
});
