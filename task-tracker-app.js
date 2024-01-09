document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('taskForm');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const priorityInput = document.getElementById('priority');
    const taskList = document.getElementById('taskList');
    const allTasksButton = document.getElementById('allTasks');
    const completedTasksButton = document.getElementById('completedTasks');
    const pendingTasksButton = document.getElementById('pendingTasks');
    const clearAllTasksButton = document.getElementById('clearAllTasks');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const darkModeToggle = document.getElementById('darkModeToggle');

    let editTaskId = null;
    let currentFilter = 'all';

    // Load tasks from local storage on page load
    loadTasks();

    taskForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const priority = priorityInput.value;

        if (isValidInput(title, description)) {
            if (editTaskId !== null) {
                // If there is an editTaskId, update the existing task
                updateTask(editTaskId, title, description, priority);
                editTaskId = null; // Reset editTaskId after editing
            } else {
                // Otherwise, add a new task
                addTask(title, description, priority);
            }

            // Reset form inputs
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            priorityInput.value = 'low'; // Reset priority to 'low' after adding a task

            // Save tasks to local storage
            saveTasks();
        } else {
            alert('Invalid input. Title and description must be at least 3 characters long and contain no special characters.');
        }
    });

    taskList.addEventListener('click', function (event) {
        const target = event.target;
        const taskElement = target.closest('li');

        if (target.classList.contains('delete-btn')) {
            confirmAndDeleteTask(taskElement);
        } else if (target.classList.contains('complete-btn')) {
            markTaskAsCompleted(taskElement);
        } else if (target.classList.contains('edit-btn')) {
            editTaskId = taskElement.dataset.taskId;
            const taskData = getTaskData(taskElement);
            prefillFormForEditing(taskData);
        }
    });

    allTasksButton.addEventListener('click', function () {
        filterTasks('all');
    });

    completedTasksButton.addEventListener('click', function () {
        filterTasks('completed');
    });

    pendingTasksButton.addEventListener('click', function () {
        filterTasks('pending');
    });

    clearAllTasksButton.addEventListener('click', function () {
        clearAllTasks();
    });

    searchButton.addEventListener('click', function () {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filterTasksBySearch(searchTerm);
    });

    //Dark Mode Toggle 
    darkModeToggle.addEventListener('change', function () {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
        document.body.classList.toggle('light-mode', !darkModeToggle.checked);
    });

    // Drag and drop functionality
    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function (event) {
            // Save tasks order after drag-and-drop
            saveTasks();
        },
    });
    

    function isValidInput(title, description) {
        const isValidTitle = title.length >= 3 && /^[a-zA-Z0-9\s]+$/.test(title);
        const isValidDescription = description.length >= 3 && /^[a-zA-Z0-9\s]+$/.test(description);
        return isValidTitle && isValidDescription;
    }

    function addTask(title, description, priority) {
        const taskId = Date.now().toString(); // Unique identifier for each task
        const li = createTaskElement(taskId, title, description, priority);
        taskList.appendChild(li);
        applyFilter();
    }

    function updateTask(taskId, title, description, priority) {
        const taskElement = document.querySelector(`li[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.innerHTML = `
                <div>
                    <strong>${title}</strong>
                    <p>${description}</p>
                    <p>Priority: ${priority}</p>
                </div>
                <div>
                    <button class="complete-btn">Complete</button>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
        }
        applyFilter();

        // Save tasks to local storage
        saveTasks();
    }

    function confirmAndDeleteTask(taskElement) {
        const confirmDelete = confirm('Are you sure you want to delete this task?');
        if (confirmDelete) {
            deleteTask(taskElement);
        }
    }

    function deleteTask(taskElement) {
        taskList.removeChild(taskElement);
        applyFilter();

        // Save tasks to local storage
        saveTasks();
    }

    function markTaskAsCompleted(taskElement) {
        taskElement.classList.toggle('completed');
        applyFilter();

        // Save tasks to local storage
        saveTasks();
    }

    function getTaskData(taskElement) {
        const titleElement = taskElement.querySelector('strong');
        const descriptionElement = taskElement.querySelector('p');

        return {
            title: titleElement.innerText,
            description: descriptionElement.innerText,
        };
    }

    function prefillFormForEditing(taskData) {
        taskTitleInput.value = taskData.title;
        taskDescriptionInput.value = taskData.description;
        // Set priority value for editing
        const taskElement = taskList.querySelector(`li[data-task-id="${editTaskId}"]`);
        if (taskElement) {
            const priorityElement = taskElement.querySelector('p:last-child');
            if (priorityElement) {
                priorityInput.value = priorityElement.innerText.split(': ')[1].toLowerCase();
            }
        }
    }

    function createTaskElement(taskId, title, description, priority) {
        const li = document.createElement('li');
        li.dataset.taskId = taskId;
        li.innerHTML = `
            <div>
                <strong>${title}</strong>
                <p>${description}</p>
                <p>Priority: ${priority}</p>
            </div>
            <div>
                <button class="complete-btn">Complete</button>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        return li;
    }

    function filterTasks(filter) {
        currentFilter = filter;
        applyFilter();
    }

    function applyFilter() {
        const tasks = taskList.getElementsByTagName('li');
        Array.from(tasks).forEach(function (task) {
            const isCompleted = task.classList.contains('completed');

            if (currentFilter === 'all' ||
                (currentFilter === 'completed' && isCompleted) ||
                (currentFilter === 'pending' && !isCompleted)) {
                task.style.display = 'flex';
            } else {
                task.style.display = 'none';
            }
        });
    }

    function filterTasksBySearch(searchTerm) {
        const tasks = taskList.getElementsByTagName('li');
        Array.from(tasks).forEach(function (task) {
            const title = task.querySelector('strong').innerText.toLowerCase();
            const description = task.querySelector('p').innerText.toLowerCase();
            const isMatch = title.includes(searchTerm) || description.includes(searchTerm);

            if (isMatch) {
                task.style.display = 'flex';
            } else {
                task.style.display = 'none';
            }
        });
    }

    function saveTasks() {
        const tasks = Array.from(taskList.getElementsByTagName('li')).map(function (task) {
            return {
                id: task.dataset.taskId,
                title: task.querySelector('strong').innerText,
                description: task.querySelector('p:first-child').innerText,
                priority: task.querySelector('p:last-child').innerText.split(': ')[1],
                completed: task.classList.contains('completed'),
            };
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');

        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);

            tasks.forEach(function (task) {
                const li = createTaskElement(task.id, task.title, task.description, task.priority);

                if (task.completed) {
                    li.classList.add('completed');
                }

                taskList.appendChild(li);
            });
        }
    }

    function clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks?')) {
            taskList.innerHTML = ''; // Clear all tasks from the list
            applyFilter();

            // Save tasks to local storage after clearing
            saveTasks();
        }
    }
});
