import { Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Arvela - HR SaaS Platform",
  description: "Modern HR SaaS Platform",
  icons: {
    icon: "/arvela-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.variable} font-sans antialiased text-sidebar-bg bg-background`}>
        <TooltipProvider>
            {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
