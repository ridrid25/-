// ============================================================================
// Flash.tsx — короткая подсветка значения при его изменении
// Чисто оформление: цифра «вспыхивает» медным тоном, чтобы взгляд цеплялся
// за то, что обновилось. Логику расчёта не затрагивает.
// ============================================================================
import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function Flash({
  value, className = '', children,
}: { value: string | number; className?: string; children: ReactNode }) {
  const [on, setOn] = useState(false);
  const prev = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; prev.current = value; return; }
    if (prev.current !== value) {
      prev.current = value;
      setOn(true);
      const t = setTimeout(() => setOn(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={`${className} ${on ? 'animate-flash rounded px-1 -mx-1' : ''}`}>{children}</span>
  );
}
