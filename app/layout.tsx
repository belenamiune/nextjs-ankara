import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Ankara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Footer />
      </body>
    </html>
  );
}
