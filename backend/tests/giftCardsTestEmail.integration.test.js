const test = require("node:test");
const assert = require("node:assert/strict");

const { createGiftCardsService } = require("../services/giftCardsService");
const { generateGiftCardPdfBuffer } = require("../emailService");

function createServiceForTestEmail(sendGiftCardEmailMock) {
  return createGiftCardsService({
    sendGiftCardEmail: sendGiftCardEmailMock,
  });
}

test("sendTestEmail renvoie 400 si aucun email destinataire n'est fourni", async () => {
  const previousEmailUser = process.env.EMAIL_USER;
  const previousEmailTestTo = process.env.EMAIL_TEST_TO;

  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_TEST_TO;

  const service = createServiceForTestEmail(async () => true);

  await assert.rejects(
    service.sendTestEmail({}),
    (error) => {
      assert.equal(error.message, "to_email is required");
      assert.equal(error.status, 400);
      return true;
    },
  );

  if (typeof previousEmailUser === "undefined") {
    delete process.env.EMAIL_USER;
  } else {
    process.env.EMAIL_USER = previousEmailUser;
  }

  if (typeof previousEmailTestTo === "undefined") {
    delete process.env.EMAIL_TEST_TO;
  } else {
    process.env.EMAIL_TEST_TO = previousEmailTestTo;
  }
});

test("sendTestEmail envoie un exemple admin avec donnees de carte cadeau", async () => {
  const calls = [];
  const service = createServiceForTestEmail(async (payload) => {
    calls.push(payload);
    return true;
  });

  const result = await service.sendTestEmail({
    to_email: "client.test@example.com",
    recipient_name: "Camille",
    amount: 95,
    gift_card_code: "TEST-PDF-2026",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].toEmail, "client.test@example.com");
  assert.equal(calls[0].recipientName, "Camille");
  assert.equal(calls[0].amount, 95);
  assert.equal(calls[0].giftCardCode, "TEST-PDF-2026");
  assert.equal(typeof calls[0].expiresAt, "string");

  assert.equal(result.success, true);
  assert.equal(result.test, true);
  assert.equal(result.pdf_attachment, true);
  assert.equal(result.to_email, "client.test@example.com");
});

test("generateGiftCardPdfBuffer genere un vrai PDF exemple", async () => {
  const pdfBuffer = await generateGiftCardPdfBuffer({
    recipientName: "Cliente Test",
    giftCardCode: "TEST-PDF-2026",
    amount: 80,
    expiresAt: new Date("2028-05-10T00:00:00.000Z").toISOString(),
    buyerName: "Lea Beaute",
  });

  assert.equal(Buffer.isBuffer(pdfBuffer), true);
  assert.equal(pdfBuffer.length > 1000, true);
  assert.equal(pdfBuffer.subarray(0, 4).toString(), "%PDF");
});

test("updateRecipient met a jour le beneficiaire et le message personnel", () => {
  const queries = [];
  const updatedGiftCard = {
    id: "gift_1",
    recipient_name: "Camille",
    personal_message: "Joyeux anniversaire",
  };
  const service = createGiftCardsService({
    nowIso: () => "2026-05-11T10:00:00.000Z",
    sqlValue: (value) => {
      if (value === null || typeof value === "undefined") return "NULL";
      return `'${String(value).replace(/'/g, "''")}'`;
    },
    runSql: (sql) => queries.push(sql),
    getGiftCardById: () => updatedGiftCard,
  });

  const result = service.updateRecipient("gift_1", "Camille", "Joyeux anniversaire");

  assert.equal(result.success, true);
  assert.equal(result.gift_card.personal_message, "Joyeux anniversaire");
  assert.match(queries[0], /recipient_name = 'Camille'/);
  assert.match(queries[0], /personal_message = 'Joyeux anniversaire'/);
  assert.match(queries[0], /WHERE id = 'gift_1'/);
});

test("updatePersonalMessage met a jour uniquement le message personnel", () => {
  const queries = [];
  const updatedGiftCard = {
    id: "gift_1",
    recipient_name: "Camille",
    personal_message: "Profite bien de ton soin",
  };
  const service = createGiftCardsService({
    nowIso: () => "2026-05-11T10:00:00.000Z",
    sqlValue: (value) => {
      if (value === null || typeof value === "undefined") return "NULL";
      return `'${String(value).replace(/'/g, "''")}'`;
    },
    runSql: (sql) => queries.push(sql),
    getGiftCardById: () => updatedGiftCard,
  });

  const result = service.updatePersonalMessage("gift_1", "Profite bien de ton soin");

  assert.equal(result.success, true);
  assert.equal(result.gift_card.personal_message, "Profite bien de ton soin");
  assert.match(queries[0], /personal_message = 'Profite bien de ton soin'/);
  assert.match(queries[0], /WHERE id = 'gift_1'/);
});
