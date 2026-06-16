import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "./globals.css";
import "@/styles/responsive.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Pupi — Inteligencia operativa",
  description:
    "Pupi analiza la operación de tu negocio y entrega diagnósticos claros y accionables para decidir mejor.",
  openGraph: {
    title: "Pupi — Inteligencia operativa",
    description:
      "Diagnósticos operativos claros para consultores y dueños de negocio.",
    type: "website",
    locale: "es",
    siteName: "Pupi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
