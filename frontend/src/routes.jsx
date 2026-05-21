import { lazy } from "react";
import RootLayout from "@/layouts/RootLayout";
import LandingPage from "@/pages/LandingPage";

const GuinotPage = lazy(() => import("@/pages/GuinotPage"));
const CoachingPage = lazy(() => import("@/pages/CoachingPage"));
const GiftCardSuccess = lazy(() => import("@/pages/GiftCardSuccess"));
const MentionsLegales = lazy(() => import("@/pages/MentionsLegales"));
const Confidentialite = lazy(() => import("@/pages/Confidentialite"));
const Cookies = lazy(() => import("@/pages/Cookies"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AboutInstitut = lazy(() => import("@/pages/AboutInstitut"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const routes = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "guinot", element: <GuinotPage /> },
      { path: "accompagnement-nutrition", element: <CoachingPage /> },
      { path: "gift-card-success", element: <GiftCardSuccess /> },
      { path: "mentions-legales", element: <MentionsLegales /> },
      { path: "confidentialite", element: <Confidentialite /> },
      { path: "cookies", element: <Cookies /> },
      { path: "admin", element: <AdminPage /> },
      { path: "a-propos-institut", element: <AboutInstitut /> },
      { path: "prestations", element: <ServicesPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
