import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

// Real browser UI with isolated API fixtures; PostgreSQL has separate integration tests.
async function openTodos(page) {
  page.on("pageerror", (error) =>
    console.error("Browser error:", error.message),
  );
  const state = {
    items: Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      title:
        index === 0
          ? "İş planı"
          : index === 1
            ? "Haftanın önceliklerini belirle"
            : index === 2
              ? "Yeni kitabım için okuma saati"
              : "Task " + (index + 1),
      description:
        index === 0
          ? "Sunum notlarını gözden geçir ve ekip için kısa bir özet hazırla."
          : index === 1
            ? "Bu hafta gerçekten önemli olan üç şeyi seç."
            : "Küçük adımlarla ilerlemeye devam et.",
      completed: index === 4 || index === 7,
      priority: index === 0 ? "HIGH" : "MEDIUM",
      category: index === 0 ? "İş" : "Genel",
      dueDate: index === 0 ? "2026-11-06" : null,
    })),
    writes: [],
    queries: [],
    failUpdate: false,
    failExport: false,
  };
  await page.addInitScript(() => {
    const encode = (value) =>
      btoa(JSON.stringify(value))
        .replaceAll("=", "")
        .replaceAll("+", "-")
        .replaceAll("/", "_");
    const token =
      encode({ alg: "HS256" }) +
      "." +
      encode({
        sub: "browser-test",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }) +
      ".fixture";
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, username: "browser-test" }),
    );
  });
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname === "/api/todos") {
        await route.fulfill(state.failExport ? { status: 503, json: {} } : { json: state.items });
        return;
      }
      if (request.method() === "GET" && url.pathname === "/api/todos/page") {
        state.queries.push(Object.fromEntries(url.searchParams));
        const params = url.searchParams;
        let items = state.items.filter(
          (todo) =>
            (params.get("status") === "all" ||
              todo.completed === (params.get("status") === "completed")) &&
            (!params.get("search") ||
              (todo.title + " " + todo.description)
                .toLocaleLowerCase("tr")
                .includes(params.get("search").toLocaleLowerCase("tr"))) &&
            (!params.get("category") ||
              todo.category === params.get("category")) &&
            (!params.get("priority") ||
              todo.priority === params.get("priority")),
        );
        const totalElements = items.length;
        const size = Number(params.get("size"));
        const totalPages = Math.ceil(items.length / size);
        const number = Math.min(
          Number(params.get("page")),
          Math.max(0, totalPages - 1),
        );
        items = items.slice(number * size, (number + 1) * size);
        await route.fulfill({
          json: {
            items,
            page: number,
            size,
            totalElements,
            totalPages,
            total: state.items.length,
            completed: state.items.filter((todo) => todo.completed).length,
            categories: [...new Set(state.items.map((todo) => todo.category))],
          },
        });
        return;
      }
      state.writes.push({ method: request.method(), path: url.pathname });
      if (request.method() === "POST") {
        const item = { ...request.postDataJSON(), id: 99, completed: false };
        state.items.unshift(item);
        await route.fulfill({ json: item });
        return;
      }
      const id = Number(url.pathname.split("/")[3]);
      const todo = state.items.find((item) => item.id === id);
      if (request.method() === "DELETE") {
        state.items = state.items.filter((item) => item.id !== id);
        await route.fulfill({ status: 204 });
        return;
      }
      if (request.method() === "PUT") {
        if (state.failUpdate) {
          await route.fulfill({ status: 500, json: {} });
          return;
        }
        Object.assign(
          todo,
          url.pathname.endsWith("/toggle")
            ? { completed: !todo.completed }
            : request.postDataJSON(),
        );
        await route.fulfill({ json: todo });
        return;
      }
      await route.fulfill({ status: 404 });
    },
  );
  await page.goto("/todos");
  await expect(
    page.getByRole("button", { name: "Düzenle", exact: true }).first(),
  ).toBeEnabled();
  return state;
}
const card = (page) => page.locator(".todo-actions").first().locator("..");

test("simple workspace keeps secondary panels closed until requested", async ({ page }) => {
  await openTodos(page);
  await expect(page.locator(".simple-garden")).not.toHaveAttribute("open", "");
  await expect(page.locator(".advanced-filters")).not.toHaveAttribute("open", "");
  await expect(page.locator(".task-extra-fields")).not.toHaveAttribute("open", "");
  await expect(page.locator("#create-title")).toBeVisible();
  await expect(page.locator("#todo-search")).toBeVisible();
  await page.getByRole("button", { name: "Benim ormanım", exact: true }).click();
  await expect(page.locator(".simple-garden")).toHaveAttribute("open", "");
  await expect(page.locator("#my-forest")).toBeFocused();
});

test("completing a task plants one tree and the forest survives refresh", async ({ page }) => {
  const state = await openTodos(page);
  await page.locator(".simple-garden > summary").click();
  await expect(page.locator(".forest-count")).toHaveText("2 ağaç");
  await expect(page.locator(".forest-planted-tree")).toHaveCount(2);
  await page.locator("#forest-task").selectOption("1");
  await page.getByRole("button", { name: "Görevi tamamla ve ağaç dik", exact: true }).click();
  await expect(page.locator(".forest-count")).toHaveText("3 ağaç");
  await expect(page.locator(".forest-planted-tree")).toHaveCount(3);
  expect(state.items.find((todo) => todo.id === 1).completed).toBe(true);
  expect(state.writes.filter((request) => request.path === "/api/todos/1/toggle")).toHaveLength(1);
  await page.reload();
  await expect(page.locator(".forest-count")).toHaveText("3 ağaç");
  await page.getByRole("article", { name: "İş planı", exact: true }).getByRole("button", { name: "Görevi bekleyenlere al", exact: true }).click();
  await expect(page.locator(".forest-count")).toHaveText("2 ağaç");
});

test("failed task completion never plants a phantom tree", async ({ page }) => {
  const state = await openTodos(page);
  await page.locator(".simple-garden > summary").click();
  state.failUpdate = true;
  await page.getByRole("button", { name: "Görevi tamamla ve ağaç dik", exact: true }).click();
  await expect(page.locator(".notice-error")).toBeVisible();
  await expect(page.locator(".forest-count")).toHaveText("2 ağaç");
  await expect(page.locator(".forest-planted-tree")).toHaveCount(2);
  state.failUpdate = false;
  await page.getByRole("button", { name: "Görevi tamamla ve ağaç dik", exact: true }).click();
  await expect(page.locator(".forest-count")).toHaveText("3 ağaç");
});

test("forest totals ignore list filters and appearance preference survives refresh", async ({ page }) => {
  await openTodos(page);
  await page.locator(".advanced-filters > summary").click();
  await page.locator("#category-filter").selectOption("İş");
  await expect(page.locator(".todo-actions")).toHaveCount(1);
  await expect(page.locator(".forest-count")).toHaveText("2 ağaç");
  await page.locator(".simple-garden > summary").click();
  await page.getByRole("combobox", { name: "Orman görünümü" }).selectOption("blossom");
  await page.reload();
  await page.getByRole("button", { name: "Benim ormanım" }).click();
  await expect(page.getByRole("combobox", { name: "Orman görünümü" })).toHaveValue("blossom");
  await expect(page.locator("#my-forest")).toBeFocused();
});

test("forest starts empty and adds groves for more than twelve trees", async ({ page }) => {
  const state = await openTodos(page);
  state.items.forEach((todo) => { todo.completed = false; });
  await page.reload();
  await page.locator(".simple-garden > summary").click();
  await expect(page.locator(".forest-count")).toHaveText("0 ağaç");
  await expect(page.locator(".forest-seedling")).toBeVisible();
  state.items = Array.from({ length: 25 }, (_, index) => ({ ...state.items[0], id: index + 1, title: `Tree task ${index + 1}`, completed: true }));
  await page.reload();
  await page.locator(".simple-garden > summary").click();
  await expect(page.locator(".forest-count")).toHaveText("25 ağaç");
  await expect(page.locator(".forest-planted-tree")).toHaveCount(12);
  await page.getByRole("button", { name: "Sonraki orman alanı", exact: true }).click();
  await page.getByRole("button", { name: "Sonraki orman alanı", exact: true }).click();
  await expect(page.locator(".forest-planted-tree")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Orman alanları" })).toContainText("Alan 3 / 3");
});

test("task draft survives refresh and clears only after a successful save", async ({ page }) => {
  await openTodos(page);
  await page.locator("#create-title").fill("Yenilemede kaybolmasın");
  await page.locator(".task-extra-fields > summary").click();
  await page.locator("#create-description").fill("Önemli bir not");
  await page.reload();
  await expect(page.locator("#create-title")).toHaveValue("Yenilemede kaybolmasın");
  await expect(page.locator("#create-description")).toHaveValue("Önemli bir not");
  await expect(page.getByText("Taslağın bu sekmede korunuyor.", { exact: true })).toBeVisible();
  await page.locator("#create-title").press("Control+Enter");
  await expect(page.locator("#create-title")).toHaveValue("");
  expect(await page.evaluate(() => sessionStorage.getItem("odak:draft:1"))).toBeNull();
});

test("letter shortcuts respect text entry and compact preference survives refresh", async ({ page }) => {
  await openTodos(page);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("n");
  await expect(page.locator("#create-title")).toBeFocused();
  await page.keyboard.type("n / yeni görev");
  await expect(page.locator("#create-title")).toHaveValue("n / yeni görev");
  await page.locator("#create-title").evaluate((input) => input.blur());
  await page.keyboard.press("/");
  await expect(page.locator("#todo-search")).toBeFocused();
  await page.getByRole("button", { name: "Kompakt görünüm", exact: true }).click();
  await expect(page.locator(".todo-page")).toHaveClass(/is-compact/);
  await expect(card(page).locator(".task-description")).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Kompakt görünüm", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("focus timer pauses, resumes and completes using elapsed wall time", async ({ page }) => {
  await page.clock.install();
  await openTodos(page);
  await page.locator(".simple-garden > summary").click();
  await page.getByRole("button", { name: "Başlat", exact: true }).click();
  await page.clock.fastForward(60000);
  await expect(page.getByRole("timer")).toHaveText("24:00");
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  await page.clock.fastForward(60000);
  await expect(page.getByRole("timer")).toHaveText("24:00");
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await page.locator(".simple-garden > summary").click();
  await page.clock.fastForward(60000);
  await page.locator(".simple-garden > summary").click();
  await expect(page.getByRole("timer")).toHaveText("23:00");
  await page.clock.fastForward(23 * 60000);
  await expect(page.getByRole("timer")).toHaveText("00:00");
  await expect(page.getByText("Odak süren tamamlandı. Mola zamanı.")).toHaveText("Odak süren tamamlandı. Mola zamanı.");
  await page.getByRole("button", { name: "Odak sayacını sıfırla" }).click();
  await expect(page.getByRole("timer")).toHaveText("25:00");
});

test("single-key shortcuts can be disabled and the help closes with Escape", async ({ page }) => {
  await openTodos(page);
  await page.getByLabel("Klavye kısayolları", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Harf kısayollarını etkinleştir" }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator(".keyboard-help")).not.toHaveAttribute("open", "");
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("n");
  await expect(page.locator("#create-title")).not.toBeFocused();
  await page.reload();
  await page.getByLabel("Klavye kısayolları", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Harf kısayollarını etkinleştir" })).not.toBeChecked();
});

test("CSV export includes every task regardless of current filters", async ({ page }) => {
  await openTodos(page);
  await page.locator("#todo-search").fill("İş planı");
  await expect(page.locator(".todo-actions")).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tüm görevleri CSV olarak indir" }).click();
  const download = await downloaded;
  const csv = await readFile(await download.path(), "utf8");
  expect(download.suggestedFilename()).toMatch(/^odak-gorevler-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(csv).toContain("İş planı");
  expect(csv).toContain("Task 12");
  expect(csv.split("\r\n")).toHaveLength(13);
});

test("export failure can be retried without losing the task draft", async ({ page }) => {
  const state = await openTodos(page);
  await page.locator("#create-title").fill("Korunacak taslak");
  state.failExport = true;
  await page.getByRole("button", { name: "Tüm görevleri CSV olarak indir" }).click();
  await expect(page.locator(".export-notice")).toContainText("Sunucuda bir hata oluştu");
  await expect(page.locator("#create-title")).toHaveValue("Korunacak taslak");
  state.failExport = false;
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tüm görevleri CSV olarak indir" }).click();
  await downloaded;
  await expect(page.locator(".export-notice")).toContainText("12 görev CSV dosyasına aktarıldı.");
});

test("offline feedback preserves the form and clears when the connection returns", async ({ page, context }) => {
  await openTodos(page);
  await page.locator("#create-title").fill("Bağlantı gelince kaydet");
  await context.setOffline(true);
  await expect(page.locator(".offline-notice")).toBeVisible();
  await expect(page.locator("#create-title")).toHaveValue("Bağlantı gelince kaydet");
  await context.setOffline(false);
  await expect(page.locator(".offline-notice")).toHaveCount(0);
});

test("workspace navigation filters tasks by status and category", async ({
  page,
}) => {
  await openTodos(page);
  await page
    .getByRole("navigation", { name: "Görev durumları", exact: true })
    .getByRole("button", { name: "Biten görevler" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tamamlanan görevler", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tamamlanan görevler", exact: true })).toBeInViewport();
  await expect(page.locator("#task-list")).toBeFocused();
  await expect(page.locator(".todo-actions")).toHaveCount(2);
  await page
    .getByRole("navigation", { name: "Görev durumları", exact: true })
    .getByRole("button", { name: "Görevlerim" })
    .click();
  await expect(page.locator(".todo-actions")).toHaveCount(10);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.getByRole("navigation", { name: "Görev durumları", exact: true }).getByRole("button", { name: "Görevlerim" }).click();
  await expect(page.getByRole("heading", { name: "Tüm görevler", exact: true })).toBeInViewport();
  await expect(page.locator("#task-list")).toBeFocused();
  await page.locator(".advanced-filters > summary").click();
  await page.locator("#category-filter").selectOption("İş");
  await expect(page.locator(".todo-actions")).toHaveCount(1);
});

test("empty search can be reset from its empty state", async ({ page }) => {
  await openTodos(page);
  await page.locator("#todo-search").fill("no-such-task");
  await expect(
    page.getByRole("heading", { name: "Burada bir eşleşme yok.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Filtreleri temizle", exact: true })
    .click();
  await expect(page.locator("#todo-search")).toHaveValue("");
  await expect(page.locator(".todo-actions")).toHaveCount(10);
});

test("new task shortcut focuses the composer", async ({ page }) => {
  await openTodos(page);
  const shortcut = page.getByRole("button", {
    name: "Yeni görev",
    exact: true,
  });
  await shortcut.click();
  await expect(page.locator("#create-title")).toBeFocused();
});

async function pauseSearchClock(page) {
  await page.clock.install({ time: new Date("2026-11-04T12:00:00Z") });
  const state = await openTodos(page);
  await page.clock.pauseAt(new Date("2026-11-04T12:01:00Z"));
  return state;
}

test("rapid typing sends only the final query after 300 ms", async ({
  page,
}) => {
  const state = await pauseSearchClock(page);
  const initialRequests = state.queries.length;
  await page.locator("#todo-search").fill("p");
  await page.clock.fastForward(100);
  await page.locator("#todo-search").fill("pl");
  await page.clock.fastForward(100);
  await page.locator("#todo-search").fill("plan");
  await page.clock.fastForward(299);
  expect(state.queries).toHaveLength(initialRequests);
  await page.clock.fastForward(1);
  await expect.poll(() => state.queries.length).toBe(initialRequests + 1);
  expect(state.queries.at(-1).search).toBe("plan");
});

test("clearing search immediately cancels a pending query", async ({
  page,
}) => {
  const state = await pauseSearchClock(page);
  await page.locator("#todo-search").fill("plan");
  await page.clock.fastForward(300);
  await expect.poll(() => state.queries.at(-1).search).toBe("plan");
  await page.locator("#todo-search").fill("missing");
  await page.clock.fastForward(100);
  await page.locator("#todo-search").fill("");
  await expect.poll(() => state.queries.at(-1).search).toBe("");
  const count = state.queries.length;
  await page.clock.fastForward(1000);
  expect(state.queries).toHaveLength(count);
  expect(state.queries.some((query) => query.search === "missing")).toBe(false);
});

test("filter changes apply pending search immediately without a duplicate request", async ({
  page,
}) => {
  const state = await pauseSearchClock(page);
  await page.locator(".advanced-filters > summary").click();
  await page.locator("#todo-search").fill("plan");
  await page.locator("#category-filter").selectOption("İş");
  await expect
    .poll(() => state.queries.at(-1))
    .toMatchObject({ search: "plan", category: "İş" });
  const count = state.queries.length;
  await page.clock.fastForward(1000);
  expect(state.queries).toHaveLength(count);
});

test("validates blank title, focuses the error, and creates a task", async ({
  page,
}) => {
  const state = await openTodos(page);
  await page.locator("#create-title").fill("   ");
  await page
    .getByRole("button", { name: "+ Görevi Kaydet", exact: true })
    .click();
  await expect(page.locator("#create-title")).toBeFocused();
  await expect(page.locator("#create-title")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(state.writes).toHaveLength(0);
  await page.locator("#create-title").fill("New browser task");
  await page
    .getByRole("button", { name: "+ Görevi Kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "New browser task", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#create-title")).toHaveValue("");
});

test("cancel preserves edits when dismissed and restores focus when accepted", async ({
  page,
}) => {
  await openTodos(page);
  await card(page)
    .getByRole("button", { name: "Düzenle", exact: true })
    .click();
  await expect(page.locator("#edit-title")).toBeFocused();
  await page.locator("#edit-title").fill("Unsaved");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "İptal", exact: true }).click();
  await expect(page.locator("#edit-title")).toHaveValue("Unsaved");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "İptal", exact: true }).click();
  await expect(page.locator("#edit-title")).toHaveCount(0);
  await expect(page.locator("#edit-button-1")).toBeFocused();
});

test("failed update keeps the form and retry saves the edit", async ({
  page,
}) => {
  const state = await openTodos(page);
  await card(page)
    .getByRole("button", { name: "Düzenle", exact: true })
    .click();
  await page.locator("#edit-title").fill("Updated browser task");
  state.failUpdate = true;
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByRole("alert").last()).toBeVisible();
  await expect(page.locator("#edit-title")).toHaveValue("Updated browser task");
  state.failUpdate = false;
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Updated browser task", exact: true }),
  ).toBeVisible();
});

test("deletion requires confirmation and refreshes the page", async ({
  page,
}) => {
  const state = await openTodos(page);
  page.once("dialog", (dialog) => dialog.dismiss());
  await card(page).getByRole("button", { name: "Sil", exact: true }).click();
  expect(state.writes).toHaveLength(0);
  page.once("dialog", (dialog) => dialog.accept());
  await card(page).getByRole("button", { name: "Sil", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "İş planı", exact: true }),
  ).toHaveCount(0);
  expect(state.items).toHaveLength(11);
});

test("search, category, priority and sort reach the server together", async ({
  page,
}) => {
  const state = await openTodos(page);
  await page.locator(".advanced-filters > summary").click();
  await page.locator("#todo-search").fill("plan");
  await expect(page.locator("#category-filter")).toBeEnabled();
  await page.locator("#category-filter").selectOption("İş");
  await expect(page.locator("#priority-filter")).toBeEnabled();
  await page.locator("#priority-filter").selectOption("HIGH");
  await expect(page.locator("#todo-sort")).toBeEnabled();
  await page.locator("#todo-sort").selectOption("due-asc");
  await expect
    .poll(() => state.queries.at(-1))
    .toMatchObject({
      search: "plan",
      category: "İş",
      priority: "HIGH",
      sort: "due-asc",
      page: "0",
    });
  await expect(page.locator(".todo-actions")).toHaveCount(1);
});

test("pagination and page size load the right server page", async ({
  page,
}) => {
  const state = await openTodos(page);
  await page.getByRole("button", { name: "Sonraki", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Task 11", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".todo-actions")).toHaveCount(2);
  expect(state.queries.at(-1).page).toBe("1");
  await page.locator("#page-size").selectOption("25");
  await expect(page.locator(".todo-actions")).toHaveCount(12);
  expect(state.queries.at(-1)).toMatchObject({ page: "0", size: "25" });
});

test("keyboard navigation and narrow layout remain usable", async ({
  page,
}) => {
  await openTodos(page);
  await page.locator("#create-title").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator(".task-extra-fields > summary")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator("#create-description")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false);
  for (const button of await card(page).getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(
      page.viewportSize().width + 1,
    );
  }
  await page.screenshot({
    path: test.info().outputPath("workspace.png"),
    fullPage: true,
  });
});
