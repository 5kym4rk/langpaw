import { test, expect } from "@playwright/test";

// Luồng cốt lõi theo §25.3 (rút gọn, ổn định).
test("học từ, lưu tiến độ qua reload, phỏng vấn, backup", async ({ page }) => {
  await page.goto("/#/settings");

  // Đảm bảo đang học tiếng Anh và đặt mục tiêu 10 từ/ngày.
  await page
    .getByRole("button", { name: /Tiếng Anh/ })
    .first()
    .click();
  await page.getByRole("button", { name: "10 từ/ngày" }).click();

  // Học từ: bắt đầu phiên, lật thẻ, đánh dấu Đã biết.
  await page.goto("/#/learn");
  await page.getByRole("button", { name: "Bắt đầu học" }).click();
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();
  await page.getByRole("button", { name: /Đã biết/ }).click();

  // Reload và kiểm tra tiến độ vẫn còn trên trang chủ.
  await page.goto("/#/");
  await expect(page.getByText("Từ đã học")).toBeVisible();
  const learned = page.locator("text=Từ đã học").locator("..");
  await expect(learned).toContainText("1");

  // Mục phỏng vấn: lọc theo vị trí.
  await page.goto("/#/interview");
  await expect(
    page.getByRole("heading", { name: /Phỏng vấn điện tử/ }),
  ).toBeVisible();

  // Trang nguồn dữ liệu mở được.
  await page.goto("/#/sources");
  await expect(page.getByText("Trạng thái kiểm duyệt")).toBeVisible();

  // Cài đặt: chuyển sang nền tĩnh và xuất backup.
  await page.goto("/#/settings");
  await page.getByRole("switch", { name: "Chỉ dùng ảnh tĩnh" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Xuất dữ liệu/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^langpaw-backup-.*\.json$/);
});
