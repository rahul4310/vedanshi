import { test, expect } from '@playwright/test';

test.describe('Vedanshi Python Showcase Smoke Tests', () => {

  test('Phase E: Normal portfolio smoke test', async ({ page }) => {
    // 1. Navigate to the homepage
    await page.goto('/');
    
    // 2. Verify all three project cards appear
    await expect(page.locator('h3', { hasText: 'Greeting Generator' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Number Guessing Game' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Turtle Drawing (Broken)' })).toBeVisible();

    // 3. Open 1_greeting.py
    await page.click('h3:has-text("Greeting Generator")');
    
    // Wait for the URL to change to the project route
    await expect(page).toHaveURL(/.*#\/project\/1_greeting/);
    
    // Click "Run"
    await page.click('button:has-text("Run")');
    
    // The program asks for name
    const inputDialog = page.locator('.input-prompt-container input[type="text"]');
    await expect(inputDialog).toBeVisible({ timeout: 15000 });
    
    // Fill the input and submit
    await inputDialog.fill('Rahul');
    await inputDialog.press('Enter');
    
    // Next prompt: favorite color
    // Wait a brief moment for the second input call
    await expect(inputDialog).toBeVisible();
    await inputDialog.fill('Blue');
    await inputDialog.press('Enter');
    
    // Wait for completion (input dialog disappears)
    await expect(inputDialog).not.toBeVisible();
    
    // Check terminal output
    const terminal = page.locator('.terminal-container');
    await expect(terminal).toContainText('Hello, Rahul!');
    await expect(terminal).toContainText('Blue is a beautiful color!');
    
    // 4. Click "Clear Terminal"
    const clearBtn = page.locator('button', { hasText: 'Clear' });
    if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await expect(terminal).not.toContainText('Hello, Rahul!');
    }
  });

  test('Phase E: Incompatible project (Turtle)', async ({ page }) => {
    await page.goto('/#/project/3_turtle_test');
    
    // Verify "Run" button is disabled or not present due to cannot-run
    const runBtn = page.locator('button', { hasText: 'Run' });
    if (await runBtn.isVisible()) {
        await expect(runBtn).toBeDisabled();
    }
    
    // Verify compatibility reason
    await expect(page.locator('text=Turtle graphics require a desktop environment')).toBeVisible();
  });

  test('Phase I: Routing and Interface States', async ({ page }) => {
    // 1. Verify navigating to a nonexistent project ID shows a "Project Not Found" state
    await page.goto('/#/project/does_not_exist');
    await expect(page.locator('text=Project not found').or(page.locator('text=Not Found'))).toBeVisible();
    
    // 2. Verify refreshing on a project route works properly
    await page.goto('/#/project/2_number_guess');
    await expect(page.locator('h1', { hasText: 'Number Guessing Game' })).toBeVisible();
    await page.reload();
    await expect(page.locator('h1', { hasText: 'Number Guessing Game' })).toBeVisible();
  });

});
