import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TransactionProvider } from "@/context/TransactionContext";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <TransactionProvider>
        <Slot />
      </TransactionProvider>
    </>
  );
}
