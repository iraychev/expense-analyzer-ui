import React, { createContext, useState, useContext, ReactNode } from "react";
import AlertModal from "@/components/AlertModal";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertContextType = {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AlertButton[]>([{ text: "OK" }]);

  const showAlert = (title: string, message: string, buttons: AlertButton[] = [{ text: "OK" }]) => {
    setTitle(title);
    setMessage(message);
    setButtons(buttons);
    setVisible(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        visible={visible}
        title={title}
        message={message}
        buttons={buttons.map((btn) => ({
          ...btn,
          onPress: btn.onPress ?? (() => {}),
        }))}
        onClose={() => setVisible(false)}
      />
    </AlertContext.Provider>
  );
}

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
