

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

let currentPage = 1;
const limit = 6;
let allDonations = [];

/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {
    getStats();
    fetchDonations();
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

        document.getElementById("pending-donations").textContent =
            stats.Pending_Donations !== undefined ? stats.Pending_Donations : (stats.totalRequests || stats.requests || 0);

        document.getElementById("accepted-donations").textContent =
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
        console.log("DONATIONS FETCHED:", data);

        // Robust fallback for all possible API response formats
        allDonations = data.donations || data.data || data.Data || (Array.isArray(data) ? data : []);
        renderDonationsPage();

    } catch (error) {
        console.log("Donations Fetch Error:", error);
        const grid = document.getElementById("donations-grid");
        if (grid) {
            grid.innerHTML = `
                <div class="alert alert-danger w-100 m-3" role="alert">
                    <strong>حدث خطأ أثناء جلب البيانات من الخادم:</strong> ${error.message}
                </div>
            `;
        }
    }
}

/* =========================
   RENDER DONATIONS PAGE (Client-Side Pagination & Clickable Cards)
========================= */
function renderDonationsPage() {
    const grid = document.getElementById("donations-grid");
    if (!grid) return;

    try {
        if (!allDonations.length) {
            grid.innerHTML = `
                <div class="text-center w-100 p-4 text-muted">
                    لا توجد تبرعات حالياً
                </div>
            `;
            document.getElementById("prevPageBtn").disabled = true;
            document.getElementById("nextPageBtn").disabled = true;
            document.getElementById("pageIndicator").textContent = `الصفحة 1 من 1`;
            return;
        }

        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginated = allDonations.slice(startIndex, endIndex);

        grid.innerHTML = paginated.map(item => {
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
                            onclick="updateDonationStatus('${item._id}', 'accepted', this); event.stopPropagation();"
                        >
                           قبول
                        </button>
                        <button
                            class="btn btn-sm btn-danger text-white px-3"
                            onclick="updateDonationStatus('${item._id}', 'rejected', this); event.stopPropagation();"
                        >
                           رفض
                        </button>
                    </div>
                `;
            }

            // Image extraction (Handles mongoose schema: imageUrl: [ { secure_url: "..." } ])
            let imageHtml = "";
            let imageSrc = "";
            
            if (item.imageUrl && item.imageUrl.length > 0) {
                const first = item.imageUrl[0];
                if (first && typeof first === 'object' && first.secure_url) {
                    imageSrc = first.secure_url;
                } else if (typeof first === 'string') {
                    imageSrc = first;
                } else if (typeof item.imageUrl === 'string') {
                    imageSrc = item.imageUrl;
                }
            } else if (item.images && item.images.length > 0) {
                const first = item.images[0];
                if (first && typeof first === 'object' && (first.secure_url || first.url)) {
                    imageSrc = first.secure_url || first.url;
                } else if (typeof first === 'string') {
                    imageSrc = first;
                }
            } else if (typeof item.image === 'string') {
                imageSrc = item.image;
            } else if (item.image && typeof item.image === 'object' && item.image.secure_url) {
                imageSrc = item.image.secure_url;
            }

            if (imageSrc && typeof imageSrc === 'string') {
                if (imageSrc.startsWith('/')) {
                    imageSrc = BASE_URL + imageSrc;
                }
                imageHtml = `
                    <div class="donation-card-img-wrap" style="height: 180px; overflow: hidden; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                        <img src="${imageSrc}" alt="صورة التبرع" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
                    </div>
                `;
            }    

            // Format Date
            let dateStr = "";
            if (item.createdAt) {
                try {
                    dateStr = new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
                } catch (e) {}
            }

            return `
                <div class="donation-card" onclick="showDonationDetails('${item._id}')" style="cursor: pointer;">
                    ${imageHtml}
                    <div class="donation-card-header" style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid #f3f4f6; padding-bottom:10px; margin-bottom:12px;">
                        <span class="type-badge" style="background: rgba(27, 75, 90, 0.08); color: #1b4b5a; padding: 4px 12px; border-radius: 30px; font-weight: 700; font-size:12.5px;">${item.type || "تبرع ملابس"}</span>
                        ${dateStr ? `<span class="text-muted" style="font-size: 11px;">${dateStr}</span>` : ''}
                    </div>
                    <div class="donation-card-body" style="text-align:right; flex-grow:1; margin-bottom:12px;">
                        <div style="font-size:13.5px; color:#4b5563; line-height:1.6;">
                            <div class="d-flex flex-wrap gap-3 mb-2">
                                <span><strong>المقاس:</strong> ${item.size || "-"}</span>
                                <span><strong>الكمية:</strong> ${item.quantity || 0}</span>
                                <span><strong>الحالة:</strong> ${item.condition || "-"}</span>
                            </div>
                            ${item.description ? `
                            <div style="border-top: 1px dashed #f3f4f6; padding-top: 8px; margin-top: 8px;">
                                <strong>الوصف:</strong>
                                <p style="margin: 4px 0 0 0; font-size: 12.5px; color: #6b7280; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.description}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="donation-card-footer actions-container" style="border-top:1px solid #f3f4f6; padding-top:12px; display:flex; justify-content:flex-end;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        }).join("");

        // Update pagination controls
        const totalPages = Math.ceil(allDonations.length / limit) || 1;
        document.getElementById("prevPageBtn").disabled = currentPage === 1;
        document.getElementById("nextPageBtn").disabled = endIndex >= allDonations.length;
        document.getElementById("pageIndicator").textContent = `الصفحة ${currentPage} من ${totalPages}`;

    } catch (err) {
        console.error("Rendering Error:", err);
        grid.innerHTML = `
            <div class="alert alert-danger w-100 m-3" role="alert">
                <strong>حدث خطأ أثناء عرض التبرعات:</strong> ${err.message}
                <pre class="mt-2 text-start" style="font-size: 11px; direction: ltr;">${err.stack}</pre>
                <div class="mt-2"><strong>البيانات المستلمة:</strong></div>
                <pre class="text-start" style="font-size: 11px; direction: ltr; white-space: pre-wrap;">${JSON.stringify(allDonations, null, 2)}</pre>
            </div>
        `;
    }
}

/* =========================
   SHOW DONATION DETAILS MODAL
========================= */
window.showDonationDetails = function(id) {
    const item = allDonations.find(d => d._id === id);
    if (!item) return;

    const modalBody = document.getElementById("donationDetailsBody");
    if (!modalBody) return;

    // Image extraction
    let imageSrc = "";
    if (item.imageUrl && item.imageUrl.length > 0) {
        imageSrc = item.imageUrl[0].secure_url;
    } else if (item.images && item.images.length > 0) {
        imageSrc = item.images[0].secure_url || item.images[0].url || item.images[0];
    } else if (item.image) {
        imageSrc = item.image;
    }

    if (imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('/')) {
        imageSrc = BASE_URL + imageSrc;
    }

    // Format Date
    let dateStr = "غير محدد";
    if (item.createdAt) {
        try {
            dateStr = new Date(item.createdAt).toLocaleDateString('ar-EG', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {}
    }

    // Status translation
    let statusBadge = "";
    const status = (item.status || "pending").toLowerCase();
    if (status === "accepted" || status === "approved") {
        statusBadge = `<span class="badge bg-success fs-6" style="padding:6px 14px;">✓ تم القبول</span>`;
    } else if (status === "rejected" || status === "refused") {
        statusBadge = `<span class="badge bg-danger fs-6" style="padding:6px 14px;">✕ تم الرفض</span>`;
    } else {
        statusBadge = `<span class="badge bg-warning text-dark fs-6" style="padding:6px 14px;">⏳ قيد الانتظار</span>`;
    }

    // Donor info
    const donor = item.donorId || {};
    const donorName = donor.userName || "غير معروف";
    const donorEmail = donor.email || "غير متوفر";
    const donorPhone = donor.phone || "غير متوفر";
    const donorAddress = donor.address || "غير متوفر";

    modalBody.innerHTML = `
        <div class="row g-4" style="direction: rtl; text-align: right;">
            ${imageSrc ? `
            <div class="col-md-5 text-center">
                <div class="shadow-sm rounded-3 overflow-hidden border" style="height: 320px; background: #f9fafb;">
                    <img src="${imageSrc}" alt="صورة التبرع" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </div>
            ` : ''}
            <div class="${imageSrc ? 'col-md-7' : 'col-md-12'}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge bg-teal-light text-teal fw-bold fs-6 px-3 py-2" style="background: rgba(27,75,90,0.1); color: #1b4b5a;">${item.type || "تبرع ملابس"}</span>
                    ${statusBadge}
                </div>
                
                <h5 class="fw-bold mb-3 pb-2 text-teal" style="border-bottom: 2px solid #f3f4f6; color:#1b4b5a;"><i class="fa-solid fa-user me-1"></i> بيانات المتبرع</h5>
                <div class="row g-2 mb-4" style="font-size: 14px; color:#4b5563;">
                    <div class="col-6"><strong>الاسم:</strong> ${donorName}</div>
                    <div class="col-6"><strong>الهاتف:</strong> ${donorPhone}</div>
                    <div class="col-6"><strong>البريد:</strong> ${donorEmail}</div>
                    <div class="col-6"><strong>العنوان:</strong> ${donorAddress}</div>
                </div>

                <h5 class="fw-bold mb-3 pb-2 text-teal" style="border-bottom: 2px solid #f3f4f6; color:#1b4b5a;"><i class="fa-solid fa-box me-1"></i> تفاصيل التبرع</h5>
                <div class="row g-2 mb-4" style="font-size: 14px; color:#4b5563;">
                    <div class="col-4"><strong>المقاس:</strong> ${item.size || "-"}</div>
                    <div class="col-4"><strong>الكمية:</strong> ${item.quantity || 0}</div>
                    <div class="col-4"><strong>الحالة:</strong> ${item.condition || "-"}</div>
                    <div class="col-12 mt-2"><strong>تاريخ التبرع:</strong> ${dateStr}</div>
                </div>

                ${item.description ? `
                <h5 class="fw-bold mb-2 text-teal" style="color:#1b4b5a;"><i class="fa-solid fa-comment-dots me-1"></i> وصف التبرع</h5>
                <div class="p-3 bg-light rounded-3" style="font-size: 13.5px; line-height: 1.6; color: #4b5563; max-height: 120px; overflow-y: auto;">
                    ${item.description}
                </div>
                ` : ''}
            </div>
        </div>
    `;

    const modalEl = document.getElementById("donationDetailsModal");
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
};

/* =========================
   PAGINATION
========================= */
window.changePage = function(direction) {
    currentPage += direction;
    renderDonationsPage();
    const gridEl = document.getElementById("donations-grid");
    if (gridEl) {
        window.scrollTo({ top: gridEl.offsetTop - 120, behavior: 'smooth' });
    }
};

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
                <li class="text-center text-muted p-3">
                    لا توجد إشعارات حالياً
                </li>
            `;

            return;
        }

        notificationList.innerHTML =
            notifications.map(notification => `

                <li class="dropdown-item d-flex justify-content-between align-items-center p-2 mb-1" style="white-space: normal; border-bottom: 1px solid #f3f4f6;">

                    <span style="flex-grow: 1; margin-left: 10px; font-size: 12.5px; text-align: right;">
                        ${
                            notification.message ||
                            notification.title ||
                            "إشعار جديد"
                        }
                    </span>

                    <div class="d-flex gap-1 flex-shrink-0">

                        <button
                            class="btn btn-sm btn-success text-white px-2 py-0"
                            style="font-size: 11px;"
                            onclick="markNotificationAsRead('${notification._id}'); event.stopPropagation();"
                        >
                            ✓
                        </button>

                        <button
                            class="btn btn-sm btn-danger text-white px-2 py-0"
                            style="font-size: 11px;"
                            onclick="deleteNotification('${notification._id}'); event.stopPropagation();"
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

// Expose functions globally to ensure HTML onclick attribute calls resolve correctly
window.loadNotifications = loadNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.deleteNotification = deleteNotification;