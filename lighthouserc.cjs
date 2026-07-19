/**
 * Cấu hình Lighthouse CI (§12.2). Chạy: npx lhci autorun
 * Build trước rồi phục vụ dist/ qua `npm run preview` (cổng 4173).
 *
 * Mục tiêu (§12.6): Performance(desktop) ≥ 0.90, Accessibility ≥ 0.95,
 * Best Practices ≥ 0.95.
 */
const BASE = "http://localhost:4173";
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

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port 4173",
      startServerReadyPattern: "Local:",
      url: ROUTES.map((r) => `${BASE}${r}`),
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        // Bỏ qua PWA installability khi chạy trên localhost/preview.
        skipAudits: ["is-on-https", "redirects-http"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
