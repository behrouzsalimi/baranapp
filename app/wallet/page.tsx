"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  getPracticeRecords,
  type PracticeRecord,
} from "@/lib/practice-data";
import {
  getCurrentMonthLabel,
  getCurrentMonthPoints,
  getCurrentMonthSettlement,
  getSettlementHistory,
  settleCurrentMonth,
  type SettlementRecord,
} from "@/lib/settlement-data";
import { getPointValue } from "@/lib/settings-data";

function formatNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function WalletPage() {
  const [records, setRecords] = useState<PracticeRecord[]>(
    []
  );

  const [pointValue, setPointValueState] = useState(0);

  const [settlements, setSettlements] = useState<
    SettlementRecord[]
  >([]);

  const [currentSettlement, setCurrentSettlement] =
    useState<SettlementRecord | null>(null);

  const [isSettling, setIsSettling] = useState(false);

  function refreshWallet() {
    const practiceRecords = getPracticeRecords();
    const currentPointValue = getPointValue();
    const settlementHistory = getSettlementHistory();
    const currentMonthSettlement =
      getCurrentMonthSettlement();

    setRecords(practiceRecords);
    setPointValueState(currentPointValue);
    setSettlements(settlementHistory);
    setCurrentSettlement(currentMonthSettlement);
  }

  useEffect(() => {
    refreshWallet();

    const handleFocus = () => {
      refreshWallet();
    };

    const handleStorage = () => {
      refreshWallet();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const currentMonthPoints = currentSettlement
    ? 0
    : getCurrentMonthPoints(records);

  const currentMonthAmount =
    currentMonthPoints * pointValue;

  function handleSettlement() {
    if (isSettling) {
      return;
    }

    if (currentSettlement) {
      return;
    }

    const confirmed = window.confirm(
      `امتیازهای ${getCurrentMonthLabel()} تسویه شوند؟\n\n` +
        `امتیاز: ${formatNumber(currentMonthPoints)}\n` +
        `مبلغ: ${formatNumber(currentMonthAmount)} تومان\n\n` +
        `بعد از تسویه، این ماه بسته می‌شود و مبلغ آن دیگر با تغییر ارزش امتیاز تغییر نمی‌کند.`
    );

    if (!confirmed) {
      return;
    }

    setIsSettling(true);

    try {
      settleCurrentMonth(records, pointValue);
      refreshWallet();
    } finally {
      setIsSettling(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f3ff] px-4 pb-28 pt-5">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-600">
                پاداش تلاش‌هات 💰
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                کیف پول باران
              </h1>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                امتیازها جمع می‌شن و آخر ماه به پاداش تبدیل می‌شن.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-3xl shadow-lg shadow-yellow-200">
              💰
            </div>
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-purple-200">
          <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/10" />

          <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-fuchsia-400/20" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-purple-100">
                  ماه جاری
                </p>

                <p className="mt-1 text-xl font-black">
                  {getCurrentMonthLabel()}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                {currentSettlement ? "🔒" : "💎"}
              </div>
            </div>

            <div className="mt-7">
              <p className="text-xs font-bold text-purple-100">
                امتیاز قابل تسویه
              </p>

              <div className="mt-1 flex items-end gap-2">
                <p className="text-5xl font-black tracking-tight">
                  {formatNumber(currentMonthPoints)}
                </p>

                <p className="mb-2 text-sm font-bold text-purple-100">
                  امتیاز
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-purple-100">
                  ارزش هر امتیاز
                </p>

                <p className="mt-1 text-lg font-black">
                  {formatNumber(pointValue)}
                </p>

                <p className="mt-0.5 text-[10px] text-purple-100">
                  تومان
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-300 p-4 text-gray-950 shadow-lg">
                <p className="text-[10px] font-black text-gray-700">
                  مبلغ ماه جاری
                </p>

                <p className="mt-1 text-lg font-black">
                  {formatNumber(currentMonthAmount)}
                </p>

                <p className="mt-0.5 text-[10px] font-bold text-gray-700">
                  تومان
                </p>
              </div>
            </div>

            {currentSettlement && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-green-400/20 px-4 py-3">
                <span className="text-lg">
                  ✅
                </span>

                <span className="text-xs font-bold text-green-100">
                  امتیازهای این ماه قبلاً تسویه شده‌اند.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                ⭐ سیستم امتیازدهی
              </h2>

              <p className="mt-1 text-xs font-medium text-gray-500">
                هر تمرین کامل‌شده مستقیم به کیف پول اضافه می‌شود.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
              ⭐
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.5rem] bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-xl text-white">
                    🎯
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      هر تمرین کامل‌شده
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-gray-500">
                      پاداش مستقیم برای انجام تمرین
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-sm">
                  +۱۰ امتیاز
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500 text-xl text-white">
                    💵
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      ارزش هر امتیاز
                    </p>

                    <p className="mt-1 text-[11px] font-medium leading-5 text-gray-500">
                      ارزش مالی فقط برای ماه جاری محاسبه می‌شود.
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-sm font-black text-green-700">
                    {formatNumber(pointValue)}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-gray-500">
                    تومان
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 overflow-hidden rounded-[2rem] bg-gray-950 p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 text-lg text-gray-950">
                  💵
                </span>

                <p className="text-lg font-black">
                  تسویه ماهانه
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-400">
                وقتی ماه را تسویه کنی، مبلغ آن برای همیشه با نرخ همان زمان ثبت می‌شود.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-gray-400">
                ماه
              </p>

              <p className="mt-1 text-xs font-black">
                {getCurrentMonthLabel()}
              </p>
            </div>
          </div>

          {currentSettlement ? (
            <div className="mt-5 rounded-[1.5rem] bg-green-500/15 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-xl text-gray-950">
                  ✓
                </div>

                <div className="min-w-0">
                  <p className="font-black text-green-300">
                    این ماه تسویه شده است
                  </p>

                  <p className="mt-2 text-xs leading-5 text-green-100/80">
                    مبلغ ثبت‌شده این ماه:
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {formatNumber(
                      currentSettlement.amount
                    )}{" "}
                    <span className="text-xs font-bold text-gray-400">
                      تومان
                    </span>
                  </p>

                  <div className="mt-3 rounded-xl bg-black/20 px-3 py-2">
                    <p className="text-[10px] leading-5 text-gray-400">
                      {formatNumber(
                        currentSettlement.points
                      )}{" "}
                      امتیاز ×{" "}
                      {formatNumber(
                        currentSettlement.pointValue
                      )}{" "}
                      تومان
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-xs font-bold text-gray-400">
                  مبلغ آماده تسویه
                </p>

                <div className="mt-1 flex items-end gap-2">
                  <p className="text-3xl font-black text-yellow-300">
                    {formatNumber(currentMonthAmount)}
                  </p>

                  <p className="mb-1 text-xs font-bold text-gray-400">
                    تومان
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-[10px] font-medium text-gray-500">
                    امتیازهای قابل تسویه
                  </span>

                  <span className="text-xs font-black text-white">
                    {formatNumber(currentMonthPoints)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSettlement}
                disabled={isSettling}
                className="mt-4 w-full rounded-2xl bg-green-500 px-5 py-4 text-sm font-black text-gray-950 shadow-lg shadow-green-950/20 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSettling
                  ? "در حال ثبت تسویه..."
                  : "تسویه ماه جاری 💰"}
              </button>
            </>
          )}
        </section>

        <section className="mb-5 rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                🧾 سابقه تسویه‌ها
              </h2>

              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                مبلغ هر ماه با نرخ همان زمان ثبت شده و تغییر نمی‌کند.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
              🧾
            </div>
          </div>

          {settlements.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] bg-gray-50 p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200 text-3xl">
                📭
              </div>

              <p className="mt-4 text-sm font-black text-gray-700">
                هنوز تسویه‌ای ثبت نشده است.
              </p>

              <p className="mt-1 text-xs font-medium text-gray-400">
                اولین تسویه که انجام شود، سابقه آن اینجا نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-lg">
                        ✓
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-950">
                          {settlement.monthLabel}
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-gray-500">
                          {formatNumber(
                            settlement.points
                          )}{" "}
                          امتیاز
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-base font-black text-green-700">
                        {formatNumber(
                          settlement.amount
                        )}
                      </p>

                      <p className="mt-1 text-[10px] font-bold text-gray-400">
                        تومان
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
                    <span className="text-[10px] font-medium text-gray-400">
                      ارزش هر امتیاز هنگام تسویه
                    </span>

                    <span className="text-[11px] font-black text-gray-700">
                      {formatNumber(
                        settlement.pointValue
                      )}{" "}
                      تومان
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 p-5 shadow-lg shadow-orange-100">
          <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-white/15" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
              🏆
            </div>

            <div>
              <p className="font-black text-orange-950">
                هر ماه یک شروع تازه!
              </p>

              <p className="mt-1 text-xs font-bold leading-5 text-orange-950/75">
                بعد از تسویه، امتیازهای ماه جدید از صفر شروع می‌شوند و تمرین‌ها دوباره آماده انجام هستند.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}