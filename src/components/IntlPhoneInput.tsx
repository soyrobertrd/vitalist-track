import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import {
  formatAsYouType,
  isValidIntlPhone,
  placeholderForCountry,
} from "@/lib/intlPhone";
import type { CountryCode } from "libphonenumber-js";

interface IntlPhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  /** Override country (defaults to workspace/user locale) */
  country?: CountryCode;
  /** Show inline validation hint (default true) */
  showHint?: boolean;
  /** Required field — affects empty-state validation */
  required?: boolean;
}

/**
 * Country-aware phone input that uses libphonenumber-js to format as the
 * user types and validates against the workspace/user locale country.
 */
export const IntlPhoneInput = forwardRef<HTMLInputElement, IntlPhoneInputProps>(
  ({ value, onChange, country, showHint = true, required = false, className, placeholder, ...rest }, ref) => {
    const { countryCode } = useLocale();
    const effectiveCountry: CountryCode = country || countryCode;
    const [touched, setTouched] = useState(false);

    // Re-format when country changes
    useEffect(() => {
      if (value) {
        const formatted = formatAsYouType(value, effectiveCountry);
        if (formatted !== value) onChange(formatted);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveCountry]);

    const isEmpty = !value || value.trim() === "";
    const isValid = isEmpty ? !required : isValidIntlPhone(value, effectiveCountry);
    const showError = touched && !isValid;

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          placeholder={placeholder ?? placeholderForCountry(effectiveCountry)}
          onChange={(e) => {
            const formatted = formatAsYouType(e.target.value, effectiveCountry);
            onChange(formatted);
          }}
          onBlur={() => setTouched(true)}
          className={cn(showError && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={showError || undefined}
          {...rest}
        />
        {showHint && (
          <p className={cn("text-xs", showError ? "text-destructive" : "text-muted-foreground")}>
            {showError
              ? "Número de teléfono inválido"
              : `Formato internacional para ${effectiveCountry}`}
          </p>
        )}
      </div>
    );
  },
);
IntlPhoneInput.displayName = "IntlPhoneInput";
