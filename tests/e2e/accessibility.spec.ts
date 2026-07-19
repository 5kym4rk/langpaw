import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Kiểm thử accessibility tự động bằng axe-core (§12.4). Chạy trên các route
 * chính; đánh dấu fail nếu có vi phạm nghiêm trọng (serious/critical) theo
 * WCAG 2.x A/AA. Onboarding bị bỏ qua bằng cách set localStorage trước.
 */

const ROUTES = [
  "/#/",
  "/#/learn",
  "/#/review",
  "/#/listen",
  "/#/quiz",
  "/#/library",
  "/#/interview",
  "/#/progress",
  "/#/sources",
  "/#/settings",
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "langpaw.settings.v1",
      JSON.stringify({ onboardingDone: true, targetLanguage: "en" }),
    );
  });
});

for (const route of ROUTES) {
  test(`axe: không vi phạm nghiêm trọng ở ${route}`, async ({ page }) => {
    await page.goto(route);
    // Chờ nội dung chính render.
    await page.locator("main, #root").first().waitFor({ state: "attached" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length > 0) {
      console.log(
        `Vi phạm ở ${route}:`,
        serious.map((v) => `${v.id} (${v.nodes.length})`).join(", "),
      );
    }
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
