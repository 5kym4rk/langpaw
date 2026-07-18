import { test, expect } from "@playwright/test";

test("mở app và điều hướng cơ bản", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();

  // Điều hướng sang trang Cài đặt qua route hash.
  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();

  // Đổi mục tiêu hằng ngày và kiểm tra trạng thái nhấn.
  const goalButton = page.getByRole("button", { name: "20 từ/ngày" });
  await goalButton.click();
  await expect(goalButton).toHaveAttribute("aria-pressed", "true");
});
