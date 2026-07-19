import { test, expect } from "@playwright/test";

// P0.3 — điều hướng mobile: truy cập các trang phụ qua menu "Thêm".
test.use({ viewport: { width: 360, height: 800 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "langpaw.settings.v1",
      JSON.stringify({ onboardingDone: true, targetLanguage: "en" }),
    );
  });
});

test("mobile: menu Thêm vào được Cài đặt, Nguồn và Tiến độ", async ({
  page,
}) => {
  await page.goto("/");

  // Không tràn ngang ở 360px.
  const scrollW = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollW).toBeLessThanOrEqual(361);

  // Mở menu "Thêm" từ trang chủ (ngắn, nút không bị che).
  await page.getByRole("button", { name: "Thêm" }).click();
  const dialog = page.getByRole("dialog", { name: "Menu điều hướng thêm" });

  // Menu chứa đủ các trang phụ.
  for (const label of [
    /Luyện nghe/,
    /Kiểm tra/,
    /Tiến độ/,
    /Nguồn dữ liệu/,
    /Cài đặt/,
  ]) {
    await expect(dialog.getByRole("link", { name: label })).toBeVisible();
  }

  // Điều hướng vào một trang phụ qua menu.
  await dialog.getByRole("link", { name: /Cài đặt/ }).click();
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();
});
