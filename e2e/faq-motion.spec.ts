import { expect, test } from '@playwright/test';

const faq = { faq_id: 1, category: 'Orders', question: 'How do I purchase a VIP number?', answer: 'Choose an available number, complete checkout, and follow the transfer guidance.', sort_order: 1, is_active: true };

test('FAQ answers animate open and closed while disclosure state stays accessible', async ({ page }) => {
  await page.route('**/vipnumberworld/**', async (route) => {
    const data = route.request().url().endsWith('/site/faqs') ? [faq] : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, info: 'OK', data }) });
  });
  await page.goto('/faq');
  const toggle = page.getByRole('button', { name: faq.question });
  const answer = page.locator('#faq-1');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(answer).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(answer).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(answer).toBeVisible();
});
