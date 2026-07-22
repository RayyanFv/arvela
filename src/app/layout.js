import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Arvela - HR SaaS Platform",
  description: "Modern HR SaaS Platform",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.variable} ${instrumentSerif.variable} font-sans antialiased bg-background text-foreground tracking-[-0.04em]`}>
        <TooltipProvider>
            {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
