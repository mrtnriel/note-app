// Interactive Flow & Progressive Enhancement for Task Manager
document.addEventListener('DOMContentLoaded', () => {

  // 1. Flash Message Auto-Dismiss & Manual Close
  const flashMessages = document.querySelectorAll('.flash-msg');
  flashMessages.forEach(msg => {
    // Add close button if not present
    if (!msg.querySelector('.flash-close-btn')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'flash-close-btn';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => dismissFlash(msg));
      msg.appendChild(closeBtn);
    }

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissFlash(msg);
    }, 4000);
  });

  function dismissFlash(el) {
    if (!el || el.classList.contains('fade-out')) return;
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 300);
  }

  // 2. Global Toast Helper for In-Page Feedback
  function showToast(message, type = 'info') {
    const container = document.querySelector('.container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flash-msg flash-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span><button class="flash-close-btn" aria-label="Close">&times;</button>`;
    
    toast.querySelector('.flash-close-btn').addEventListener('click', () => dismissFlash(toast));
    
    container.insertBefore(toast, container.firstChild);
    setTimeout(() => dismissFlash(toast), 3500);
  }

  // 3. Quick Add Auto-Expand & Toggle on Click Logic
  const titleInput = document.getElementById('taskTitleInput');
  const expandedDrawer = document.getElementById('expandedDrawer');
  const cancelAddBtn = document.getElementById('cancelAddBtn');
  const quickAddForm = document.getElementById('mainTaskForm');

  if (titleInput && expandedDrawer) {
    let wasOpenOnMouseDown = false;

    // Record whether drawer was already open before mouse down
    titleInput.addEventListener('mousedown', () => {
      wasOpenOnMouseDown = expandedDrawer.classList.contains('open');
    });

    // Clicking the input box toggles expand/collapse
    titleInput.addEventListener('click', () => {
      if (wasOpenOnMouseDown) {
        // If already open, clicking the box collapses it back
        expandedDrawer.classList.remove('open');
        titleInput.blur();
      } else {
        // If closed, open the details
        expandedDrawer.classList.add('open');
      }
    });

    // If user starts typing, ensure drawer stays open
    titleInput.addEventListener('input', () => {
      if (!expandedDrawer.classList.contains('open')) {
        expandedDrawer.classList.add('open');
      }
    });
  }

  // Cancel button resets the form and collapses the drawer
  if (cancelAddBtn && quickAddForm && expandedDrawer) {
    cancelAddBtn.addEventListener('click', () => {
      quickAddForm.reset();
      expandedDrawer.classList.remove('open');
      if (titleInput) titleInput.blur();
    });
  }

  // 4. Date Preset Buttons (Today, Tomorrow, Next Week, Clear)
  const datePresets = document.querySelectorAll('.date-preset-btn');
  datePresets.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetInputId = btn.getAttribute('data-for') || 'taskDueDate';
      const input = document.getElementById(targetInputId) || document.querySelector('input[type="date"]');
      if (!input) return;

      const daysToAdd = btn.getAttribute('data-days');
      if (daysToAdd === 'clear') {
        input.value = '';
      } else {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(daysToAdd, 10));
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        input.value = `${year}-${month}-${day}`;
      }

      // Update active styling among siblings
      btn.parentElement.querySelectorAll('.date-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 5. Progressive Enhancement: AJAX Task Toggle
  document.addEventListener('submit', async (e) => {
    const toggleForm = e.target.closest('form.toggle-task-form');
    if (!toggleForm) return;

    e.preventDefault();
    const taskItem = toggleForm.closest('.task-item');
    if (!taskItem) return;

    // Optimistic UI update
    const wasCompleted = taskItem.classList.contains('completed');
    taskItem.classList.toggle('completed', !wasCompleted);
    updateStatsOptimistic(!wasCompleted ? 1 : -1);

    try {
      const response = await fetch(toggleForm.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();
      if (data.stats) updateStats(data.stats);
    } catch (err) {
      // Rollback on failure
      taskItem.classList.toggle('completed', wasCompleted);
      updateStatsOptimistic(wasCompleted ? 1 : -1);
      showToast('Could not update task. Please try again.', 'error');
    }
  });

  // 6. Progressive Enhancement: AJAX Task Delete
  document.addEventListener('submit', async (e) => {
    const deleteForm = e.target.closest('form.delete-task-form');
    if (!deleteForm) return;

    e.preventDefault();
    if (!confirm('Delete this task?')) return;

    const taskItem = deleteForm.closest('.task-item');
    if (!taskItem) return;

    // Optimistic UI exit animation
    taskItem.classList.add('fade-out');

    try {
      const response = await fetch(deleteForm.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete task');
      const data = await response.json();

      setTimeout(() => {
        taskItem.remove();
        checkEmptyState();
      }, 300);

      if (data.stats) updateStats(data.stats);
      showToast('Task deleted.', 'info');
    } catch (err) {
      taskItem.classList.remove('fade-out');
      showToast('Could not delete task.', 'error');
    }
  });

  // 7. Progressive Enhancement: AJAX Add Task
  if (quickAddForm) {
    quickAddForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputEl = quickAddForm.querySelector('input[name="title"]');
      if (!inputEl || !inputEl.value.trim()) return;

      const formData = new FormData(quickAddForm);

      try {
        const response = await fetch(quickAddForm.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!response.ok) throw new Error('Failed to add task');
        const data = await response.json();

        if (data.success && data.task) {
          // Clear inputs and collapse drawer
          quickAddForm.reset();
          if (expandedDrawer) {
            expandedDrawer.classList.remove('open');
          }
          if (inputEl) inputEl.blur();

          // Insert new task element into DOM
          insertTaskIntoList(data.task);

          // Update header stats
          if (data.stats) updateStats(data.stats);

          // Remove empty state if present
          const emptyState = document.querySelector('.empty-state');
          if (emptyState) emptyState.remove();

          showToast('Task added!', 'success');
        }
      } catch (err) {
        // Fallback to traditional submit on error
        quickAddForm.submit();
      }
    });
  }

  // Helper: DOM task insertion
  function insertTaskIntoList(task) {
    let list = document.querySelector('.task-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'task-list';
      const container = document.querySelector('.container');
      const filtersBar = document.querySelector('.filters-bar');
      if (filtersBar && filtersBar.nextSibling) {
        container.insertBefore(list, filtersBar.nextSibling);
      } else {
        container.appendChild(list);
      }
    }

    const item = document.createElement('div');
    item.className = 'task-item slide-in';
    item.setAttribute('data-id', task.id);

    const descHtml = task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : '';
    const categoryHtml = task.category ? `<span class="tag">${escapeHtml(task.category)}</span>` : '';
    const priorityHtml = (task.priority && task.priority !== 'Low') 
      ? `<span class="tag ${task.priority === 'High' ? 'tag-priority-high' : ''}">${escapeHtml(task.priority)}</span>` 
      : '';
    const dueHtml = task.due_date_formatted ? `<span class="tag tag-today">${escapeHtml(task.due_date_formatted)}</span>` : '';

    const metaHtml = (categoryHtml || priorityHtml || dueHtml)
      ? `<div class="task-meta">${categoryHtml}${priorityHtml}${dueHtml}</div>`
      : '';

    item.innerHTML = `
      <form method="POST" action="/toggle/${task.id}" class="toggle-task-form" style="margin: 0;">
        <button type="submit" class="task-toggle-btn" aria-label="Toggle task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </form>

      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${descHtml}
        ${metaHtml}
      </div>

      <div class="task-actions">
        <a href="/edit/${task.id}" class="action-btn" aria-label="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </a>

        <form method="POST" action="/delete/${task.id}" class="delete-task-form" style="margin: 0;">
          <button type="submit" class="action-btn delete-btn" aria-label="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </form>
      </div>
    `;

    list.insertBefore(item, list.firstChild);
  }

  // 8. Header Stats Update Helpers
  function updateStats(stats) {
    const statsContainer = document.querySelector('.app-stats');
    if (!statsContainer) return;

    let html = `<span>${stats.pending} pending</span>`;
    if (stats.completed > 0) {
      html += `<span style="color: var(--text-subtle); margin: 0 4px;">·</span><span>${stats.completed} done</span>`;
    }
    statsContainer.innerHTML = html;
  }

  function updateStatsOptimistic(deltaCompleted) {
    const statsContainer = document.querySelector('.app-stats');
    if (!statsContainer) return;

    const pendingSpan = statsContainer.querySelector('span:first-child');
    if (!pendingSpan) return;

    let currentPending = parseInt(pendingSpan.textContent, 10) || 0;
    let newPending = Math.max(0, currentPending - deltaCompleted);
    pendingSpan.textContent = `${newPending} pending`;
  }

  function checkEmptyState() {
    const items = document.querySelectorAll('.task-list .task-item');
    if (items.length === 0) {
      const list = document.querySelector('.task-list');
      if (list) list.remove();

      const container = document.querySelector('.container');
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = 'All caught up! No tasks here.';
      container.appendChild(emptyDiv);
    }
  }

  // 9. Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Focus search/add input when pressing '/' or 'n' (if not already focused on an input)
    if ((e.key === '/' || e.key.toLowerCase() === 'n') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const input = document.querySelector('input[name="title"]');
      if (input) {
        input.focus();
        input.select();
        if (expandedDrawer) expandedDrawer.classList.add('open');
      }
    }

    // Escape to close expanded drawer and blur
    if (e.key === 'Escape') {
      if (expandedDrawer && expandedDrawer.classList.contains('open')) {
        expandedDrawer.classList.remove('open');
        if (titleInput) titleInput.blur();
      }
    }
  });

  // Utility: HTML Sanitizer
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

});
