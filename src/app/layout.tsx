import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galaxy AI - Visual AI Workflow Builder",
  description: "Build powerful AI workflows with a visual drag-and-drop interface",
  keywords: ["AI", "workflow", "automation", "LLM", "visual builder"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#12121a",
          colorInputBackground: "#18181f",
          colorText: "#ffffff",
          colorTextSecondary: "#a1a1aa",
          borderRadius: "8px",
        },
        elements: {
          card: "bg-[#12121a] border border-[#2a2a35]",
          formButtonPrimary: "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white",
          footerActionLink: "text-[#8b5cf6] hover:text-[#a78bfa]",
          rootBox: "bg-[#0a0a0f]",
          cardBox: "bg-[#12121a]",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
