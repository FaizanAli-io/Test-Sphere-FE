import { useState, useCallback } from "react";

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: "",
    message: "",
  });
  const [resolveConfirm, setResolveConfirm] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((confirmOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions);
      setResolveConfirm(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveConfirm) {
      resolveConfirm(true);
      setResolveConfirm(null);
    }
    setIsOpen(false);
  }, [resolveConfirm]);

  const handleCancel = useCallback(() => {
    if (resolveConfirm) {
      resolveConfirm(false);
      setResolveConfirm(null);
    }
    setIsOpen(false);
  }, [resolveConfirm]);

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  };
};
