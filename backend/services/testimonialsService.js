function createTestimonialsService(deps) {
  const {
    randomId,
    nowIso,
    runSql,
    sqlValue,
    sqlBool,
    readRows,
    mapTestimonialRow,
  } = deps;

  return {
    createTestimonial(body) {
      const payload = {
        id: randomId(),
        name: String(body.name || "").trim(),
        rating: Number(body.rating),
        text: String(body.text || "").trim(),
        service: body.service ? String(body.service).trim() : null,
        allowDisplay: Boolean(body.allowDisplay),
        isApproved: Boolean(body.allowDisplay),
        createdAt: nowIso(),
      };

      if (payload.name.length < 2 || payload.name.length > 60) {
        const error = new Error("Invalid name");
        error.status = 400;
        throw error;
      }
      if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
        const error = new Error("Invalid rating");
        error.status = 400;
        throw error;
      }
      if (payload.text.length < 10 || payload.text.length > 600) {
        const error = new Error("Invalid text");
        error.status = 400;
        throw error;
      }

      runSql(`
        INSERT INTO testimonials (
          id, name, rating, text, service, allow_display, is_approved, created_at, updated_at
        ) VALUES (
          ${sqlValue(payload.id)},
          ${sqlValue(payload.name)},
          ${sqlValue(payload.rating)},
          ${sqlValue(payload.text)},
          ${sqlValue(payload.service)},
          ${sqlBool(payload.allowDisplay)},
          ${sqlBool(payload.isApproved)},
          ${sqlValue(payload.createdAt)},
          ${sqlValue(payload.createdAt)}
        );
      `);

      return { success: true, id: payload.id };
    },

    listApprovedTestimonials(limitInput) {
      const limit = Math.max(1, Math.min(Number(limitInput || 6), 12));
      const items = readRows(`
        SELECT * FROM testimonials
        WHERE is_approved = 1
        ORDER BY created_at DESC
        LIMIT ${limit};
      `).map(mapTestimonialRow);

      return { items };
    },
  };
}

module.exports = {
  createTestimonialsService,
};
