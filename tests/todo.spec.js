const { test, expect } = require("@playwright/test");

const BASE_URL = "https://demo.playwright.dev/todomvc/";

test.describe("TodoMVC Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("Add a new todo item", async ({ page }) => {
    const todoInput = page.getByPlaceholder("What needs to be done?");
    await expect(todoInput).toBeVisible();

    await todoInput.fill("Buy groceries");
    await todoInput.press("Enter");

    const todoItem = page.locator(".todo-list li").filter({ hasText: "Buy groceries" });
    await expect(todoItem).toBeVisible();

    const count = await page.locator(".todo-list li").count();
    expect(count).toBeGreaterThan(0);

    const todoCount = page.locator(".todo-count");
    await expect(todoCount).toContainText("1");
  });

  test("Mark a todo as complete", async ({ page }) => {
    // First add a todo
    const todoInput = page.getByPlaceholder("What needs to be done?");
    await todoInput.fill("Complete this task");
    await todoInput.press("Enter");

    // Find and click the checkbox to mark it complete
    const checkbox = page.locator(".todo-list li .toggle").first();
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    // Verify the todo is now completed
    const completedTodo = page.locator(".todo-list li.completed").first();
    await expect(completedTodo).toBeVisible();

    // Verify the todo count updates (0 items left)
    const todoCount = page.locator(".todo-count");
    await expect(todoCount).toContainText("0");
  });

  test("Filter todos by status", async ({ page }) => {
    const todoInput = page.getByPlaceholder("What needs to be done?");

    // Add two todos
    await todoInput.fill("Active task");
    await todoInput.press("Enter");

    await todoInput.fill("Completed task");
    await todoInput.press("Enter");

    // Mark the second one as complete
    const checkboxes = page.locator(".todo-list li .toggle");
    await checkboxes.nth(1).check();

    // Filter by Active
    const activeFilter = page.getByRole("link", { name: "Active" });
    await activeFilter.click();

    const activeItems = page.locator(".todo-list li");
    const activeCount = await activeItems.count();
    expect(activeCount).toBe(1);

    const activeText = await activeItems.first().textContent();
    expect(activeText).toContain("Active task");

    // Filter by Completed
    const completedFilter = page.getByRole("link", { name: "Completed" });
    await completedFilter.click();

    const completedItems = page.locator(".todo-list li");
    const completedCount = await completedItems.count();
    expect(completedCount).toBe(1);

    // Filter by All
    const allFilter = page.getByRole("link", { name: "All" });
    await allFilter.click();

    const allItems = page.locator(".todo-list li");
    const allCount = await allItems.count();
    expect(allCount).toBe(2);
  });
});
