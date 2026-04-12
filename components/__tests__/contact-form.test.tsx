// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { ContactForm } from "../ContactForm";

afterEach(() => {
  cleanup();
});

describe("ContactForm", () => {
  test("renders the required input fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("カテゴリ")).toBeTruthy();
    expect(screen.getByLabelText("返信先メールアドレス")).toBeTruthy();
    expect(screen.getByLabelText("件名")).toBeTruthy();
    expect(screen.getByLabelText("本文")).toBeTruthy();
  });

  test("shows validation errors when submitted empty", async () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole("button", { name: "送信する" }));

    expect(await screen.findByText("返信先メールアドレスは必須です。")).toBeTruthy();
    expect(screen.getByText("件名は必須です。")).toBeTruthy();
    expect(screen.getByText("本文は必須です。")).toBeTruthy();
  });
});
