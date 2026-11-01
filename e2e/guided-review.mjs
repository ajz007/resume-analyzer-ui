import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const port = 8818;
const url = `http://127.0.0.1:${port}/e2e/guided-review.html`;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: "pipe" },
);
const errors = [];
server.stderr.on("data", (data) => process.stderr.write(data));
let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 100) throw Error("Test server did not start");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  const button = (name) =>
    name === "Use your resume"
      ? page
          .getByRole("navigation", { name: "Review sections" })
          .getByRole("button", { name, exact: true })
      : page.getByRole("button", { name, exact: true });
  const visible = (locator) => locator.waitFor({ state: "visible" });
  const absent = async (locator) =>
    assert.equal(await locator.isVisible(), false);
  async function start(query = "") {
    await page.goto(url + query);
    await visible(
      page.getByRole("heading", { name: "Ready edits", exact: true }),
    );
    if (!query.includes("load-error"))
      await visible(
        page.getByText("1 initial edit available · Your review is saved.", {
          exact: true,
        }),
      );
  }
  async function openQuestion() {
    await button("Requirements & questions").click();
    await button("Clarify this requirement").click();
  }
  async function submitKind(label) {
    await openQuestion();
    await page.getByLabel(label, { exact: true }).check();
    await page.getByRole("checkbox").check();
    await button("Use my answer").click();
    await visible(
      page.getByRole("heading", { name: "What your answers changed" }),
    );
  }
  await start();
  await absent(button("Download reviewed resume"));
  await button("Keep original").click();
  await visible(button("Use proposed edit"));
  await openQuestion();
  await page
    .getByLabel("Your experience", { exact: true })
    .fill("I implemented Terraform for a personal project.");
  await page.getByRole("checkbox").check();
  await page
    .getByLabel("Your experience", { exact: true })
    .fill("I implemented Terraform for my own personal project.");
  assert.equal(
    await page.getByRole("checkbox").isChecked(),
    false,
    "Editing facts requires renewed confirmation",
  );
  // Draft survives reviewing another section before submission.
  await button("Ready edits (1)").click();
  await button("Requirements & questions").click();
  assert.equal(
    await page.getByLabel("Your experience", { exact: true }).inputValue(),
    "I implemented Terraform for my own personal project.",
  );
  await page.getByRole("checkbox").check();
  await button("Use my answer").click();
  await visible(
    page.getByRole("heading", { name: "What your answers changed" }),
  );
  assert.equal(
    await page
      .locator("#review-answer-updates")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await button("Review new edit").click();
  await visible(
    page.getByText("New from your confirmed answer", { exact: false }),
  );
  await button("Ready edits (2)").click();
  await button("Review changes").click();
  await visible(button("Use proposed edit"));
  await page
    .getByRole("navigation", { name: "Review sections" })
    .getByRole("button", { name: "Use your resume", exact: true })
    .click();
  await visible(
    page.getByText("1 proposed passages selected · 1 originals kept."),
  );
  assert.equal(await button("Download reviewed resume").isEnabled(), true);
  await button("Toggle shared view").click();
  await absent(button("Answer updates (1)"));
  await button("Use your resume").click();
  assert.equal(
    await button("Download available to report owner").isDisabled(),
    true,
  );
  await button("Toggle shared view").click();
  await visible(button("Ready edits (2)"));
  await button("Switch analysis").click();
  await visible(button("Ready edits (1)"));
  await absent(button("Answer updates (1)"));
  await visible(button("Keep original"));
  await button("Toggle locked view").click();
  await visible(
    page.getByRole("heading", { name: "Your full review is locked" }),
  );
  await absent(button("Keep original"));
  await absent(button("Use your resume"));

  await start();
  await submitKind("I have no relevant experience to add");
  await visible(page.getByText("No resume edit was added."));
  await button("Review all 1 edits").click();
  await visible(button("Keep original"));
  await start();
  await submitKind("I am not sure");
  await button("Clarify the remaining detail").click();
  await visible(
    page.getByRole("heading", { name: "What did you personally build?" }),
  );
  await start("?save-error");
  await button("Keep original").click();
  await visible(page.getByText("Your earlier saved choices remain in use."));
  await visible(button("Keep original"));
  await start("?load-error");
  await visible(page.getByText("Your saved review is unavailable."));
  await button("Use your resume").click();
  assert.equal(await button("Download reviewed resume").isDisabled(), true);
  assert.equal(await button("Copy selected passages").isDisabled(), true);

  await start("?pending");
  await button("Use your resume").click();
  assert.equal(await button("Download reviewed resume").isDisabled(), true);
  assert.equal(await button("Copy selected passages").isDisabled(), true);

  const screenshots = process.env.REVIEW_SCREENSHOT_DIR;
  if (screenshots) await mkdir(screenshots, { recursive: true });
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await start();
    for (const section of [
      "Ready edits (1)",
      "Requirements & questions",
      "Use your resume",
    ]) {
      await page
        .getByRole("navigation", { name: "Review sections" })
        .getByRole("button", { name: section, exact: true })
        .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${section} overflows at ${width}px`,
      );
      if (screenshots)
        await page.screenshot({
          path: `${screenshots}/${width}-${section.startsWith("Ready") ? "edits" : section.startsWith("Requirements") ? "requirements" : "export"}.png`,
          fullPage: true,
        });
    }
  }
  // Native buttons remain keyboard accessible and expose the active section.
  await button("Ready edits (1)").focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await button("Ready edits (1)").getAttribute("aria-pressed"),
    "true",
  );
  await visible(
    page.getByRole("heading", { name: "Ready edits", exact: true }),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Guided review browser checks passed: edits, confirmations, draft preservation, answer/no-change/clarification, choice recovery, analysis/access isolation, locked views, export guards, 1280/390/320px layouts.",
  );
} finally {
  await browser?.close();
  server.kill();
}
