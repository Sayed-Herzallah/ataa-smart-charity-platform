

// document.addEventListener("DOMContentLoaded", () => {
//     fetchDonations();
//     fetchRequests();
//     updateCharityStats();
// });


// async function fetchDonations() {
//     try {
//         const response = await fetch('https://reqres.in/api/users?page=1');
//         const result = await response.json();
//         const list = document.getElementById('donations-list');

//         list.innerHTML = result.data.slice(0, 3).map(item => `
//             <li class="list-group-item border-0 p-0 mb-2 mt-3">
//                 <div class="request-box" style="padding:15px; border:1px solid #ddd; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
//                     <div class="text-box">
//                         <span class="text fw-bold"></span> </div>
//                     <div class="d-flex gap-2">
//                         <button class="fw-bold" style="background-color: white; color: #1b4b5a; border: 2px solid #1b4b5a; padding: 5px 15px; border-radius: 5px;" onclick="acceptDonation(this)">قبول الاستلام</button>
                        
//                         <button class="fw-bold" style="background-color: #1b4b5a; color: white; border: none; padding: 7px 15px; border-radius: 5px;" onclick="rejectDonation(this)">رفض الاستلام</button>
//                     </div>
//                 </div>
//             </li>
//         `).join('');
//     } catch (err) { console.error("Error"); }
// }


// async function fetchRequests() {
//     try {
//         const response = await fetch('https://reqres.in/api/users?page=2');
//         const result = await response.json();
//         const list = document.getElementById('beneficiary-list');

//         list.innerHTML = result.data.slice(0, 3).map(item => `
//             <li class="list-group-item border-0 p-0 mt-3">
//                 <div class="request-box" style="padding:15px; border:1px solid #ddd; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
//                     <div class="text-box">
//                         <span class="text fw-bold"></span> </div>
//                     <button class="fw-bold" style="background-color: #1b4b5a; color: white; border: none; padding: 7px 15px; border-radius: 5px;" onclick="return false;">تعيين متطوع</button>
//                 </div>
//             </li>
//         `).join('');
//     } catch (err) { console.error("Error"); }
// }


// function acceptDonation(btn) {
//     const box = btn.closest('.request-box');
//     box.style.backgroundColor = "#e8f0f2"; 
//     btn.innerText = "تم القبول";
//     btn.disabled = true;
// }


// function rejectDonation(btn) {
//     if (confirm("هل أنت متأكد من الحذف؟")) {
//         btn.closest('li').remove();
//     }
// }


// function updateCharityStats() {
//     document.getElementById("total-donations").textContent = "0";
//     document.getElementById("beneficiary-requests").textContent = "0";
//     document.getElementById("active-volunteers").textContent = "0";
// }

// =========================222222222222222222222222222===========================

// فحص الأمان والصلاحيات فوراً قبل تحميل الصفحة
(function checkSecurity() {
    const localToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {}

    if (!localToken || !user || user.roleType?.toLowerCase() !== "charity") {
        alert("غير مصرح لك بالدخول لهذه الصفحة!");
        window.location.href = "login-register.html?mode=login";
        throw new Error("Unauthorized access");
    }
})();

const BASE_URL = "https://ataa-charity-platform.vercel.app";

const token = localStorage.getItem("token");

/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

    getStats();

    fetchDonations();

    fetchRequests();

    loadNotifications();
});

/* =========================
   GET STATS
========================= */

async function getStats() {

    try {

        const response = await fetch(
            `${BASE_URL}/dashboard/stats`,
            {
                method: "GET",

                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();

        console.log("STATS:", data);

        const stats = data.stats || data;

        document.getElementById("total-donations").textContent =
            stats.Total_Donations !== undefined ? stats.Total_Donations : (stats.totalDonations || stats.donations || 0);

        document.getElementById("beneficiary-requests").textContent =
            stats.Pending_Donations !== undefined ? stats.Pending_Donations : (stats.totalRequests || stats.requests || 0);

        document.getElementById("active-volunteers").textContent =
            stats.Accepted_Donations !== undefined ? stats.Accepted_Donations : (stats.activeVolunteers || stats.volunteers || 0);

    } catch (error) {

        console.log("Stats Error:", error);
    }
}

/* =========================
   GET DONATIONS
========================= */
async function fetchDonations() {

    try {

        const response = await fetch(
            `${BASE_URL}/dashboard/donations`,
            {
                method: "GET",
                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();
        console.log("DONATIONS:", data);

        const donations = data.donations || data.data || [];
        const list = document.getElementById("donations-list");

        if (!donations.length) {
            list.innerHTML = `
                <li class="list-group-item text-center">
                    لا توجد تبرعات حالياً
                </li>
            `;
            return;
        }

        list.innerHTML = donations.map(item => {
            let actionsHtml = "";
            const status = (item.status || "pending").toLowerCase();

            if (status === "accepted" || status === "approved") {
                actionsHtml = `<span class="badge bg-success">✓ تم القبول</span>`;
            } else if (status === "rejected" || status === "refused") {
                actionsHtml = `<span class="badge bg-danger">✕ تم الرفض</span>`;
            } else {
                actionsHtml = `
                    <div class="d-flex gap-2">
                        <button
                            class="btn btn-sm btn-success text-white px-3"
                            onclick="updateDonationStatus('${item._id}', 'accepted', this)"
                        >
                           قبول
                        </button>
                        <button
                            class="btn btn-sm btn-danger text-white px-3"
                            onclick="updateDonationStatus('${item._id}', 'rejected', this)"
                        >
                           رفض
                        </button>
                    </div>
                `;
            }

            return `
                <li class="list-group-item border-0 p-0 mb-2 mt-3">
                    <div class="request-box">
                        <div class="text-box">
                            <span class="text fw-bold">
                                ${item.type || "تبرع جديد"}
                            </span>
                            <small class="text-muted">
                                المقاس: ${item.size || "-"} |
                                الكمية: ${item.quantity || 0}
                            </small>
                        </div>
                        <div class="actions-container">
                            ${actionsHtml}
                        </div>
                    </div>
                </li>
            `;
        }).join("");

    } catch (error) {
        console.log("Donations Error:", error);
    }
}

/* =========================
   UPDATE DONATION STATUS
========================= */
async function updateDonationStatus(id, status, btn) {
    try {
        const response = await fetch(
            `${BASE_URL}/dashboard/request/${id}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status
                })
            }
        );

        const data = await response.json();
        console.log("ACCEPT/REJECT DONATION:", data);

        if (response.ok) {
            const container = btn.closest(".actions-container");
            if (container) {
                if (status === "accepted") {
                    container.innerHTML = `<span class="badge bg-success">✓ تم القبول</span>`;
                } else {
                    container.innerHTML = `<span class="badge bg-danger">✕ تم الرفض</span>`;
                }
            }
            // Refresh stats to reflect changes in totals
            getStats();
        } else {
            alert(data.message || "فشل تحديث حالة التبرع");
        }

    } catch (error) {
        console.log("Update Donation Error:", error);
    }
}

/* =========================
   GET REQUESTS
========================= */
async function fetchRequests() {

    try {

        const response = await fetch(
            `${BASE_URL}/dashboard/requests`,
            {
                method: "GET",
                headers: {
                    Authorization: token
                }
            }
        );

        const data = await response.json();
        console.log("REQUESTS:", data);

        const requests = data.requests || data.data || [];
        const list = document.getElementById("beneficiary-list");

        if (!requests.length) {
            list.innerHTML = `
                <li class="list-group-item text-center">
                    لا توجد طلبات حالياً
                </li>
            `;
            return;
        }

        list.innerHTML = requests.map(item => {
            let actionsHtml = "";
            const status = (item.status || "pending").toLowerCase();

            if (status === "accepted" || status === "approved") {
                actionsHtml = `<span class="badge bg-success">✓ تم القبول</span>`;
            } else if (status === "rejected" || status === "refused") {
                actionsHtml = `<span class="badge bg-danger">✕ تم الرفض</span>`;
            } else {
                actionsHtml = `
                    <div class="d-flex gap-2">
                        <button
                            class="btn btn-sm btn-success text-white px-3"
                            onclick="updateRequestStatus('${item._id}', 'accepted', this)"
                        >
                           قبول
                        </button>
                        <button
                            class="btn btn-sm btn-danger text-white px-3"
                            onclick="updateRequestStatus('${item._id}', 'rejected', this)"
                        >
                           رفض
                        </button>
                    </div>
                `;
            }

            return `
                <li class="list-group-item border-0 p-0 mt-3">
                    <div class="request-box">
                        <div class="text-box">
                            <span class="text fw-bold">
                                ${item.title || item.requestTitle || item.userName || "طلب جديد"}
                            </span>
                        </div>
                        <div class="actions-container">
                            ${actionsHtml}
                        </div>
                    </div>
                </li>
            `;
        }).join("");

    } catch (error) {
        console.log("Requests Error:", error);
    }
}

/* =========================
   UPDATE REQUEST STATUS
========================= */
async function updateRequestStatus(id, status, btn) {
    try {
        const response = await fetch(
            `${BASE_URL}/dashboard/request/${id}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status
                })
            }
        );

        const data = await response.json();
        console.log("ACCEPT/REJECT REQUEST:", data);

        if (response.ok) {
            const container = btn.closest(".actions-container");
            if (container) {
                if (status === "accepted") {
                    container.innerHTML = `<span class="badge bg-success">✓ تم القبول</span>`;
                } else {
                    container.innerHTML = `<span class="badge bg-danger">✕ تم الرفض</span>`;
                }
            }
            // Refresh stats to reflect changes in totals
            getStats();
        } else {
            alert(data.message || "فشل تحديث حالة الطلب");
        }

    } catch (error) {
        console.log("Update Request Error:", error);
    }
}

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
            document.getElementById("notifications-count");

        const notificationList =
            document.getElementById("notifications-list");

        if (countBadge) {

            countBadge.textContent =
                notifications.length;
        }

        if (!notificationList) return;

        if (!notifications.length) {

            notificationList.innerHTML = `
                <li class="list-group-item text-center text-muted">
                    لا توجد إشعارات حالياً
                </li>
            `;

            return;
        }

        notificationList.innerHTML =
            notifications.map(notification => `

                <li
                    class="list-group-item d-flex justify-content-between align-items-center"
                >

                    <span>
                        ${
                            notification.message ||
                            notification.title ||
                            "إشعار جديد"
                        }
                    </span>

                    <div class="d-flex gap-1">

                        <button
                            class="btn btn-sm btn-success text-white"
                            style="padding: 2px 8px;"
                            onclick="markNotificationAsRead('${notification._id}')"
                        >
                            ✓
                        </button>

                        <button
                            class="btn btn-sm btn-danger text-white"
                            style="padding: 2px 8px;"
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

        console.log("MARK READ:", data);

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

        console.log("DELETE NOTIFICATION:", data);

        if (response.ok) {

            loadNotifications();
        }

    } catch (error) {

        console.log(error);
    }
}