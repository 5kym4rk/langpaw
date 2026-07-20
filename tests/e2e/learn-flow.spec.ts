import { test, expect } from "@playwright/test";

/**
 * E2E luồng thiết lập học 6 bước (spec XII): ngôn ngữ → lộ trình → cấp độ →
 * chủ đề → nhóm từ → số từ → bắt đầu; xác minh mọi thẻ thuộc đúng
 * route/level và learningReady.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "langpaw.settings.v1",
      JSON.stringify({ onboardingDone: true, targetLanguage: "ko" }),
    );
  });
});

test("thiết lập 6 bước và mọi thẻ đúng cấp đã chọn", async ({ page }) => {
  await page.goto("/#/learn");

  // 1–2. Lộ trình mặc định = certificate (NIKL); chọn cấp độ đầu tiên có từ.
  const levelSelect = page.locator("select").first();
  await expect(levelSelect).toBeVisible();
  const firstLevel = await levelSelect
    .locator("option")
    .nth(1)
    .getAttribute("value");
  expect(firstLevel).toBeTruthy();
  await levelSelect.selectOption(firstLevel!);

  // 3. Chủ đề: giữ "Tất cả chủ đề". 4. Nhóm từ: Tất cả phù hợp.
  await page.locator("select").nth(2).selectOption("all");
  // 5. Số từ: 5.
  await page.locator("select").nth(3).selectOption("5");

  // 6. Bắt đầu học.
  await page.getByRole("button", { name: /Bắt đầu học/ }).click();

  // Xác minh 5 thẻ: đúng cấp + learningReady.
  for (let i = 0; i < 5; i += 1) {
    const meta = page.getByTestId("learning-card-meta");
    await expect(meta).toHaveAttribute("data-cert-level", firstLevel!);
    await expect(meta).toHaveAttribute("data-learning-ready", "true");
    await page.getByRole("button", { name: /Đã biết/ }).click();
  }
  await expect(page.getByText("Hoàn thành phiên học 🎉")).toBeVisible();
});

test("route Ngoài lộ trình không chứa thẻ learningReady", async ({ page }) => {
  await page.goto("/#/learn");
  const outBtn = page.getByRole("button", { name: /^Ngoài lộ trình \(/ });
  await expect(outBtn).toBeVisible({ timeout: 15000 });
  await outBtn.click();
  // Nhóm từ ở route này là select thứ 2 (không có cấp độ).
  await page.locator("select").nth(2).selectOption("5");
  await page.getByRole("button", { name: /Bắt đầu học/ }).click();
  const meta = page.getByTestId("learning-card-meta");
  await expect(meta).toHaveAttribute("data-learning-ready", "false");
});
