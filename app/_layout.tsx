import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TransactionProvider } from "@/context/TransactionContext";
import { AlertProvider } from "@/context/AlertContext";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <TransactionProvider>
        <AlertProvider>
          <Slot />
        </AlertProvider>
      </TransactionProvider>
    </>
  );
}
