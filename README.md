# Organize Your Day - To-Do List Application

A modern, feature-rich to-do list application built with vanilla HTML, CSS, and JavaScript. Manage your daily tasks efficiently with an intuitive interface and persistent storage.

## Features

- **Add Tasks**: Quickly add new tasks with an input field and button
- **Mark Complete**: Check off tasks as you complete them with a visual indicator
- **Delete Tasks**: Remove tasks you no longer need
- **Progress Tracking**: View your completion progress with a visual progress bar
- **Task Filtering**: Filter tasks by status - All, Active, or Completed
- **Mark All Done**: Complete all tasks at once with a single click
- **Persistent Storage**: Tasks are automatically saved to localStorage and restored on page reload
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Modern dark interface with accent colors for better visibility

## Project Structure

```
├── index.html       # HTML structure
├── style.css        # Styling and layout
├── script.js        # Application logic
└── README.md        # Documentation
```

## How to Use

1. **Open the Application**: Open `index.html` in your web browser
2. **Add a Task**: Type your task in the input field and click "Add Task" or press Enter
3. **Complete a Task**: Click the circle button next to a task to mark it as complete
4. **Delete a Task**: Click the trash icon to remove a task
5. **Filter Tasks**: Use the filter tabs (All, Active, Completed) to view specific tasks
6. **Mark All Done**: Click "Mark All Done" to complete all tasks at once

## Features in Detail

### Task Management

- Each task displays with a completion checkbox, task text, and delete button
- Completed tasks show with a strikethrough text style
- Tasks are organized in a grid layout with clear column headers

### Progress Tracking

- Real-time progress bar showing completion percentage
- Task counter displaying completed vs. total tasks
- Visual feedback for task completion status

### Storage

- All tasks are automatically saved to browser's localStorage
- Tasks persist across browser sessions
- Sample tasks are pre-loaded on first use

## Technical Details

### Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Flexbox and Grid layout, animations, gradients
- **JavaScript (ES6+)**: DOM manipulation, event handling, localStorage API

### Key Functions

- `init()`: Initialize the application
- `renderTasks()`: Display tasks based on current filter
- `updateProgress()`: Update progress bar and counters
- `setupEventListeners()`: Attach event handlers
- `addTask()`: Create and add new task
- `toggleComplete()`: Mark task as complete/incomplete
- `deleteTask()`: Remove a task
- `markAllDone()`: Complete all tasks
- `saveTasks()`: Persist tasks to localStorage

## Browser Compatibility

Works on all modern browsers that support:

- ES6 JavaScript
- CSS Grid and Flexbox
- localStorage API

## Customization

You can customize the application by:

- Modifying colors in the CSS `:root` variables
- Adjusting layout in the grid template columns
- Changing animation speeds in the CSS keyframes
- Adding new filter options through JavaScript

## Future Enhancements

Potential improvements for future versions:

- Task priority levels
- Due dates and reminders
- Task categories/tags
- Export/import functionality
- Dark/light theme toggle
- Multi-user support
