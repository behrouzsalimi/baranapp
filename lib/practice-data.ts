export type PracticeCategory = {
  id: string;
  title: string;
  createdAt: string;
  deletedAt: string | null;
};

export type PracticeItem = {
  id: string;
  categoryId: string;
  title: string;
  order: number;
  durationMinutes: number;
  createdAt: string;
  deletedAt: string | null;
};

export type PracticeRecord = {
  id: string;
  practiceId: string;
  categoryId: string;
  categoryTitle?: string;
  practiceTitle?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  points: number;
};

const CATEGORIES_KEY = "baran_practice_categories";
const ITEMS_KEY = "baran_practice_items";
const RECORDS_KEY = "baran_practice_records";
const ACTIVE_TIMER_KEY = "baran_active_timer";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

export function getPracticeCategories(): PracticeCategory[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    const createdAt = now();

    const defaultCategories: PracticeCategory[] = [
      {
        id: "category_santur",
        title: "سنتور",
        createdAt,
        deletedAt: null,
      },
      {
        id: "category_smart",
        title: "تیزهوشان",
        createdAt,
        deletedAt: null,
      },
    ];

    localStorage.setItem(
      CATEGORIES_KEY,
      JSON.stringify(defaultCategories)
    );

    return defaultCategories;
  } catch {
    return [];
  }
}

export function getPracticeItems(): PracticeItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(ITEMS_KEY);

    if (saved) {
      const parsedItems = JSON.parse(saved);

      return parsedItems.map((item: PracticeItem) => ({
        ...item,
        durationMinutes:
          typeof item.durationMinutes === "number"
            ? item.durationMinutes
            : item.categoryId === "category_smart"
            ? 30
            : 15,
      }));
    }

    const createdAt = now();

    const defaultItems: PracticeItem[] = [
      {
        id: "practice_santur_1",
        categoryId: "category_santur",
        title: "تمرین اول",
        order: 1,
        durationMinutes: 15,
        createdAt,
        deletedAt: null,
      },
      {
        id: "practice_santur_2",
        categoryId: "category_santur",
        title: "تمرین دوم",
        order: 2,
        durationMinutes: 15,
        createdAt,
        deletedAt: null,
      },
      {
        id: "practice_santur_3",
        categoryId: "category_santur",
        title: "تمرین سوم",
        order: 3,
        durationMinutes: 15,
        createdAt,
        deletedAt: null,
      },
      {
        id: "practice_smart_1",
        categoryId: "category_smart",
        title: "تمرین اول",
        order: 1,
        durationMinutes: 30,
        createdAt,
        deletedAt: null,
      },
      {
        id: "practice_smart_2",
        categoryId: "category_smart",
        title: "تمرین دوم",
        order: 2,
        durationMinutes: 30,
        createdAt,
        deletedAt: null,
      },
    ];

    localStorage.setItem(
      ITEMS_KEY,
      JSON.stringify(defaultItems)
    );

    return defaultItems;
  } catch {
    return [];
  }
}

export function savePracticeCategories(
  categories: PracticeCategory[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CATEGORIES_KEY,
    JSON.stringify(categories)
  );
}

export function savePracticeItems(items: PracticeItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ITEMS_KEY,
    JSON.stringify(items)
  );
}

export function getActivePracticeCategories() {
  return getPracticeCategories()
    .filter((category) => category.deletedAt === null)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );
}

export function getActivePracticeItems(categoryId?: string) {
  return getPracticeItems()
    .filter(
      (item) =>
        item.deletedAt === null &&
        (!categoryId || item.categoryId === categoryId)
    )
    .sort((a, b) => a.order - b.order);
}

export function addPracticeCategory(
  title: string
): PracticeCategory | null {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return null;
  }

  const categories = getPracticeCategories();

  const category: PracticeCategory = {
    id: createId("category"),
    title: cleanTitle,
    createdAt: now(),
    deletedAt: null,
  };

  savePracticeCategories([...categories, category]);

  return category;
}

export function renamePracticeCategory(
  categoryId: string,
  title: string
) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return;
  }

  const categories = getPracticeCategories();

  const updatedCategories = categories.map((category) =>
    category.id === categoryId
      ? {
          ...category,
          title: cleanTitle,
        }
      : category
  );

  savePracticeCategories(updatedCategories);
}

export function deletePracticeCategory(categoryId: string) {
  const deletedAt = now();

  const categories = getPracticeCategories();

  const updatedCategories = categories.map((category) =>
    category.id === categoryId
      ? {
          ...category,
          deletedAt,
        }
      : category
  );

  savePracticeCategories(updatedCategories);

  const items = getPracticeItems();

  const updatedItems = items.map((item) =>
    item.categoryId === categoryId && item.deletedAt === null
      ? {
          ...item,
          deletedAt,
        }
      : item
  );

  savePracticeItems(updatedItems);
}

export function addPracticeItem(
  categoryId: string,
  title: string
): PracticeItem | null {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return null;
  }

  const items = getPracticeItems();

  const categoryItems = items.filter(
    (item) =>
      item.categoryId === categoryId &&
      item.deletedAt === null
  );

  const highestOrder = categoryItems.reduce(
    (highest, item) => Math.max(highest, item.order),
    0
  );

  const item: PracticeItem = {
    id: createId("practice"),
    categoryId,
    title: cleanTitle,
    order: highestOrder + 1,
    durationMinutes:
      categoryId === "category_smart" ? 30 : 15,
    createdAt: now(),
    deletedAt: null,
  };

  savePracticeItems([...items, item]);

  return item;
}

export function renamePracticeItem(
  itemId: string,
  title: string
) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    return;
  }

  const items = getPracticeItems();

  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          title: cleanTitle,
        }
      : item
  );

  savePracticeItems(updatedItems);
}

export function updatePracticeItemDuration(
  itemId: string,
  durationMinutes: number
) {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return;
  }

  const items = getPracticeItems();

  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          durationMinutes,
        }
      : item
  );

  savePracticeItems(updatedItems);
}

export function deletePracticeItem(itemId: string) {
  const items = getPracticeItems();

  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          deletedAt: now(),
        }
      : item
  );

  savePracticeItems(updatedItems);
}

export function reorderPracticeItems(
  categoryId: string,
  orderedItemIds: string[]
) {
  const items = getPracticeItems();

  const updatedItems = items.map((item) => {
    if (item.categoryId !== categoryId) {
      return item;
    }

    const newOrder = orderedItemIds.indexOf(item.id);

    if (newOrder === -1) {
      return item;
    }

    return {
      ...item,
      order: newOrder + 1,
    };
  });

  savePracticeItems(updatedItems);
}

export function getPracticeRecords(): PracticeRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(RECORDS_KEY);

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function clearPracticeHistory() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(ACTIVE_TIMER_KEY);
}