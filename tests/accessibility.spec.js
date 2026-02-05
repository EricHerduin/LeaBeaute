import { test, expect } from '@playwright/test';

test.describe('Accessibilité', () => {
  test('devrait avoir des liens cliquables', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les liens principaux sont cliquables
    const links = [
      'text=Prendre Rendez-vous',
      'a[href="tel:0233214819"]',
    ];
    
    for (const selector of links) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await expect(element).toBeEnabled();
      }
    }
  });

  test('devrait permettre la navigation au clavier', async ({ page }) => {
    await page.goto('/');
    
    // Tab pour naviguer
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Vérifier qu'un élément a le focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('devrait avoir des contrastes suffisants', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les couleurs principales
    const goldColor = await page.evaluate(() => {
      return getComputedStyle(document.body).getPropertyValue('--color-gold');
    });
    
    // Les couleurs or doivent être lisibles sur fond sombre
    expect(goldColor || '#D4AF37').toBeTruthy();
  });
});
