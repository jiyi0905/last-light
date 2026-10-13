import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "开始执政", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "一百年之后，恒星将不再升起。",
  );
  await page.getByRole("button", { name: "接任执政官" }).click();
}

async function decide(page: Page, title: string, last = false) {
  await expect(
    page.getByRole("button", { name: "确认决议", exact: true }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: new RegExp(title) }).check();
  await page.getByRole("button", { name: "确认决议", exact: true }).click();
  await expect(page.getByText("决策已归档", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: last ? "见证文明的结局" : "继续时间线" })
    .click();
}

async function noHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("complete ark route, save/reload, restart cancellation and confirmation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await noHorizontalOverflow(page);
  await page.getByRole("radio", { name: /分阶段公布，建立应对秩序/ }).check();
  await page.getByRole("button", { name: "确认决议", exact: true }).click();
  await expect(page.getByTestId("metric-resources")).toHaveText("55/100");
  await expect(page.getByTestId("metric-stability")).toHaveText("70/100");
  await expect(page.getByRole("status")).toHaveText("进度已保存至本机");

  await page.reload();
  await page.getByRole("button", { name: "继续执政" }).click();
  await expect(page.getByText("决策已归档", { exact: true })).toBeVisible();
  await expect(page.getByTestId("metric-stability")).toHaveText("70/100");
  await page.getByRole("button", { name: "继续时间线" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "稀缺的未来",
  );
  await decide(page, "优先投入方舟工程");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "第一道裂痕",
  );
  await decide(page, "签订自治契约，交换资源", true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("方舟计划");
  await expect(page.getByTestId("metric-resources")).toHaveText("50/100");
  await expect(page.getByTestId("metric-technology")).toHaveText("75/100");
  await expect(page.getByRole("heading", { name: /稀薄的回声/ })).toBeVisible();
  await noHorizontalOverflow(page);

  await page.reload();
  await page.getByRole("button", { name: "查看文明档案" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("方舟计划");
  await page
    .getByRole("button", { name: "重新开始", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("方舟计划");
  await page
    .getByRole("button", { name: "重新开始", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "确认重新开始" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "一百年之后，恒星将不再升起。",
  );
  await expect(page.getByTestId("metric-resources")).toHaveText("60/100");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "继续执政" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "一百年之后，恒星将不再升起。",
  );
  expect(errors).toEqual([]);
});

test("complete book route and preserve a rich civilization archive", async ({
  page,
}) => {
  await start(page);
  await decide(page, "向所有人公开完整真相");
  await decide(page, "优先建立文明档案");
  await decide(page, "召开公民议会，重建共识", true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("文明之书");
  await expect(page.getByRole("heading", { name: /丰厚的记忆/ })).toBeVisible();
  await expect(page.getByTestId("metric-legacy")).toHaveText("90/100");
  await expect(
    page.getByText("资源 40 / 需 50 未达成", { exact: true }),
  ).toBeVisible();
  await noHorizontalOverflow(page);
});

test("corrupted save is reported and a new game recovers", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("last-light:v0.1", "corrupt"));
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("存档无法读取，可重新开始");
  await page.getByRole("button", { name: "开始执政", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("进度已保存至本机");
});

test("storage denial keeps the full game playable with a visible warning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await start(page);
  await expect(page.getByRole("status")).toHaveText(
    "本地保存不可用，请勿刷新页面",
  );
  await decide(page, "向所有人公开完整真相");
  await decide(page, "优先建立文明档案");
  await decide(page, "召开公民议会，重建共识", true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("文明之书");
});

test("radio choices support keyboard selection and confirmation", async ({
  page,
}) => {
  await start(page);
  const radio = page.getByRole("radio", { name: /向所有人公开完整真相/ });
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("radio", { name: /分阶段公布，建立应对秩序/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "确认决议", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "分阶段公布，建立应对秩序",
      exact: true,
    }),
  ).toBeVisible();
});

test("320px screens fit the homepage, every narrative stage and the restart dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "开始执政", exact: true }).click();
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "接任执政官" }).click();
  for (const [index, title] of [
    "向所有人公开完整真相",
    "优先建立文明档案",
    "召开公民议会，重建共识",
  ].entries()) {
    await noHorizontalOverflow(page);
    await page.getByRole("radio", { name: new RegExp(title) }).check();
    await page.getByRole("button", { name: "确认决议", exact: true }).click();
    await noHorizontalOverflow(page);
    await page
      .getByRole("button", {
        name: index === 2 ? "见证文明的结局" : "继续时间线",
      })
      .click();
  }
  await noHorizontalOverflow(page);
  await page
    .getByRole("button", { name: "重新开始", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
});
