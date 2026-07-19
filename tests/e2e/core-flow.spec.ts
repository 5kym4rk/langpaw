import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "langpaw.settings.v1",
      JSON.stringify({ onboardingDone: true, targetLanguage: "en" }),
    );
  });
});

// Luồng cốt lõi: học từ → hoàn thành phiên → tiến độ → phỏng vấn → nguồn → backup.
test("học từ, hoàn thành phiên, phỏng vấn, backup", async ({ page }) => {
  await page.goto("/#/settings");

  // Đảm bảo đang học tiếng Anh và đặt mục tiêu 10 từ/ngày.
  await page
    .getByRole("button", { name: /Tiếng Anh/ })
    .first()
    .click();
  await page.getByRole("button", { name: "10 từ/ngày" }).click();

  // Học từ: phiên 5 từ, đánh giá hết → màn hoàn thành.
  await page.goto("/#/learn");
  await page.getByRole("combobox").nth(3).selectOption("5"); // Số từ/phiên = 5
  await page.getByRole("button", { name: "Bắt đầu học" }).click();
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole("button", { name: /Đã biết/ }).click();
  }
  await expect(
    page.getByRole("heading", { name: /Hoàn thành phiên học/ }),
  ).toBeVisible();

  // Trang chủ: tiến độ đã được ghi.
  await page.goto("/#/");
  await expect(page.getByText("Từ đã học")).toBeVisible();

  // Mục phỏng vấn.
  await page.goto("/#/interview");
  await expect(
    page.getByRole("heading", { name: /Phỏng vấn điện tử/ }),
  ).toBeVisible();

  // Trang nguồn dữ liệu.
  await page.goto("/#/sources");
  await expect(
    page.getByRole("heading", { name: "Trạng thái kiểm duyệt" }),
  ).toBeVisible();

  // Cài đặt: xuất backup.
  await page.goto("/#/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Xuất dữ liệu/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^langpaw-backup-.*\.json$/);
});
