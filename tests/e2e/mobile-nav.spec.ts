import { test, expect } from "@playwright/test";

// P0.3 — điều hướng mobile: truy cập các trang phụ qua menu "Thêm".
test.use({ viewport: { width: 360, height: 800 } });

test("mobile: menu Thêm vào được Cài đặt, Nguồn và Tiến độ", async ({
  page,
}) => {
  await page.goto("/");

  // Không tràn ngang ở 360px.
  const scrollW = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollW).toBeLessThanOrEqual(361);

  const more = page.getByRole("button", { name: "Thêm" });

  // Vào Cài đặt.
  await more.click();
  await page
    .getByRole("dialog", { name: "Menu điều hướng thêm" })
    .getByRole("link", { name: /Cài đặt/ })
    .click();
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();

  // Vào Nguồn dữ liệu.
  await more.click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Nguồn dữ liệu/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Trạng thái kiểm duyệt" }),
  ).toBeVisible();

  // Vào Tiến độ.
  await more.click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Tiến độ/ })
    .click();
  await expect(page.getByRole("heading", { name: "Tiến độ" })).toBeVisible();
});
