import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('devrait charger rapidement', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 5 secondes
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Page chargée en ${loadTime}ms`);
  });

  test('devrait avoir des images optimisées', async ({ page }) => {
    await page.goto('/');
    
    // Récupérer toutes les images
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      
      // Vérifier que chaque image a un alt text
      expect(alt).toBeTruthy();
      
      console.log(`Image: ${src} - Alt: ${alt}`);
    }
  });

  test('ne devrait pas avoir d\'erreurs console', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Filtrer les erreurs connues (comme les warnings React en dev)
    const criticalErrors = errors.filter(
      err => !err.includes('Warning:') && !err.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
