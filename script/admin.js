

// function toggleSidebar() {
//     const sidebar = document.getElementById("sidebar");
//     const content = document.getElementById("content");
//     const menuBtn = document.querySelector(".menu-btn");
//     if(sidebar) sidebar.classList.toggle("active");
//     if(content) content.classList.toggle("shift");
//     if(menuBtn) menuBtn.classList.toggle("move");
// }


// function confirmDelete(btn, name) {
//     if (confirm(`؟هل متاكد من حذف هذا السجل`)) {
//         btn.closest('tr').remove();
//     }
// }

// function setStatus(id, status) {
//     console.log(`Status for ${id} set to ${status}`);
// }

// async function loadDashboardData() {
//     try {
        
//         const resDonors = await fetch('https://reqres.in/api/users?page=1');
//         const jsonDonors = await resDonors.json();
//         const donorNames = [""];
        
//         document.getElementById('donors-table').innerHTML = jsonDonors.data.slice(0, 4).map((u, i) => `
//             <tr>
//                 <td style="font-weight: bold;">${donorNames[i]}</td>
//                 <td>
//                     <button class="btn btn-sm btn-success" onclick="setStatus(${u.id}, 'accept')">قبول</button>
//                     <button class="btn btn-sm btn-secondary" onclick="setStatus(${u.id}, 'review')">مراجعة</button>
//                     <button class="btn btn-sm btn-danger" onclick="confirmDelete(this, '${donorNames[i]}')">حذف</button>
//                 </td>
//             </tr>`).join('');

//         const resCharities = await fetch('https://reqres.in/api/users?page=2');
//         const jsonCharities = await resCharities.json();
//         const charityNames = [""];

//         document.getElementById('charities-table').innerHTML = jsonCharities.data.slice(0, 4).map((u, i) => `
//             <tr>
//                 <td style="font-weight: bold;">${charityNames[i]}</td>
//                 <td>
//                     <button class="btn btn-sm btn-success" onclick="setStatus(${u.id}, 'accept')">قبول</button>
//                     <button class="btn btn-sm btn-secondary" onclick="setStatus(${u.id}, 'review')">مراجعة</button>
//                     <button class="btn btn-sm btn-danger" onclick="confirmDelete(this, '${charityNames[i]}')">حذف</button>
//                 </td>
//             </tr>`).join('');
//     } catch (e) { console.error(e); }
// }

// function initCharts() {
//     const ctx = document.getElementById('donutChart');
//     if (ctx) {
//         new Chart(ctx, {
//             type: 'doughnut',
//             data: {
//                 labels: ['ملابس رجال', 'ملابس نساء', 'ملابس اطفال'],
//                 datasets: [{ data: [45, 25, 30], backgroundColor: ['#007bff', '#28a745', '#ffc107'] }]
//             },
//             options: { responsive: true, maintainAspectRatio: false }
//         });
//     }
//     const ctx2 = document.getElementById('lineChart');
//     if (ctx2) {
//         new Chart(ctx2, {
//             type: 'line',
//             data: {
//                 labels: ['يناير', 'فبراير', 'مارس', 'أبريل'],
//                 datasets: [{ label: 'تبرعات', data: [10, 50, 25, 70], borderColor: '#6f42c1', fill: false }]
//             },
//             options: { responsive: true, maintainAspectRatio: false }
//         });
//     }
// }

// function addNewTask() {
//     const taskName = prompt("أدخل تفاصيل المهمة الجديدة:");
//     if (taskName && taskName.trim() !== "") {
//         const list = document.getElementById('list');
//         const li = document.createElement('li');
//         li.className = "list-group-item";
//         li.innerHTML = `<input type="checkbox"> <label>${taskName}</label>`;
//         list.appendChild(li);
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     initCharts();
//     loadDashboardData();
//     document.getElementById('addtask').onclick = addNewTask;
// });

// =========================2222222222222222222222222222222222222=======================
const BASE_URL = "https://ataa-charity-platform.vercel.app";

const token = localStorage.getItem("token");

/* =========================
   SIDEBAR
========================= */

function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
    const menuBtn = document.querySelector(".menu-btn");

    sidebar?.classList.toggle("active");
    content?.classList.toggle("shift");
    menuBtn?.classList.toggle("move");
}

/* =========================
   DELETE USER
========================= */

async function deleteUser(id, btn) {

    const confirmDelete = confirm("هل أنت متأكد من حذف المستخدم؟");

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${BASE_URL}/users/${id}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: token
                }
            }
        );

        if (response.ok) {

            btn.closest("tr").remove();

        } else {

            alert("فشل حذف المستخدم");
        }

    } catch (error) {

        console.log(error);

        alert("حدث خطأ أثناء الحذف");
    }
}

/* =========================
   DELETE CHARITY
========================= */

async function deleteCharity(id, btn) {

    const confirmDelete = confirm("هل أنت متأكد من حذف الجمعية؟");

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${BASE_URL}/charity/${id}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: token
                }
            }
        );

        if (response.ok) {

            btn.closest("tr").remove();

        } else {

            alert("فشل حذف الجمعية");
        }

    } catch (error) {

        console.log(error);

        alert("حدث خطأ أثناء الحذف");
    }
}

/* =========================
   APPROVE CHARITY
========================= */
async function approveCharity(id) {

    console.log("TOKEN:", localStorage.getItem("token"));

    try {

        const response = await fetch(
            `${BASE_URL}/charity/${id}/approve`,
            {
                method: "PATCH",

                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        const data = await response.json();
        console.log(data);

        if (response.ok) {

            alert("تم قبول الجمعية");
            loadCharities();

        } else {

            alert(data.message || "فشل قبول الجمعية");
        }

    } catch (error) {

        console.log(error);
    }
}

/* =========================
   REJECT CHARITY
========================= */

async function rejectCharity(id) {

    const reason = prompt("اكتب سبب الرفض");

    if (!reason) return;

    try {

        const response = await fetch(
            `${BASE_URL}/charity/${id}/reject`,
            {
                method: "PATCH",

                headers: {
                    Authorization: localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    reason
                })
            }
        );

        const data = await response.json();
        console.log(data);

        if (response.ok) {

            alert("تم رفض الجمعية");
            loadCharities();

        } else {

            alert(data.message || "فشل رفض الجمعية");
        }

    } catch (error) {

        console.log(error);
    }
}

/* =========================
   LOAD USERS
========================= */

async function loadUsers() {

    try {

        const response = await fetch(
            `${BASE_URL}/users`,
            {
                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();

        console.log("USERS:", data);

        const users = data.data?.Data || [];

        const donorsTable =
            document.getElementById("donors-table");

        if (!donorsTable) return;

        donorsTable.innerHTML =
            users.map(user => `

                <tr>

                    <td>
                        ${user.userName || user.name || user.email || "مستخدم"}
                    </td>

                    <td>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteUser('${user._id}', this)"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `).join("");

    } catch (error) {

        console.log("USERS ERROR:", error);
    }
}
/* =========================
   LOAD CHARITIES
========================= */

async function loadCharities() {

    try {

        const response = await fetch(
            `${BASE_URL}/charity/charities`
        );

        const data = await response.json();

        console.log("CHARITIES:", data);
       
        const charities = data.result?.Data || [];

        const pendingCharities =
            charities.filter(
                charity => charity.approvalStatus === "pending"
            );

        const approvedCharities =
            charities.filter(
                charity => charity.approvalStatus === "approved"
            );
            console.log("Pending:", pendingCharities);
            console.log("Approved:", approvedCharities);

        const pendingTable =
            document.getElementById(
                "pending-charities-table"
            );

        const approvedTable =
            document.getElementById(
                "approved-charities-table"
            );

        if (pendingTable) {

            pendingTable.innerHTML =
                pendingCharities.map(charity => `

                    <tr>

                        <td>
                            ${charity.charityName}
                        </td>

                        <td>
                            قيد المراجعة
                        </td>

                        <td>

                            <button
                                class="btn btn-success btn-sm"
                                onclick="approveCharity('${charity._id}')"
                            >
                                قبول
                            </button>

                            <button
                                class="btn btn-secondary btn-sm"
                                onclick="rejectCharity('${charity._id}')"
                            >
                                رفض
                            </button>

                            <button
                                class="btn btn-danger btn-sm"
                                onclick="deleteCharity('${charity._id}', this)"
                            >
                                حذف
                            </button>

                        </td>

                    </tr>

                `).join("");
        }

        if (approvedTable) {

            approvedTable.innerHTML =
                approvedCharities.map(charity => `

                    <tr>

                        <td>
                            ${charity.charityName}
                        </td>

                        <td>
                            معتمدة
                        </td>

                        <td>

                            <button
                                class="btn btn-danger btn-sm"
                                onclick="deleteCharity('${charity._id}', this)"
                            >
                                حذف
                            </button>

                        </td>

                    </tr>

                `).join("");
        }

    } catch (error) {

        console.log(error);
    }
}
/* =========================
   CHARTS
========================= */

function initCharts() {

    const ctx = document.getElementById('donutChart');

    if (ctx) {

        new Chart(ctx, {

            type: 'doughnut',

            data: {

                labels: [
                    'ملابس رجال',
                    'ملابس نساء',
                    'ملابس أطفال'
                ],

                datasets: [{
                    data: [45, 25, 30],

                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107'
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    const ctx2 = document.getElementById('lineChart');

    if (ctx2) {

        new Chart(ctx2, {

            type: 'line',

            data: {

                labels: [
                    'يناير',
                    'فبراير',
                    'مارس',
                    'أبريل'
                ],

                datasets: [{
                    label: 'تبرعات',

                    data: [10, 50, 25, 70],

                    borderColor: '#6f42c1',

                    fill: false
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

/* =========================
   TASKS
========================= */

function addNewTask() {

    const taskName =
        prompt("أدخل تفاصيل المهمة الجديدة:");

    if (!taskName || taskName.trim() === "") return;

    const list =
        document.getElementById('list');

    const li =
        document.createElement('li');

    li.className = "list-group-item";

    li.innerHTML = `
        <input type="checkbox">
        <label>${taskName}</label>
    `;

    list.appendChild(li);
}


// ====================
/* =========================
   LOAD NOTIFICATIONS
========================= */

async function loadNotifications() {

    try {

        const response = await fetch(
            `${BASE_URL}/notification`,
            {
                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();

        console.log("NOTIFICATIONS:", data);

        const notifications =
            data.notifications ||
            data.data ||
            [];

        const countBadge =
            document.getElementById("notifications-list");

        const notificationList =
            document.getElementById("notification-list");

        if (countBadge) {

            countBadge.textContent =
                notifications.length;
        }

        if (!notificationList) return;

        if (!notifications.length) {

            notificationList.innerHTML = `
                <li class="dropdown-item text-center">
                    لا توجد إشعارات
                </li>
            `;

            return;
        }

        notificationList.innerHTML =
            notifications.map(notification => `

                <li
                    class="dropdown-item d-flex justify-content-between align-items-center"
                >

                    <span>
                        ${
                            notification.message ||
                            notification.title ||
                            "إشعار جديد"
                        }
                    </span>

                    <div>

                        <button
                            class="btn btn-sm btn-success"
                            onclick="markNotificationAsRead('${notification._id}')"
                        >
                            ✓
                        </button>

                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deleteNotification('${notification._id}')"
                        >
                            ✕
                        </button>

                    </div>

                </li>

            `).join("");

    } catch (error) {

        console.log("NOTIFICATIONS ERROR:", error);
    }
}

/* =========================
   MARK AS READ
========================= */

async function markNotificationAsRead(id) {

    try {

        const response = await fetch(
            `${BASE_URL}/notification/${id}`,
            {
                method: "PATCH",

                headers: {
                    Authorization: token,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "read"
                })
            }
        );

        const data = await response.json();

        console.log(data);

        if (response.ok) {

            loadNotifications();
        }

    } catch (error) {

        console.log(error);
    }
}

/* =========================
   DELETE NOTIFICATION
========================= */

async function deleteNotification(id) {

    try {

        const response = await fetch(
            `${BASE_URL}/notification/${id}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();

        console.log(data);

        if (response.ok) {

            loadNotifications();
        }

    } catch (error) {

        console.log(error);
    }
}

/* =========================

   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

    initCharts();

    loadUsers();

    loadCharities();

    loadNotifications();

    document.getElementById("addtask").onclick =
        addNewTask;
});