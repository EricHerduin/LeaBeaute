import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildCookieConsentPayload,
  COOKIE_CONSENT_OPEN_EVENT,
  DEFAULT_COOKIE_CATEGORIES,
  fetchCookieConsentFromBackend,
  getAnonymousVisitorId,
  isCookieConsentExpired,
  openCookieConsentManager,
  readStoredCookieConsent,
  saveCookieConsentLocally,
  syncCookieConsentWithBackend,
} from "@/lib/cookieConsent";
import {
  fetchCookiePolicyConfig,
  formatRetentionDuration,
  getCookiePolicyConfig,
} from "@/lib/cookiePolicyConfig";

function CookieCategoryRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${disabled ? "bg-[#F9F7F2]" : "bg-white"}`}>
      <div>
        <div className="font-medium text-[#1A1A1A]">{title}</div>
        <p className="mt-1 text-sm text-[#4A4A4A]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-[#D4AF37] text-[#D4AF37] focus:ring-[#D4AF37]"
      />
    </label>
  );
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_COOKIE_CATEGORIES);
  const [policyConfig, setPolicyConfig] = useState(getCookiePolicyConfig());

  useEffect(() => {
    let isMounted = true;

    async function bootstrapConsent() {
      const nextPolicyConfig = await fetchCookiePolicyConfig();
      if (isMounted) {
        setPolicyConfig(nextPolicyConfig);
      }

      const visitorId = getAnonymousVisitorId();
      const localConsent = readStoredCookieConsent();

      if (localConsent && !isCookieConsentExpired(localConsent)) {
        try {
          const savedConsent = await syncCookieConsentWithBackend({
            ...localConsent,
            anonymousVisitorId: localConsent.anonymousVisitorId || visitorId,
            categories: {
              ...DEFAULT_COOKIE_CATEGORIES,
              ...(localConsent.categories || {}),
              necessary: true,
            },
            source: localConsent.source || "local-sync",
          });
          if (!isMounted) return;
          saveCookieConsentLocally(savedConsent);
          setCategories(savedConsent.categories);
        } catch (error) {
          if (!isMounted) return;
          setCategories(localConsent.categories);
        }

        if (!isMounted) return;
        setShowBanner(false);
        return;
      }

      try {
        const serverConsent = await fetchCookieConsentFromBackend(visitorId);
        if (!isMounted) return;

        if (serverConsent && !isCookieConsentExpired(serverConsent)) {
          saveCookieConsentLocally(serverConsent);
          setCategories(serverConsent.categories);
          setShowBanner(false);
          return;
        }
      } catch {
        // Aucun consentement serveur disponible ou backend indisponible.
      }

      if (!isMounted) return;
      setShowBanner(true);
    }

    bootstrapConsent();

    const handleOpenManager = () => {
      setIsDialogOpen(true);
      setShowDetails(false);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenManager);
    return () => {
      isMounted = false;
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpenManager);
    };
  }, []);

  const persistConsent = async (nextCategories, source) => {
    const payload = buildCookieConsentPayload(nextCategories, source);
    saveCookieConsentLocally(payload);
    setCategories(payload.categories);
    setShowBanner(false);

    try {
      setIsSaving(true);
      const savedConsent = await syncCookieConsentWithBackend(payload);
      saveCookieConsentLocally(savedConsent);
      setCategories(savedConsent.categories);
    } catch (error) {
      console.error("Impossible de synchroniser le consentement cookies:", error);
    } finally {
      setIsSaving(false);
      setIsDialogOpen(false);
    }
  };

  const handleAcceptAll = async () => {
    await persistConsent(
      {
        necessary: true,
        preferences: true,
        analytics: true,
        marketing: true,
      },
      "accept-all",
    );
  };

  const handleRejectAll = async () => {
    await persistConsent(
      {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
      "reject-all",
    );
  };

  const handleSaveCustom = async () => {
    await persistConsent(categories, "preferences-center");
  };

  return (
    <>
      <AnimatePresence>
        {showBanner ? (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
              <div className="flex items-start gap-4">
                <Cookie className="mt-1 h-6 w-6 flex-shrink-0 text-[#D4AF37]" />

                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">
                    Gérez vos cookies
                  </h3>

                  <p className="mb-4 text-sm text-[#4A4A4A]">
                    Nous utilisons des cookies strictement nécessaires au fonctionnement du site.
                    Vous pouvez aussi choisir d&apos;autoriser ou non les cookies de préférences,
                    de mesure d&apos;audience et de marketing. Votre choix est conservé{" "}
                    {formatRetentionDuration(policyConfig.choiceRetentionDays)} et peut être modifié
                    à tout moment.
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={handleAcceptAll}
                      disabled={isSaving}
                      className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(180,137,31,0.22)] transition-colors hover:bg-[#B8952A] disabled:opacity-60"
                    >
                      Tout accepter
                    </button>

                    <button
                      onClick={handleRejectAll}
                      disabled={isSaving}
                      className="rounded-lg border border-[#D8C7A8] bg-white px-5 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors hover:border-[#D4AF37] hover:text-[#B8891F] disabled:opacity-60"
                    >
                      Tout refuser
                    </button>

                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="rounded-lg border border-[#D8C7A8] bg-white px-5 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors hover:border-[#D4AF37] hover:text-[#B8891F]"
                    >
                      Personnaliser
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => setShowDetails((value) => !value)}
                      className="text-[#D4AF37] hover:underline"
                    >
                      {showDetails ? "Masquer les détails" : "Voir les détails"}
                    </button>
                    <Link to="/cookies" className="text-[#4A4A4A] hover:text-[#D4AF37]">
                      Politique de cookies
                    </Link>
                  </div>

                  {showDetails ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-[#4A4A4A]"
                    >
                      <ul className="space-y-2">
                        <li><strong>Nécessaires :</strong> indispensables au fonctionnement du site et au stockage de votre choix.</li>
                        <li><strong>Préférences :</strong> mémorisation de certains réglages de confort.</li>
                        <li><strong>Mesure d&apos;audience :</strong> statistiques de fréquentation si activées ultérieurement.</li>
                        <li><strong>Marketing :</strong> contenus ou campagnes promotionnelles si activés ultérieurement.</li>
                      </ul>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!showBanner ? (
        <button
          type="button"
          onClick={openCookieConsentManager}
          title="Gérer mes cookies"
          aria-label="Gérer mes cookies"
          className="fixed bottom-4 left-4 z-40 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white/95 text-[#1A1A1A] shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:shadow-xl"
        >
          <span className="relative flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#F9F7F2]">
            <Cookie className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#B8891F]" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <span className="absolute left-1.5 bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <span className="absolute right-2 bottom-1.5 h-1 w-1 rounded-full bg-[#D4AF37]" />
          </span>
        </button>
      ) : null}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-14px)] max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Préférences cookies</DialogTitle>
            <DialogDescription>
              Modifiez vos préférences à tout moment. Les cookies nécessaires restent actifs
              car ils sont indispensables au fonctionnement du site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <CookieCategoryRow
              title="Cookies nécessaires"
              description="Fonctionnement du site, sécurité, conservation de votre choix de consentement."
              checked={true}
              disabled={true}
            />

            <CookieCategoryRow
              title="Cookies de préférences"
              description="Permettent de mémoriser certains réglages de confort si cette finalité est activée."
              checked={categories.preferences}
              onChange={(checked) =>
                setCategories((current) => ({ ...current, preferences: checked, necessary: true }))
              }
            />

            <CookieCategoryRow
              title="Mesure d'audience"
              description="Permettent d'analyser la fréquentation et l'utilisation du site si cette finalité est activée."
              checked={categories.analytics}
              onChange={(checked) =>
                setCategories((current) => ({ ...current, analytics: checked, necessary: true }))
              }
            />

            <CookieCategoryRow
              title="Marketing"
              description="Permettent des contenus ou campagnes promotionnelles si cette finalité est activée."
              checked={categories.marketing}
              onChange={(checked) =>
                setCategories((current) => ({ ...current, marketing: checked, necessary: true }))
              }
            />
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={handleAcceptAll}
              disabled={isSaving}
              className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(180,137,31,0.22)] hover:bg-[#B8952A] disabled:opacity-60"
            >
              Tout accepter
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              disabled={isSaving}
              className="rounded-lg border border-[#D8C7A8] bg-white px-5 py-2.5 text-sm font-medium text-[#4A4A4A] hover:border-[#D4AF37] hover:text-[#B8891F] disabled:opacity-60"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={handleSaveCustom}
              disabled={isSaving}
              className="rounded-lg border border-[#D8C7A8] bg-white px-5 py-2.5 text-sm font-medium text-[#4A4A4A] hover:border-[#D4AF37] hover:text-[#B8891F] disabled:opacity-60"
            >
              {isSaving ? "Enregistrement..." : "Personnaliser"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
