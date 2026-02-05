import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`devrait s'afficher correctement sur ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Vérifier que le contenu est visible
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Prendre un screenshot pour comparaison visuelle
      await page.screenshot({ 
        path: `tests/screenshots/${viewport.name.toLowerCase()}-home.png`,
        fullPage: true 
      });
    });
  }

  test('devrait gérer les animations sur toutes tailles', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que les animations se chargent
    await page.waitForTimeout(1000);
    
    // Vérifier qu'il n'y a pas d'erreurs JS
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});
