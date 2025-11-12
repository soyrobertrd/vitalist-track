import { useState, useEffect } from "react";
import { validatePhoneNumber, normalizePhoneNumber, formatPhoneNumber, type PhoneValidationResult } from "@/lib/validaciones";

interface UsePhoneValidationProps {
  phone: string;
  required?: boolean;
}

export function usePhoneValidation({ phone, required = false }: UsePhoneValidationProps) {
  const [validation, setValidation] = useState<PhoneValidationResult>({
    isValid: true,
    normalized: "",
    formatted: "",
    errors: []
  });

  useEffect(() => {
    // Si el campo no es requerido y está vacío, es válido
    if (!required && (!phone || phone.trim() === "")) {
      setValidation({
        isValid: true,
        normalized: "",
        formatted: "",
        errors: []
      });
      return;
    }

    // Validar el número
    const result = validatePhoneNumber(phone);
    setValidation(result);
  }, [phone, required]);

  return {
    ...validation,
    normalize: (value: string) => normalizePhoneNumber(value),
    format: (value: string) => formatPhoneNumber(value)
  };
}
