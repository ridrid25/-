// ============================================================================
// HistoryTable.tsx — журнал расчётов (история) + счёт в Telegram
// Расчёт асфальта · версия В3 · палитра «Нефть-зелёный»
// ============================================================================
import { Send, X } from 'lucide-react';
import { JournalEntry, fmtNum } from './CalculatorEngine';

interface Props {
  journal: JournalEntry[];
  target: number;
  onTelegram: (e: JournalEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function HistoryTable({ journal, target, onTelegram, onDelete, onClear }: Props) {
  if (journal.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <p className="px-3.5 pb-2.5 pt-3 text-[11px] text-muted">
          Буфер хранит 7 последних расчётов. Кнопка ✈ — счёт бухгалтеру в Telegram.
        </p>
        <div className="px-4 py-6 text-center text-sm text-muted">
          Сохранённых расчётов пока нет. Откройте марку и нажмите «Сохранить».
        </div>
      </div>
    );
  }

  const anyVat = journal.some((e) => e.vat);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <p className="px-3.5 pb-1.5 pt-3 text-[11px] text-muted">
        Буфер хранит 7 последних расчётов. Кнопка ✈ — счёт бухгалтеру в Telegram.
      </p>
      <p className="flex items-center gap-1 px-3.5 pb-2.5 text-[10.5px] text-muted/80">
        ↔ таблицу можно листать вбок — марка остаётся на месте
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead>
            <tr>
              <Th sticky>Марка</Th>
              <Th>Объём, т</Th>
              <Th>Цена без НДС, ₽/т</Th>
              {anyVat && <Th>НДС, ₽/т</Th>}
              {anyVat && <Th>Цена с НДС, ₽/т</Th>}
              <Th>Скидка, %</Th>
              <Th>Сумма заказа, ₽</Th>
              <Th>Маржа, %</Th>
              <Th>Счёт</Th>
            </tr>
          </thead>
          <tbody>
            {journal.map((e) => {
              const paySum = e.vat ? e.totalGross : e.totalNet;
              const mPos = e.margin >= target;
              return (
                <tr key={e.id} className="tap animate-rise-in hover:bg-surface-2">
                  <TdSticky>{e.name}</TdSticky>
                  <Td>{fmtNum(e.V, 1)}</Td>
                  <Td>{fmtNum(e.priceNet)}</Td>
                  {anyVat && <Td>{e.vat ? fmtNum(e.vatPerTon) : '—'}</Td>}
                  {anyVat && <Td>{e.vat ? fmtNum(e.priceGross) : '—'}</Td>}
                  <Td className={e.disc !== 0 ? 'text-copper' : ''}>{fmtNum(e.disc, 1)}</Td>
                  <Td><b>{fmtNum(paySum)}</b></Td>
                  <Td className={mPos ? 'text-zone-green' : 'text-zone-red'}>{fmtNum(e.margin, 1)}</Td>
                  <td className="border-b border-line px-3 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onTelegram(e)}
                        className="btn-tactile btn-cta flex h-9 w-9 items-center justify-center rounded-lg bg-[#229ED9] text-white"
                        title="Счёт бухгалтеру в Telegram"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        className="btn-tactile flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-zone-red hover:border-zone-red/50"
                        title="Удалить запись"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={onClear}
        className="tap w-full border-t border-line bg-surface-2 py-3 text-xs text-muted hover:text-ink"
      >
        Очистить журнал
      </button>
    </div>
  );
}

function Th({ children, sticky }: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <th
      className={[
        'whitespace-nowrap bg-brand px-3 py-2.5 font-display text-[10.5px] font-semibold uppercase tracking-wide text-brand-ink',
        sticky ? 'sticky left-0 z-[2] text-left' : 'text-right',
      ].join(' ')}
    >
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`whitespace-nowrap border-b border-line px-3 py-2.5 text-right font-mono text-[13px] text-ink ${className}`}>
      {children}
    </td>
  );
}
function TdSticky({ children }: { children: React.ReactNode }) {
  return (
    <td className="sticky left-0 z-[2] whitespace-nowrap border-b border-line bg-surface px-3 py-2.5 text-left font-display text-[13px] font-semibold text-ink shadow-[1px_0_0_rgb(var(--line))]">
      {children}
    </td>
  );
}
