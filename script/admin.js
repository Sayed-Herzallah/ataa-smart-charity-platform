// admin.js — لوحة تحكم الأدمن | عطاء

// ═══ 1. فحص الأمان ═══
(function checkSecurity() {
    const localToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try { user = JSON.parse(userStr); } catch (e) {}

    if (!localToken || !user || user.roleType?.toLowerCase() !== "admin") {
        window.location.href = "login-register.html?mode=login";
        throw new Error("Unauthorized access");
    }
})();

const BASE_URL = "https://ataa-charity-platform.vercel.app";
const token = localStorage.getItem("token");

// ═══ 2. Cache & Pagination State ═══
let allDonors = [];
let allPendingCharities = [];
let allApprovedCharities = [];

let donorsPage = 1;
let pendingPage = 1;
let approvedPage = 1;
const PAGE_SIZE = 5;

/* ══════════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ══════════════════════════════════════════════════════════════════════════ */

// Create toast container once
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    const icons = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error:   '<i class="fa-solid fa-circle-xmark"></i>',
        warning: '<i class="fa-solid fa-circle-exclamation"></i>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-msg">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ══════════════════════════════════════════════════════════════════════════
   CUSTOM CONFIRM & PROMPT DIALOGS
   ══════════════════════════════════════════════════════════════════════════ */

function showConfirmCard(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay';

    overlay.innerHTML = `
        <div class="custom-dialog">
            <div class="dialog-icon confirm"><i class="fa-solid fa-trash-can"></i></div>
            <div class="dialog-title">${title}</div>
            <div class="dialog-message">${message}</div>
            <div class="dialog-buttons">
                <button class="dialog-btn danger" id="cfmYes">تأكيد</button>
                <button class="dialog-btn cancel" id="cfmNo">إلغاء</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const close = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('#cfmNo').onclick = close;
    overlay.querySelector('#cfmYes').onclick = () => { close(); onConfirm(); };
}

function showPromptCard(title, message, placeholder, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay';

    overlay.innerHTML = `
        <div class="custom-dialog">
            <div class="dialog-icon prompt"><i class="fa-solid fa-comment-dots"></i></div>
            <div class="dialog-title">${title}</div>
            <div class="dialog-message">${message}</div>
            <textarea class="dialog-input" id="pInput" rows="3" placeholder="${placeholder}"></textarea>
            <div class="dialog-buttons">
                <button class="dialog-btn primary" id="pSubmit">إرسال</button>
                <button class="dialog-btn cancel" id="pCancel">إلغاء</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const close = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('#pCancel').onclick = close;
    overlay.querySelector('#pSubmit').onclick = () => {
        const val = overlay.querySelector('#pInput').value.trim();
        if (!val) { showToast("يرجى إدخال السبب أولاً!", "warning"); return; }
        close();
        onConfirm(val);
    };
}

/* ══════════════════════════════════════════════════════════════════════════
   API OPERATIONS
   ══════════════════════════════════════════════════════════════════════════ */

async function deleteUser(id) {
    showConfirmCard(
        "حذف المستخدم",
        "هل أنت متأكد من رغبتك في حذف هذا المتبرع نهائياً من النظام؟",
        async () => {
            try {
                const res = await fetch(`${BASE_URL}/users/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: token }
                });
                if (res.ok) {
                    showToast("تم حذف المتبرع بنجاح ✓", "success");
                    loadUsers();
                } else {
                    const err = await res.json();
                    showToast(err.message || "فشل حذف المتبرع", "error");
                }
            } catch (e) { console.error(e); showToast("حدث خطأ أثناء الحذف", "error"); }
        }
    );
}

async function deleteCharity(id) {
    showConfirmCard(
        "حذف الجمعية",
        "هل أنت متأكد من رغبتك في حذف هذه الجمعية نهائياً من النظام؟",
        async () => {
            try {
                const res = await fetch(`${BASE_URL}/charity/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: token }
                });
                if (res.ok) {
                    showToast("تم حذف الجمعية بنجاح ✓", "success");
                    loadCharities();
                } else {
                    const err = await res.json();
                    showToast(err.message || "فشل حذف الجمعية", "error");
                }
            } catch (e) { console.error(e); showToast("حدث خطأ أثناء الحذف", "error"); }
        }
    );
}

async function approveCharity(id) {
    showConfirmCard(
        "اعتماد الجمعية",
        "هل تريد تأكيد قبول واعتماد هذه الجمعية الخيرية بالمنصة؟",
        async () => {
            try {
                const res = await fetch(`${BASE_URL}/charity/${id}/approve`, {
                    method: "PATCH",
                    headers: { Authorization: token }
                });
                if (res.ok) {
                    showToast("تم اعتماد وقبول الجمعية بنجاح ✓", "success");
                    loadCharities();
                } else {
                    const err = await res.json();
                    showToast(err.message || "فشل قبول الجمعية", "error");
                }
            } catch (e) { console.error(e); showToast("حدث خطأ أثناء قبول الجمعية", "error"); }
        }
    );
}

async function rejectCharity(id) {
    showPromptCard(
        "رفض الجمعية",
        "يرجى توضيح سبب رفض طلب اعتماد هذه الجمعية:",
        "اكتب سبب الرفض هنا...",
        async (reason) => {
            try {
                const res = await fetch(`${BASE_URL}/charity/${id}/reject`, {
                    method: "PATCH",
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ reason })
                });
                if (res.ok) {
                    showToast("تم رفض طلب الجمعية وإخطارهم بالسبب ✓", "success");
                    loadCharities();
                } else {
                    const err = await res.json();
                    showToast(err.message || "فشل رفض طلب الجمعية", "error");
                }
            } catch (e) { console.error(e); showToast("حدث خطأ أثناء عملية الرفض", "error"); }
        }
    );
}

/* ══════════════════════════════════════════════════════════════════════════
   TABLE RENDERING — with all data columns
   ══════════════════════════════════════════════════════════════════════════ */

function renderDonorsTable() {
    const tbody = document.getElementById("donors-table");
    const pagDiv = document.getElementById("donors-pagination");
    if (!tbody) return;

    if (allDonors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-users"></i><p>لا يوجد متبرعين حالياً</p></td></tr>`;
        if (pagDiv) pagDiv.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(allDonors.length / PAGE_SIZE);
    if (donorsPage > totalPages) donorsPage = totalPages || 1;

    const start = (donorsPage - 1) * PAGE_SIZE;
    const pageItems = allDonors.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(u => `
        <tr>
            <td class="fw-semibold">${u.userName || u.name || '—'}</td>
            <td>${u.email || '—'}</td>
            <td>${u.phone || '—'}</td>
            <td>${u.address || '—'}</td>
            <td>
                <div class="actions-group">
                    <button class="btn-view" onclick="viewDetails('${u._id}','donor')">
                        <i class="fa-solid fa-eye me-1"></i>التفاصيل
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${u._id}')">
                        <i class="fa-solid fa-trash-can me-1"></i>حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination(pagDiv, donorsPage, totalPages, p => { donorsPage = p; renderDonorsTable(); });
}

function renderPendingTable() {
    const tbody = document.getElementById("pending-charities-table");
    const pagDiv = document.getElementById("pending-pagination");
    if (!tbody) return;

    if (allPendingCharities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-hourglass-half"></i><p>لا توجد طلبات معلقة حالياً</p></td></tr>`;
        if (pagDiv) pagDiv.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(allPendingCharities.length / PAGE_SIZE);
    if (pendingPage > totalPages) pendingPage = totalPages || 1;

    const start = (pendingPage - 1) * PAGE_SIZE;
    const pageItems = allPendingCharities.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(c => `
        <tr>
            <td class="fw-semibold">${c.charityName || '—'}</td>
            <td>${c.email || '—'}</td>
            <td>${c.licenseNumber || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td><span class="badge-status badge-pending"><i class="fa-solid fa-clock me-1"></i>قيد المراجعة</span></td>
            <td>
                <div class="actions-group">
                    <button class="btn-view" onclick="viewDetails('${c._id}','charity')">
                        <i class="fa-solid fa-eye me-1"></i>التفاصيل
                    </button>
                    <button class="btn-approve" onclick="approveCharity('${c._id}')">
                        <i class="fa-solid fa-check me-1"></i>قبول
                    </button>
                    <button class="btn-reject" onclick="rejectCharity('${c._id}')">
                        <i class="fa-solid fa-xmark me-1"></i>رفض
                    </button>
                    <button class="btn-delete" onclick="deleteCharity('${c._id}')">
                        <i class="fa-solid fa-trash-can me-1"></i>حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination(pagDiv, pendingPage, totalPages, p => { pendingPage = p; renderPendingTable(); });
}

function renderApprovedTable() {
    const tbody = document.getElementById("approved-charities-table");
    const pagDiv = document.getElementById("approved-pagination");
    if (!tbody) return;

    if (allApprovedCharities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-circle-check"></i><p>لا توجد جمعيات معتمدة حالياً</p></td></tr>`;
        if (pagDiv) pagDiv.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(allApprovedCharities.length / PAGE_SIZE);
    if (approvedPage > totalPages) approvedPage = totalPages || 1;

    const start = (approvedPage - 1) * PAGE_SIZE;
    const pageItems = allApprovedCharities.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(c => `
        <tr>
            <td class="fw-semibold">${c.charityName || '—'}</td>
            <td>${c.email || '—'}</td>
            <td>${c.licenseNumber || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td><span class="badge-status badge-approved"><i class="fa-solid fa-circle-check me-1"></i>معتمدة</span></td>
            <td>
                <div class="actions-group">
                    <button class="btn-view" onclick="viewDetails('${c._id}','charity')">
                        <i class="fa-solid fa-eye me-1"></i>التفاصيل
                    </button>
                    <button class="btn-delete" onclick="deleteCharity('${c._id}')">
                        <i class="fa-solid fa-trash-can me-1"></i>حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination(pagDiv, approvedPage, totalPages, p => { approvedPage = p; renderApprovedTable(); });
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════════════════════════════════════ */

function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <button class="btn btn-outline-teal btn-sm" ${currentPage === 1 ? 'disabled' : ''} id="pgPrev">
            السابق <i class="fa-solid fa-chevron-right ms-1"></i>
        </button>
        <span class="fw-bold" style="font-size:13px;color:#1b4b5a;">صفحة ${currentPage} من ${totalPages}</span>
        <button class="btn btn-outline-teal btn-sm" ${currentPage === totalPages ? 'disabled' : ''} id="pgNext">
            التالي <i class="fa-solid fa-chevron-left me-1"></i>
        </button>
    `;

    container.querySelector('#pgPrev').onclick = () => onPageChange(currentPage - 1);
    container.querySelector('#pgNext').onclick = () => onPageChange(currentPage + 1);
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAILS MODAL
   ══════════════════════════════════════════════════════════════════════════ */

function viewDetails(id, type) {
    let item = null;
    if (type === 'donor') {
        item = allDonors.find(u => u._id === id);
    } else {
        item = allPendingCharities.find(c => c._id === id) || allApprovedCharities.find(c => c._id === id);
    }

    if (!item) {
        showToast("تعذر العثور على التفاصيل المطلوبة", "error");
        return;
    }

    const body = document.getElementById("detailsModalBody");
    if (!body) return;

    const addRow = (label, value) => {
        if (!value) return '';
        return `<div class="detail-row">
            <span class="detail-label">${label}</span>
            <span class="detail-value">${value}</span>
        </div>`;
    };

    let html = '';
    if (type === 'donor') {
        html += addRow("اسم المستخدم", item.userName);
        html += addRow("الاسم", item.name);
        html += addRow("البريد الإلكتروني", item.email);
        html += addRow("رقم الهاتف", item.phone);
        html += addRow("العنوان", item.address);
        html += addRow("نوع الحساب", "متبرع (مستخدم)");
        html += addRow("تاريخ الانضمام", item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
    } else {
        html += addRow("اسم الجمعية", item.charityName);
        html += addRow("البريد الإلكتروني", item.email);
        html += addRow("رقم الهاتف", item.phone);
        html += addRow("العنوان", item.address);
        html += addRow("رقم الترخيص", item.licenseNumber);
        html += addRow("وصف الجمعية", item.description || item.charityDescription);
        const statusBadge = item.approvalStatus === 'approved'
            ? '<span class="badge-status badge-approved"><i class="fa-solid fa-circle-check me-1"></i>معتمدة</span>'
            : '<span class="badge-status badge-pending"><i class="fa-solid fa-clock me-1"></i>قيد المراجعة</span>';
        html += addRow("حالة الاعتماد", statusBadge);
        html += addRow("تاريخ التسجيل", item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
    }

    body.innerHTML = html || '<p class="text-center text-muted">لا توجد بيانات</p>';

    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

/* ══════════════════════════════════════════════════════════════════════════
   DATA LOADING
   ══════════════════════════════════════════════════════════════════════════ */

async function loadUsers() {
    const tbody = document.getElementById("donors-table");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="loading-spinner"></td></tr>`;

    try {
        // Fetch ALL users by requesting a high limit and looping through pages
        let allUsers = [];
        let page = 1;
        let totalPages = 1;

        do {
            const res = await fetch(`${BASE_URL}/users?page=${page}&limit=500`, {
                headers: { Authorization: token }
            });
            const data = await res.json();

            // The users API returns: { data: { Data: [...], Total_Pages, Total_Items } }
            const result = data.data || data;
            const items = result.Data || result.users || [];
            totalPages = result.Total_Pages || 1;

            allUsers = allUsers.concat(items);
            console.log(`📄 Users page ${page}/${totalPages}: got ${items.length} items`);
            page++;
        } while (page <= totalPages);

        // Filter out admin users — only show donors
        allDonors = allUsers.filter(u => u.roleType?.toLowerCase() !== 'admin');

        console.log(`✅ Total donors loaded: ${allDonors.length}`);
        donorsPage = 1;
        renderDonorsTable();
        updateStats();
    } catch (e) {
        console.error("USERS ERROR:", e);
        showToast("فشل تحميل بيانات المتبرعين من السيرفر", "error");
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>`;
    }
}

async function loadCharities() {
    const pendTb = document.getElementById("pending-charities-table");
    const appTb = document.getElementById("approved-charities-table");
    if (pendTb) pendTb.innerHTML = `<tr><td colspan="6" class="loading-spinner"></td></tr>`;
    if (appTb) appTb.innerHTML = `<tr><td colspan="6" class="loading-spinner"></td></tr>`;

    try {
        // Fetch ALL charities by requesting a high limit and looping through pages
        let allCharities = [];
        let page = 1;
        let totalPages = 1;

        do {
            const res = await fetch(`${BASE_URL}/charity/charities?page=${page}&limit=500`);
            const data = await res.json();

            // The charities API returns: { result: { Data: [...], Total_Pages, Total_Items } }
            const result = data.result || data;
            const items = result.Data || [];
            totalPages = result.Total_Pages || 1;

            allCharities = allCharities.concat(items);
            console.log(`📄 Charities page ${page}/${totalPages}: got ${items.length} items`);
            page++;
        } while (page <= totalPages);

        allPendingCharities = allCharities.filter(c => c.approvalStatus === "pending");
        allApprovedCharities = allCharities.filter(c => c.approvalStatus === "approved");

        console.log(`✅ Total charities: ${allCharities.length} (${allPendingCharities.length} pending + ${allApprovedCharities.length} approved)`);
        pendingPage = 1;
        approvedPage = 1;
        renderPendingTable();
        renderApprovedTable();
        updateStats();
    } catch (e) {
        console.error("CHARITIES ERROR:", e);
        showToast("فشل تحميل بيانات الجمعيات من السيرفر", "error");
        if (pendTb) pendTb.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>`;
        if (appTb) appTb.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>`;
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   STATS UPDATE
   ══════════════════════════════════════════════════════════════════════════ */

function updateStats() {
    const el = (id) => document.getElementById(id);

    const donorsEl = el("total-donors");
    const pendingEl = el("total-pending");
    const approvedEl = el("total-approved");

    if (donorsEl) donorsEl.textContent = allDonors.length;
    if (pendingEl) pendingEl.textContent = allPendingCharities.length;
    if (approvedEl) approvedEl.textContent = allApprovedCharities.length;
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN TASKS (LocalStorage Persistence)
   ══════════════════════════════════════════════════════════════════════════ */

let adminTasks = [];

function loadTasks() {
    const tasksStr = localStorage.getItem("admin_tasks");
    if (tasksStr) {
        try {
            adminTasks = JSON.parse(tasksStr);
        } catch (e) {
            console.error("Error parsing tasks:", e);
            adminTasks = [];
        }
    } else {
        // Default tasks if empty
        adminTasks = [
            { id: 1, text: "مراجعة طلبات الجمعيات الجديدة المعلقة", completed: false },
            { id: 2, text: "تحديث قائمة المتبرعين النشطين وتصديرها", completed: false }
        ];
        saveTasks();
    }
    renderTasks();
}

function saveTasks() {
    localStorage.setItem("admin_tasks", JSON.stringify(adminTasks));
}

function renderTasks() {
    const list = document.getElementById("tasks-list");
    const countEl = document.getElementById("tasks-count");
    if (!list) return;

    if (adminTasks.length === 0) {
        list.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fa-solid fa-list-check d-block fs-3 mb-2" style="opacity:0.4;"></i>
                <span>لا توجد مهام حالياً. أضف مهمة جديدة بالأعلى!</span>
            </div>
        `;
        if (countEl) countEl.textContent = "0 مهمة متبقية";
        return;
    }

    const remaining = adminTasks.filter(t => !t.completed).length;
    if (countEl) {
        countEl.textContent = `${remaining} مهمة متبقية`;
    }

    list.innerHTML = adminTasks.map(task => `
        <li class="task-item">
            <div class="task-checkbox-container" onclick="toggleTask(${task.id})">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} readonly>
                <span class="task-text">${task.text}</span>
            </div>
            <button class="btn-delete-task" onclick="deleteTask(${task.id}); event.stopPropagation();" title="حذف المهمة">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </li>
    `).join("");
}

function addTask(text) {
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };
    adminTasks.push(newTask);
    saveTasks();
    renderTasks();
    showToast("تم إضافة المهمة بنجاح", "success");
}

function toggleTask(id) {
    const task = adminTasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    adminTasks = adminTasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast("تم حذف المهمة", "warning");
}

// Bind task form
function initTaskEvents() {
    const form = document.getElementById("add-task-form");
    const input = document.getElementById("task-input");
    if (form && input) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                addTask(text);
                input.value = "";
            }
        };
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    loadCharities();
    loadTasks();
    initTaskEvents();
});