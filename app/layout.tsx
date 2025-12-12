import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/global.scss";

import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Proflo",
  description: "A clean workspace for agencies & freelancers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 2600,
            style: {
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              color: "var(--text)",
              padding: "14px 16px",
              borderRadius: "5px",
              fontSize: "15px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
            },
          }}
        />
      </body>
    </html>
  );
}
