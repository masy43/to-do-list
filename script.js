/* ========================================
   TaskFlow — Professional Task Manager
   Core Application Logic
   ======================================== */

// ─── State ───────────────────────────────────
const STATE_KEY = "taskflow_state";
const DEFAULT_CATEGORIES = [
  { id: "cat_work", name: "Work", color: "#e63946" },
  { id: "cat_personal", name: "Personal", color: "#ff6b6b" },
  { id: "cat_health", name: "Health", color: "#b91c2c" },
];

let state = loadState();

function getDefaultState() {
  return {
    tasks: [],
    categories: [...DEFAULT_CATEGORIES],
    currentView: "all",
    currentSort: "created",
    currentCategoryFilter: null,
    theme: "dark",
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      // Ensure all fields exist
      return { ...getDefaultState(), ...s };
    }
  } catch (e) {
    console.warn("Failed to load state", e);
  }
  return getDefaultState();
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
}

// ─── DOM References ──────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  sidebar: $("#sidebar"),
  sidebarOverlay: $("#sidebar-overlay"),
  mobileMenuBtn: $("#mobile-menu-btn"),
  themeToggle: $("#theme-toggle"),
  searchInput: $("#search-input"),
  sortBtn: $("#sort-btn"),
  sortMenu: $("#sort-menu"),
  exportBtn: $("#export-btn"),
  tasksList: $("#tasks-list"),
  emptyState: $("#empty-state"),
  fabAdd: $("#fab-add"),
  progressFill: $("#progress-fill"),
  progressPct: $("#progress-pct"),
  markAllDone: $("#mark-all-done"),
  clearCompleted: $("#clear-completed-btn"),
  viewTitle: $("#view-title"),
  viewCount: $("#view-count"),
  // Stats
  statTotal: $("#stat-total"),
  statCompleted: $("#stat-completed"),
  statPending: $("#stat-pending"),
  statOverdue: $("#stat-overdue"),
  // Badges
  badgeAll: $("#badge-all"),
  badgeToday: $("#badge-today"),
  badgeUpcoming: $("#badge-upcoming"),
  badgeCompleted: $("#badge-completed"),
  badgeOverdue: $("#badge-overdue"),
  // Category
  categoryNav: $("#category-nav"),
  addCategoryBtn: $("#add-category-btn"),
  // Task Modal
  taskModalOverlay: $("#task-modal-overlay"),
  modalTitle: $("#modal-title"),
  modalClose: $("#modal-close"),
  modalCancel: $("#modal-cancel"),
  modalSave: $("#modal-save"),
  taskTitleInput: $("#task-title-input"),
  taskDescInput: $("#task-desc-input"),
  taskPriority: $("#task-priority"),
  taskDueDate: $("#task-due-date"),
  taskDueTime: $("#task-due-time"),
  taskCategory: $("#task-category"),
  subtaskInput: $("#subtask-input"),
  addSubtaskBtn: $("#add-subtask-btn"),
  subtasksListModal: $("#subtasks-list-modal"),
  // Category Modal
  categoryModalOverlay: $("#category-modal-overlay"),
  categoryModalClose: $("#category-modal-close"),
  categoryCancel: $("#category-cancel"),
  categorySave: $("#category-save"),
  categoryNameInput: $("#category-name-input"),
  colorPicker: $("#color-picker"),
  // Confirm Modal
  confirmModalOverlay: $("#confirm-modal-overlay"),
  confirmTitle: $("#confirm-title"),
  confirmMessage: $("#confirm-message"),
  confirmCancel: $("#confirm-cancel"),
  confirmOk: $("#confirm-ok"),
  // Toast
  toastContainer: $("#toast-container"),
};

// ─── Temp modal state ────────────────────────
let editingTaskId = null;
let modalSubtasks = [];
let confirmCallback = null;

// ─── Init ────────────────────────────────────
function init() {
  applyTheme(state.theme);
  bindEvents();
  renderAll();
}

// ─── Theme ───────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  state.theme = theme;
  saveState();
}

function toggleTheme() {
  const newTheme = state.theme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

// ─── Events ──────────────────────────────────
function bindEvents() {
  // Theme
  els.themeToggle.addEventListener("click", toggleTheme);

  // Mobile sidebar
  els.mobileMenuBtn.addEventListener("click", () => {
    els.sidebar.classList.toggle("open");
    els.sidebarOverlay.classList.toggle("open");
  });
  els.sidebarOverlay.addEventListener("click", () => {
    els.sidebar.classList.remove("open");
    els.sidebarOverlay.classList.remove("open");
  });

  // Nav items
  $$(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentView = btn.dataset.view;
      state.currentCategoryFilter = null;
      $$(".nav-item").forEach((n) => n.classList.remove("active"));
      btn.classList.add("active");
      closeMobileSidebar();
      renderAll();
    });
  });

  // Search
  els.searchInput.addEventListener("input", debounce(renderAll, 200));

  // Sort
  els.sortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    els.sortMenu.classList.toggle("open");
  });
  document.addEventListener("click", () =>
    els.sortMenu.classList.remove("open"),
  );
  $$(".sort-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      state.currentSort = opt.dataset.sort;
      $$(".sort-option").forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      els.sortMenu.classList.remove("open");
      saveState();
      renderAll();
    });
  });

  // Export
  els.exportBtn.addEventListener("click", exportTasks);

  // FAB
  els.fabAdd.addEventListener("click", () => openTaskModal());

  // Mark all / clear completed
  els.markAllDone.addEventListener("click", markAllDone);
  els.clearCompleted.addEventListener("click", () => {
    showConfirm("Clear Completed", "Remove all completed tasks?", () => {
      state.tasks = state.tasks.filter((t) => !t.completed);
      saveState();
      renderAll();
      toast("Completed tasks cleared", "info");
    });
  });

  // Task modal
  els.modalClose.addEventListener("click", closeTaskModal);
  els.modalCancel.addEventListener("click", closeTaskModal);
  els.taskModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.taskModalOverlay) closeTaskModal();
  });
  els.modalSave.addEventListener("click", saveTask);
  els.taskTitleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveTask();
  });

  // Subtasks in modal
  els.addSubtaskBtn.addEventListener("click", addModalSubtask);
  els.subtaskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addModalSubtask();
  });

  // Category modal
  els.addCategoryBtn.addEventListener("click", openCategoryModal);
  els.categoryModalClose.addEventListener("click", closeCategoryModal);
  els.categoryCancel.addEventListener("click", closeCategoryModal);
  els.categoryModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.categoryModalOverlay) closeCategoryModal();
  });
  els.categorySave.addEventListener("click", saveCategory);

  // Color picker
  $$(".color-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      $$(".color-swatch").forEach((s) => s.classList.remove("active"));
      sw.classList.add("active");
    });
  });

  // Confirm modal
  els.confirmCancel.addEventListener("click", closeConfirmModal);
  els.confirmOk.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });
  els.confirmModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.confirmModalOverlay) closeConfirmModal();
  });

  // Task list delegation
  els.tasksList.addEventListener("click", handleTaskListClick);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+N — new task
    if (e.ctrlKey && e.key === "n") {
      e.preventDefault();
      openTaskModal();
    }
    // Ctrl+K — focus search
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      els.searchInput.focus();
    }
    // Escape — close modals
    if (e.key === "Escape") {
      closeTaskModal();
      closeCategoryModal();
      closeConfirmModal();
      els.searchInput.blur();
    }
  });
}

function closeMobileSidebar() {
  els.sidebar.classList.remove("open");
  els.sidebarOverlay.classList.remove("open");
}

// ─── Rendering ───────────────────────────────
function renderAll() {
  renderStats();
  renderProgress();
  renderBadges();
  renderCategoryNav();
  renderTaskList();
  updateViewHeader();
}

function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = state.tasks.filter(
    (t) => !t.completed && isOverdue(t),
  ).length;

  els.statTotal.textContent = total;
  els.statCompleted.textContent = completed;
  els.statPending.textContent = pending;
  els.statOverdue.textContent = overdue;
}

function renderProgress() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  els.progressFill.style.width = `${pct}%`;
  els.progressPct.textContent = `${pct}%`;
}

function renderBadges() {
  const now = new Date();
  const todayStr = toDateStr(now);

  els.badgeAll.textContent = state.tasks.filter((t) => !t.completed).length;
  els.badgeToday.textContent = state.tasks.filter(
    (t) => !t.completed && t.dueDate === todayStr,
  ).length;
  els.badgeUpcoming.textContent = state.tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate > todayStr,
  ).length;
  els.badgeCompleted.textContent = state.tasks.filter(
    (t) => t.completed,
  ).length;

  const overdueCount = state.tasks.filter(
    (t) => !t.completed && isOverdue(t),
  ).length;
  els.badgeOverdue.textContent = overdueCount;
}

function renderCategoryNav() {
  els.categoryNav.innerHTML = "";
  state.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `nav-item${state.currentView === "category" && state.currentCategoryFilter === cat.id ? " active" : ""}`;
    btn.innerHTML = `
      <span class="cat-dot" style="background:${cat.color}"></span>
      <span>${escHtml(cat.name)}</span>
      <span class="nav-badge">${state.tasks.filter((t) => t.categoryId === cat.id && !t.completed).length}</span>
    `;
    btn.addEventListener("click", () => {
      state.currentView = "category";
      state.currentCategoryFilter = cat.id;
      $$(".nav-item").forEach((n) => n.classList.remove("active"));
      btn.classList.add("active");
      closeMobileSidebar();
      renderAll();
    });
    els.categoryNav.appendChild(btn);
  });

  // Update category select in modal
  const sel = els.taskCategory;
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">None</option>';
  state.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
  sel.value = currentVal;
}

function getFilteredTasks() {
  const now = new Date();
  const todayStr = toDateStr(now);
  const query = els.searchInput.value.trim().toLowerCase();
  let tasks = [...state.tasks];

  // View filter
  switch (state.currentView) {
    case "today":
      tasks = tasks.filter((t) => !t.completed && t.dueDate === todayStr);
      break;
    case "upcoming":
      tasks = tasks.filter(
        (t) => !t.completed && t.dueDate && t.dueDate > todayStr,
      );
      break;
    case "completed":
      tasks = tasks.filter((t) => t.completed);
      break;
    case "overdue":
      tasks = tasks.filter((t) => !t.completed && isOverdue(t));
      break;
    case "category":
      tasks = tasks.filter((t) => t.categoryId === state.currentCategoryFilter);
      break;
    default:
      // all — show everything
      break;
  }

  // Search filter
  if (query) {
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)),
    );
  }

  // Sort
  tasks = sortTasks(tasks);
  return tasks;
}

function sortTasks(tasks) {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
  switch (state.currentSort) {
    case "dueDate":
      return tasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case "priority":
      return tasks.sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4),
      );
    case "alphabetical":
      return tasks.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }
}

function renderTaskList() {
  const tasks = getFilteredTasks();
  els.tasksList.innerHTML = "";

  if (tasks.length === 0) {
    els.emptyState.style.display = "block";
    return;
  }

  els.emptyState.style.display = "none";

  tasks.forEach((task, i) => {
    const card = document.createElement("div");
    card.className = `task-card${task.completed ? " completed-card" : ""}`;
    card.style.animationDelay = `${i * 0.04}s`;
    card.dataset.id = task.id;

    const category = state.categories.find((c) => c.id === task.categoryId);
    const dueMeta = getDueMeta(task);
    const subtasksDone = task.subtasks
      ? task.subtasks.filter((s) => s.done).length
      : 0;
    const subtasksTotal = task.subtasks ? task.subtasks.length : 0;

    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle" data-id="${task.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="task-body">
          <div class="task-title ${task.completed ? "done" : ""}">${escHtml(task.title)}</div>
          ${task.description ? `<div class="task-description">${escHtml(task.description)}</div>` : ""}
          <div class="task-meta">
            <span class="task-tag tag-priority-${task.priority || "none"}">${priorityLabel(task.priority)}</span>
            ${dueMeta.label ? `<span class="task-tag tag-due ${dueMeta.class}">${dueMeta.icon} ${dueMeta.label}</span>` : ""}
            ${category ? `<span class="task-tag tag-category" style="background:${category.color}">${escHtml(category.name)}</span>` : ""}
            ${subtasksTotal > 0 ? `<span class="task-tag tag-due">${subtasksDone}/${subtasksTotal} subtasks</span>` : ""}
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn" data-action="edit" data-id="${task.id}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="task-action-btn" data-action="duplicate" data-id="${task.id}" title="Duplicate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="task-action-btn delete-btn" data-action="delete" data-id="${task.id}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      ${subtasksTotal > 0 ? renderSubtasks(task) : ""}
    `;

    els.tasksList.appendChild(card);
  });
}

function renderSubtasks(task) {
  if (!task.subtasks || task.subtasks.length === 0) return "";
  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  let html = '<div class="task-subtasks">';
  task.subtasks.forEach((sub, i) => {
    html += `
      <div class="subtask-row">
        <div class="subtask-check ${sub.done ? "checked" : ""}" data-action="toggle-subtask" data-task-id="${task.id}" data-sub-index="${i}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span class="subtask-text ${sub.done ? "done" : ""}">${escHtml(sub.text)}</span>
      </div>
    `;
  });
  html += "</div>";
  html += `<div class="subtask-progress">${done} of ${total} completed</div>`;
  return html;
}

function updateViewHeader() {
  const viewNames = {
    all: "All Tasks",
    today: "Today",
    upcoming: "Upcoming",
    completed: "Completed",
    overdue: "Overdue",
  };
  if (state.currentView === "category") {
    const cat = state.categories.find(
      (c) => c.id === state.currentCategoryFilter,
    );
    els.viewTitle.textContent = cat ? cat.name : "Category";
  } else {
    els.viewTitle.textContent = viewNames[state.currentView] || "All Tasks";
  }
  const count = getFilteredTasks().length;
  els.viewCount.textContent = `${count} task${count !== 1 ? "s" : ""}`;
}

// ─── Task List Click Handler ─────────────────
function handleTaskListClick(e) {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  const taskId = actionEl.dataset.id;

  switch (action) {
    case "toggle":
      toggleTask(taskId);
      break;
    case "edit":
      openTaskModal(taskId);
      break;
    case "duplicate":
      duplicateTask(taskId);
      break;
    case "delete":
      showConfirm(
        "Delete Task",
        "Are you sure you want to delete this task?",
        () => {
          deleteTask(taskId);
        },
      );
      break;
    case "toggle-subtask": {
      const taskIdSub = actionEl.dataset.taskId;
      const subIndex = parseInt(actionEl.dataset.subIndex);
      toggleSubtask(taskIdSub, subIndex);
      break;
    }
  }
}

// ─── Task CRUD ───────────────────────────────
function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  if (task.completed) {
    task.completedAt = Date.now();
    toast("Task completed!", "success");
  } else {
    task.completedAt = null;
  }
  saveState();
  renderAll();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveState();
  renderAll();
  toast("Task deleted", "info");
}

function duplicateTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  const dup = {
    ...JSON.parse(JSON.stringify(task)),
    id: uid(),
    title: task.title + " (copy)",
    completed: false,
    completedAt: null,
    createdAt: Date.now(),
  };
  if (dup.subtasks) {
    dup.subtasks = dup.subtasks.map((s) => ({ ...s, done: false }));
  }
  state.tasks.push(dup);
  saveState();
  renderAll();
  toast("Task duplicated", "info");
}

function toggleSubtask(taskId, subIndex) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || !task.subtasks || !task.subtasks[subIndex]) return;
  task.subtasks[subIndex].done = !task.subtasks[subIndex].done;

  // Auto-complete parent if all subtasks done
  const allDone = task.subtasks.every((s) => s.done);
  if (allDone && !task.completed) {
    task.completed = true;
    task.completedAt = Date.now();
    toast("All subtasks done — task completed!", "success");
  }

  saveState();
  renderAll();
}

function markAllDone() {
  const pending = state.tasks.filter((t) => !t.completed);
  if (pending.length === 0) {
    toast("All tasks already completed", "info");
    return;
  }
  pending.forEach((t) => {
    t.completed = true;
    t.completedAt = Date.now();
    if (t.subtasks) t.subtasks.forEach((s) => (s.done = true));
  });
  saveState();
  renderAll();
  toast(`${pending.length} task(s) marked as done`, "success");
}

// ─── Task Modal ──────────────────────────────
function openTaskModal(editId) {
  editingTaskId = editId || null;
  modalSubtasks = [];

  if (editingTaskId) {
    const task = state.tasks.find((t) => t.id === editingTaskId);
    if (!task) return;
    els.modalTitle.textContent = "Edit Task";
    els.taskTitleInput.value = task.title;
    els.taskDescInput.value = task.description || "";
    els.taskPriority.value = task.priority || "medium";
    els.taskDueDate.value = task.dueDate || "";
    els.taskDueTime.value = task.dueTime || "";
    els.taskCategory.value = task.categoryId || "";
    modalSubtasks = task.subtasks ? task.subtasks.map((s) => ({ ...s })) : [];
    els.modalSave.textContent = "Update Task";
  } else {
    els.modalTitle.textContent = "New Task";
    els.taskTitleInput.value = "";
    els.taskDescInput.value = "";
    els.taskPriority.value = "medium";
    els.taskDueDate.value = "";
    els.taskDueTime.value = "";
    els.taskCategory.value = "";
    modalSubtasks = [];
    els.modalSave.textContent = "Save Task";
  }

  renderModalSubtasks();
  renderCategoryNav(); // refresh select
  if (editingTaskId) {
    const task = state.tasks.find((t) => t.id === editingTaskId);
    if (task) els.taskCategory.value = task.categoryId || "";
  }
  els.taskModalOverlay.classList.add("open");
  setTimeout(() => els.taskTitleInput.focus(), 100);
}

function closeTaskModal() {
  els.taskModalOverlay.classList.remove("open");
  editingTaskId = null;
  modalSubtasks = [];
}

function saveTask() {
  const title = els.taskTitleInput.value.trim();
  if (!title) {
    els.taskTitleInput.focus();
    toast("Please enter a task title", "error");
    return;
  }

  if (editingTaskId) {
    const task = state.tasks.find((t) => t.id === editingTaskId);
    if (task) {
      task.title = title;
      task.description = els.taskDescInput.value.trim();
      task.priority = els.taskPriority.value;
      task.dueDate = els.taskDueDate.value || null;
      task.dueTime = els.taskDueTime.value || null;
      task.categoryId = els.taskCategory.value || null;
      task.subtasks = [...modalSubtasks];
      toast("Task updated", "success");
    }
  } else {
    const newTask = {
      id: uid(),
      title,
      description: els.taskDescInput.value.trim(),
      priority: els.taskPriority.value,
      dueDate: els.taskDueDate.value || null,
      dueTime: els.taskDueTime.value || null,
      categoryId: els.taskCategory.value || null,
      subtasks: [...modalSubtasks],
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
    };
    state.tasks.push(newTask);
    toast("Task created", "success");
  }

  saveState();
  closeTaskModal();
  renderAll();
}

function addModalSubtask() {
  const text = els.subtaskInput.value.trim();
  if (!text) return;
  modalSubtasks.push({ text, done: false });
  els.subtaskInput.value = "";
  renderModalSubtasks();
  els.subtaskInput.focus();
}

function removeModalSubtask(index) {
  modalSubtasks.splice(index, 1);
  renderModalSubtasks();
}

function renderModalSubtasks() {
  els.subtasksListModal.innerHTML = "";
  modalSubtasks.forEach((sub, i) => {
    const div = document.createElement("div");
    div.className = "modal-subtask-item";
    div.innerHTML = `
      <span>${escHtml(sub.text)}</span>
      <button data-remove-subtask="${i}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    div
      .querySelector("button")
      .addEventListener("click", () => removeModalSubtask(i));
    els.subtasksListModal.appendChild(div);
  });
}

// ─── Category Modal ──────────────────────────
function openCategoryModal() {
  els.categoryNameInput.value = "";
  $$(".color-swatch").forEach((s) => s.classList.remove("active"));
  $(".color-swatch").classList.add("active");
  els.categoryModalOverlay.classList.add("open");
  setTimeout(() => els.categoryNameInput.focus(), 100);
}

function closeCategoryModal() {
  els.categoryModalOverlay.classList.remove("open");
}

function saveCategory() {
  const name = els.categoryNameInput.value.trim();
  if (!name) {
    els.categoryNameInput.focus();
    toast("Please enter a category name", "error");
    return;
  }
  const color = $(".color-swatch.active")?.dataset.color || "#e63946";
  state.categories.push({ id: "cat_" + uid(), name, color });
  saveState();
  closeCategoryModal();
  renderAll();
  toast("Category created", "success");
}

// ─── Confirm Modal ───────────────────────────
function showConfirm(title, message, onOk) {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  confirmCallback = onOk;
  els.confirmModalOverlay.classList.add("open");
}

function closeConfirmModal() {
  els.confirmModalOverlay.classList.remove("open");
  confirmCallback = null;
}

// ─── Export ──────────────────────────────────
function exportTasks() {
  const data = {
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    categories: state.categories,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskflow-export-${toDateStr(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Tasks exported successfully", "success");
}

// ─── Toast ───────────────────────────────────
function toast(message, type = "info") {
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = message;
  els.toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// ─── Utilities ───────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function escHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const now = new Date();
  const due = new Date(
    task.dueDate + (task.dueTime ? "T" + task.dueTime : "T23:59:59"),
  );
  return due < now;
}

function getDueMeta(task) {
  if (!task.dueDate) return { label: "", class: "", icon: "" };
  const todayStr = toDateStr(new Date());
  const tomorrowStr = toDateStr(new Date(Date.now() + 86400000));
  const dueStr = task.dueDate;
  const overdue = isOverdue(task);

  let label = formatDate(dueStr);
  let cls = "";
  let icon = "📅";

  if (dueStr === todayStr) {
    label = "Today" + (task.dueTime ? " " + formatTime(task.dueTime) : "");
    cls = "today";
    icon = "⏰";
  } else if (dueStr === tomorrowStr) {
    label = "Tomorrow" + (task.dueTime ? " " + formatTime(task.dueTime) : "");
    icon = "📅";
  } else if (overdue && !task.completed) {
    cls = "overdue";
    icon = "⚠️";
    label =
      formatDate(dueStr) + (task.dueTime ? " " + formatTime(task.dueTime) : "");
  } else {
    label =
      formatDate(dueStr) + (task.dueTime ? " " + formatTime(task.dueTime) : "");
  }

  return { label, class: cls, icon };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function priorityLabel(p) {
  const labels = {
    urgent: "🔴 Urgent",
    high: "🟠 High",
    medium: "🟡 Medium",
    low: "🔵 Low",
  };
  return labels[p] || "";
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Start ───────────────────────────────────
init();
