import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { cn, toEnglishDigits } from '../../utils/helpers';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OTPInput({ length = 5, onComplete, disabled, error }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    // Convert Persian to English digits
    const digit = toEnglishDigits(value).slice(-1);

    if (!/^\d*$/.test(digit)) return;

    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    if (newValues.every((v) => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValues = [...values];

      if (values[index]) {
        newValues[index] = '';
        setValues(newValues);
      } else if (index > 0) {
        newValues[index - 1] = '';
        setValues(newValues);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focusInput(index + 1); // RTL
    } else if (e.key === 'ArrowRight') {
      focusInput(index - 1); // RTL
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = toEnglishDigits(e.clipboardData.getData('text')).replace(/\D/g, '');
    const digits = pastedData.slice(0, length).split('');

    const newValues = [...values];
    digits.forEach((digit, i) => {
      newValues[i] = digit;
    });
    setValues(newValues);

    // Focus last filled or next empty
    const nextIndex = Math.min(digits.length, length - 1);
    focusInput(nextIndex);

    if (newValues.every((v) => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-3 justify-center" dir="ltr">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            'otp-input',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}
