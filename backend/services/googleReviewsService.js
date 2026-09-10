const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";
const FIELD_MASK = "displayName,rating,userRatingCount,reviews";
const LANGUAGE_CODE = "fr";
const MAX_REVIEWS = 5;
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const UPSTREAM_ERROR_STATUS = 503;

function readGoogleConfig() {
  return {
    placeId: String(process.env.GOOGLE_PLACE_ID || "").trim(),
    apiKey: String(process.env.GOOGLE_PLACES_API_KEY || "").trim(),
  };
}

function buildUpstreamError(details) {
  const error = new Error(
    `Google Places API a refusé la requête (${details.status}): ${details.message}`,
  );
  error.status = UPSTREAM_ERROR_STATUS;
  error.googleStatus = details.status;
  return error;
}

function mapReview(review) {
  const author = review.authorAttribution || {};

  return {
    author: author.displayName || null,
    rating: review.rating ?? null,
    text: review.text?.text || review.originalText?.text || "",
    time: review.publishTime || null,
    relative_time: review.relativePublishTimeDescription || null,
    profile_photo: author.photoUri || null,
    author_url: author.uri || null,
  };
}

function mapPlaceDetails(place) {
  const reviews = Array.isArray(place.reviews) ? place.reviews : [];

  return {
    status: "ok",
    configured: true,
    name: place.displayName?.text || null,
    rating: place.rating ?? null,
    user_ratings_total: place.userRatingCount ?? 0,
    reviews: reviews.slice(0, MAX_REVIEWS).map(mapReview),
  };
}

function notConfiguredPayload() {
  return {
    status: "not_configured",
    configured: false,
    name: null,
    rating: null,
    user_ratings_total: 0,
    reviews: [],
  };
}

function createGoogleReviewsService({
  fetchImpl = fetch,
  now = () => Date.now(),
  logger = console,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
} = {}) {
  let cache = null;

  async function fetchPlaceDetails({ placeId, apiKey }) {
    const url = new URL(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`);
    url.searchParams.set("languageCode", LANGUAGE_CODE);

    const response = await fetchImpl(url.toString(), {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    const body = await response.json();

    if (!response.ok || body.error) {
      const details = {
        status: body.error?.status || `HTTP_${response.status}`,
        message: body.error?.message || "réponse inattendue",
      };
      logger.error("[GoogleReviews] Appel Places API (New) en échec", details);
      throw buildUpstreamError(details);
    }

    return mapPlaceDetails(body);
  }

  return {
    async getReviews() {
      const { placeId, apiKey } = readGoogleConfig();

      if (!placeId || !apiKey) {
        logger.warn(
          "[GoogleReviews] GOOGLE_PLACE_ID et/ou GOOGLE_PLACES_API_KEY absents : aucun avis ne sera affiché",
        );
        return notConfiguredPayload();
      }

      if (cache && cache.expiresAt > now()) {
        return cache.payload;
      }

      const payload = await fetchPlaceDetails({ placeId, apiKey });

      cache = { payload, expiresAt: now() + cacheTtlMs };

      return payload;
    },
  };
}

module.exports = {
  createGoogleReviewsService,
};
