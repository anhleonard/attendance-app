"use client";
import "./globals.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import Modal from "@/components/modal";
import Drawer from "@/lib/drawer";
import ConfirmModal from "@/components/confirm-modal";
import Loading from "@/lib/loading";
import { Alert } from "@/components/alert";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { Source_Sans_3 } from "next/font/google";

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-source-sans-3",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sourceSans3.className} ${sourceSans3.variable}`}>
      <body suppressHydrationWarning className="font-normal">
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <GlobalErrorHandler />
            <div>{children}</div>
            <Modal />
            <Drawer />
            <ConfirmModal />
            <Loading />
            <Alert />
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
