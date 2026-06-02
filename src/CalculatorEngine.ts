// ============================================================================
// CalculatorEngine.ts — вся бизнес-логика калькулятора АБС (без UI)
// Расчёт асфальта · версия В3
// ============================================================================

// ----- Константы модели -----
export const VAT_RATE = 0.22; // НДС 22% (по ТЗ; в РФ обычно 20% — поменяйте при необходимости)
export const LOSS = 1.02;     // системные потери сырья +2%
export const JOURNAL_LIMIT = 7;

// ----- Типы -----
export type MaterialKey =
  | 'st2040' | 'st1622' | 'st816' | 'st520' | 'st48'
  | 'sand04' | 'otsev' | 'mp1' | 'b5070' | 'b70100' | 'stab';

export interface Material {
  key: MaterialKey;
  name: string;
  price: number;          // ₽/т — закупочная цена по умолчанию
  min: number;
  max: number;
  step: number;
  group: string;          // для группировки в таблице 01
}

/** Позиция рецепта: [ключ материала, кг на 1 т смеси] */
export type RecipeItem = [MaterialKey, number];

export interface RecipeRow {
  label: string;          // как в документе
  kg: number;             // кг/т
  source: string;         // источник ДСМ
}

export interface RecipeMeta {
  key: string;
  name: string;
  gost: string;
  bitum: string;
  layer: string;
  density: string;
  recipe: RecipeItem[];   // для расчёта
  rows: RecipeRow[];      // для справочника (как в документе)
}

export interface ProdCost {
  id: string;
  name: string;
  val: number;            // ₽/т
}

export interface GlobalSettings {
  matPrices: Record<MaterialKey, number>;
  prodCosts: ProdCost[];
  vat: boolean;
  target: number;         // целевая маржа, %
  delivery: boolean;
  capacity: number;       // т
  tripCost: number;       // ₽
}

export interface CardInput {
  id: string;
  name: string;
  recipe: RecipeItem[];
  refKey: string | null;
  volume: number;
  basePrice: number;      // прайс (с НДС, если режим НДС)
  disc: number;           // скидка %, >0 скидка, <0 наценка
  collapsed: boolean;
}

export type Zone = 'green' | 'yellow' | 'red';

export interface CalcResult {
  rawPerTon: number;
  unitCost: number;
  Cfull: number;          // полная себест. на тонну с логистикой
  P0: number;             // прайс (брутто)
  P0net: number;          // прайс без НДС
  disc: number;
  trips: number;
  logistics: number;
  priceGross: number;     // цена с НДС после скидки
  priceNet: number;       // цена без НДС
  vatPerTon: number;
  totalGross: number;
  totalNet: number;
  totalVat: number;
  fullCost: number;
  revenue: number;
  profit: number;
  margin: number;
  pTgt: number;           // цена под целевую маржу
  pBe: number;            // цена нулевой прибыли
  dToTarget: number;      // макс. скидка с сохранением цели, %
  dToBe: number;          // макс. скидка до нуля прибыли, %
  zone: Zone;
  remTarget: number;
  remBe: number;
  bep: number;            // точка безубыточности, т
  V: number;
}

export interface JournalEntry {
  id: string;
  ts: number;
  name: string;
  V: number;
  disc: number;
  P0: number;
  priceGross: number;
  priceNet: number;
  vatPerTon: number;
  totalGross: number;
  totalNet: number;
  totalVat: number;
  cost: number;
  profit: number;
  margin: number;
  vat: boolean;
  delivery: boolean;
}

export interface AppConfig {
  ADMIN_PIN: string;
  TG_CHAT_ID: string;
  TG_PHONE: string;
  COMPANY: string;
}

// ----- Настройки (правьте под себя) -----
export const CONFIG: AppConfig = {
  ADMIN_PIN: '2026',
  TG_CHAT_ID: '300023851',
  TG_PHONE: '+79183033323',
  COMPANY: 'ООО «Фирма ЮДС»',
};

// ----- Каталог сырья (номенклатура из рецептов) -----
export const CATALOG: Material[] = [
  { key: 'st2040', name: 'Щебень фр. 20–40 мм', price: 1350, min: 0, max: 4000, step: 25, group: 'Щебень' },
  { key: 'st1622', name: 'Щебень фр. 16–22 мм', price: 1500, min: 0, max: 4000, step: 25, group: 'Щебень' },
  { key: 'st816', name: 'Щебень фр. 8–16 мм', price: 1550, min: 0, max: 4000, step: 25, group: 'Щебень' },
  { key: 'st520', name: 'Щебень фр. 5–20 мм', price: 1450, min: 0, max: 4000, step: 25, group: 'Щебень' },
  { key: 'st48', name: 'Щебень фр. 4–8 мм', price: 1700, min: 0, max: 4000, step: 25, group: 'Щебень' },
  { key: 'sand04', name: 'Песок дроблёный 0–4 мм', price: 900, min: 0, max: 3000, step: 25, group: 'Песок и отсев' },
  { key: 'otsev', name: 'Отсев 0–10 мм', price: 650, min: 0, max: 3000, step: 25, group: 'Песок и отсев' },
  { key: 'mp1', name: 'Минеральный порошок МП-1', price: 4500, min: 0, max: 9000, step: 50, group: 'Минеральный порошок' },
  { key: 'b5070', name: 'Битум БНД 50/70', price: 35000, min: 0, max: 70000, step: 500, group: 'Битумное вяжущее' },
  { key: 'b70100', name: 'Битум БНД 70/100', price: 34000, min: 0, max: 70000, step: 500, group: 'Битумное вяжущее' },
  { key: 'stab', name: 'Стаб. добавка «Стилобит»', price: 120000, min: 0, max: 250000, step: 1000, group: 'Добавки' },
];

export const CATALOG_MAP: Record<MaterialKey, Material> = CATALOG.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {} as Record<MaterialKey, Material>);

// ----- Рецептуры (кг на 1 т смеси, из загруженных документов) -----
export const RECIPES: Record<string, RecipeMeta> = {
  a11vn: {
    key: 'a11vn', name: 'А-11 ВН', gost: 'ГОСТ Р 58406.2-2020', bitum: 'БНД 50/70', layer: 'не указан', density: '2,636 (мин. часть)',
    recipe: [['st816', 274], ['st48', 236], ['sand04', 358], ['mp1', 75], ['b5070', 57]],
    rows: [
      { label: 'Щебень фр. 16,0–22,0 мм', kg: 0, source: 'ООО «Выбор-С»' },
      { label: 'Щебень фр. 8,0–11,2 мм', kg: 274, source: 'ООО «Выбор-С»' },
      { label: 'Щебень фр. 4,0–8,0 мм', kg: 236, source: 'ООО «Выбор-С»' },
      { label: 'Песок дроблёный фр. 0–4,0 мм', kg: 358, source: 'ООО «Выбор-С»' },
      { label: 'Минеральный порошок МП-1', kg: 75, source: 'ООО «Крымский ЖБИ»' },
      { label: 'Битумное вяжущее БНД 50/70', kg: 57, source: '—' },
    ],
  },
  a16vn: {
    key: 'a16vn', name: 'А-16 ВН', gost: 'ГОСТ Р 58406.2-2020', bitum: 'БНД 50/70', layer: 'не указан', density: '—',
    recipe: [['st816', 342], ['st48', 237], ['sand04', 304], ['mp1', 66], ['b5070', 50]],
    rows: [
      { label: 'Щебень фр. 8,0–16,0 мм', kg: 342, source: 'ООО «Выбор-С»' },
      { label: 'Щебень фр. 4,0–8,0 мм', kg: 237, source: 'ООО «Выбор-С»' },
      { label: 'Песок дроблёный фр. 0–4,0 мм', kg: 304, source: 'ООО «Выбор-С»' },
      { label: 'Активир. мин. порошок МП-1', kg: 66, source: 'ООО «Крымский ЖБИ»' },
      { label: 'Битумное вяжущее БНД 50/70', kg: 50, source: '—' },
    ],
  },
  a22nn: {
    key: 'a22nn', name: 'А-22 НН', gost: 'ГОСТ Р 58406.2-2020', bitum: 'БНД 50/70', layer: 'не указан', density: '—',
    recipe: [['st1622', 315], ['st816', 268], ['sand04', 306], ['mp1', 67], ['b5070', 44]],
    rows: [
      { label: 'Щебень фр. 16–22,4 мм', kg: 315, source: 'ООО «Выбор-С»' },
      { label: 'Щебень фр. 8–16,0 мм', kg: 268, source: 'ООО «Выбор-С»' },
      { label: 'Песок дроблёный 0–4 мм', kg: 306, source: 'ООО «Выбор-С»' },
      { label: 'Минеральный порошок МП-1', kg: 67, source: 'ООО «Выбор-С»' },
      { label: 'Битумное вяжущее БНД 50/70', kg: 44, source: '—' },
    ],
  },
  krupnoz: {
    key: 'krupnoz', name: 'Крупнозернистая пористая', gost: 'ГОСТ 9128-2009', bitum: 'БНД 70/100', layer: 'Нижний слой · II марка', density: '2,395',
    recipe: [['st2040', 163], ['st520', 220], ['otsev', 335], ['sand04', 239], ['b70100', 43]],
    rows: [
      { label: 'Щебень фр. св 20 до 40 мм', kg: 163, source: 'ООО «Мехтранссервис»' },
      { label: 'Щебень фр. 5 до 20 мм', kg: 220, source: 'ООО «Мехтранссервис»' },
      { label: 'Отсев 0–10', kg: 335, source: 'ООО «Мехтранссервис»' },
      { label: 'Песок 0–4', kg: 239, source: 'ООО «Майкопская нерудная компания»' },
      { label: 'Битум БНД 70/100', kg: 43, source: 'ООО «ГАЗПРОМНЕФТЬ-БМ»' },
    ],
  },
  melkoz: {
    key: 'melkoz', name: 'Мелкозернистая плотная тип Б', gost: 'ГОСТ 9128-2009', bitum: 'БНД 50/70', layer: 'Верхний слой · тип Б, II марка', density: '2,416',
    recipe: [['st520', 303], ['otsev', 379], ['sand04', 218], ['mp1', 47], ['b5070', 53]],
    rows: [
      { label: 'Щебень фр. св 5 до 20 мм', kg: 303, source: 'ООО «Мехтранссервис»' },
      { label: 'Отсев 0–10', kg: 379, source: 'ООО «Мехтранссервис»' },
      { label: 'Песок 0–4', kg: 218, source: '—' },
      { label: 'Мин. порошок МП-1 (актив.)', kg: 47, source: '—' },
      { label: 'Битум БНД 50/70', kg: 53, source: 'ООО «ГАЗПРОМНЕФТЬ-БМ»' },
    ],
  },
  shma11: {
    key: 'shma11', name: 'ЩМА-11', gost: 'ГОСТ Р 58406.1-2020', bitum: 'БНД 50/70', layer: 'Верхний слой покрытия', density: '—',
    recipe: [['st816', 394], ['st48', 281], ['sand04', 150], ['mp1', 113], ['b5070', 58.2], ['stab', 3.8]],
    rows: [
      { label: 'Щебень фр. 16,0–22,0 мм', kg: 0, source: '—' },
      { label: 'Щебень фр. 8,0–16,0 мм', kg: 394, source: 'ООО «Выбор-С»' },
      { label: 'Щебень фр. 4,0–8,0 мм', kg: 281, source: 'ООО «Выбор-С»' },
      { label: 'Песок дроблёный фр. 0–4,0 мм', kg: 150, source: 'ООО «Выбор-С»' },
      { label: 'Минеральный порошок МП-1', kg: 113, source: 'ООО «Крымский ЖБИ»' },
      { label: 'Битумное вяжущее БНД 50/70', kg: 58.2, source: '—' },
      { label: 'Стабилизирующая добавка «Стилобит»', kg: 3.8, source: '—' },
    ],
  },
};

export const BASE_ORDER = ['a11vn', 'a16vn', 'a22nn', 'krupnoz', 'melkoz', 'shma11'];

// ----- Утилиты форматирования -----
export function fmtNum(n: number, dec = 0): string {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function fmtRub(n: number, dec = 0): string {
  return fmtNum(n, dec) + ' ₽';
}

// ----- Дефолтные настройки и карточки -----
let _seq = 0;
export function uid(): string {
  _seq += 1;
  return 'c' + _seq + Math.floor(Math.random() * 10000);
}

export function defaultSettings(): GlobalSettings {
  const matPrices = CATALOG.reduce((acc, m) => {
    acc[m.key] = m.price;
    return acc;
  }, {} as Record<MaterialKey, number>);
  return {
    matPrices,
    prodCosts: [
      { id: uid(), name: 'Зарплата', val: 250 },
      { id: uid(), name: 'Электроэнергия', val: 180 },
      { id: uid(), name: 'Механизмы', val: 220 },
      { id: uid(), name: 'Амортизация', val: 150 },
      { id: uid(), name: 'Прочие расходы', val: 100 },
    ],
    vat: false,
    target: 25,
    delivery: false,
    capacity: 25,
    tripCost: 8000,
  };
}

export function makeCard(name: string, recipe: RecipeItem[], refKey: string | null, collapsed = true): CardInput {
  return {
    id: uid(),
    name,
    recipe: recipe.map((r) => [r[0], r[1]] as RecipeItem),
    refKey,
    volume: 100,
    basePrice: 6000,
    disc: 0,
    collapsed,
  };
}

export function defaultCards(): CardInput[] {
  return BASE_ORDER.map((k) => makeCard(RECIPES[k].name, RECIPES[k].recipe, k, true));
}

// ----- Ядро расчёта -----
export function compute(card: CardInput, s: GlobalSettings): CalcResult {
  let rawPerTon = 0;
  for (const [key, kg] of card.recipe) {
    rawPerTon += (kg / 1000) * (s.matPrices[key] || 0);
  }
  rawPerTon *= LOSS;

  const prodPerTon = s.prodCosts.reduce((sum, p) => sum + (Number(p.val) || 0), 0);

  const V = Number(card.volume) || 0;
  const P0 = Number(card.basePrice) || 0;
  const disc = Number(card.disc) || 0;
  const price = P0 * (1 - disc / 100); // брутто после скидки
  const unitCost = rawPerTon + prodPerTon;

  let trips = 0;
  let logistics = 0;
  if (s.delivery && s.capacity > 0) {
    trips = Math.ceil(V / s.capacity);
    logistics = trips * s.tripCost;
  }
  const logiPerTon = V > 0 ? logistics / V : 0;
  const Cfull = unitCost + logiPerTon;

  const vatDiv = s.vat ? 1 + VAT_RATE : 1;
  const netPerTon = price / vatDiv;
  const fullCost = unitCost * V + logistics;
  const revenue = netPerTon * V;
  const profit = revenue - fullCost;
  const margin = netPerTon > 0 ? ((netPerTon - Cfull) / netPerTon) * 100 : 0;

  const t = s.target / 100;
  const pTgt = t < 1 ? (Cfull * vatDiv) / (1 - t) : Infinity;
  const pBe = Cfull * vatDiv;
  const dToTarget = P0 > 0 ? ((P0 - pTgt) / P0) * 100 : 0;
  const dToBe = P0 > 0 ? ((P0 - pBe) / P0) * 100 : 0;
  const zone: Zone = disc <= dToTarget + 1e-9 ? 'green' : disc <= dToBe + 1e-9 ? 'yellow' : 'red';
  const remTarget = dToTarget - disc;
  const remBe = dToBe - disc;

  const contrib = netPerTon - unitCost;
  const bep = s.delivery && s.tripCost > 0
    ? (contrib > 0 ? s.tripCost / contrib : Infinity)
    : (contrib > 0 ? 0 : Infinity);

  const priceGross = price;
  const priceNet = netPerTon;
  const vatPerTon = priceGross - priceNet;

  return {
    rawPerTon, unitCost, Cfull, P0, P0net: s.vat ? P0 / vatDiv : P0, disc,
    trips, logistics,
    priceGross, priceNet, vatPerTon,
    totalGross: priceGross * V, totalNet: priceNet * V, totalVat: vatPerTon * V,
    fullCost, revenue, profit, margin,
    pTgt, pBe, dToTarget, dToBe, zone, remTarget, remBe, bep, V,
  };
}

// ----- Запись в журнал из расчёта -----
export function toJournalEntry(card: CardInput, r: CalcResult, s: GlobalSettings): JournalEntry {
  return {
    id: uid(), ts: Date.now(), name: card.name, V: r.V, disc: r.disc,
    P0: r.P0, priceGross: r.priceGross, priceNet: r.priceNet, vatPerTon: r.vatPerTon,
    totalGross: r.totalGross, totalNet: r.totalNet, totalVat: r.totalVat,
    cost: r.fullCost, profit: r.profit, margin: r.margin, vat: s.vat, delivery: s.delivery,
  };
}

// ----- Текст счёта для Telegram -----
export function invoiceText(e: JournalEntry, config: AppConfig = CONFIG): string {
  const d = new Date(e.ts);
  const dd = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const L: string[] = [];
  L.push(`СЧЁТ № ${String(e.id).replace(/\D/g, '').slice(-6)} от ${dd}`);
  L.push(config.COMPANY);
  L.push('Покупатель: ____________________');
  L.push('');
  L.push(`Товар: асфальтобетонная смесь «${e.name}»`);
  L.push(`Объём: ${fmtNum(e.V, 1)} т`);
  if (e.disc) L.push(`Скидка: ${fmtNum(e.disc, 1)} %`);
  L.push('');
  if (e.vat) {
    L.push(`Цена без НДС: ${fmtNum(e.priceNet)} ₽/т`);
    L.push(`НДС 22%: ${fmtNum(e.vatPerTon)} ₽/т`);
    L.push(`Цена с НДС: ${fmtNum(e.priceGross)} ₽/т`);
    L.push('');
    L.push(`Сумма без НДС: ${fmtNum(e.totalNet)} ₽`);
    L.push(`НДС 22%: ${fmtNum(e.totalVat)} ₽`);
    L.push(`ИТОГО к оплате (с НДС): ${fmtNum(e.totalGross)} ₽`);
  } else {
    L.push(`Цена: ${fmtNum(e.priceNet)} ₽/т (без НДС)`);
    L.push(`ИТОГО к оплате: ${fmtNum(e.totalNet)} ₽ (без НДС)`);
  }
  L.push('');
  L.push(e.delivery ? 'Условия: доставка рейсами' : 'Условия: самовывоз');
  return L.join('\n');
}

/** Открыть Telegram (текст копируется отдельно — Telegram не принимает text в ссылке на личный чат).
 *  Для автоматической отправки ботом нужен бэкенд (см. README). */
export function telegramUrl(config: AppConfig = CONFIG): string {
  return 'https://t.me/+' + config.TG_PHONE.replace(/[^\d]/g, '');
}
