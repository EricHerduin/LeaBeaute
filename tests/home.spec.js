import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('devrait charger la page correctement', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le titre
    await expect(page).toHaveTitle(/Léa Beauté/);
    
    // Vérifier la navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Vérifier le logo
    await expect(page.locator('img[alt*="Léa Beauté"]').first()).toBeVisible();
  });

  test('devrait afficher le hero section', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le hero existe
    await expect(page.locator('section').first()).toBeVisible();
    
    // Vérifier le bouton CTA
    const callButton = page.locator('a[href="tel:0233214819"]').first();
    await expect(callButton).toBeVisible();
  });

  test('devrait naviguer vers la page Guinot', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le lien Guinot dans la nav
    await page.locator('[data-testid="nav-guinot"]').click();
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/guinot');
    
    // Vérifier le titre de la page
    await expect(page.locator('h1').first()).toContainText('Guinot');
  });

  test('devrait naviguer vers Accompagnement nutrition', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le lien Accompagnement dans la nav
    await page.locator('[data-testid="nav-coaching"]').click();
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/accompagnement-nutrition');
    
    // Vérifier le titre de la page
    await expect(page.locator('h1').first()).toContainText('Chrononutrition');
  });
});
