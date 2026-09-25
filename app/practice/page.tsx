"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  getActivePracticeCategories,
  getActivePracticeItems,
  getPracticeCategories,
  getPracticeItems,
  getPracticeRecords,
  type PracticeCategory,
  type PracticeItem,
  type PracticeRecord,
} from "@/lib/practice-data";

type LegacyPracticeRecord = {
  id: string;
  type: "santur" | "smart";
  number: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  points: number;
};

type ActiveTimer = {
  categoryId: string;
  practiceId: string;
  startTime: string;
  durationMinutes: number;
  remainingSeconds: number;
  isPaused: boolean;
  lastStartedAt: number | null;
};

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function migrateOldRecords() {
  if (typeof window === "undefined") {
    return;
  }
  const migrationKey = "baran_practice_records_migrated_v2";
  if (localStorage.getItem(migrationKey) === "1") {
    return;
  }
  try {
    const oldSaved = localStorage.getItem("baran_practice_records");
    if (!oldSaved) {
      localStorage.setItem(migrationKey, "1");
      return;
    }
    const oldRecords: LegacyPracticeRecord[] = JSON.parse(oldSaved);
    const categories = getPracticeCategories();
    const items = getPracticeItems();
    const currentRecords = getPracticeRecords();
    const santurCategory = categories.find(
      (category) => category.id === "category_santur"
    );
    const smartCategory = categories.find(
      (category) => category.id === "category_smart"
    );
    if (!santurCategory || !smartCategory) {
      return;
    }
    const migratedRecords = oldRecords
      .map((oldRecord): PracticeRecord | null => {
        const category =
          oldRecord.type === "santur"
            ? santurCategory
            : smartCategory;
        const item = items.find(
          (practiceItem) =>
            practiceItem.categoryId === category.id &&
            practiceItem.order === oldRecord.number
        );
        if (!item) {
          return null;
        }
        return {
          id: oldRecord.id,
          practiceId: item.id,
          categoryId: category.id,
          categoryTitle: category.title ?? "تمرین",
          practiceTitle: item.title ?? "تمرین",
          startTime: oldRecord.startTime,
          endTime: oldRecord.endTime,
          durationMinutes: oldRecord.durationMinutes,
          points: oldRecord.points,
        };
      })
      .filter((record): record is PracticeRecord => record !== null);
    const existingIds = new Set(
      currentRecords.map((record) => record.id)
    );
    const newRecords = migratedRecords.filter(
      (record) => !existingIds.has(record.id)
    );
    if (newRecords.length > 0) {
      localStorage.setItem(
        "baran_practice_records",
        JSON.stringify([
          ...currentRecords,
          ...newRecords,
        ])
      );
    }
    localStorage.setItem(migrationKey, "1");
  } catch {
    return;
  }
}

function ensureDefaultData() {
  if (typeof window === "undefined") {
    return;
  }
  getActivePracticeCategories();
  getActivePracticeItems();
  migrateOldRecords();
}

export default function PracticePage() {
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [message, setMessage] = useState("");

  function refreshData() {
    setCategories(getActivePracticeCategories());
    setItems(getActivePracticeItems());
    setRecords(getPracticeRecords());
  }

  useEffect(() => {
    ensureDefaultData();
    refreshData();
    const savedTimer = localStorage.getItem("baran_active_timer");
    if (savedTimer) {
      try {
        const timer: ActiveTimer = JSON.parse(savedTimer);
        setActiveTimer(timer);
      } catch {
        localStorage.removeItem("baran_active_timer");
      }
    }
  }, []);

  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) {
      return;
    }
    const interval = window.setInterval(() => {
      setActiveTimer((currentTimer) => {
        if (!currentTimer || currentTimer.isPaused) {
          return currentTimer;
        }
        if (currentTimer.lastStartedAt === null) {
          return currentTimer;
        }
        const elapsed = Math.floor(
          (Date.now() - currentTimer.lastStartedAt) / 1000
        );
        const remaining = Math.max(
          0,
          currentTimer.remainingSeconds - elapsed
        );
        if (remaining <= 0) {
          completePractice(currentTimer);
          return null;
        }
        const updatedTimer: ActiveTimer = {
          ...currentTimer,
          remainingSeconds: remaining,
          lastStartedAt: Date.now(),
        };
        localStorage.setItem(
          "baran_active_timer",
          JSON.stringify(updatedTimer)
        );
        return updatedTimer;
      });
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [activeTimer?.isPaused, activeTimer?.practiceId]);

  function getCategoryItems(categoryId: string) {
    return items
      .filter(
        (item) =>
          item.categoryId === categoryId &&
          item.deletedAt === null
      )
      .sort((a, b) => a.order - b.order);
  }

  function isPracticeCompleted(practiceId: string) {
    return records.some(
      (record) =>
        record.practiceId === practiceId &&
        isToday(record.startTime)
    );
  }

  function isPracticeLocked(
    categoryId: string,
    practiceId: string
  ) {
    const categoryItems = getCategoryItems(categoryId);
    const currentIndex = categoryItems.findIndex(
      (item) => item.id === practiceId
    );
    if (currentIndex <= 0) {
      return false;
    }
    const previousItem = categoryItems[currentIndex - 1];
    return !isPracticeCompleted(previousItem.id);
  }

  function startPractice(
    categoryId: string,
    practiceId: string
  ) {
    if (activeTimer) {
      return;
    }
    if (isPracticeCompleted(practiceId)) {
      return;
    }
    if (isPracticeLocked(categoryId, practiceId)) {
      return;
    }
    const item = items.find(
      (practiceItem) => practiceItem.id === practiceId
    );
    if (!item) {
      return;
    }
    const durationMinutes = item.durationMinutes;
    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      return;
    }
    const now = Date.now();
    const timer: ActiveTimer = {
      categoryId,
      practiceId,
      startTime: new Date(now).toISOString(),
      durationMinutes,
      remainingSeconds: Math.round(durationMinutes * 60),
      isPaused: false,
      lastStartedAt: now,
    };
    localStorage.setItem(
      "baran_active_timer",
      JSON.stringify(timer)
    );
    setActiveTimer(timer);
    setMessage("");
  }

  function pauseTimer() {
    if (!activeTimer || activeTimer.isPaused) {
      return;
    }
    if (activeTimer.lastStartedAt !== null) {
      const elapsed = Math.floor(
        (Date.now() - activeTimer.lastStartedAt) / 1000
      );
      const remaining = Math.max(
        0,
        activeTimer.remainingSeconds - elapsed
      );
      const pausedTimer: ActiveTimer = {
        ...activeTimer,
        remainingSeconds: remaining,
        isPaused: true,
        lastStartedAt: null,
      };
      localStorage.setItem(
        "baran_active_timer",
        JSON.stringify(pausedTimer)
      );
      setActiveTimer(pausedTimer);
    }
  }

  function resumeTimer() {
    if (!activeTimer || !activeTimer.isPaused) {
      return;
    }
    const resumedTimer: ActiveTimer = {
      ...activeTimer,
      isPaused: false,
      lastStartedAt: Date.now(),
    };
    localStorage.setItem(
      "baran_active_timer",
      JSON.stringify(resumedTimer)
    );
    setActiveTimer(resumedTimer);
  }

  function cancelTimer() {
    if (!activeTimer) {
      return;
    }
    const confirmed = window.confirm(
      "تمرین فعلی لغو شود؟ این تمرین امتیازی دریافت نمی‌کند."
    );
    if (!confirmed) {
      return;
    }
    localStorage.removeItem("baran_active_timer");
    setActiveTimer(null);
    setMessage("تمرین لغو شد.");
  }

  function completePractice(timer: ActiveTimer) {
    const existingRecords = getPracticeRecords();
    const alreadyCompleted = existingRecords.some(
      (record) =>
        record.practiceId === timer.practiceId &&
        record.startTime === timer.startTime
    );
    if (alreadyCompleted) {
      localStorage.removeItem("baran_active_timer");
      return;
    }
    const category = categories.find(
      (item) => item.id === timer.categoryId
    );
    const practice = items.find(
      (item) => item.id === timer.practiceId
    );
    const endTime = new Date().toISOString();
    const newRecord: PracticeRecord = {
      id: `record_${Date.now()}`,
      practiceId: timer.practiceId,
      categoryId: timer.categoryId,
      categoryTitle: category?.title ?? "تمرین",
      practiceTitle: practice?.title ?? "تمرین",
      startTime: timer.startTime,
      endTime,
      durationMinutes: timer.durationMinutes,
      points: 10,
    };
    const updatedRecords = [
      ...existingRecords,
      newRecord,
    ];
    localStorage.setItem(
      "baran_practice_records",
      JSON.stringify(updatedRecords)
    );
    localStorage.removeItem("baran_active_timer");
    setRecords(updatedRecords);
    setActiveTimer(null);
    setMessage(
      `${category?.title ?? "تمرین"} - ${
        practice?.title ?? "تمرین"
      } کامل شد! +۱۰ امتیاز ⭐`
    );
  }

  const todayRecords = records.filter((record) =>
    isToday(record.startTime)
  );
  const todayPoints = todayRecords.reduce(
    (total, record) => total + record.points,
    0
  );
  const completedCount = todayRecords.length;
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
                (activeTimer.lastStartedAt ??
                  Date.now())) /
                1000
            )
        )
    : 0;

  return (
    <main className="min-h-screen bg-[#f5f3ff] px-4 pb-28 pt-5">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-600">
                وقت تمرینه 🎯
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                تمرین‌های باران
              </h1>
              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                هر تمرینی که کامل کنی، یک قدم به پاداش نزدیک‌تر می‌شی.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-3xl shadow-lg shadow-yellow-200">
              🎯
            </div>
          </div>
        </header>

        <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-xl shadow-purple-200">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-fuchsia-400/20" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-purple-100">
                  عملکرد امروز
                </p>
                <p className="mt-1 text-2xl font-black">
                  {completedCount}
                  <span className="mr-1 text-sm font-bold text-purple-200">
                    تمرین
                  </span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
                <p className="text-2xl font-black">
                  {todayPoints}
                </p>
                <p className="mt-1 text-[10px] font-bold text-purple-100">
                  امتیاز امروز
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span>ادامه بده!</span>
                <span>
                  {completedCount} تمرین انجام شده
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-yellow-300 transition-all duration-500"
                  style={{
                    width: `${
                      categories.reduce(
                        (total, category) =>
                          total +
                          getCategoryItems(category.id).length,
                        0
                      ) > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (completedCount /
                                categories.reduce(
                                  (total, category) =>
                                    total +
                                    getCategoryItems(
                                      category.id
                                    ).length,
                                  0
                                )) *
                                100
                            )
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {message && (
          <section className="relative mb-5 overflow-hidden rounded-[1.7rem] bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-white shadow-lg shadow-green-100">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                🏆
              </div>
              <div>
                <p className="text-sm font-black">
                  عالی بود باران!
                </p>
                <p className="mt-1 text-xs font-medium text-green-50">
                  {message}
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTimer && (
          <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gray-950 p-5 text-white shadow-2xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/20" />
            <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-fuchsia-600/10" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
                    <p className="text-xs font-black text-green-400">
                      {activeTimer.isPaused
                        ? "تمرین متوقف شده"
                        : "تمرین در حال انجام"}
                    </p>
                  </div>
                  <p className="mt-3 text-xs font-bold text-gray-400">
                    {activeCategory?.title ?? "تمرین"}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {activePractice?.title ?? "تمرین فعال"}
                  </h2>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-2xl text-gray-950 shadow-lg shadow-yellow-900/20">
                  ⏱
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] bg-white/5 px-4 py-6 text-center">
                <p className="font-mono text-6xl font-black tracking-widest text-yellow-300">
                  {formatTime(activeRemaining)}
                </p>
                <p className="mt-3 text-xs font-bold text-gray-400">
                  {activeTimer.isPaused
                    ? "هر وقت آماده بودی ادامه بده"
                    : `مدت تمرین: ${activeTimer.durationMinutes} دقیقه`}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-lg">⭐</span>
                <span className="text-xs font-bold text-gray-300">
                  با کامل شدن این تمرین، ۱۰ امتیاز می‌گیری
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {activeTimer.isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="rounded-2xl bg-green-500 px-4 py-3.5 text-sm font-black text-gray-950 transition hover:bg-green-400"
                  >
                    ▶ ادامه تمرین
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-gray-950 transition hover:bg-gray-100"
                  >
                    ⏸ توقف موقت
                  </button>
                )}
                <button
                  onClick={cancelTimer}
                  className="rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-red-400"
                >
                  ✕ لغو تمرین
                </button>
              </div>
            </div>
          </section>
        )}

        {categories.map((category, categoryIndex) => {
          const categoryItems = getCategoryItems(category.id);
          if (categoryItems.length === 0) {
            return null;
          }

          const completedCategoryItems =
            categoryItems.filter((item) =>
              isPracticeCompleted(item.id)
            ).length;

          const categoryProgress = Math.round(
            (completedCategoryItems / categoryItems.length) *
              100
          );

          const categoryColors =
            categoryIndex % 3 === 0
              ? {
                  icon: "bg-violet-100 text-violet-700",
                  progress: "bg-violet-500",
                  badge: "bg-violet-100 text-violet-700",
                  border: "border-violet-100",
                }
              : categoryIndex % 3 === 1
                ? {
                    icon: "bg-blue-100 text-blue-700",
                    progress: "bg-blue-500",
                    badge: "bg-blue-100 text-blue-700",
                    border: "border-blue-100",
                  }
                : {
                    icon: "bg-fuchsia-100 text-fuchsia-700",
                    progress: "bg-fuchsia-500",
                    badge: "bg-fuchsia-100 text-fuchsia-700",
                    border: "border-fuchsia-100",
                  };

          return (
            <section
              key={category.id}
              className={`mb-5 overflow-hidden rounded-[2rem] border bg-white p-5 shadow-sm ${categoryColors.border}`}
            >
              <div className="mb-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${categoryColors.icon}`}
                    >
                      {categoryIndex % 3 === 0
                        ? "🎵"
                        : categoryIndex % 3 === 1
                          ? "🧠"
                          : "🎯"}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-gray-950">
                        {category.title}
                      </h2>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {completedCategoryItems} از{" "}
                        {categoryItems.length} تمرین کامل شده
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${categoryColors.badge}`}
                  >
                    {categoryProgress}٪
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${categoryColors.progress}`}
                    style={{
                      width: `${categoryProgress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item, index) => {
                  const completed = isPracticeCompleted(item.id);
                  const locked = isPracticeLocked(
                    category.id,
                    item.id
                  );

                  return (
                    <div
                      key={item.id}
                      className={`overflow-hidden rounded-[1.5rem] border p-4 transition ${
                        completed
                          ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                          : locked
                            ? "border-gray-200 bg-gray-50"
                            : "border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black ${
                              completed
                                ? "bg-green-500 text-white shadow-md shadow-green-200"
                                : locked
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-purple-200"
                            }`}
                          >
                            {completed
                              ? "✓"
                              : locked
                                ? "🔒"
                                : index + 1}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`truncate text-sm font-black ${
                                locked
                                  ? "text-gray-400"
                                  : completed
                                    ? "text-green-900"
                                    : "text-gray-950"
                              }`}
                            >
                              {item.title}
                            </p>

                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  locked
                                    ? "text-gray-400"
                                    : completed
                                      ? "text-green-700"
                                      : "text-gray-500"
                                }`}
                              >
                                ⏱ {item.durationMinutes} دقیقه
                              </span>

                              {!completed && !locked && (
                                <span className="text-xs font-black text-yellow-600">
                                  ⭐ +۱۰
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {completed ? (
                          <span className="shrink-0 rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-white shadow-sm">
                            انجام شد ✓
                          </span>
                        ) : locked ? (
                          <span className="shrink-0 rounded-xl bg-gray-200 px-3 py-2 text-[10px] font-black text-gray-500">
                            قبلی را کامل کن
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              startPractice(
                                category.id,
                                item.id
                              )
                            }
                            disabled={activeTimer !== null}
                            className="shrink-0 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            شروع 🚀
                          </button>
                        )}
                      </div>

                      {completed && (
                        <div className="mt-4 border-t border-green-200 pt-3">
                          {records
                            .filter(
                              (record) =>
                                record.practiceId === item.id &&
                                isToday(record.startTime)
                            )
                            .slice(-1)
                            .map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between gap-3 text-xs"
                              >
                                <span className="font-medium text-gray-500">
                                  شروع:{" "}
                                  {formatDateTime(
                                    record.startTime
                                  )}
                                </span>
                                <span className="rounded-lg bg-green-100 px-2 py-1 font-black text-green-700">
                                  +{record.points} امتیاز
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      {locked && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
                          <span className="text-sm">🔒</span>
                          <p className="text-[11px] font-medium leading-5 text-gray-400">
                            برای فعال شدن این تمرین، تمرین قبلی را کامل کن.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {categories.length === 0 && (
          <section className="mb-5 overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-4xl">
              📚
            </div>
            <h2 className="mt-5 text-lg font-black text-gray-950">
              هنوز تمرینی تعریف نشده است
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              از تنظیمات می‌توانی دسته‌ها و تمرین‌های جدید ایجاد کنی.
            </p>
          </section>
        )}

        <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 p-5 shadow-lg shadow-orange-100">
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/15" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-md">
              ⭐
            </div>
            <div>
              <p className="font-black text-orange-950">
                آفرین باران!
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-orange-950/75">
                هر تمرینی که کامل کنی، ۱۰ امتیاز به دست می‌آری.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-gray-950 p-5 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-2xl text-gray-950">
              🚀
            </div>
            <div>
              <p className="font-black">
                فقط قدم بعدی رو بردار
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                لازم نیست همه تمرین‌ها رو یک‌دفعه انجام بدی.
              </p>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}