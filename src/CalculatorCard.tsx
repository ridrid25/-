// ============================================================================
// CalculatorCard.tsx — карточка одной марки асфальтобетона
// Расчёт асфальта · версия В3 · палитра «Нефть-зелёный»
// ============================================================================
import { ChevronDown, SlidersHorizontal, Save, X } from 'lucide-react';
import {
  CardInput, CalcResult, GlobalSettings, RECIPES, fmtRub, fmtNum, Zone,
} from './CalculatorEngine';
import Flash from './Flash';

interface Props {
  card: CardInput;
  result: CalcResult;
  settings: GlobalSettings;
  selected: boolean;
  onPatch: (patch: Partial<CardInput>) => void;
  onToggle: () => void;
  onOpenEngine: () => void;
  onSave: () => void;
  onDelete: () => void;
  onOpenRef: (refKey: string | null) => void;
}

// Смысловые цвета зон маржи — несут смысл, не трогаем палитрой
const zoneDot: Record<Zone, string> = {
  green: 'bg-zone-green',
  yellow: 'bg-zone-yellow',
  red: 'bg-zone-red',
};
const zoneSeg: Record<Zone, string> = {
  green: 'bg-zone-green',
  yellow: 'bg-zone-yellow',
  red: 'bg-zone-red',
};

// Числовое поле ввода
function NumField({
  label, unit, value, onChange,
}: { label: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col">
      <span className="mb-1.5 text-xs text-muted">{label}</span>
      <div className="relative flex items-center">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(parseFloat(e.target.value.replace(',', '.')) || 0)}
          className="tap w-full rounded-lg border border-line bg-surface py-2.5 pl-3 pr-10 font-mono text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <span className="pointer-events-none absolute right-3 font-mono text-xs text-muted">{unit}</span>
      </div>
    </label>
  );
}

// Строка метрики
function MetricRow({
  k, v, tone, highlight,
}: { k: string; v: string; tone?: 'pos' | 'neg' | 'gold'; highlight?: boolean }) {
  const toneCls = tone === 'pos' ? 'text-zone-green' : tone === 'neg' ? 'text-zone-red' : tone === 'gold' ? 'text-copper' : '';
  return (
    <div className={`flex items-baseline justify-between gap-2.5 px-3 py-2 ${highlight ? 'bg-accent' : 'bg-surface'}`}>
      <span className={`text-xs ${highlight ? 'text-accent-ink/70' : 'text-muted'}`}>{k}</span>
      <Flash
        value={v}
        className={`whitespace-nowrap text-right font-mono text-sm font-medium ${
          highlight
            ? (tone ? toneCls : 'text-accent-ink') + ' text-[15px] font-semibold'
            : (tone ? toneCls : 'text-ink')
        }`}
      >
        {v}
      </Flash>
    </div>
  );
}

export default function CalculatorCard({
  card, result: r, settings, selected,
  onPatch, onToggle, onOpenEngine, onSave, onDelete, onOpenRef,
}: Props) {
  const below = r.margin < settings.target - 1e-9;
  const ref = card.refKey ? RECIPES[card.refKey] : null;

  // карта торга — ширины зон
  const maxD = Math.min(Math.max(Math.ceil((r.dToBe + 8) / 5) * 5, 25), 70) || 25;
  const clamp = (x: number) => Math.max(0, Math.min(maxD, x));
  const wG = (clamp(r.dToTarget) / maxD) * 100;
  const wY = (Math.max(0, clamp(r.dToBe) - clamp(r.dToTarget)) / maxD) * 100;
  const wR = Math.max(0, 100 - wG - wY);
  const pos = (clamp(r.disc) / maxD) * 100;
  const zoneLabel = { green: 'Зелёная — держим цель', yellow: 'Жёлтая — ниже цели', red: 'Красная — убыток' }[r.zone];

  return (
    <div
      className={[
        'tap overflow-hidden rounded-xl border-t-[3px] bg-surface shadow-card',
        below
          ? 'border-t-zone-red border-x border-b border-x-zone-red/30 border-b-zone-red/30'
          : 'border-t-accent border-x border-b border-x-line border-b-line',
        selected ? 'shadow-lift ring-2 ring-accent' : 'hover:shadow-card-hover',
      ].join(' ')}
    >
      {/* Сводка — тап сворачивает/разворачивает */}
      <button
        onClick={onToggle}
        className="tap flex w-full items-center gap-2.5 px-3.5 py-3 text-left min-h-[44px] hover:bg-surface-2"
      >
        <span className={`h-2.5 w-2.5 flex-none rounded-full ${zoneDot[r.zone]} ${r.zone === 'red' ? 'animate-breathe' : ''}`} />
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold tracking-tight text-ink">{card.name}</span>
        <span className="whitespace-nowrap font-mono text-xs text-muted">
          <Flash value={Math.round(r.priceGross)}>{fmtNum(r.priceGross)} ₽/т</Flash> ·{' '}
          <Flash value={r.margin.toFixed(1)}><b className={r.margin >= settings.target ? 'text-zone-green' : 'text-zone-red'}>{fmtNum(r.margin, 1)}%</b></Flash>
        </span>
        <ChevronDown className={`tap h-4 w-4 flex-none text-muted ${card.collapsed ? '-rotate-90' : ''}`} />
      </button>

      {/* Тело карточки — плавное раскрытие по высоте */}
      <div className={`reveal ${card.collapsed ? '' : 'open'}`}>
        <div className="reveal-inner">
          <div className="border-t border-line">
            {/* Заголовок марки + удаление */}
            <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2 px-3.5 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <input
                  value={card.name}
                  onChange={(e) => onPatch({ name: e.target.value })}
                  className="tap w-full rounded bg-transparent font-display text-[15px] font-semibold tracking-tight text-ink outline-none focus:bg-surface focus:px-1"
                />
                <button
                  onClick={() => onOpenRef(card.refKey)}
                  className="tap text-left text-[10.5px] text-muted underline decoration-dotted underline-offset-2 hover:text-copper"
                >
                  {ref ? `рецептура · ${ref.gost}` : 'рецептура не задана'}
                </button>
              </div>
              <button
                onClick={onDelete}
                className="btn-tactile flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-surface text-muted hover:border-zone-red/50 hover:text-zone-red"
                title="Убрать марку"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5">
              {/* Поля ввода */}
              <div className="mb-4 flex flex-col gap-3">
                <NumField label="Объём поставки" unit="т" value={card.volume} onChange={(v) => onPatch({ volume: v })} />
                <NumField label={settings.vat ? 'Прайс с НДС, ₽/т' : 'Прайс без НДС, ₽/т'} unit="₽" value={card.basePrice} onChange={(v) => onPatch({ basePrice: v })} />
                <NumField label="Скидка, % (наценка — со знаком −)" unit="%" value={card.disc} onChange={(v) => onPatch({ disc: v })} />
              </div>

              {/* Метрики */}
              <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
                <MetricRow k="Себестоимость сырья (с потерями)" v={fmtRub(r.rawPerTon) + '/т'} />
                {r.disc !== 0 ? (
                  <MetricRow k={`Цена со скидкой ${fmtNum(r.disc, 1)}%`} v={fmtRub(r.priceGross) + '/т'} tone="gold" />
                ) : (
                  <MetricRow k={`Цена покупателю${settings.vat ? ' (с НДС)' : ''}`} v={fmtRub(r.priceGross) + '/т'} />
                )}
                {settings.vat && <MetricRow k="— в т.ч. без НДС" v={fmtRub(r.priceNet) + '/т'} />}
                {settings.vat && <MetricRow k="— в т.ч. НДС 22%" v={fmtRub(r.vatPerTon) + '/т'} />}
                <MetricRow k="Фактическая маржинальность" v={fmtNum(r.margin, 1) + ' %'} tone={r.margin >= settings.target ? 'pos' : 'neg'} highlight />
              </div>

              {/* Карта торга */}
              <div className="mt-3.5 rounded-lg border border-line bg-surface p-3 shadow-card">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted">Карта торга</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.zone === 'green' ? 'bg-zone-green/15 text-zone-green'
                    : r.zone === 'yellow' ? 'bg-zone-yellow/15 text-zone-yellow'
                    : 'bg-zone-red/15 text-zone-red'}`}>{zoneLabel}</span>
                </div>
                <div className="relative flex h-3.5 overflow-hidden rounded-full bg-line">
                  <div className={`${zoneSeg.green} tap`} style={{ width: `${wG}%` }} />
                  <div className={`${zoneSeg.yellow} tap`} style={{ width: `${wY}%` }} />
                  <div className={`${zoneSeg.red} tap`} style={{ width: `${wR}%` }} />
                  {/* маркер плавно скользит при изменении скидки */}
                  <div
                    className="absolute -top-1 bottom-[-4px] w-0.5 bg-copper transition-[left] duration-200 ease-smooth"
                    style={{ left: `${pos}%` }}
                  >
                    <span className="absolute -left-1.5 -top-2 h-3.5 w-3.5 rounded-full border-2 border-surface bg-copper shadow-[0_1px_3px_rgba(0,0,0,0.3)]" />
                  </div>
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
                  <span>0 %</span><span>{fmtNum(maxD)} %</span>
                </div>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Скидка без потери цели</span>
                    <span className="font-mono font-semibold text-zone-green">{r.dToTarget >= 0 ? `до ${fmtNum(r.dToTarget, 1)} %` : 'недоступно'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Скидка до нуля прибыли</span>
                    <span className="font-mono font-semibold text-copper">{r.dToBe >= 0 ? `до ${fmtNum(r.dToBe, 1)} %` : 'уже убыток'}</span>
                  </div>
                </div>
                <div className="mt-2 font-mono text-[10.5px] text-muted">
                  Границы: цель {isFinite(r.pTgt) ? fmtNum(r.pTgt) : '—'} ₽/т · ноль {fmtNum(r.pBe)} ₽/т
                </div>
              </div>

              {below && (
                <div className="mt-3.5 rounded-lg border border-zone-red bg-zone-red/10 px-3 py-2.5 text-xs font-medium text-zone-red animate-fade-in">
                  ⚠ Маржинальность {fmtNum(r.margin, 1)}% ниже целевой {fmtNum(settings.target, 1)}%. Цена под цель: {fmtRub(r.pTgt)}/т (скидка до {fmtNum(Math.max(0, r.dToTarget), 1)}%).
                </div>
              )}

              {/* Кнопки */}
              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <button
                  onClick={onOpenEngine}
                  className="btn-tactile group flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-accent/40 bg-surface py-3 text-sm font-semibold text-accent hover:border-accent"
                >
                  <SlidersHorizontal className="h-4 w-4 tap group-hover:-translate-y-px group-hover:rotate-3" /> Движок
                </button>
                <button
                  onClick={onSave}
                  className="btn-tactile btn-cta group flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-accent-ink"
                >
                  <Save className="h-4 w-4 tap group-hover:-translate-y-px" /> Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
