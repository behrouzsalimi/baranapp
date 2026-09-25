"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import {
  addPracticeCategory,
  addPracticeItem,
  deletePracticeCategory,
  deletePracticeItem,
  getActivePracticeCategories,
  getActivePracticeItems,
  renamePracticeCategory,
  renamePracticeItem,
  updatePracticeItemDuration,
  clearPracticeHistory,
  type PracticeCategory,
  type PracticeItem,
} from "@/lib/practice-data";
import {
  changeSettingsPassword,
  createSettingsPassword,
  getPointValue,
  hasSettingsPassword,
  setPointValue,
  verifySettingsPassword,
} from "@/lib/settings-data";
import { clearSettlementHistory } from "@/lib/settlement-data";

type ResetOptions = {
  practiceHistory: boolean;
  settlementHistory: boolean;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [pointValue, setPointValueState] = useState(0);
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetOptions, setResetOptions] = useState<ResetOptions>({
    practiceHistory: false,
    settlementHistory: false,
  });

  useEffect(() => {
    async function load() {
      const passwordExists = await hasSettingsPassword();
      setHasPassword(passwordExists);
      setPointValueState(getPointValue());
      setCategories(getActivePracticeCategories());
      setItems(getActivePracticeItems());
      setLoading(false);
    }

    load();
  }, []);

  function refreshPracticeData() {
    setCategories(getActivePracticeCategories());
    setItems(getActivePracticeItems());
  }

  async function handleCreatePassword() {
    const success = await createSettingsPassword(password);

    if (!success) {
      window.alert("Password must be at least 4 characters.");
      return;
    }

    setHasPassword(true);
    setAuthenticated(true);
    setPassword("");
  }

  async function handleLogin() {
    const success = await verifySettingsPassword(password);

    if (!success) {
      window.alert("Incorrect password.");
      return;
    }

    setAuthenticated(true);
    setPassword("");
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      window.alert("Please enter both the current and new password.");
      return;
    }

    const success = await changeSettingsPassword(
      currentPassword,
      newPassword
    );

    if (!success) {
      window.alert(
        "Current password is incorrect or the new password is invalid."
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    window.alert("Password changed successfully.");
  }

  function handlePointValueSave() {
    const value = Number(pointValue);

    if (!Number.isFinite(value) || value < 0) {
      window.alert("Point value must be zero or greater.");
      return;
    }

    const success = setPointValue(value);

    if (!success) {
      window.alert("Could not save point value.");
      return;
    }

    window.alert("Point value saved.");
  }

  function handleAddCategory() {
    const category = addPracticeCategory(newCategoryTitle);

    if (!category) {
      window.alert("Please enter a category name.");
      return;
    }

    setNewCategoryTitle("");
    refreshPracticeData();
  }

  function handleRenameCategory(categoryId: string) {
    if (!editingCategoryTitle.trim()) {
      return;
    }

    renamePracticeCategory(categoryId, editingCategoryTitle);
    setEditingCategoryId(null);
    setEditingCategoryTitle("");
    refreshPracticeData();
  }

  function handleDeleteCategory(categoryId: string) {
    const confirmed = window.confirm(
      "Delete this category and all active practices inside it?"
    );

    if (!confirmed) {
      return;
    }

    deletePracticeCategory(categoryId);
    refreshPracticeData();
  }

  function handleAddItem(categoryId: string) {
    const title = newItemTitles[categoryId] ?? "";
    const item = addPracticeItem(categoryId, title);

    if (!item) {
      window.alert("Please enter a practice name.");
      return;
    }

    setNewItemTitles((current) => ({
      ...current,
      [categoryId]: "",
    }));

    refreshPracticeData();
  }

  function handleRenameItem(itemId: string) {
    if (!editingItemTitle.trim()) {
      return;
    }

    renamePracticeItem(itemId, editingItemTitle);
    setEditingItemId(null);
    setEditingItemTitle("");
    refreshPracticeData();
  }

  function handleDurationChange(itemId: string, value: string) {
    const duration = Number(value);

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    updatePracticeItemDuration(itemId, duration);
    refreshPracticeData();
  }

  function handleDeleteItem(itemId: string) {
    const confirmed = window.confirm("Delete this practice?");

    if (!confirmed) {
      return;
    }

    deletePracticeItem(itemId);
    refreshPracticeData();
  }

  function openResetDialog() {
    setResetOptions({
      practiceHistory: false,
      settlementHistory: false,
    });
    setResetOpen(true);
  }

  function closeResetDialog() {
    setResetOpen(false);
    setResetOptions({
      practiceHistory: false,
      settlementHistory: false,
    });
  }

  function toggleResetOption(option: keyof ResetOptions) {
    setResetOptions((current) => ({
      ...current,
      [option]: !current[option],
    }));
  }

  function handleResetSelectedHistory() {
    const { practiceHistory, settlementHistory } = resetOptions;

    if (!practiceHistory && !settlementHistory) {
      window.alert("Please select at least one item to delete.");
      return;
    }

    const selectedItems: string[] = [];

    if (practiceHistory) {
      selectedItems.push("Practice History");
    }

    if (settlementHistory) {
      selectedItems.push("Monthly Settlement History");
    }

    const confirmed = window.confirm(
      `The following data will be deleted:\n\n` +
        selectedItems.map((item) => `• ${item}`).join("\n") +
        `\n\nThis action cannot be undone.\n\nContinue?`
    );

    if (!confirmed) {
      return;
    }

    if (practiceHistory) {
      clearPracticeHistory();
    }

    if (settlementHistory) {
      clearSettlementHistory();
    }

    closeResetDialog();
    window.alert("Selected history has been deleted.");
  }

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 px-4 pb-24 pt-6">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              Loading...
            </div>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (hasPassword && !authenticated) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 px-4 pb-24 pt-6">
          <div className="mx-auto max-w-md">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-center">
                <div className="text-5xl">🔐</div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                  Settings
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Enter your password to continue.
                </p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="Password"
                className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={handleLogin}
                className="mt-3 w-full rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-purple-700"
              >
                Unlock Settings
              </button>
            </section>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (!hasPassword) {
    return (
      <>
        <main className="min-h-screen bg-gray-50 px-4 pb-24 pt-6">
          <div className="mx-auto max-w-md">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-center">
                <div className="text-5xl">🔐</div>
                <h1 className="mt-4 text-2xl font-bold text-gray-900">
                  Create Settings Password
                </h1>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Create a password to protect the settings section.
                </p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCreatePassword();
                  }
                }}
                placeholder="New password"
                className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={handleCreatePassword}
                className="mt-3 w-full rounded-2xl bg-purple-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-purple-700"
              >
                Create Password
              </button>
            </section>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 px-4 pb-24 pt-6">
        <div className="mx-auto max-w-2xl">
          <header className="mb-6">
            <p className="text-sm font-semibold text-purple-600">
              App Configuration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage practices, rewards and app settings.
            </p>
          </header>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Point Value</h2>
            <p className="mt-1 text-sm text-gray-500">
              Set the monetary value of one point.
            </p>

            <div className="mt-4 flex gap-3">
              <input
                type="number"
                min="0"
                value={pointValue}
                onChange={(event) =>
                  setPointValueState(Number(event.target.value))
                }
                className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={handlePointValueSave}
                className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </section>

          <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Change Password
            </h2>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={handleChangePassword}
                className="w-full rounded-2xl bg-gray-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>
          </section>

          <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Practice Categories
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add, rename or delete practice categories.
                </p>
              </div>

              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                {categories.length}
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <input
                type="text"
                value={newCategoryTitle}
                onChange={(event) =>
                  setNewCategoryTitle(event.target.value)
                }
                placeholder="New category"
                className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={handleAddCategory}
                className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
              >
                Add
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {categories.map((category) => {
                const categoryItems = items.filter(
                  (item) => item.categoryId === category.id
                );

                return (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      {editingCategoryId === category.id ? (
                        <>
                          <input
                            type="text"
                            value={editingCategoryTitle}
                            onChange={(event) =>
                              setEditingCategoryTitle(event.target.value)
                            }
                            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleRenameCategory(category.id)
                            }
                            className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryTitle("");
                            }}
                            className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="min-w-0 flex-1 font-bold text-gray-900">
                            {category.title}
                          </h3>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setEditingCategoryTitle(category.title);
                            }}
                            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700"
                          >
                            Rename
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCategory(category.id)
                            }
                            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-white p-4"
                        >
                          {editingItemId === item.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingItemTitle}
                                onChange={(event) =>
                                  setEditingItemTitle(event.target.value)
                                }
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                              />

                              <button
                                type="button"
                                onClick={() => handleRenameItem(item.id)}
                                className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white"
                              >
                                Save
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemId(null);
                                  setEditingItemTitle("");
                                }}
                                className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-bold text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800">
                                  {item.title}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  Practice time: {item.durationMinutes}{" "}
                                  minute(s)
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditingItemTitle(item.title);
                                }}
                                className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700"
                              >
                                Rename
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          )}

                          <div className="mt-4 flex items-center gap-3">
                            <label className="text-xs font-semibold text-gray-500">
                              Practice Time
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.durationMinutes}
                              onChange={(event) =>
                                handleDurationChange(
                                  item.id,
                                  event.target.value
                                )
                              }
                              className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-purple-400"
                            />

                            <span className="text-xs text-gray-500">
                              minute(s)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <input
                        type="text"
                        value={newItemTitles[category.id] ?? ""}
                        onChange={(event) =>
                          setNewItemTitles((current) => ({
                            ...current,
                            [category.id]: event.target.value,
                          }))
                        }
                        placeholder="New practice"
                        className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400"
                      />

                      <button
                        type="button"
                        onClick={() => handleAddItem(category.id)}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                      >
                        Add Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                🗑️
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  Reset History
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Choose exactly which historical data you want to remove.
                  Categories, practices, passwords and settings will not be
                  deleted.
                </p>

                <button
                  type="button"
                  onClick={openResetDialog}
                  className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-red-700"
                >
                  Reset History
                </button>
              </div>
            </div>
          </section>

          {resetOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <div className="text-center">
                  <div className="text-4xl">🗑️</div>

                  <h2 className="mt-3 text-xl font-bold text-gray-900">
                    What do you want to delete?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Select one or more history sections. Other app settings
                    will remain unchanged.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <input
                      type="checkbox"
                      checked={resetOptions.practiceHistory}
                      onChange={() =>
                        toggleResetOption("practiceHistory")
                      }
                      className="h-5 w-5 accent-purple-600"
                    />

                    <div>
                      <p className="font-bold text-gray-900">
                        Practice History
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Completed practice records and points.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <input
                      type="checkbox"
                      checked={resetOptions.settlementHistory}
                      onChange={() =>
                        toggleResetOption("settlementHistory")
                      }
                      className="h-5 w-5 accent-purple-600"
                    />

                    <div>
                      <p className="font-bold text-gray-900">
                        Monthly Settlement History
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Previous monthly settlement records and amounts.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeResetDialog}
                    className="flex-1 rounded-2xl bg-gray-100 px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSelectedHistory}
                    disabled={
                      !resetOptions.practiceHistory &&
                      !resetOptions.settlementHistory
                    }
                    className="flex-1 rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}