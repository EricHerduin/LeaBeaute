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
