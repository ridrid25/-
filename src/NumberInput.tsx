// ============================================================================
// NumberInput.tsx — числовой ввод, сохраняющий промежуточный набор
// Держит «сырую» строку, пока поле редактируется, поэтому можно набрать
// «1.», «-», «-1.5» (наценка со знаком −) без преждевременного округления.
// Наружу отдаёт число — сигнатура onChange та же: (v: number) => void.
// ============================================================================
import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';

type Props = {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>;

function fmt(v: number): string {
  return Number.isFinite(v) ? String(v) : '';
}

export default function NumberInput({ value, onChange, readOnly, ...rest }: Props) {
  const [text, setText] = useState(() => fmt(value));
  const editing = useRef(false);

  // Пока пользователь не редактирует — отражаем внешнее значение
  // (например, изменение через ползунок или из другого места модели).
  useEffect(() => {
    if (!editing.current) setText(fmt(value));
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      readOnly={readOnly}
      onFocus={(e) => { editing.current = true; rest.onFocus?.(e); }}
      onBlur={(e) => { editing.current = false; setText(fmt(value)); rest.onBlur?.(e); }}
      onChange={(e) => {
        const raw = e.target.value;
        // допускаем только число-подобный ввод (цифры, точка/запятая, минус)
        if (!/^-?[\d.,]*$/.test(raw)) return;
        setText(raw);
        // промежуточные состояния не нормализуем в значение
        if (raw === '' || raw === '-' || raw === '.' || raw === ',' || raw === '-.' || raw === '-,') {
          onChange?.(0);
          return;
        }
        const n = parseFloat(raw.replace(',', '.'));
        if (Number.isFinite(n)) onChange?.(n);
      }}
    />
  );
}
