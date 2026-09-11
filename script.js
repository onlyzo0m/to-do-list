/* ========================================
   To-Do List Application
   Handles CRUD, filtering, persistence,
   and UI interactions
   ======================================== */

(function () {
    'use strict';

    // ── DOM Elements ──
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-select');
    const tasksList = document.getElementById('tasks-list');
    const emptyState = document.getElementById('empty-state');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const toastEl = document.getElementById('toast');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');

    // Stats
    const statTotal = document.querySelector('#stat-total .stat-number');
    const statDone = document.querySelector('#stat-done .stat-number');
    const statPending = document.querySelector('#stat-pending .stat-number');

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-tab');

    // ── State ──
    let tasks = [];
    let currentFilter = 'all';
    let toastTimer = null;

    // ── LocalStorage Keys ──
    const STORAGE_KEY = 'todo-list-tasks';

    // ── Initialize ──
    function init() {
        loadTasks();
        renderTasks();
        bindEvents();
    }

    // ── Event Binding ──
    function bindEvents() {
        taskForm.addEventListener('submit', handleAddTask);
        clearCompletedBtn.addEventListener('click', handleClearCompleted);

        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentFilter = this.dataset.filter;
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                renderTasks();
            });
        });

        // Focus animation on input
        taskInput.addEventListener('focus', function () {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        taskInput.addEventListener('blur', function () {
            this.parentElement.style.transform = 'scale(1)';
        });
    }

    // ── Add Task ──
    function handleAddTask(e) {
        e.preventDefault();

        var text = taskInput.value.trim();
        if (!text) return;

        var task = {
            id: generateId(),
            text: text,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
        showToast('✅ تم إضافة المهمة بنجاح', 'success');
    }

    // ── Toggle Complete ──
    function toggleTask(id) {
        var task = tasks.find(function (t) { return t.id === id; });
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            if (task.completed) {
                showToast('🎉 أحسنت! تم إكمال المهمة', 'success');
            }
        }
    }

    // ── Delete Task ──
    function deleteTask(id) {
        var taskEl = document.querySelector('[data-id="' + id + '"]');
        if (taskEl) {
            taskEl.classList.add('removing');
            setTimeout(function () {
                tasks = tasks.filter(function (t) { return t.id !== id; });
                saveTasks();
                renderTasks();
                showToast('🗑️ تم حذف المهمة', 'info');
            }, 350);
        }
    }

    // ── Edit Task ──
    function editTask(id) {
        var task = tasks.find(function (t) { return t.id === id; });
        if (!task) return;

        var taskEl = document.querySelector('[data-id="' + id + '"]');
        var contentEl = taskEl.querySelector('.task-content');
        var textEl = taskEl.querySelector('.task-text');
        var timeEl = taskEl.querySelector('.task-time');

        // Replace text with input
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = task.text;

        // Hide text and time
        textEl.style.display = 'none';
        if (timeEl) timeEl.style.display = 'none';
        contentEl.insertBefore(input, textEl);
        input.focus();
        input.select();

        function saveEdit() {
            var newText = input.value.trim();
            if (newText && newText !== task.text) {
                task.text = newText;
                saveTasks();
                showToast('✏️ تم تعديل المهمة', 'info');
            }
            renderTasks();
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
            if (e.key === 'Escape') {
                renderTasks();
            }
        });
    }

    // ── Clear Completed ──
    function handleClearCompleted() {
        var completedCount = tasks.filter(function (t) { return t.completed; }).length;
        if (completedCount === 0) {
            showToast('لا توجد مهام مكتملة للحذف', 'error');
            return;
        }
        tasks = tasks.filter(function (t) { return !t.completed; });
        saveTasks();
        renderTasks();
        showToast('🗑️ تم حذف ' + completedCount + ' مهام مكتملة', 'info');
    }

    // ── Render ──
    function renderTasks() {
        var filtered = getFilteredTasks();

        tasksList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.add('visible');
        } else {
            emptyState.classList.remove('visible');
            filtered.forEach(function (task, index) {
                var li = createTaskElement(task, index);
                tasksList.appendChild(li);
            });
        }

        updateStats();
        updateProgress();
    }

    // ── Create Task Element ──
    function createTaskElement(task, index) {
        var li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;
        li.style.animationDelay = (index * 0.04) + 's';

        // Checkbox
        var checkboxWrap = document.createElement('label');
        checkboxWrap.className = 'task-checkbox';

        var checkInput = document.createElement('input');
        checkInput.type = 'checkbox';
        checkInput.checked = task.completed;
        checkInput.addEventListener('change', function () {
            toggleTask(task.id);
        });

        var checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        checkmark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

        checkboxWrap.appendChild(checkInput);
        checkboxWrap.appendChild(checkmark);

        // Priority dot
        var dot = document.createElement('span');
        dot.className = 'priority-dot ' + task.priority;

        // Content
        var content = document.createElement('div');
        content.className = 'task-content';

        var textSpan = document.createElement('span');
        textSpan.className = 'task-text';
        textSpan.textContent = task.text;

        var timeSpan = document.createElement('span');
        timeSpan.className = 'task-time';
        timeSpan.textContent = formatTime(task.createdAt);

        content.appendChild(textSpan);
        content.appendChild(timeSpan);

        // Actions
        var actions = document.createElement('div');
        actions.className = 'task-actions';

        var editBtn = document.createElement('button');
        editBtn.className = 'task-action-btn edit-btn';
        editBtn.title = 'تعديل';
        editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        editBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            editTask(task.id);
        });

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-action-btn delete-btn';
        deleteBtn.title = 'حذف';
        deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            deleteTask(task.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        // Assemble
        li.appendChild(checkboxWrap);
        li.appendChild(dot);
        li.appendChild(content);
        li.appendChild(actions);

        return li;
    }

    // ── Filter Logic ──
    function getFilteredTasks() {
        if (currentFilter === 'completed') {
            return tasks.filter(function (t) { return t.completed; });
        }
        if (currentFilter === 'pending') {
            return tasks.filter(function (t) { return !t.completed; });
        }
        return tasks;
    }

    // ── Update Stats ──
    function updateStats() {
        var total = tasks.length;
        var done = tasks.filter(function (t) { return t.completed; }).length;
        var pending = total - done;

        animateNumber(statTotal, total);
        animateNumber(statDone, done);
        animateNumber(statPending, pending);
    }

    // ── Animate Number Change ──
    function animateNumber(el, target) {
        var current = parseInt(el.textContent) || 0;
        if (current === target) return;

        el.style.transform = 'scale(1.3)';
        el.style.transition = 'transform 0.2s ease';
        el.textContent = target;

        setTimeout(function () {
            el.style.transform = 'scale(1)';
        }, 200);
    }

    // ── Update Progress ──
    function updateProgress() {
        var total = tasks.length;
        var done = tasks.filter(function (t) { return t.completed; }).length;
        var percent = total === 0 ? 0 : Math.round((done / total) * 100);

        progressFill.style.width = percent + '%';
        progressText.textContent = percent + '% مكتمل';

        // Change color based on progress
        if (percent === 100) {
            progressFill.style.background = 'var(--gradient-success)';
        } else if (percent >= 50) {
            progressFill.style.background = 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))';
        } else {
            progressFill.style.background = 'var(--gradient-main)';
        }
    }

    // ── Persistence ──
    function saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    function loadTasks() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                tasks = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
            tasks = [];
        }
    }

    // ── Toast ──
    function showToast(message, type) {
        if (toastTimer) clearTimeout(toastTimer);

        toastEl.textContent = message;
        toastEl.className = 'toast ' + (type || 'info');

        // Trigger reflow for animation restart
        void toastEl.offsetWidth;
        toastEl.classList.add('show');

        toastTimer = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2500);
    }

    // ── Utilities ──
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatTime(isoString) {
        var date = new Date(isoString);
        var now = new Date();
        var diff = now - date;

        // Just now
        if (diff < 60000) return 'الآن';

        // Minutes ago
        if (diff < 3600000) {
            var mins = Math.floor(diff / 60000);
            return 'منذ ' + mins + ' دقيقة';
        }

        // Hours ago
        if (diff < 86400000) {
            var hours = Math.floor(diff / 3600000);
            return 'منذ ' + hours + ' ساعة';
        }

        // Format date
        var options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('ar-EG', options);
    }

    // ── Keyboard Shortcut ──
    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + Enter to add task when input is focused
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (document.activeElement === taskInput && taskInput.value.trim()) {
                taskForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // ── Start ──
    document.addEventListener('DOMContentLoaded', init);

})();
