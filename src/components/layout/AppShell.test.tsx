import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell";

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell>
        <div>Nội dung</div>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("AppShell — menu Thêm mobile (P0.3)", () => {
  it("mở menu Thêm và truy cập được các trang phụ", async () => {
    const user = userEvent.setup();
    renderShell();

    const moreBtn = screen.getByRole("button", { name: "Thêm" });
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");
    expect(moreBtn).toHaveAttribute("aria-controls", "mobile-more-menu");

    await user.click(moreBtn);
    expect(moreBtn).toHaveAttribute("aria-expanded", "true");

    // Dialog chứa các route phụ.
    const dialog = screen.getByRole("dialog", { name: "Menu điều hướng thêm" });
    expect(dialog).toBeInTheDocument();
    for (const label of [
      "Luyện nghe",
      "Kiểm tra",
      "Tiến độ",
      "Nguồn dữ liệu",
      "Cài đặt",
    ]) {
      expect(
        within(dialog).getByRole("link", { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }
  });

  it("đóng menu bằng phím Escape", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Thêm" }));
    expect(
      screen.getByRole("dialog", { name: "Menu điều hướng thêm" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Menu điều hướng thêm" }),
    ).not.toBeInTheDocument();
  });
});
