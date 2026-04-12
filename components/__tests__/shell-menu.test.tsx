// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ShellMenu } from "../ShellMenu";
import { getThemePalette } from "../../lib/presentation/palette";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ShellMenu", () => {
  test("opens a menu with share, sources/license, and contact actions", async () => {
    const user = userEvent.setup();

    render(<ShellMenu sharePath="/?theme=rice" themePalette={getThemePalette("energy")} />);

    expect(screen.getByRole("button", { name: "メニュー" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "メニュー" }));

    expect(screen.getByRole("menuitem", { name: "共有" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Sources/License" }).getAttribute("href")).toBe("/sources-license");
    expect(screen.getByRole("menuitem", { name: "問い合わせ" }).getAttribute("href")).toBe("/contact");
  });

  test("copies the absolute share URL", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText
      }
    });

    render(<ShellMenu sharePath="/?theme=rice" themePalette={getThemePalette("energy")} />);

    await user.click(screen.getByRole("button", { name: "メニュー" }));
    await user.click(screen.getByRole("menuitem", { name: "共有" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("http://localhost:3000/?theme=rice");
    });
  });
});
