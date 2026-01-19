let tasks = JSON.parse(localStorage.getItem("tasks")) || [
  { id: 1, text: "1E293B", completed: true, time: "1m" },
  { id: 2, text: "2D374B", completed: true, time: "1m" },
  { id: 3, text: "2D3748", completed: true, time: "1m" },
  { id: 4, text: "3A567C", completed: false, time: "2m" },
  { id: 5, text: "4B689D", completed: false, time: "3m" },
  { id: 6, text: "5C79AE", completed: false, time: "4m" },
  { id: 7, text: "6D8ABF", completed: false, time: "5m" },
];

let currentFilter = "all";

const newTaskInput = document.getElementById("new-task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const markAllDoneBtn = document.getElementById("mark-all-done");
const completedCountEl = document.getElementById("completed-count");
const totalCountEl = document.getElementById("total-count");
const progressFill = document.getElementById("progress-fill");
const tasksList = document.getElementById("tasks-list");
const filterTabs = document.querySelectorAll(".filter-tab");

function init() {
  renderTasks();
  updateProgress();
  setupEventListeners();
}

function renderTasks() {
  tasksList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state">No tasks to show</div>';
    return;
  }

  filteredTasks.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.className = "task-item";
    taskElement.innerHTML = `
          <div class="done-col">
            <div class="check-circle ${task.completed ? "checked" : ""}" data-id="${task.id}">
              ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ""}
            </div>
            <span class="time-label">${task.time}</span>
          </div>
          <div class="task-text ${task.completed ? "completed" : ""}">${task.text}</div>
          <div class="delete-col">
            <div class="delete-btn" data-id="${task.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
          </div>
        `;

    tasksList.appendChild(taskElement);
  });
}

// Update progress bar and counts
function updateProgress() {
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  completedCountEl.textContent = completedCount;
  totalCountEl.textContent = totalCount;

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  progressFill.style.width = `${progress}%`;
}

function setupEventListeners() {
  addTaskBtn.addEventListener("click", addTask);

  markAllDoneBtn.addEventListener("click", markAllDone);

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  newTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  tasksList.addEventListener("click", (e) => {
    if (e.target.closest(".check-circle")) {
      toggleComplete(e.target.closest(".check-circle").dataset.id);
    } else if (e.target.closest(".delete-btn")) {
      deleteTask(e.target.closest(".delete-btn").dataset.id);
    }
  });
}

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text,
    completed: false,
    time: "1m",
  };

  tasks.push(newTask);
  saveTasks();
  newTaskInput.value = "";
  renderTasks();
  updateProgress();
}

function toggleComplete(id) {
  const taskId = parseInt(id);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateProgress();
  }
}

function deleteTask(id) {
  const taskId = parseInt(id);
  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasks();
  renderTasks();
  updateProgress();
}

function markAllDone() {
  tasks.forEach((task) => {
    task.completed = true;
  });
  saveTasks();
  renderTasks();
  updateProgress();
}

function saveTasks() {
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (e) {
    console.warn("Could not save tasks to localStorage");
  }
}

init();
