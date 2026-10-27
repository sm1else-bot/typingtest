const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.SITE_URL || "http://127.0.0.1:5173/";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.MOZHI_TEST_BROWSER
      ? { executablePath: process.env.MOZHI_TEST_BROWSER }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors = [],
      api = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/\/api\/|onrender\.com/.test(r.url())) api.push(r.url());
    });
    await page.clock.install();
    await page.goto(base);
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.title(), "Typing Test");
    assert.ok(
      !(await page.locator("body").innerText()).match(
        /TLW\/UI|The Lost Wunderkind|Unlucky Influence/,
      ),
    );
    for (const mode of ["Octopus", "Dolphin", "Owl"])
      for (const duration of [15, 30, 60]) {
        await page.getByRole("tab", { name: new RegExp(mode) }).click();
        await page
          .getByRole("button", { name: duration + "s", exact: true })
          .click();
        await page.getByRole("button", { name: "Start", exact: true }).click();
        await page.clock.fastForward(5000);
        assert.equal(
          await page.getByTestId("time").innerText(),
          "Time: " + duration + "s",
        );
        const input = page.locator("#typing-input");
        const target = await page.getByTestId("passage").textContent();
        const prefix = target.slice(0, 25);
        const wrong = target[25] === "x" ? "z" : "x";
        await input.fill(prefix);
        await page.clock.fastForward(5000);
        assert.ok(
          (await page.getByTestId("net").innerText()).match(
            /Net WPM: (5[89]|60)/,
          ),
        );
        await input.fill(prefix + wrong);
        assert.equal(
          await page.locator("[data-testid=passage] .text-red-400").count(),
          1,
        );
        await input.press("Backspace");
        assert.equal(await input.inputValue(), prefix);
        await input.press(target[25] === " " ? "Space" : target[25]);
        assert.equal(
          await page.locator("[data-testid=passage] .text-red-400").count(),
          0,
        );
        assert.equal(
          await page.getByTestId("accuracy").innerText(),
          "Accuracy: 96%",
        );
        await page.clock.fastForward(duration * 1000);
        await page.getByRole("dialog").waitFor();
        const values = await page
          .getByRole("dialog")
          .locator("strong")
          .allTextContents();
        assert.deepEqual(values, [
          String(Math.round((26 * 12) / duration)),
          String(Math.round((27 * 12) / duration)),
          "96%",
        ]);
        assert.equal(await page.getByTestId("time").innerText(), "Time: 0s");
        const frozen = await page.getByTestId("net").innerText();
        await page.clock.fastForward(10000);
        assert.equal(await page.getByTestId("net").innerText(), frozen);
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        assert.equal(await input.inputValue(), "");
        assert.equal(
          await page.getByTestId("accuracy").innerText(),
          "Accuracy: 0%",
        );
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        console.log(
          "PASS " +
            mode +
            " " +
            duration +
            "s: first-input timing, corrections, deadline, frozen result and restart",
        );
      }
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("typing-test.personal-bests.v1"))
            .length,
      ),
      9,
    );
    await page.reload();
    assert.ok((await page.locator("body").innerText()).includes("net WPM"));
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.locator("#typing-input").fill("typing");
    await page.getByRole("tab", { name: /Dolphin/ }).click();
    assert.equal(await page.locator("#typing-input").inputValue(), "");
    assert.equal(await page.getByTestId("net").innerText(), "Net WPM: 0");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.locator("#typing-input").fill("one word ");
    await page.locator("#typing-input").press("Backspace");
    assert.equal(await page.locator("#typing-input").inputValue(), "one word");
    await page.getByRole("button", { name: "Restart", exact: true }).click();
    assert.equal(await page.locator("#typing-input").inputValue(), "");
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR + "/typing-test-desktop.png",
        fullPage: true,
      });
    }
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        "overflow at " + width,
      );
    }
    if (process.env.SCREENSHOT_DIR)
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR + "/typing-test-mobile.png",
        fullPage: true,
      });
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw Error("blocked");
      };
    });
    const bp = await blocked.newPage();
    await bp.clock.install();
    await bp.goto(base);
    await bp.getByRole("button", { name: "15s", exact: true }).click();
    await bp.getByRole("button", { name: "Start", exact: true }).click();
    await bp.locator("#typing-input").fill("test");
    await bp.clock.fastForward(16000);
    await bp.getByRole("dialog").waitFor();
    assert.ok(
      (await bp.locator("body").innerText()).includes("could not be saved"),
    );
    await blocked.close();
    assert.deepEqual(api, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS persistence, mode reset, cross-word backspace, storage failure, desktop/mobile layouts, branding and zero backend requests",
    );
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
