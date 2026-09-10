const test = require("node:test");
const assert = require("node:assert/strict");

const { createGoogleReviewsService } = require("../services/googleReviewsService");

const PLACE_ID = "ChIJreE_Pi-DDEgRJ0veR0hH5jE";
const API_KEY = "AIzaSyTestKey";

const silentLogger = { info() {}, warn() {}, error() {} };

async function withGoogleEnv(values, run) {
  const previous = {
    GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  };

  for (const key of Object.keys(previous)) {
    if (typeof values[key] === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function googleResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return body;
    },
  };
}

const PLACE_DETAILS_FIXTURE = {
  displayName: { text: "Léa Beauté", languageCode: "fr" },
  rating: 4.9,
  userRatingCount: 37,
  reviews: [
    {
      name: "places/abc/reviews/rev-1",
      rating: 5,
      text: { text: "Un soin du visage remarquable.", languageCode: "fr" },
      relativePublishTimeDescription: "il y a 2 semaines",
      publishTime: "2026-08-20T09:15:00Z",
      googleMapsUri: "https://maps.google.com/?cid=1",
      authorAttribution: {
        displayName: "Camille D.",
        uri: "https://www.google.com/maps/contrib/1",
        photoUri: "https://lh3.googleusercontent.com/photo-1",
      },
    },
  ],
};

test("getReviews signale not_configured quand les variables d'environnement sont absentes", async () => {
  await withGoogleEnv({}, async () => {
    const service = createGoogleReviewsService({
      fetchImpl: async () => {
        throw new Error("aucun appel réseau ne doit être effectué");
      },
      logger: silentLogger,
    });

    const payload = await service.getReviews();

    assert.equal(payload.status, "not_configured");
    assert.equal(payload.configured, false);
    assert.equal(payload.rating, null, "aucune note ne doit être inventée");
    assert.equal(payload.user_ratings_total, 0);
    assert.deepEqual(payload.reviews, []);
  });
});

test("getReviews mappe les avis renvoyés par Places API (New)", async () => {
  await withGoogleEnv({ GOOGLE_PLACE_ID: PLACE_ID, GOOGLE_PLACES_API_KEY: API_KEY }, async () => {
    const calls = [];
    const service = createGoogleReviewsService({
      fetchImpl: async (url, options) => {
        calls.push({ url: String(url), options });
        return googleResponse(PLACE_DETAILS_FIXTURE);
      },
      logger: silentLogger,
    });

    const payload = await service.getReviews();

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, new RegExp(`^https://places\\.googleapis\\.com/v1/places/${PLACE_ID}\\?`));
    assert.match(calls[0].url, /languageCode=fr/);
    assert.equal(calls[0].options.headers["X-Goog-Api-Key"], API_KEY);
    assert.equal(
      calls[0].options.headers["X-Goog-FieldMask"],
      "displayName,rating,userRatingCount,reviews",
    );

    assert.equal(payload.status, "ok");
    assert.equal(payload.configured, true);
    assert.equal(payload.name, "Léa Beauté");
    assert.equal(payload.rating, 4.9);
    assert.equal(payload.user_ratings_total, 37);
    assert.deepEqual(payload.reviews, [
      {
        author: "Camille D.",
        rating: 5,
        text: "Un soin du visage remarquable.",
        time: "2026-08-20T09:15:00Z",
        relative_time: "il y a 2 semaines",
        profile_photo: "https://lh3.googleusercontent.com/photo-1",
        author_url: "https://www.google.com/maps/contrib/1",
      },
    ]);
  });
});

test("getReviews limite la sortie à 5 avis", async () => {
  await withGoogleEnv({ GOOGLE_PLACE_ID: PLACE_ID, GOOGLE_PLACES_API_KEY: API_KEY }, async () => {
    const reviews = [];
    for (let index = 0; index < 8; index += 1) {
      reviews.push({
        ...PLACE_DETAILS_FIXTURE.reviews[0],
        name: `places/abc/reviews/rev-${index}`,
      });
    }

    const service = createGoogleReviewsService({
      fetchImpl: async () => googleResponse({ ...PLACE_DETAILS_FIXTURE, reviews }),
      logger: silentLogger,
    });

    const payload = await service.getReviews();

    assert.equal(payload.reviews.length, 5);
  });
});

test("getReviews remonte une erreur explicite quand Google refuse la requête", async () => {
  await withGoogleEnv({ GOOGLE_PLACE_ID: PLACE_ID, GOOGLE_PLACES_API_KEY: API_KEY }, async () => {
    const logged = [];
    const service = createGoogleReviewsService({
      fetchImpl: async () => googleResponse(
        { error: { code: 403, status: "PERMISSION_DENIED", message: "Places API (New) has not been used" } },
        { ok: false, status: 403 },
      ),
      logger: { ...silentLogger, error: (...args) => logged.push(args) },
    });

    await assert.rejects(
      service.getReviews(),
      (error) => {
        assert.equal(error.status, 503, "une panne amont doit répondre 503, jamais 200");
        assert.match(error.message, /PERMISSION_DENIED/);
        return true;
      },
    );

    assert.equal(logged.length, 1, "la cause réelle doit être journalisée");
    assert.match(JSON.stringify(logged[0]), /PERMISSION_DENIED/);
  });
});

test("getReviews sert le cache pendant la durée de vie configurée", async () => {
  await withGoogleEnv({ GOOGLE_PLACE_ID: PLACE_ID, GOOGLE_PLACES_API_KEY: API_KEY }, async () => {
    let calls = 0;
    let currentTime = 1_000_000;

    const service = createGoogleReviewsService({
      fetchImpl: async () => {
        calls += 1;
        return googleResponse(PLACE_DETAILS_FIXTURE);
      },
      now: () => currentTime,
      cacheTtlMs: 60 * 60 * 1000,
      logger: silentLogger,
    });

    await service.getReviews();
    currentTime += 59 * 60 * 1000;
    await service.getReviews();

    assert.equal(calls, 1, "le second appel doit être servi par le cache");

    currentTime += 2 * 60 * 1000;
    await service.getReviews();

    assert.equal(calls, 2, "le cache doit expirer après la durée de vie");
  });
});

test("getReviews ne met pas en cache une réponse en échec", async () => {
  await withGoogleEnv({ GOOGLE_PLACE_ID: PLACE_ID, GOOGLE_PLACES_API_KEY: API_KEY }, async () => {
    let calls = 0;

    const service = createGoogleReviewsService({
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          return googleResponse(
            { error: { code: 500, status: "INTERNAL", message: "boom" } },
            { ok: false, status: 500 },
          );
        }
        return googleResponse(PLACE_DETAILS_FIXTURE);
      },
      logger: silentLogger,
    });

    await assert.rejects(service.getReviews());

    const payload = await service.getReviews();

    assert.equal(calls, 2);
    assert.equal(payload.status, "ok");
  });
});
