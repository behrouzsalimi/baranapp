import type { PracticeRecord } from "@/lib/practice-data";

export type SettlementRecord = {
  id: string;
  monthKey: string;
  monthLabel: string;
  points: number;
  pointValue: number;
  amount: number;
  settledAt: string;
};

const SETTLEMENTS_KEY = "baran_monthly_settlements";

function createId() {
  return `settlement_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getLocalDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year: "numeric",
      month: "2-digit",
    }
  );

  const parts = formatter.formatToParts(date);

  const year =
    parts.find((part) => part.type === "year")?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")?.value ?? "";

  return {
    year,
    month,
  };
}

export function getCurrentMonthKey() {
  const { year, month } = getLocalDateParts(new Date());

  return `${year}-${month}`;
}

export function getMonthKey(value: string) {
  const date = new Date(value);

  const { year, month } = getLocalDateParts(date);

  return `${year}-${month}`;
}

export function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year: "numeric",
      month: "long",
    }
  ).format(new Date());
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");

  if (!year || !month) {
    return monthKey;
  }

  const numericMonth = Number(month);

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    return monthKey;
  }

  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const monthName = monthNames[numericMonth - 1];

  return `${monthName} ${year}`;
}

export function getSettlementRecords(): SettlementRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(SETTLEMENTS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveSettlementRecords(
  settlements: SettlementRecord[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    SETTLEMENTS_KEY,
    JSON.stringify(settlements)
  );
}

export function clearSettlementHistory() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SETTLEMENTS_KEY);
}

export function getCurrentMonthRecords(
  records: PracticeRecord[]
) {
  const currentMonthKey = getCurrentMonthKey();

  return records.filter(
    (record) =>
      getMonthKey(record.startTime) === currentMonthKey
  );
}

export function getCurrentMonthPoints(
  records: PracticeRecord[]
) {
  const settlements = getSettlementRecords();
  const currentMonthKey = getCurrentMonthKey();

  const alreadySettled = settlements.some(
    (settlement) =>
      settlement.monthKey === currentMonthKey
  );

  if (alreadySettled) {
    return 0;
  }

  return getCurrentMonthRecords(records).reduce(
    (total, record) => total + record.points,
    0
  );
}

export function getCurrentMonthSettlement() {
  const currentMonthKey = getCurrentMonthKey();

  return (
    getSettlementRecords().find(
      (settlement) =>
        settlement.monthKey === currentMonthKey
    ) ?? null
  );
}

export function isCurrentMonthSettled() {
  return getCurrentMonthSettlement() !== null;
}

export function settleCurrentMonth(
  records: PracticeRecord[],
  pointValue: number
) {
  if (
    !Number.isFinite(pointValue) ||
    pointValue < 0
  ) {
    return null;
  }

  const currentMonthKey = getCurrentMonthKey();

  const settlements = getSettlementRecords();

  const existingSettlement = settlements.find(
    (settlement) =>
      settlement.monthKey === currentMonthKey
  );

  if (existingSettlement) {
    return existingSettlement;
  }

  const currentMonthRecords =
    getCurrentMonthRecords(records);

  const points = currentMonthRecords.reduce(
    (total, record) => total + record.points,
    0
  );

  const settlement: SettlementRecord = {
    id: createId(),
    monthKey: currentMonthKey,
    monthLabel: getCurrentMonthLabel(),
    points,
    pointValue,
    amount: points * pointValue,
    settledAt: new Date().toISOString(),
  };

  saveSettlementRecords([
    ...settlements,
    settlement,
  ]);

  return settlement;
}

export function getSettlementHistory() {
  return [...getSettlementRecords()].sort(
    (a, b) =>
      new Date(b.settledAt).getTime() -
      new Date(a.settledAt).getTime()
  );
}