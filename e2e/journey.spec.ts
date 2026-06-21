import { test, expect } from '@playwright/test';

test('Primary User Journey: Register, Login, Onboarding, Chat Log', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  // 1. Mock Vertex AI Response to avoid network/API Key issues
  await page.route('**/api/parse-activity', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        activities: [
          {
            category: 'transport',
            subcategory: 'car',
            description: 'Driving a car',
            quantity: 40,
            unit: 'km',
            confidence: 0.95,
            co2eKg: 7.68
          }
        ],
        totalCo2eKg: 7.68
      }),
    });
  });

  const testEmail = `e2e_${Date.now()}@ecoloop.org`;
  const testPassword = 'Password123!';

  // -- REGISTER --
  await page.goto('/register');
  await page.getByPlaceholder('e.g. Navdeep', { exact: true }).fill('E2E User');
  await page.getByPlaceholder('e.g. navdeep@ecoloop.org').fill(testEmail);
  await page.getByPlaceholder('••••••••').fill(testPassword);
  // Button text is "Sign Up"
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

  // AppContext checks user data and pushes to /onboarding since it's a new DB user
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });
  await expect(page.getByText('EcoLoop Onboarding')).toBeVisible({ timeout: 10000 });

  // -- ONBOARDING --
  // Step 1: Housing
  await page.getByRole('button', { name: /house/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 2: Transit
  await page.getByRole('button', { name: /walk\/cycle/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 3: Diet
  await page.getByRole('button', { name: /vegan/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 4: Utilities
  await page.getByRole('button', { name: /calculate baseline/i }).click();

  // Step 5: Reveal
  await expect(page.getByText('Baseline Revealed!')).toBeVisible();
  
  await page.getByPlaceholder('e.g. Navdeep', { exact: true }).fill('E2E User');
  await page.getByPlaceholder('e.g. navdeep@ecoloop.org').fill(testEmail);
  await page.getByRole('button', { name: /Enter the Loop/i }).click();

  // Redirect to Dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('E2E User').first()).toBeVisible({ timeout: 10000 });

  // -- CHAT DRAWER LOGGING --
  // Open the drawer
  await page.getByRole('button', { name: /Log Activity/i }).click();
  await expect(page.getByText('EcoBot Logger')).toBeVisible();

  // Type in the message
  await page.getByPlaceholder(/Tell me about your day/).fill('Drove 40km today');
  await page.getByPlaceholder(/Tell me about your day/).press('Enter');

  // Wait for the mocked response to parse into confirmation chips
  // It should show a badge with "transport" and "7.68 kg"
  await expect(page.locator('.badge-transport').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('7.68 kg').first()).toBeVisible();

  // Click 'Log It'
  await page.getByRole('button', { name: /Log It/i }).click();

  // Expect success message
  await expect(page.getByText(/Logged! You earned/)).toBeVisible({ timeout: 15000 });

  // Wait for the drawer to automatically close (after 2s timeout in ChatDrawer)
  await expect(page.getByText('EcoBot Logger')).not.toBeVisible({ timeout: 5000 });

  // The EcosystemCanvas svg should be present on the dashboard
  await expect(page.locator('svg').filter({ has: page.locator('linearGradient#skyGrad') })).toBeVisible();
});

test('Edge Case: Duplicate Registration', async ({ page }) => {
  // First register a user
  const dupEmail = `dup_${Date.now()}@ecoloop.org`;
  
  await page.goto('/register');
  await page.getByPlaceholder('e.g. Navdeep', { exact: true }).fill('First User');
  await page.getByPlaceholder('e.g. navdeep@ecoloop.org').fill(dupEmail);
  await page.getByPlaceholder('••••••••').fill('Password123!');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  
  await expect(page).toHaveURL(/\/onboarding/);
  
  // Clear site data (sign out)
  await page.context().clearCookies();
  
  // Try to register again with same email
  await page.goto('/register');
  await page.getByPlaceholder('e.g. Navdeep', { exact: true }).fill('Second User');
  await page.getByPlaceholder('e.g. navdeep@ecoloop.org').fill(dupEmail);
  await page.getByPlaceholder('••••••••').fill('Password123!');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  
  await expect(page.getByText(/User with this email already exists/i)).toBeVisible();
});
