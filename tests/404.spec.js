import { test, expect } from '@playwright/test';

test.describe('Page 404', () => {
  test('devrait afficher la page 404 pour URL inexistante', async ({ page }) => {
    await page.goto('/page-inexistante');
    
    // Vérifier le message d'erreur
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=/Oups/i')).toBeVisible();
    await expect(page.locator('text=/Cette page n\'existe pas/i')).toBeVisible();
  });

  test('devrait avoir un bouton retour à l\'accueil', async ({ page }) => {
    await page.goto('/page-qui-nexiste-pas');
    
    // Cliquer sur le bouton retour
    await page.click('text=/Retour à l\'accueil/i');
    
    // Vérifier qu'on est bien sur l'accueil
    await expect(page).toHaveURL('/');
  });

  test('devrait afficher l\'animation CSS premium', async ({ page }) => {
    await page.goto('/erreur-404');
    
    // Vérifier que l'animation est présente (par la présence d'éléments animés)
    const animatedElements = page.locator('[class*="animate"]');
    const count = await animatedElements.count();
    expect(count).toBeGreaterThan(0);
  });
});
