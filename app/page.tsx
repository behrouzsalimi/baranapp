"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  getActivePracticeCategories,
  getActivePracticeItems,
  getPracticeRecords,
  type PracticeCategory,
  type PracticeItem,
  type PracticeRecord,
} from "@/lib/practice-data";

type ActiveTimer = {
  categoryId: string;
  practiceId: string;
  startTime: string;
  remainingSeconds: number;
  isPaused: boolean;
  lastStartedAt: number | null;
  durationMinutes: number;
};

const ACTIVE_TIMER_KEY = "baran_active_timer";

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function isToday(value: string) {
  return (
    new Date(value).toDateString() ===
    new Date().toDateString()
  );
}

function getActiveTimer(): ActiveTimer | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(
      ACTIVE_TIMER_KEY
    );

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed.categoryId !== "string" ||
      typeof parsed.practiceId !== "string" ||
      typeof parsed.remainingSeconds !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "صبح بخیر باران ☀️";
  }

  if (hour < 18) {
    return "سلام باران 👋";
  }

  return "خسته نباشی باران 🌟";
}

function getMotivation(
  completed: number,
  total: number
) {
  if (total === 0) {
    return "امروز آماده‌ای که اولین قدم رو برداری 🚀";
  }

  if (completed === 0) {
    return "باران جان، شروع کنیم که امتیازها رو بگیری! 🚀";
  }

  if (completed >= total) {
    return "امروز همه تمرین‌ها رو انجام دادی! فوق‌العاده‌ای 🏆";
  }

  if (completed >= total - 1) {
    return "چیزی نمونده تا همه امتیاز امروز رو بگیری! 🔥";
  }

  return "عالیه! ادامه بدیم و امتیازهای بیشتری بگیریم 💪";
}

function getCategoryIcon(
  category: PracticeCategory,
  index: number
) {
  const icons = ["🎵", "🧠", "🏃", "📚", "🎯", "⭐"];

  return icons[index % icons.length];
}

export default function HomePage() {
  const [categories, setCategories] = useState<
    PracticeCategory[]
  >([]);

  const [items, setItems] = useState<PracticeItem[]>(
    []
  );

  const [records, setRecords] = useState<
    PracticeRecord[]
  >([]);

  const [activeTimer, setActiveTimer] =
    useState<ActiveTimer | null>(null);

  const [, setTick] = useState(0);

  function refreshHome() {
    setCategories(getActivePracticeCategories());
    setItems(getActivePracticeItems());
    setRecords(getPracticeRecords());
    setActiveTimer(getActiveTimer());
  }

  useEffect(() => {
    refreshHome();

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
      setActiveTimer(getActiveTimer());
    }, 1000);

    const handleFocus = () => {
      refreshHome();
    };

    const handleStorage = () => {
      refreshHome();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        refreshHome();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "storage",
      handleStorage
    );
    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "focus",
        handleFocus
      );
      window.removeEventListener(
        "storage",
        handleStorage
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
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

  const totalTasks = items.length;

  const completedIds = new Set(
    todayRecords.map((record) => record.practiceId)
  );

  const completedTasks = items.filter((item) =>
    completedIds.has(item.id)
  ).length;

  const progress =
    totalTasks > 0
      ? Math.min(
          100,
          Math.round(
            (completedTasks / totalTasks) * 100
          )
        )
      : 0;

  const remainingTasks = Math.max(
    0,
    totalTasks - completedTasks
  );

  const nextPractice = items.find(
    (item) => !completedIds.has(item.id)
  );

  const activeCategory = activeTimer
    ? categories.find(
        (category) =>
          category.id === activeTimer.categoryId
      )
    : null;

  const activePractice = activeTimer
    ? items.find(
        (item) => item.id === activeTimer.practiceId
      )
    : null;

  const activeRemaining = activeTimer
    ? activeTimer.isPaused
      ? activeTimer.remainingSeconds
      : Math.max(
          0,
          activeTimer.remainingSeconds -
            Math.floor(
              (Date.now() -
                (activeTimer.lastStartedAt ?? Date.now())) /
                1000
            )
        )
    : 0;

  const motivation = getMotivation(
    completedTasks,
    totalTasks
  );

  return (
    <main className="min-h-screen bg-[#f5f3ff] px-4 pb-28 pt-5">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-violet-600">
              {getGreeting()}
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              اپلیکیشن باران
            </h1>

            <p className="mt-1 text-xs font-medium text-gray-500">
              امروز یه قدم دیگه جلو بریم ✨
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-3xl shadow-lg shadow-yellow-200">
            🌟
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-purple-200">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-fuchsia-400/20" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-purple-100">
                  پیشرفت امروز
                </p>

                <h2 className="mt-2 text-xl font-black">
                  {motivation}
                </h2>
              </div>

              <div className="shrink-0 rounded-2xl bg-white/15 px-3 py-2 text-center backdrop-blur">
                <p className="text-2xl font-black">
                  {todayPoints}
                </p>

                <p className="text-[10px] font-bold text-purple-100">
                  امتیاز
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span>
                  {completedTasks} از {totalTasks} تمرین
                </span>

                <span>{progress}٪</span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-yellow-300 transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xs text-purple-100">
                  تمرین باقی‌مانده
                </p>

                <p className="mt-1 text-lg font-black">
                  {remainingTasks}
                </p>
              </div>

              <div className="text-2xl">
                {remainingTasks === 0
                  ? "🏆"
                  : "🔥"}
              </div>
            </div>
          </div>
        </section>

        {activeTimer ? (
          <section className="mb-5 rounded-[2rem] bg-gray-950 p-5 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

                  <p className="text-xs font-bold text-green-400">
                    تمرین در حال انجام
                  </p>
                </div>

                <h2 className="mt-2 text-lg font-black">
                  {activeCategory?.title ??
                    "تمرین"}
                </h2>

                <p className="mt-1 text-sm text-gray-300">
                  {activePractice?.title ??
                    "تمرین فعال"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                <p className="font-mono text-2xl font-black tracking-wider">
                  {formatTimer(activeRemaining)}
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                  {activeTimer.isPaused
                    ? "متوقف شده"
                    : "در حال تمرین"}
                </p>
              </div>
            </div>

            <Link
              href="/practice"
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-green-500 px-5 py-3.5 text-sm font-black text-gray-950 transition hover:bg-green-400"
            >
              بازگشت به تمرین →
            </Link>
          </section>
        ) : nextPractice ? (
          <section className="mb-5 rounded-[2rem] border-2 border-orange-200 bg-gradient-to-br from-orange-400 to-amber-400 p-5 shadow-lg shadow-orange-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/30 px-3 py-1 text-xs font-black text-orange-950">
                  قدم بعدی 👇
                </div>

                <h2 className="mt-3 text-xl font-black text-orange-950">
                  {nextPractice.title}
                </h2>

                <p className="mt-1 text-sm font-bold text-orange-900/80">
                  {categories.find(
                    (category) =>
                      category.id ===
                      nextPractice.categoryId
                  )?.title ?? "تمرین"}
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
                ⚡
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-xl bg-white/40 px-3 py-2 text-xs font-black text-orange-950">
                ⏱ {nextPractice.durationMinutes} دقیقه
              </div>

              <div className="rounded-xl bg-white/40 px-3 py-2 text-xs font-black text-orange-950">
                ⭐ +۱۰ امتیاز
              </div>
            </div>

            <Link
              href="/practice"
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gray-950 px-5 py-4 text-sm font-black text-white transition hover:bg-gray-800"
            >
              شروع تمرین 🚀
            </Link>
          </section>
        ) : (
          <section className="mb-5 rounded-[2rem] bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white shadow-xl shadow-green-100">
            <div className="text-4xl">🏆</div>

            <h2 className="mt-3 text-2xl font-black">
              مأموریت امروز کامل شد!
            </h2>

            <p className="mt-2 text-sm font-medium text-green-50">
              همه تمرین‌های امروزت رو انجام دادی. عالی بود!
            </p>
          </section>
        )}

        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.7rem] bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-xl">
              ⭐
            </div>

            <p className="mt-4 text-xs font-bold text-gray-500">
              امتیاز امروز
            </p>

            <p className="mt-1 text-3xl font-black text-gray-950">
              {todayPoints}
            </p>
          </div>

          <div className="rounded-[1.7rem] bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl">
              🎯
            </div>

            <p className="mt-4 text-xs font-bold text-gray-500">
              تمرین کامل‌شده
            </p>

            <p className="mt-1 text-3xl font-black text-gray-950">
              {completedTasks}
              <span className="text-lg text-gray-400">
                /{totalTasks}
              </span>
            </p>
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                تمرین‌های امروز
              </h2>

              <p className="mt-1 text-xs font-medium text-gray-500">
                هر قدم کوچیک، یک امتیاز بزرگه 🌟
              </p>
            </div>

            <Link
              href="/practice"
              className="text-xs font-black text-violet-600"
            >
              همه تمرین‌ها
            </Link>
          </div>

          <div className="grid gap-3">
            {categories.map((category, index) => {
              const categoryItems = items.filter(
                (item) =>
                  item.categoryId === category.id
              );

              const completedCategoryItems =
                categoryItems.filter((item) =>
                  completedIds.has(item.id)
                ).length;

              const categoryProgress =
                categoryItems.length > 0
                  ? Math.round(
                      (completedCategoryItems /
                        categoryItems.length) *
                        100
                    )
                  : 0;

              return (
                <Link
                  href="/practice"
                  key={category.id}
                  className="group rounded-[1.7rem] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                        index % 3 === 0
                          ? "bg-violet-100"
                          : index % 3 === 1
                            ? "bg-blue-100"
                            : "bg-pink-100"
                      }`}
                    >
                      {getCategoryIcon(
                        category,
                        index
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-black text-gray-950">
                          {category.title}
                        </h3>

                        <span className="shrink-0 text-xs font-black text-gray-500">
                          {completedCategoryItems}/
                          {categoryItems.length}
                        </span>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            index % 3 === 0
                              ? "bg-violet-500"
                              : index % 3 === 1
                                ? "bg-blue-500"
                                : "bg-pink-500"
                          }`}
                          style={{
                            width: `${categoryProgress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="text-gray-300 transition group-hover:text-violet-500">
                      ←
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-5 overflow-hidden rounded-[2rem] bg-gray-950 p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-2xl">
              💎
            </div>

            <div>
              <p className="text-sm font-black">
                امتیازها جمع می‌شن!
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-400">
                هر تمرینی که کامل می‌کنی، یک قدم به پاداش ماهانه نزدیک‌تر می‌شی.
              </p>
            </div>
          </div>

          <Link
            href="/wallet"
            className="mt-4 flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-xs font-black text-gray-950"
          >
            مشاهده کیف پول →
          </Link>
        </section>

        <section className="rounded-[2rem] bg-gradient-to-r from-cyan-400 to-blue-500 p-5 text-white shadow-lg shadow-blue-100">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>

            <div>
              <p className="font-black">
                آماده‌ای ادامه بدیم؟
              </p>

              <p className="mt-1 text-sm font-medium text-blue-50">
                لازم نیست همه‌چیز یک‌دفعه انجام بشه؛ فقط قدم بعدی رو بردار.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}