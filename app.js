// ======================================================
// SMART PRODUCTIVITY DASHBOARD
// Firebase + Offline Backup + Automatic Sync
// ======================================================

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;
let tasks = [];
let editingTaskId = null;


// ======================================================
// OFFLINE STORAGE
// ======================================================

function getStorageKey() {

    if (!currentUser) {
        return null;
    }

    return `smartProductivity_tasks_${currentUser.uid}`;
}


function saveTasksOffline() {

    if (!currentUser) {
        return;
    }

    try {

        const key = getStorageKey();

        localStorage.setItem(
            key,
            JSON.stringify(tasks)
        );

        console.log("Tasks backed up locally.");

    } catch (error) {

        console.error(
            "LOCAL STORAGE ERROR:",
            error
        );
    }
}


function loadTasksOffline() {

    if (!currentUser) {
        return [];
    }

    try {

        const key = getStorageKey();

        const saved = localStorage.getItem(key);

        if (!saved) {
            return [];
        }

        const offlineTasks = JSON.parse(saved);

        if (!Array.isArray(offlineTasks)) {
            return [];
        }

        return offlineTasks;

    } catch (error) {

        console.error(
            "OFFLINE LOAD ERROR:",
            error
        );

        return [];
    }
}


// ======================================================
// CONNECTION STATUS
// ======================================================

function updateConnectionStatus() {

    let indicator =
        document.getElementById("connectionStatus");


    if (!indicator) {

        indicator =
            document.createElement("div");

        indicator.id =
            "connectionStatus";

        document.body.appendChild(indicator);

        indicator.style.position = "fixed";
        indicator.style.top = "15px";
        indicator.style.right = "15px";
        indicator.style.zIndex = "10000";
        indicator.style.padding = "8px 14px";
        indicator.style.borderRadius = "20px";
        indicator.style.fontSize = "12px";
        indicator.style.fontWeight = "bold";
    }


    if (navigator.onLine) {

        indicator.textContent = "🟢 Online";

        indicator.style.background = "#203d31";
        indicator.style.color = "#80d6ad";

    } else {

        indicator.textContent = "🔴 Offline";

        indicator.style.background = "#52252b";
        indicator.style.color = "#ff9ba8";
    }
}


// ======================================================
// ONLINE EVENT
// AUTOMATIC SYNC
// ======================================================

window.addEventListener(
    "online",
    async () => {

        updateConnectionStatus();

        console.log(
            "Internet connection restored."
        );

        if (currentUser) {

            await syncOfflineTasks();

            await loadTasks();
        }
    }
);


// ======================================================
// OFFLINE EVENT
// ======================================================

window.addEventListener(
    "offline",
    () => {

        updateConnectionStatus();

        console.log(
            "Internet connection lost. Using local backup."
        );

        if (currentUser) {

            tasks = loadTasksOffline();

            renderTasks();

            updateStatistics();
        }
    }
);


// ======================================================
// LOGIN / SIGNUP ELEMENTS
// ======================================================

const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");


// ======================================================
// LOGIN / SIGNUP TABS
// ======================================================

if (
    loginTab &&
    signupTab &&
    loginForm &&
    signupForm
) {

    loginTab.addEventListener(
        "click",
        () => {

            loginTab.classList.add("active");

            signupTab.classList.remove("active");

            loginForm.classList.remove("hidden");

            signupForm.classList.add("hidden");
        }
    );


    signupTab.addEventListener(
        "click",
        () => {

            signupTab.classList.add("active");

            loginTab.classList.remove("active");

            signupForm.classList.remove("hidden");

            loginForm.classList.add("hidden");
        }
    );
}


// ======================================================
// SIGN UP
// ======================================================

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                .getElementById("signupEmail")
                ?.value.trim();


            const password =
                document
                .getElementById("signupPassword")
                ?.value;


            const message =
                document
                .getElementById("signupMessage");


            if (!email || !password) {

                if (message) {

                    message.textContent =
                        "Please enter email and password.";
                }

                return;
            }


            if (message) {

                message.textContent =
                    "Creating account...";
            }


            try {

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (message) {

                    message.textContent =
                        "Account created successfully! 🎉";
                }


                signupForm.reset();


                setTimeout(
                    () => {

                        window.location.href =
                            "index.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "SIGNUP ERROR:",
                    error
                );


                if (message) {

                    message.textContent =
                        getErrorMessage(
                            error.code
                        );
                }
            }
        }
    );
}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                .getElementById("loginEmail")
                ?.value.trim();


            const password =
                document
                .getElementById("loginPassword")
                ?.value;


            const message =
                document
                .getElementById("loginMessage");


            if (!email || !password) {

                if (message) {

                    message.textContent =
                        "Please enter email and password.";
                }

                return;
            }


            if (message) {

                message.textContent =
                    "Logging in...";
            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                if (message) {

                    message.textContent =
                        "Login successful! 🚀";
                }


                loginForm.reset();


                setTimeout(
                    () => {

                        window.location.href =
                            "index.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                if (message) {

                    message.textContent =
                        getErrorMessage(
                            error.code
                        );
                }
            }
        }
    );
}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        const isDashboard =
            window.location.pathname
            .endsWith("index.html");


        if (!user) {

            currentUser = null;


            if (isDashboard) {

                window.location.href =
                    "login.html";
            }

            return;
        }


        currentUser = user;


        console.log(
            "Logged in:",
            user.email
        );


        updateConnectionStatus();


        if (isDashboard) {

            if (navigator.onLine) {

                await loadTasks();

                await syncOfflineTasks();

            } else {

                tasks =
                    loadTasksOffline();

                renderTasks();

                updateStatistics();
            }

            checkDeadlines();
        }
    }
);


// ======================================================
// LOAD TASKS FROM FIRESTORE
// ======================================================

async function loadTasks() {

    if (!currentUser) {
        return;
    }


    try {

        const tasksRef =
            collection(db, "tasks");


        const q =
            query(
                tasksRef,
                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        tasks = [];


        snapshot.forEach(
            (item) => {

                tasks.push({

                    id: item.id,

                    ...item.data()
                });
            }
        );


        tasks.sort(
            (a, b) =>
                new Date(a.deadline) -
                new Date(b.deadline)
        );


        saveTasksOffline();


        renderTasks();

        updateStatistics();


        console.log(
            "Firebase tasks loaded."
        );


    } catch (error) {

        console.error(
            "LOAD TASKS ERROR:",
            error
        );


        const offlineTasks =
            loadTasksOffline();


        if (offlineTasks.length > 0) {

            tasks =
                offlineTasks;

            renderTasks();

            updateStatistics();


            console.log(
                "Loaded tasks from local backup."
            );

        } else {

            alert(
                "Could not load tasks: " +
                error.message
            );
        }
    }
}


// ======================================================
// AUTOMATIC OFFLINE TASK SYNC
// ======================================================

async function syncOfflineTasks() {

    if (!currentUser) {
        return;
    }


    if (!navigator.onLine) {
        return;
    }


    const offlineTasks =
        tasks.filter(
            task => task.offline === true
        );


    if (offlineTasks.length === 0) {

        console.log(
            "No offline tasks to sync."
        );

        return;
    }


    console.log(
        `Syncing ${offlineTasks.length} offline task(s)...`
    );


    for (const task of offlineTasks) {

        try {

            await addDoc(
                collection(db, "tasks"),
                {

                    userId:
                        currentUser.uid,

                    title:
                        task.title,

                    description:
                        task.description || "",

                    priority:
                        task.priority || "Medium",

                    deadline:
                        task.deadline,

                    completed:
                        task.completed || false,

                    createdAt:
                        serverTimestamp()
                }
            );


            console.log(
                "Synced:",
                task.title
            );


        } catch (error) {

            console.error(
                "SYNC ERROR:",
                error
            );

            return;
        }
    }


    console.log(
        "✅ Offline tasks synced successfully."
    );


    await loadTasks();
}


// ======================================================
// ADD / EDIT TASK
// ======================================================

const taskForm =
    document.getElementById("taskForm");


if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;
            }


            const title =
                document
                .getElementById("taskTitle")
                ?.value.trim();


            const description =
                document
                .getElementById("taskDescription")
                ?.value.trim();


            const priority =
                document
                .getElementById("taskPriority")
                ?.value;


            const deadline =
                document
                .getElementById("taskDeadline")
                ?.value;


            if (!title) {

                alert(
                    "Please enter a task title."
                );

                return;
            }


            if (!deadline) {

                alert(
                    "Please select a deadline."
                );

                return;
            }


            // ==================================================
            // EDIT TASK
            // ==================================================

            if (editingTaskId) {

                try {

                    const index =
                        tasks.findIndex(
                            task =>
                                task.id ===
                                editingTaskId
                        );


                    if (index === -1) {
                        return;
                    }


                    const isOfflineTask =
                        editingTaskId.startsWith(
                            "offline-"
                        );


                    // Update local task

                    tasks[index] = {

                        ...tasks[index],

                        title:
                            title,

                        description:
                            description,

                        priority:
                            priority,

                        deadline:
                            deadline
                    };


                    // If online Firebase task

                    if (
                        navigator.onLine &&
                        !isOfflineTask
                    ) {

                        await updateDoc(

                            doc(
                                db,
                                "tasks",
                                editingTaskId
                            ),

                            {

                                title:
                                    title,

                                description:
                                    description,

                                priority:
                                    priority,

                                deadline:
                                    deadline
                            }
                        );
                    }


                    saveTasksOffline();


                    taskForm.reset();

                    hideTaskForm();


                    renderTasks();

                    updateStatistics();


                    console.log(
                        "Task updated."
                    );


                } catch (error) {

                    console.error(
                        "EDIT TASK ERROR:",
                        error
                    );


                    alert(
                        "Could not edit task: " +
                        error.message
                    );
                }


                return;
            }


            // ==================================================
            // CREATE TASK
            // ==================================================

            try {

                // ----------------------------------------------
                // OFFLINE
                // ----------------------------------------------

                if (!navigator.onLine) {

                    const offlineTask = {

                        id:
                            "offline-" +
                            Date.now(),

                        userId:
                            currentUser.uid,

                        title:
                            title,

                        description:
                            description,

                        priority:
                            priority,

                        deadline:
                            deadline,

                        completed:
                            false,

                        offline:
                            true
                    };


                    tasks.push(
                        offlineTask
                    );


                    saveTasksOffline();


                    taskForm.reset();

                    hideTaskForm();

                    renderTasks();

                    updateStatistics();


                    alert(
                        "You're offline. The task was saved and will sync automatically when you're back online."
                    );


                    return;
                }


                // ----------------------------------------------
                // ONLINE FIREBASE
                // ----------------------------------------------

                const newTask =
                    await addDoc(

                        collection(
                            db,
                            "tasks"
                        ),

                        {

                            userId:
                                currentUser.uid,

                            title:
                                title,

                            description:
                                description,

                            priority:
                                priority,

                            deadline:
                                deadline,

                            completed:
                                false,

                            createdAt:
                                serverTimestamp()
                        }
                    );


                tasks.push({

                    id:
                        newTask.id,

                    userId:
                        currentUser.uid,

                    title:
                        title,

                    description:
                        description,

                    priority:
                        priority,

                    deadline:
                        deadline,

                    completed:
                        false
                });


                saveTasksOffline();


                taskForm.reset();

                hideTaskForm();

                renderTasks();

                updateStatistics();


                console.log(
                    "Task saved to Firebase."
                );


            } catch (error) {

                console.error(
                    "ADD TASK ERROR:",
                    error
                );


                // Firebase failed
                // Save locally

                const offlineTask = {

                    id:
                        "offline-" +
                        Date.now(),

                    userId:
                        currentUser.uid,

                    title:
                        title,

                    description:
                        description,

                    priority:
                        priority,

                    deadline:
                        deadline,

                    completed:
                        false,

                    offline:
                        true
                };


                tasks.push(
                    offlineTask
                );


                saveTasksOffline();


                taskForm.reset();

                hideTaskForm();

                renderTasks();

                updateStatistics();


                alert(
                    "Firebase is unavailable. Your task was saved locally and will sync automatically."
                );
            }
        }
    );
}


// ======================================================
// RENDER TASKS
// ======================================================

function renderTasks() {

    const taskList =
        document.getElementById("taskList");


    if (!taskList) {
        return;
    }


    const filter =
        document
        .getElementById("filterTasks")
        ?.value || "all";


    let filteredTasks =
        tasks;


    if (filter === "pending") {

        filteredTasks =
            tasks.filter(
                task =>
                    !task.completed
            );
    }


    if (filter === "completed") {

        filteredTasks =
            tasks.filter(
                task =>
                    task.completed
            );
    }


    if (filteredTasks.length === 0) {

        taskList.innerHTML = `

            <div class="empty-state">

                <div>📝</div>

                <h3>No tasks found</h3>

                <p>
                    Create your first task
                    to get started.
                </p>

                <button onclick="showTaskForm()">
                    + Create Task
                </button>

            </div>

        `;

        return;
    }


    taskList.innerHTML = "";


    filteredTasks.forEach(
        (task) => {

            const taskElement =
                document.createElement("div");


            taskElement.className =
                "task-card" +
                (
                    task.completed
                    ? " completed"
                    : ""
                );


            const deadline =
                new Date(
                    task.deadline
                );


            const overdue =
                !task.completed &&
                deadline < new Date();


            taskElement.innerHTML = `

                <div class="task-check">

                    <button
                        class="check-button"
                        onclick="
                            toggleTask(
                                '${task.id}',
                                ${task.completed}
                            )
                        "
                    >
                        ${
                            task.completed
                            ? "✓"
                            : ""
                        }
                    </button>

                </div>


                <div class="task-info">

                    <div class="task-top">

                        <h3>
                            ${escapeHTML(
                                task.title
                            )}
                        </h3>

                        <span
                            class="priority ${
                                (
                                    task.priority ||
                                    "Low"
                                ).toLowerCase()
                            }"
                        >
                            ${escapeHTML(
                                task.priority ||
                                "Low"
                            )}
                        </span>

                    </div>


                    ${
                        task.description
                        ?
                        `<p>
                            ${escapeHTML(
                                task.description
                            )}
                        </p>`
                        :
                        ""
                    }


                    <div class="task-deadline">

                        📅
                        ${formatDate(
                            task.deadline
                        )}

                        ${
                            overdue
                            ?
                            `<span class="overdue-label">
                                OVERDUE
                            </span>`
                            :
                            ""
                        }

                        ${
                            task.offline
                            ?
                            `<span class="offline-label">
                                📱 Local
                            </span>`
                            :
                            ""
                        }

                    </div>

                </div>


                <div class="task-actions">

                    <button
                        onclick="
                            editTask(
                                '${task.id}'
                            )
                        "
                        title="Edit"
                    >
                        ✏️
                    </button>


                    <button
                        onclick="
                            deleteTask(
                                '${task.id}'
                            )
                        "
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>

            `;


            taskList.appendChild(
                taskElement
            );
        }
    );
}


// ======================================================
// STATISTICS
// ======================================================

function updateStatistics() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        tasks.filter(
            task =>
                !task.completed
        ).length;


    const overdue =
        tasks.filter(
            task =>
                !task.completed &&
                new Date(
                    task.deadline
                ) < new Date()
        ).length;


    const totalElement =
        document.getElementById(
            "totalTasks"
        );


    const completedElement =
        document.getElementById(
            "completedTasks"
        );


    const pendingElement =
        document.getElementById(
            "pendingTasks"
        );


    const overdueElement =
        document.getElementById(
            "overdueTasks"
        );


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (completedElement) {

        completedElement.textContent =
            completed;
    }


    if (pendingElement) {

        pendingElement.textContent =
            pending;
    }


    if (overdueElement) {

        overdueElement.textContent =
            overdue;
    }


    // ==================================================
    // PRODUCTIVITY
    // ==================================================

    const percentage =
        total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
        );


    const progressPercent =
        document.getElementById(
            "progressPercent"
        );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    const analyticsCompleted =
        document.getElementById(
            "analyticsCompleted"
        );


    const analyticsPending =
        document.getElementById(
            "analyticsPending"
        );


    if (progressPercent) {

        progressPercent.textContent =
            percentage + "%";
    }


    if (progressFill) {

        progressFill.style.width =
            percentage + "%";
    }


    if (analyticsCompleted) {

        analyticsCompleted.textContent =
            completed;
    }


    if (analyticsPending) {

        analyticsPending.textContent =
            pending;
    }
}


// ======================================================
// COMPLETE / UNCOMPLETE
// ======================================================

window.toggleTask =
    async function(
        taskId,
        currentStatus
    ) {

        try {

            const index =
                tasks.findIndex(
                    task =>
                        task.id ===
                        taskId
                );


            if (index === -1) {
                return;
            }


            const newStatus =
                !currentStatus;


            // Update local copy first

            tasks[index].completed =
                newStatus;


            saveTasksOffline();


            renderTasks();

            updateStatistics();


            // Offline-created task

            if (
                taskId.startsWith(
                    "offline-"
                )
            ) {

                return;
            }


            // Firebase update

            if (navigator.onLine) {

                await updateDoc(

                    doc(
                        db,
                        "tasks",
                        taskId
                    ),

                    {

                        completed:
                            newStatus
                    }
                );

            }


        } catch (error) {

            console.error(
                "TOGGLE TASK ERROR:",
                error
            );


            alert(
                "Could not update task."
            );
        }
    };


// ======================================================
// EDIT TASK
// ======================================================

window.editTask =
    function(taskId) {

        const task =
            tasks.find(
                item =>
                    item.id ===
                    taskId
            );


        if (!task) {
            return;
        }


        editingTaskId =
            taskId;


        const title =
            document.getElementById(
                "taskTitle"
            );


        const description =
            document.getElementById(
                "taskDescription"
            );


        const priority =
            document.getElementById(
                "taskPriority"
            );


        const deadline =
            document.getElementById(
                "taskDeadline"
            );


        if (title) {

            title.value =
                task.title || "";
        }


        if (description) {

            description.value =
                task.description || "";
        }


        if (priority) {

            priority.value =
                task.priority ||
                "Medium";
        }


        if (deadline) {

            deadline.value =
                task.deadline || "";
        }


        const modalTitle =
            document.getElementById(
                "modalTitle"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Edit Task";
        }


        showTaskForm();
    };


// ======================================================
// DELETE TASK
// ======================================================

window.deleteTask =
    async function(taskId) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this task?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const isOfflineTask =
                taskId.startsWith(
                    "offline-"
                );


            // Remove locally

            tasks =
                tasks.filter(
                    task =>
                        task.id !==
                        taskId
                );


            saveTasksOffline();


            // Offline task

            if (isOfflineTask) {

                renderTasks();

                updateStatistics();

                return;
            }


            // Delete Firebase task

            if (navigator.onLine) {

                await deleteDoc(

                    doc(
                        db,
                        "tasks",
                        taskId
                    )
                );

            }


            renderTasks();

            updateStatistics();


        } catch (error) {

            console.error(
                "DELETE TASK ERROR:",
                error
            );


            alert(
                "Could not delete task."
            );
        }
    };


// ======================================================
// FILTER
// ======================================================

const filterTasks =
    document.getElementById(
        "filterTasks"
    );


if (filterTasks) {

    filterTasks.addEventListener(
        "change",
        renderTasks
    );
}


// ======================================================
// MODAL
// ======================================================

window.showTaskForm =
    function() {

        const modal =
            document.getElementById(
                "taskModal"
            );


        if (modal) {

            modal.classList.remove(
                "hidden"
            );
        }
    };


window.hideTaskForm =
    function() {

        const modal =
            document.getElementById(
                "taskModal"
            );


        if (modal) {

            modal.classList.add(
                "hidden"
            );
        }


        if (taskForm) {

            taskForm.reset();
        }


        editingTaskId =
            null;


        const modalTitle =
            document.getElementById(
                "modalTitle"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Create New Task";
        }
    };


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );
            }
        }
    );
}


// ======================================================
// DEADLINE REMINDERS
// ======================================================

function checkDeadlines() {

    if (!tasks.length) {
        return;
    }


    const now =
        new Date();


    tasks.forEach(
        task => {

            if (task.completed) {
                return;
            }


            const deadline =
                new Date(
                    task.deadline
                );


            const difference =
                deadline - now;


            // Reminder within 5 minutes

            if (
                difference > 0 &&
                difference <=
                5 * 60 * 1000
            ) {

                showDeadlineReminder(
                    task
                );
            }
        }
    );
}


// ======================================================
// CHECK DEADLINES EVERY 30 SECONDS
// ======================================================

setInterval(
    checkDeadlines,
    30000
);


// ======================================================
// REMINDER DISPLAY
// ======================================================

function showDeadlineReminder(task) {

    const reminderId =
        "reminder-" +
        task.id;


    if (
        document.getElementById(
            reminderId
        )
    ) {

        return;
    }


    const reminder =
        document.createElement(
            "div"
        );


    reminder.id =
        reminderId;


    reminder.className =
        "deadline-reminder";


    reminder.innerHTML = `

        <div class="reminder-icon">
            ⏰
        </div>

        <div>

            <strong>
                Deadline Coming Up!
            </strong>

            <p>
                ${escapeHTML(
                    task.title
                )}
            </p>

        </div>

        <button
            onclick="
                this.parentElement.remove()
            "
        >
            ×
        </button>

    `;


    document.body.appendChild(
        reminder
    );
}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(dateString) {

    if (!dateString) {
        return "No deadline";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Invalid date";
    }


    return date.toLocaleString(
        [],
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


// ======================================================
// FIREBASE ERROR MESSAGES
// ======================================================

function getErrorMessage(code) {

    switch (code) {

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/network-request-failed":
            return "Network connection problem.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return "Firebase error: " + code;
    }
}


// ======================================================
// INITIAL CONNECTION STATUS
// ======================================================

updateConnectionStatus();


// ======================================================
// END OF APP.JS
// ======================================================