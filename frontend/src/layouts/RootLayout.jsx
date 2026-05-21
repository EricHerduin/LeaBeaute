import { Outlet } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { Suspense } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollTopFab from "@/components/ScrollTopFab";
import CookieConsent from "@/components/CookieConsent";
import GoogleAnalyticsConsentBridge from "@/components/GoogleAnalyticsConsentBridge";
import StructuredData from "@/components/StructuredData";
import AppErrorBoundary from "@/components/AppErrorBoundary";

export default function RootLayout() {
  return (
    <HelmetProvider>
      <AppErrorBoundary>
        <StructuredData />
        <ScrollToTop />
        <GoogleAnalyticsConsentBridge />
        <Suspense fallback={<div aria-hidden="true" />}>
          <Outlet />
        </Suspense>
        <CookieConsent />
        <ScrollTopFab />
        <Toaster richColors position="top-center" />
      </AppErrorBoundary>
    </HelmetProvider>
  );
}
