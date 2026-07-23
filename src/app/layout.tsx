
import "./globals.css";
import MainProviders from "@/app/provider/MainProviders";
import Provider from "@/app/provider/Provider";
import { Toaster } from "sonner";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` antialiased`}>
        <MainProviders>
          <Provider>{children}</Provider>
          <Toaster position="top-center" />
        </MainProviders>
      </body>
    </html>
  );
}
