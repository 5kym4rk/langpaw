import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/stores/settings-store";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it("đổi ngôn ngữ đang học khi nhấn nút", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const chineseButton = screen.getByTitle("Tiếng Trung");
    await user.click(chineseButton);

    expect(useSettingsStore.getState().settings.targetLanguage).toBe("zh");
    expect(chineseButton).toHaveAttribute("aria-pressed", "true");
  });
});
