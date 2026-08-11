import ToastProvider from "@/components/common/ToastProvider";
import TopNav from "@/components/layout/TopNav";
import "./globals.css";

export const metadata = {
  title: "Escapa2 — ¿Dónde nos escapamos?",
  description:
    "Encuentra destinos, alojamiento, transporte y planes para vuestra próxima escapada.",
  openGraph: {
    title: "Escapa2 — ¿Dónde nos escapamos?",
    description:
      "Encuentra destinos, alojamiento, transporte y planes para vuestra próxima escapada.",
    type: "website",
    locale: "es_ES",
    siteName: "Escapa2",
  },
  twitter: {
    card: "summary_large_image",
    title: "Escapa2 — ¿Dónde nos escapamos?",
    description:
      "Encuentra destinos, alojamiento, transporte y planes para vuestra próxima escapada.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <ToastProvider>
          <TopNav />
          {children}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                  });
                }
              `,
            }}
          />
        </ToastProvider>
      </body>
    </html>
  );
}
