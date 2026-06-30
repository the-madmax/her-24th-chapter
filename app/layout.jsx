import "./globals.css";

export const metadata = {
  title: "Her 24th",
  description: "A cinematic birthday memory experience.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
