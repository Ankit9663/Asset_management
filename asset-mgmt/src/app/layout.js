import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Gujarat R&B Asset Management",
  description: "Roads & Buildings Department — Asset Tracking, Condition Monitoring & Maintenance Issue Management",
  keywords: "Gujarat, R&B, Roads, Buildings, Asset Management, Infrastructure, Maintenance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <div className="app-main">
              <Header />
              <div className="app-content">
                {children}
              </div>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
