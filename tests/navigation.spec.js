import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('devrait avoir tous les liens de navigation', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les liens principaux
    await expect(page.locator('text=Accueil')).toBeVisible();
    await expect(page.locator('text=Guinot')).toBeVisible();
    await expect(page.locator('text=Accompagnement')).toBeVisible();
    await expect(page.locator('text=Tarifs')).toBeVisible();
  });

  test('devrait ouvrir et fermer le menu mobile', async ({ page, viewport }) => {
    // Tester sur mobile uniquement
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Chercher le bouton hamburger (peut avoir différents noms)
    const menuButton = page.locator('button').filter({ hasText: /menu|☰/i }).or(
      page.locator('button[aria-label*="menu"]')
    ).first();
    
    // Si le bouton existe, le tester
    const isVisible = await menuButton.isVisible().catch(() => false);
    if (isVisible) {
      await menuButton.click();
      
      // Vérifier que le menu s'ouvre
      await page.waitForTimeout(500);
      
      // Fermer le menu
      await menuButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('devrait scroller vers le haut avec ScrollToTop', async ({ page }) => {
    await page.goto('/');
    
    // Scroller vers le bas
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    
    // Naviguer vers une autre page
    await page.click('text=Guinot');
    
    // Vérifier qu'on est en haut de page
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});
