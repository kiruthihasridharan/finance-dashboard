import "./globals.css";

export const metadata = {
  title: "Finance Dashboard",
  description: "A modern finance dashboard built with Next.js and Material UI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
