/* ========================================
   To-Do List JavaScript Logic with Theme Toggle
   ======================================== */

(function () {
    'use strict';

    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const tasksList = document.getElementById('tasks-list');
    const emptyState = document.getElementById('empty-state');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // LocalStorage Keys
    const TASKS_STORAGE_KEY = 'todo_list_tasks_theme_v1';
    const THEME_STORAGE_KEY = 'todo_list_theme';

    let tasks = [];

    // ── Initialize ──
    function init() {
        initTheme();
        loadTasks();
        renderTasks();
        bindEvents();
    }

    // ── Theme Management ──
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            // Default to light theme
            setTheme('light');
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    // ── Event Binding ──
    function bindEvents() {
        taskForm.addEventListener('submit', handleAddTask);
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
    }

    // ── Add Task ──
    function handleAddTask(e) {
        e.preventDefault();

        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
    }

    // ── Toggle Complete ──
    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    // ── Delete Task ──
    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }

    // ── Render Tasks ──
    function renderTasks() {
        tasksList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.classList.add('visible');
            return;
        }

        emptyState.classList.remove('visible');

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');
            li.dataset.id = task.id;

            // Left Section (Checkbox & Text)
            const leftDiv = document.createElement('div');
            leftDiv.className = 'task-left';

            const checkboxWrap = document.createElement('label');
            checkboxWrap.className = 'custom-checkbox';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = task.completed;
            input.addEventListener('change', () => toggleTask(task.id));

            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

            checkboxWrap.appendChild(input);
            checkboxWrap.appendChild(checkmark);

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;

            leftDiv.appendChild(checkboxWrap);
            leftDiv.appendChild(textSpan);

            // Right Section (Completed Badge & Delete Button)
            const rightDiv = document.createElement('div');
            rightDiv.className = 'task-right';

            if (task.completed) {
                const badge = document.createElement('span');
                badge.className = 'completed-badge';
                badge.textContent = 'Completed';
                rightDiv.appendChild(badge);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'Delete Task';
            deleteBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `;
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            rightDiv.appendChild(deleteBtn);

            li.appendChild(leftDiv);
            li.appendChild(rightDiv);

            tasksList.appendChild(li);
        });
    }

    // ── Persistence ──
    function saveTasks() {
        try {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.warn('LocalStorage error:', e);
        }
    }

    function loadTasks() {
        try {
            const stored = localStorage.getItem(TASKS_STORAGE_KEY);
            if (stored) {
                tasks = JSON.parse(stored);
            } else {
                tasks = [];
            }
        } catch (e) {
            tasks = [];
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
