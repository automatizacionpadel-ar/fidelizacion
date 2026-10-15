import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-poppins" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-montserrat" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Fidelización — Tarjetas digitales para tu negocio",
  description:
    "Creá tu tarjeta de sellos o puntos, compartila con QR y sumá clientes fieles.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`h-full ${inter.variable} ${poppins.variable} ${montserrat.variable} ${playfair.variable}`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "#20201F", color: "#F0F0EE" }}
      >
        {children}
      </body>
    </html>
  );
}
