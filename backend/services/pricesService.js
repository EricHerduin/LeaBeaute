function createPricesService(deps) {
  const {
    getPriceRows,
    getNormalizedPriceCategoryPreferences,
    sortPricesWithCategoryOrder,
    normalizeCategoryPreferences,
    setAdminSetting,
    randomId,
    runSql,
    sqlBool,
    sqlValue,
    nowIso,
    readOne,
    mapPriceRow,
  } = deps;

  return {
    getPublicPrices() {
      const prices = getPriceRows(true);
      const preferences = getNormalizedPriceCategoryPreferences();
      return sortPricesWithCategoryOrder(prices, preferences.categoryOrder);
    },

    getAllPrices() {
      const prices = getPriceRows(false);
      const preferences = getNormalizedPriceCategoryPreferences();
      return sortPricesWithCategoryOrder(prices, preferences.categoryOrder);
    },

    getCategoryPreferences() {
      return getNormalizedPriceCategoryPreferences();
    },

    saveCategoryPreferences(body) {
      const prices = getPriceRows(false);
      const normalizedPreferences = normalizeCategoryPreferences(
        prices.map((item) => item.category),
        body.categoryOrder || [],
        body.selectedCategoriesForPdf || [],
      );

      setAdminSetting("price_category_preferences", normalizedPreferences);
      return normalizedPreferences;
    },

    createPrice(body) {
      const item = {
        id: body.id || randomId(),
        category: body.category,
        name: body.name,
        priceEur: body.priceEur ?? null,
        durationMin: body.durationMin ?? null,
        note: body.note ?? null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      };

      runSql(`
        INSERT INTO price_items (
          id, category, name, price_eur, duration_min, note, is_active, sort_order, created_at, updated_at
        ) VALUES (
          ${sqlValue(item.id)},
          ${sqlValue(item.category)},
          ${sqlValue(item.name)},
          ${sqlValue(item.priceEur)},
          ${sqlValue(item.durationMin)},
          ${sqlValue(item.note)},
          ${sqlBool(item.isActive)},
          ${sqlValue(item.sortOrder)},
          ${sqlValue(nowIso())},
          ${sqlValue(nowIso())}
        );
      `);

      return item;
    },

    updatePrice(itemId, body) {
      const updateData = Object.fromEntries(
        Object.entries({
          category: body.category,
          name: body.name,
          price_eur: body.priceEur,
          duration_min: body.durationMin,
          note: body.note,
          is_active: body.isActive === undefined ? undefined : (body.isActive ? 1 : 0),
          sort_order: body.sortOrder,
        }).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(updateData).length === 0) {
        const error = new Error("No fields to update");
        error.status = 400;
        throw error;
      }

      const setters = Object.entries(updateData)
        .map(([key, value]) => `${key} = ${sqlValue(value)}`)
        .join(", ");

      runSql(`
        UPDATE price_items
        SET ${setters}, updated_at = ${sqlValue(nowIso())}
        WHERE id = ${sqlValue(itemId)};
      `);

      const updated = readOne(`SELECT * FROM price_items WHERE id = ${sqlValue(itemId)} LIMIT 1;`);
      if (!updated) {
        return null;
      }

      return mapPriceRow(updated);
    },

    deletePrice(itemId) {
      const existing = readOne(`SELECT id FROM price_items WHERE id = ${sqlValue(itemId)} LIMIT 1;`);
      if (!existing) {
        return false;
      }

      runSql(`DELETE FROM price_items WHERE id = ${sqlValue(itemId)};`);
      return true;
    },
  };
}

module.exports = {
  createPricesService,
};
