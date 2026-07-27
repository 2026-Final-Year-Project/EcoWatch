import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata = {
  title: "EcoWatch",
  description: "Protect The Planet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
