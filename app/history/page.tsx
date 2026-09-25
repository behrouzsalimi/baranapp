"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  getPracticeCategories,
  getPracticeItems,
  getPracticeRecords,
  type PracticeCategory,
  type PracticeItem,
  type PracticeRecord,
} from "@/lib/practice-data";

type ChartMode = "daily" | "weekly" | "monthly";

type ChartPoint = {
  label: string;
  value: number;
};

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

function formatDuration(minutes: number) {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} ثانیه`;
  }

  if (Number.isInteger(minutes)) {
    return `${minutes.toLocaleString("fa-IR")} دقیقه`;
  }

  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}

function getDateKey(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStartOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getStartOfWeek(date: Date) {
  const start = getStartOfDay(date);
  const day = start.getDay();
  const distanceFromSaturday = (day + 1) % 7;

  start.setDate(start.getDate() - distanceFromSaturday);

  return start;
}

function getStartOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getChartPointKey(
  date: Date,
  mode: ChartMode
) {
  if (mode === "daily") {
    return getDateKey(date.toISOString());
  }

  if (mode === "weekly") {
    const start = getStartOfWeek(date);

    return getDateKey(start.toISOString());
  }

  const start = getStartOfMonth(date);

  return `${start.getFullYear()}-${String(
    start.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatChartLabel(
  date: Date,
  mode: ChartMode
) {
  if (mode === "daily") {
    return date.toLocaleDateString("fa-IR", {
      day: "numeric",
      month: "short",
    });
  }

  if (mode === "weekly") {
    return `هفته ${date.toLocaleDateString("fa-IR", {
      day: "numeric",
      month: "short",
    })}`;
  }

  return date.toLocaleDateString("fa-IR", {
    month: "long",
    year: "numeric",
  });
}

function getChartPoints(
  records: PracticeRecord[],
  mode: ChartMode
): ChartPoint[] {
  if (records.length === 0) {
    return [];
  }

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  const firstDate = new Date(
    sortedRecords[0].startTime
  );

  const lastDate = new Date(
    sortedRecords[sortedRecords.length - 1].startTime
  );

  const start =
    mode === "daily"
      ? getStartOfDay(firstDate)
      : mode === "weekly"
        ? getStartOfWeek(firstDate)
        : getStartOfMonth(firstDate);

  const end =
    mode === "daily"
      ? getStartOfDay(lastDate)
      : mode === "weekly"
        ? getStartOfWeek(lastDate)
        : getStartOfMonth(lastDate);

  const totals = new Map<string, number>();

  records.forEach((record) => {
    const date = new Date(record.startTime);
    const key = getChartPointKey(date, mode);

    totals.set(
      key,
      (totals.get(key) ?? 0) + record.points
    );
  });

  const points: ChartPoint[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = getChartPointKey(cursor, mode);

    points.push({
      label: formatChartLabel(
        new Date(cursor),
        mode
      ),
      value: totals.get(key) ?? 0,
    });

    if (mode === "daily") {
      cursor.setDate(cursor.getDate() + 1);
    } else if (mode === "weekly") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return points;
}

function LineChart({
  points,
  mode,
}: {
  points: ChartPoint[];
  mode: ChartMode;
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-gray-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
          📈
        </div>

        <p className="mt-4 text-sm font-black text-gray-700">
          هنوز امتیازی برای نمایش وجود ندارد.
        </p>

        <p className="mt-1 text-xs font-medium text-gray-400">
          با انجام اولین تمرین، روند امتیازها اینجا نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  const width = 760;
  const height = 340;
  const paddingLeft = 58;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 62;

  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;

  const maxValue = Math.max(
    ...points.map((point) => point.value),
    0
  );

  const yMax =
    maxValue === 0
      ? 10
      : Math.ceil(maxValue / 10) * 10;

  const getX = (index: number) => {
    if (points.length === 1) {
      return paddingLeft + chartWidth / 2;
    }

    return (
      paddingLeft +
      (index / (points.length - 1)) * chartWidth
    );
  };

  const getY = (value: number) => {
    return (
      paddingTop +
      chartHeight -
      (value / yMax) * chartHeight
    );
  };

  const linePath = points
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${getX(
    points.length - 1
  )} ${paddingTop + chartHeight} L ${getX(
    0
  )} ${paddingTop + chartHeight} Z`;

  const gridValues = [
    yMax,
    Math.round(yMax * 0.75),
    Math.round(yMax * 0.5),
    Math.round(yMax * 0.25),
    0,
  ];

  const labelStep =
    points.length <= 7
      ? 1
      : points.length <= 15
        ? 2
        : Math.ceil(points.length / 7);

  const modeLabel =
    mode === "daily"
      ? "روزانه"
      : mode === "weekly"
        ? "هفتگی"
        : "ماهانه";

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto min-w-[680px] w-full"
        role="img"
        aria-label={`نمودار ${modeLabel} امتیازهای باران`}
      >
        {gridValues.map((value) => {
          const y = getY(value);

          return (
            <g key={value}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="5 5"
              />

              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="#6b7280"
              >
                {formatNumber(value)}
              </text>
            </g>
          );
        })}

        <path
          d={areaPath}
          fill="#ede9fe"
          opacity="0.85"
        />

        <path
          d={linePath}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => {
          const x = getX(index);
          const y = getY(point.value);

          return (
            <g key={`${point.label}-${index}`}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="white"
                stroke="#7c3aed"
                strokeWidth="3"
              />

              {index % labelStep === 0 ||
              index === points.length - 1 ? (
                <text
                  x={x}
                  y={height - 21}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#6b7280"
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<
    PracticeRecord[]
  >([]);

  const [categories, setCategories] = useState<
    PracticeCategory[]
  >([]);

  const [items, setItems] = useState<PracticeItem[]>([]);

  const [chartMode, setChartMode] =
    useState<ChartMode>("daily");

  useEffect(() => {
    setRecords(getPracticeRecords());
    setCategories(getPracticeCategories());
    setItems(getPracticeItems());
  }, []);

  const todayRecords = useMemo(
    () =>
      records.filter((record) =>
        isToday(record.startTime)
      ),
    [records]
  );

  const todayPoints = todayRecords.reduce(
    (total, record) => total + record.points,
    0
  );

  const totalPoints = records.reduce(
    (total, record) => total + record.points,
    0
  );

  const totalDuration = records.reduce(
    (total, record) =>
      total + record.durationMinutes,
    0
  );

  const chartPoints = useMemo(
    () => getChartPoints(records, chartMode),
    [records, chartMode]
  );

  const chartTotal = chartPoints.reduce(
    (total, point) => total + point.value,
    0
  );

  const chartAverage =
    chartPoints.length > 0
      ? Math.round(chartTotal / chartPoints.length)
      : 0;

  const bestChartPoint =
    chartPoints.length > 0
      ? Math.max(
          ...chartPoints.map((point) => point.value)
        )
      : 0;

  const groupedRecords = useMemo(() => {
    const groups = new Map<
      string,
      PracticeRecord[]
    >();

    const sortedRecords = [...records].sort(
      (a, b) =>
        new Date(b.startTime).getTime() -
        new Date(a.startTime).getTime()
    );

    sortedRecords.forEach((record) => {
      const key = getDateKey(record.startTime);
      const existing = groups.get(key);

      if (existing) {
        existing.push(record);
      } else {
        groups.set(key, [record]);
      }
    });

    return Array.from(groups.entries());
  }, [records]);

  function getCategoryTitle(record: PracticeRecord) {
    if (record.categoryTitle) {
      return record.categoryTitle;
    }

    const category = categories.find(
      (item) => item.id === record.categoryId
    );

    return category?.title ?? "دسته حذف‌شده";
  }

  function getPracticeTitle(record: PracticeRecord) {
    if (record.practiceTitle) {
      return record.practiceTitle;
    }

    const item = items.find(
      (practiceItem) =>
        practiceItem.id === record.practiceId
    );

    return item?.title ?? "تمرین حذف‌شده";
  }

  const chartTitle =
    chartMode === "daily"
      ? "امتیازهای روزانه"
      : chartMode === "weekly"
        ? "امتیازهای هفتگی"
        : "امتیازهای ماهانه";

  const chartDescription =
    chartMode === "daily"
      ? "هر نقطه مجموع امتیازهای یک روز را نشان می‌دهد."
      : chartMode === "weekly"
        ? "هر نقطه مجموع امتیازهای یک هفته را نشان می‌دهد."
        : "هر نقطه مجموع امتیازهای یک ماه را نشان می‌دهد.";

  return (
    <main className="min-h-screen bg-[#f5f3ff] px-4 pb-28 pt-5">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-600">
                مسیر پیشرفت باران 📈
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                تاریخچه تمرین‌ها
              </h1>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                همه تلاش‌ها و امتیازهای ثبت‌شده اینجا جمع شده‌اند.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-3xl shadow-lg shadow-violet-200">
              📊
            </div>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400">
                  امتیاز امروز
                </p>

                <p className="mt-2 text-3xl font-black text-gray-950">
                  {formatNumber(todayPoints)}
                </p>

                <p className="mt-1 text-[10px] font-bold text-violet-500">
                  ⭐ امتیاز
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-xl">
                ⭐
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400">
                  تمرین امروز
                </p>

                <p className="mt-2 text-3xl font-black text-gray-950">
                  {formatNumber(todayRecords.length)}
                </p>

                <p className="mt-1 text-[10px] font-bold text-green-600">
                  تمرین کامل‌شده
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                ✓
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-violet-200">
            <p className="text-[11px] font-bold text-violet-100">
              کل امتیازها
            </p>

            <p className="mt-2 text-3xl font-black">
              {formatNumber(totalPoints)}
            </p>

            <p className="mt-1 text-[10px] font-bold text-violet-100">
              از ابتدای ثبت تمرین
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-lg shadow-green-100">
            <p className="text-[11px] font-bold text-green-100">
              کل زمان تمرین
            </p>

            <p className="mt-2 text-2xl font-black">
              {formatDuration(totalDuration)}
            </p>

            <p className="mt-1 text-[10px] font-bold text-green-100">
              مجموع تمرین‌های کامل‌شده
            </p>
          </div>
        </section>

        <section className="mb-5 overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">
                    📈
                  </span>

                  <h2 className="text-lg font-black text-gray-950">
                    روند امتیازها
                  </h2>
                </div>

                <p className="mt-3 text-xs font-medium leading-5 text-gray-500">
                  {chartDescription}
                </p>
              </div>

              {chartPoints.length > 0 && (
                <div className="rounded-2xl bg-violet-50 px-3 py-2 text-left">
                  <p className="text-[9px] font-bold text-violet-400">
                    بیشترین
                  </p>

                  <p className="mt-1 text-sm font-black text-violet-700">
                    {formatNumber(bestChartPoint)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setChartMode("daily")}
                className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                  chartMode === "daily"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                روزانه
              </button>

              <button
                type="button"
                onClick={() => setChartMode("weekly")}
                className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                  chartMode === "weekly"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                هفتگی
              </button>

              <button
                type="button"
                onClick={() => setChartMode("monthly")}
                className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                  chartMode === "monthly"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                ماهانه
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-[1.5rem] bg-gray-50 p-3">
              <LineChart
                points={chartPoints}
                mode={chartMode}
              />
            </div>

            {chartPoints.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] bg-violet-50 p-4">
                  <p className="text-[10px] font-bold text-violet-500">
                    مجموع این بازه
                  </p>

                  <p className="mt-1 text-lg font-black text-violet-800">
                    {formatNumber(chartTotal)}
                  </p>

                  <p className="mt-0.5 text-[9px] font-bold text-violet-400">
                    ⭐ امتیاز
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-fuchsia-50 p-4">
                  <p className="text-[10px] font-bold text-fuchsia-500">
                    میانگین هر بازه
                  </p>

                  <p className="mt-1 text-lg font-black text-fuchsia-800">
                    {formatNumber(chartAverage)}
                  </p>

                  <p className="mt-0.5 text-[9px] font-bold text-fuchsia-400">
                    ⭐ امتیاز
                  </p>
                </div>
              </div>
            )}

            {chartPoints.length > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-[1.25rem] bg-gray-950 px-4 py-3">
                <span className="text-[11px] font-bold text-gray-400">
                  نمایش فعلی
                </span>

                <span className="text-xs font-black text-white">
                  {chartTitle}
                </span>
              </div>
            )}
          </div>
        </section>

        {groupedRecords.length === 0 ? (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-violet-100 text-4xl">
              📅
            </div>

            <h2 className="mt-5 text-lg font-black text-gray-950">
              هنوز سابقه‌ای ثبت نشده
            </h2>

            <p className="mt-2 text-xs font-medium leading-6 text-gray-500">
              وقتی اولین تمرینت را کامل کنی، نتیجه و امتیاز آن اینجا نمایش داده می‌شود.
            </p>

            <div className="mt-5 rounded-2xl bg-violet-50 px-4 py-3 text-xs font-bold leading-5 text-violet-700">
              اولین قدم رو بردار؛ بقیه مسیر خودش شروع می‌شه 🚀
            </div>
          </section>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  سوابق تمرین
                </h2>

                <p className="mt-1 text-[10px] font-bold text-gray-400">
                  {formatNumber(records.length)} تمرین ثبت شده
                </p>
              </div>

              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                <span className="text-xs font-black text-violet-700">
                  {formatNumber(totalPoints)} ⭐
                </span>
              </div>
            </div>

            {groupedRecords.map(
              ([dateKey, dateRecords]) => {
                const dayPoints = dateRecords.reduce(
                  (total, record) =>
                    total + record.points,
                  0
                );

                return (
                  <section
                    key={dateKey}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-sm"
                  >
                    <div className="border-b border-gray-100 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="font-black text-gray-950">
                            {formatDate(
                              dateRecords[0].startTime
                            )}
                          </h2>

                          <p className="mt-1 text-[10px] font-bold text-gray-400">
                            {formatNumber(
                              dateRecords.length
                            )}{" "}
                            تمرین کامل‌شده
                          </p>
                        </div>

                        <div className="rounded-2xl bg-violet-100 px-3 py-2 text-center">
                          <p className="text-[9px] font-bold text-violet-500">
                            امتیاز روز
                          </p>

                          <p className="mt-1 text-sm font-black text-violet-700">
                            +{formatNumber(dayPoints)} ⭐
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      {dateRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-[1.5rem] bg-gray-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-lg text-green-700">
                              ✓
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-violet-600">
                                    {getCategoryTitle(
                                      record
                                    )}
                                  </p>

                                  <p className="mt-1 text-sm font-black text-gray-950">
                                    {getPracticeTitle(
                                      record
                                    )}
                                  </p>
                                </div>

                                <div className="shrink-0 rounded-xl bg-green-100 px-3 py-2 text-xs font-black text-green-700">
                                  +{formatNumber(record.points)}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-xl bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500">
                                  🕐{" "}
                                  {formatTime(
                                    record.startTime
                                  )}
                                </span>

                                <span className="rounded-xl bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500">
                                  ⏱{" "}
                                  {formatDuration(
                                    record.durationMinutes
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }
            )}
          </div>
        )}

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 p-5 shadow-lg shadow-orange-100">
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-white/15" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
              🏆
            </div>

            <div>
              <p className="font-black text-orange-950">
                ادامه بده!
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-orange-950/75">
                هر تمرین کامل‌شده یک قدم به جلوست. مهم‌تر از تعداد امتیازها، ادامه دادن مسیر است.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}