import { test, expect } from "@playwright/test";

test("login preserves credentials on error and enters the workspace on retry", async ({
  page,
}) => {
  let rejectLogin = true;
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      if (route.request().url().endsWith("/auth/login")) {
        if (rejectLogin) {
          await route.fulfill({
            status: 401,
            json: { detail: "Kullanıcı adı veya şifre hatalı." },
          });
        } else {
          const payload = Buffer.from(
            JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
          ).toString("base64url");
          await route.fulfill({
            json: {
              token: "fixture." + payload + ".signature",
              userId: 1,
              username: "browser-user",
            },
          });
        }
        return;
      }
      await route.fulfill({
        json: {
          items: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          total: 0,
          completed: 0,
          categories: [],
        },
      });
    },
  );
  await page.goto("/");
  await page.getByLabel("Kullanıcı adı", { exact: true }).fill("browser-user");
  await page.getByLabel("Şifre", { exact: true }).fill("synthetic-password");
  await page
    .getByRole("button", { name: "Şifreyi göster", exact: true })
    .click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Şifreyi gizle", exact: true })
    .click();
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("hatalı");
  await expect(page.getByLabel("Kullanıcı adı", { exact: true })).toHaveValue(
    "browser-user",
  );
  rejectLogin = false;
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(page).toHaveURL(/\/todos$/);
  await expect(
    page.getByRole("heading", { name: "Görevlerim", exact: true }),
  ).toBeVisible();
});

test("registration validates password length and confirms successful registration", async ({
  page,
}) => {
  let registrations = 0;
  await page.route(
    (url) => url.pathname === "/api/auth/register",
    async (route) => {
      registrations += 1;
      await route.fulfill({ status: 201, json: { message: "Created" } });
    },
  );
  await page.goto("/register");
  await page.getByLabel("Kullanıcı adı", { exact: true }).fill("browser-user");
  await page
    .getByLabel("E-posta adresi", { exact: true })
    .fill("browser@example.test");
  await page.getByLabel("Şifre", { exact: true }).fill("short");
  await page
    .getByRole("button", { name: "Hesap oluştur", exact: true })
    .click();
  expect(registrations).toBe(0);
  await page.getByLabel("Şifre", { exact: true }).fill("synthetic-password");
  await page
    .getByRole("button", { name: "Hesap oluştur", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("status")).toContainText("Hesabın hazır");
  expect(registrations).toBe(1);
});

test("authentication layouts fit the viewport and links switch between forms", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tekrar hoş geldin." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false);
  const switchBox = await page.locator(".auth-switch").boundingBox();
  const noteBox = await page.locator(".auth-bottom-note").boundingBox();
  expect(noteBox.y).toBeGreaterThanOrEqual(switchBox.y + switchBox.height + 24);
  await page.screenshot({
    path: test.info().outputPath("login.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Bir hesap oluştur", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Yeni bir sayfa." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false);
  await page.screenshot({
    path: test.info().outputPath("register.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Giriş yap", exact: true }).click();
  await expect(page).toHaveURL("/");
});
