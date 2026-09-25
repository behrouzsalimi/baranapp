import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";

export const metadata: Metadata = {
  title: "اپلیکیشن باران",
  description: "برنامه تمرین و انگیزه باران",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}