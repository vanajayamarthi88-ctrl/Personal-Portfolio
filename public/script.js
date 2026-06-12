const authSection = document.getElementById('authSection');
const taskSection = document.getElementById('taskSection');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const authForm = document.getElementById('authForm');
const nameRow = document.getElementById('nameRow');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const taskForm = document.getElementById('taskForm');
const taskMessage = document.getElementById('taskMessage');
const tasksList = document.getElementById('tasksList');

const socket = io();
let activeMode = 'login';

socket.on('task-changed', () => {
  if (getToken()) {
    loadTasks();
  }
});

function setMode(mode) {
  activeMode = mode;
  loginTab.classList.toggle('active', mode === 'login');
  registerTab.classList.toggle('active', mode === 'register');
  nameRow.classList.toggle('hidden', mode === 'login');
  authMessage.textContent = '';
}

function getToken() {
  return localStorage.getItem('taskManagerToken');
}

function setToken(token) {
  localStorage.setItem('taskManagerToken', token);
}

function clearSession() {
  localStorage.removeItem('taskManagerToken');
  localStorage.removeItem('taskManagerUser');
}

function showPage() {
  const signedIn = Boolean(getToken());
  authSection.classList.toggle('hidden', signedIn);
  taskSection.classList.toggle('hidden', !signedIn);
  logoutBtn.hidden = !signedIn;

  if (signedIn) {
    loadTasks();
  }
}

function setAuthMessage(message, error = false) {
  authMessage.textContent = message;
  authMessage.style.color = error ? '#f87171' : '#a5f3fc';
}

function setTaskMessage(message, error = false) {
  taskMessage.textContent = message;
  taskMessage.style.color = error ? '#f87171' : '#a5f3fc';
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authMessage.textContent = '';

  const formData = new FormData(authForm);
  const email = formData.get('email').trim();
  const password = formData.get('password').trim();
  const name = formData.get('name').trim();

  const endpoint = activeMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const payload = activeMode === 'login' ? { email, password } : { name, email, password };

  if (activeMode === 'register' && !name) {
    return setAuthMessage('Enter your name to register.', true);
  }

  try {
    const data = await request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    localStorage.setItem('taskManagerUser', JSON.stringify(data.user));
    setMode('login');
    authForm.reset();
    showPage();
  } catch (error) {
    setAuthMessage(error.message, true);
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  setTaskMessage('');
  showPage();
});

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setTaskMessage('');

  const formData = new FormData(taskForm);
  const payload = {
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    priority: formData.get('priority'),
    status: formData.get('status'),
    dueDate: formData.get('dueDate') || undefined
  };

  if (!payload.title) {
    return setTaskMessage('Task title is required.', true);
  }

  try {
    await request('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
    taskForm.reset();
    setTaskMessage('Task saved successfully!');
    loadTasks();
  } catch (error) {
    setTaskMessage(error.message, true);
  }
});

function formatDueDate(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';

  const statusLabel = task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In progress' : 'To do';

  card.innerHTML = `
    <header>
      <div>
        <h3>${task.title}</h3>
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          <span class="badge ${task.status === 'done' ? 'done' : ''}">${statusLabel}</span>
        </div>
      </div>
      <div><strong>${formatDueDate(task.dueDate)}</strong></div>
    </header>
    <p>${task.description || 'No description provided.'}</p>
    <div class="task-actions">
      <button class="small-button success" data-action="toggle" data-id="${task._id}">${task.status === 'done' ? 'Mark todo' : 'Mark done'}</button>
      <button class="small-button" data-action="edit" data-id="${task._id}">Edit</button>
      <button class="small-button danger" data-action="delete" data-id="${task._id}">Delete</button>
    </div>
  `;

  return card;
}

async function loadTasks() {
  try {
    tasksList.innerHTML = '<p>Loading tasks...</p>';
    const tasks = await request('/api/tasks');

    if (!tasks.length) {
      tasksList.innerHTML = '<p>No tasks yet. Create one to get started.</p>';
      return;
    }

    tasksList.innerHTML = '';
    tasks.forEach((task) => tasksList.appendChild(createTaskCard(task)));
  } catch (error) {
    tasksList.innerHTML = `<p>${error.message}</p>`;
  }
}

tasksList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const taskId = button.dataset.id;
  const card = button.closest('.task-card');

  if (!action || !taskId) return;

  try {
    if (action === 'toggle') {
      const task = Array.from(tasksList.querySelectorAll('.task-card')).find((element) => element.querySelector(`[data-id="${taskId}"]`));
      const currentText = button.textContent.trim();
      const status = currentText === 'Mark done' ? 'done' : 'todo';
      const title = card.querySelector('h3').textContent;
      const description = card.querySelector('p').textContent;
      await request(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, status })
      });
      loadTasks();
    }

    if (action === 'delete' && confirm('Delete this task permanently?')) {
      await request(`/api/tasks/${taskId}`, { method: 'DELETE' });
      loadTasks();
    }

    if (action === 'edit') {
      const title = prompt('Task title', card.querySelector('h3').textContent);
      if (!title) return;

      const description = prompt('Task description', card.querySelector('p').textContent);
      const status = prompt('Status (todo, in-progress, done)', 'todo');
      const priority = prompt('Priority (low, medium, high)', 'medium');
      const dueDate = prompt('Due date (YYYY-MM-DD)', '');

      await request(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          description: description ? description.trim() : '',
          status: status || 'todo',
          priority: priority || 'medium',
          dueDate: dueDate || undefined
        })
      });
      loadTasks();
    }
  } catch (error) {
    setTaskMessage(error.message, true);
  }
});

showPage();
