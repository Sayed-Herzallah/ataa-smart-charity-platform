// Security & Authentication Check
(function checkSecurity() {
    const localToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {}

    if (!localToken || !user || user.roleType?.toLowerCase() !== "user") {
        window.location.href = "login-register.html?mode=login";
        throw new Error("Unauthorized access");
    }
})();

const BASE_URL = "https://ataa-charity-platform.vercel.app";
const token = localStorage.getItem("token");

// Dashboard States
let activeTab = "stats";
let allDonations = [];
let donationChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar tab switching
    setupTabNavigation();

    // 2. Sidebar Collapsed Toggle
    setupSidebarCollapsible();

    // 3. Live Header Clock
    setupLiveHeaderClock();

    // 4. API Data Fetching
    fetchDashboardData();

    // 5. Action listeners
    setupActionListeners();

    // 6. Quantity Adjusters for form
    setupQuantitySelector();

    // 7. Load Profile Settings
    loadProfileSettings();
});

/* ==========================================================================
   SIDEBAR & ROUTING
   ========================================================================== */
function setupTabNavigation() {
    const navItems = document.querySelectorAll(".ap-sidebar-nav .ap-nav-item[data-tab]");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabName = item.getAttribute("data-tab");
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    activeTab = tabName;

    // Sidebar active item styling
    const navItems = document.querySelectorAll(".ap-sidebar-nav .ap-nav-item");
    navItems.forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Content pane swapping
    const panes = document.querySelectorAll(".ap-tab-pane");
    panes.forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
        }
    });

    // breadcrumb label
    const breadcrumbLabel = document.getElementById("breadcrumb-current-tab");
    if (breadcrumbLabel) {
        const labelsMap = {
            stats: "نظرة عامة",
            "new-donation": "تبرع جديد",
            donations: "تبرعاتي السابقة",
            settings: "الإعدادات",
            chat: "مساعد عطاء"
        };
        breadcrumbLabel.textContent = labelsMap[tabName] || tabName;
    }
}

function setupSidebarCollapsible() {
    const sidebar = document.getElementById("sidebar");
    const collapseBtn = document.getElementById("sidebarCollapseBtn");
    if (!sidebar || !collapseBtn) return;

    const isCollapsed = localStorage.getItem("ap-sidebar-collapsed") === "true";
    if (isCollapsed) {
        sidebar.classList.add("collapsed");
        collapseBtn.querySelector("i").className = "ti ti-layout-sidebar-right-expand";
    }

    collapseBtn.addEventListener("click", () => {
        const collapsed = sidebar.classList.toggle("collapsed");
        localStorage.setItem("ap-sidebar-collapsed", collapsed);
        collapseBtn.querySelector("i").className = collapsed ? 
            "ti ti-layout-sidebar-right-expand" : 
            "ti ti-layout-sidebar-right-collapse";
    });
}

function setupLiveHeaderClock() {
    const clockEl = document.getElementById("header-live-clock");
    if (!clockEl) return;

    function updateClock() {
        clockEl.textContent = new Date().toLocaleTimeString('ar-EG', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

/* ==========================================================================
   FETCH DATA
   ========================================================================== */
async function fetchDashboardData() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.classList.add("fa-spin");

    try {
        const response = await fetch(`${BASE_URL}/donor`, {
            method: "GET",
            headers: { authorization: token }
        });

        if (response.status === 401) {
            showToast("انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول", "error");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => { window.location.href = "login-register.html?mode=login"; }, 1500);
            return;
        }

        const result = await response.json();
        if (response.ok && (result.success || Array.isArray(result))) {
            allDonations = result.donations || result.data || result.Data || (Array.isArray(result) ? result : []);
            
            // Calculate stats
            processStats(allDonations);
            
            // Render Previous Donations
            renderDonationsTable(allDonations);
        } else {
            showToast(result.message || "فشل جلب البيانات من السيرفر", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("حدث عطل أثناء الاتصال بالسيرفر وجلب البيانات", "error");
    } finally {
        if (refreshBtn) refreshBtn.classList.remove("fa-spin");
    }
}

/* ==========================================================================
   PROCESS STATS & PROGRESS & CHARTS
   ========================================================================== */
function processStats(donations) {
    const total = donations.length;
    const pending = donations.filter(d => d.status === "pending").length;
    const accepted = donations.filter(d => d.status === "accepted" || d.status === "approved").length;

    // Update KPI UI
    document.getElementById("kpi-total").textContent = total;
    document.getElementById("kpi-pending").textContent = pending;
    document.getElementById("kpi-accepted").textContent = accepted;
    document.getElementById("my-donations-count").textContent = total;

    // Calculate Trust Bar
    const trustPercent = total > 0 ? Math.round((accepted / total) * 100) : 0;
    animateTrustBar(trustPercent);

    // Sizes badge calculations
    calculateSizes(donations);

    // Categories Chart
    renderCategoriesChart(donations);
}

function animateTrustBar(targetPercent) {
    const bar = document.getElementById("trustBar");
    const text = document.getElementById("trustValueText");
    if (!bar) return;

    let trust = 0;
    bar.style.width = "0%";
    bar.textContent = "0%";
    if (text) text.textContent = "0%";

    if (targetPercent === 0) return;

    let interval = setInterval(() => {
        if (trust >= targetPercent) {
            clearInterval(interval);
        } else {
            trust++;
            bar.style.width = trust + "%";
            bar.textContent = trust + "%";
            if (text) text.textContent = trust + "%";
        }
    }, 15);
}

function calculateSizes(donations) {
    const sizesBox = document.getElementById("sizesBox");
    if (!sizesBox) return;

    sizesBox.innerHTML = "";
    if (donations.length === 0) {
        sizesBox.innerHTML = `<span class="text-muted fs-6">لا توجد تبرعات سابقة لعرض المقاسات</span>`;
        return;
    }

    // Accumulate size frequencies
    const sizeMap = {};
    donations.forEach(d => {
        if (d.size) {
            sizeMap[d.size] = (sizeMap[d.size] || 0) + 1;
        }
    });

    const sizeKeys = Object.keys(sizeMap);
    if (sizeKeys.length === 0) {
        sizesBox.innerHTML = `<span class="text-muted fs-6">لا توجد مقاسات محددة بعد</span>`;
        return;
    }

    sizeKeys.forEach(size => {
        const count = sizeMap[size];
        const span = document.createElement("span");
        span.className = "badge bg-light text-dark border p-2 m-1";
        span.innerHTML = `<strong>${size}</strong> (${count} تبرع)`;
        sizesBox.appendChild(span);
    });
}

function renderCategoriesChart(donations) {
    const canvas = document.getElementById("donationChart");
    if (!canvas) return;

    if (donationChartInstance) {
        donationChartInstance.destroy();
    }

    const categories = { "رجال": 0, "حريمي": 0, "أطفال": 0 };
    donations.forEach(d => {
        if (d.type && categories[d.type] !== undefined) {
            categories[d.type] += d.quantity || 1;
        } else if (d.type) {
            // fallback if type is "man", "woman", "child"
            if (d.type === "man" || d.type === "men") categories["رجال"] += d.quantity || 1;
            else if (d.type === "woman" || d.type === "women") categories["حريمي"] += d.quantity || 1;
            else if (d.type === "child" || d.type === "kids") categories["أطفال"] += d.quantity || 1;
        }
    });

    const isDark = !document.body.classList.contains("ap-light-theme");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#9ca3af" : "#6b7280";

    donationChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'عدد قطع الملابس المتبرع بها',
                data: Object.values(categories),
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Tajawal', size: 11 } }
                },
                y: {
                    grid: { color: gridColor },
                    border: { dash: [3, 3] },
                    ticks: { color: textColor, font: { family: 'Tajawal', size: 10 }, stepSize: 1 }
                }
            }
        }
    });
}

/* ==========================================================================
   DONATIONS HISTORY TABLE
   ========================================================================== */
function renderDonationsTable(donationsList) {
    const tableBody = document.getElementById("userdonationsTable");
    const emptyState = document.getElementById("donations-empty-state");
    
    if (!tableBody) return;

    if (donationsList.length === 0) {
        tableBody.innerHTML = "";
        emptyState?.classList.remove("d-none");
        return;
    }

    emptyState?.classList.add("d-none");
    tableBody.innerHTML = donationsList.map(item => {
        let statusBadge = "";
        const status = (item.status || "pending").toLowerCase();

        if (status === "accepted" || status === "approved") {
            statusBadge = `<span class="ap-badge text-success"><span class="ap-badge-dot" style="background: var(--green);"></span>مقبول</span>`;
        } else if (status === "rejected" || status === "refused") {
            statusBadge = `<span class="ap-badge text-danger"><span class="ap-badge-dot" style="background: var(--red);"></span>مرفوض</span>`;
        } else {
            statusBadge = `<span class="ap-badge text-warning"><span class="ap-badge-dot" style="background: var(--amber);"></span>معلق</span>`;
        }

        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : "-";
        const quantity = item.quantity || 0;
        const size = item.size || "-";
        const type = item.type || "ملابس";

        return `
            <tr onclick="showDonationDetails('${item._id}')" style="cursor: pointer;" class="ap-table-row-clickable">
                <td>${dateStr}</td>
                <td>${statusBadge}</td>
                <td>${quantity} قطع</td>
                <td>${size}</td>
                <td style="font-weight:700; color: var(--t1);">${type}</td>
                <td>
                    <button class="ap-eye-btn" onclick="showDonationDetails('${item._id}'); event.stopPropagation();"><i class="ti ti-eye"></i></button>
                </td>
            </tr>
        `;
    }).join("");
}

/* ==========================================================================
   DONATION DETAILS MODAL
   ========================================================================== */
window.showDonationDetails = function(id) {
    const item = allDonations.find(d => d._id === id);
    if (!item) return;

    const modalBody = document.getElementById("donationDetailsBody");
    if (!modalBody) return;

    let imageSrc = "";
    if (item.imageUrl && item.imageUrl.length > 0) {
        imageSrc = item.imageUrl[0].secure_url;
    } else if (item.images && item.images.length > 0) {
        imageSrc = item.images[0].secure_url || item.images[0].url || item.images[0];
    } else if (item.image) {
        imageSrc = item.image.secure_url || item.image;
    }

    if (imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('/')) {
        imageSrc = BASE_URL + imageSrc;
    }

    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : "غير محدد";

    const status = (item.status || "pending").toLowerCase();
    let statusHtml = "";
    if (status === "accepted" || status === "approved") {
        statusHtml = `<span class="badge text-success px-3 py-2 rounded-pill fs-6" style="background: var(--green-dim); border: 1px solid var(--green);"><i class="fa-solid fa-circle-check me-1"></i> تم قبول التبرع</span>`;
    } else if (status === "rejected" || status === "refused") {
        statusHtml = `<span class="badge text-danger px-3 py-2 rounded-pill fs-6" style="background: var(--red-dim); border: 1px solid var(--red);"><i class="fa-solid fa-circle-xmark me-1"></i> تم رفض التبرع</span>`;
    } else {
        statusHtml = `<span class="badge text-warning px-3 py-2 rounded-pill fs-6" style="background: var(--amber-dim); border: 1px solid var(--amber);"><i class="fa-solid fa-circle-minus me-1"></i> قيد المراجعة</span>`;
    }

    modalBody.innerHTML = `
        <div class="row g-4" style="direction: rtl; text-align: right; color: var(--t2);">
            <!-- Image left -->
            <div class="col-md-5">
                ${imageSrc ? `
                    <div class="shadow-sm rounded-4 overflow-hidden border" style="height: 330px; background: var(--surface2); border-color: var(--border); position: relative; cursor: zoom-in;" onclick="zoomImage('${imageSrc}')">
                        <img src="${imageSrc}" alt="صورة التبرع" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(transparent, rgba(0,0,0,0.6)); padding: 12px; color: white; font-size: 11px; text-align: center;">
                            <i class="ti ti-zoom-in me-1"></i> اضغط لتكبير الصورة
                        </div>
                    </div>
                ` : `
                    <div class="shadow-sm rounded-4 border d-flex flex-column align-items-center justify-content-center" style="height: 330px; background: var(--surface2); border: 1px dashed var(--border); color: var(--t4); padding: 20px;">
                        <i class="ti ti-shirt mb-3" style="font-size: 40px; color: var(--teal);"></i>
                        <h6 class="fw-bold mb-1" style="color: var(--t1);">لا توجد صورة مرفقة</h6>
                        <p class="text-center" style="font-size: 11px; max-width: 180px; margin: 0;">لم يتم إرفاق صورة لهذا التبرع.</p>
                    </div>
                `}
            </div>

            <!-- Details right -->
            <div class="col-md-7 d-flex flex-column justify-content-between">
                <div>
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <span class="fs-5 fw-bold text-teal" style="color: var(--teal); font-weight: 800;">
                            <i class="ti ti-tag me-1"></i> ${item.type || "تبرع ملابس"}
                        </span>
                        <div>${statusHtml}</div>
                    </div>

                    <!-- Specs -->
                    <div class="row g-2 mb-3">
                        <div class="col-4">
                            <div class="p-2 text-center rounded-3 border" style="background: var(--surface2); border-color: var(--border);">
                                <div class="text-muted mb-1" style="font-size: 10px;">📏 المقاس</div>
                                <div class="fw-bold" style="font-size: 13px; color: var(--t1);">${item.size || "-"}</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-2 text-center rounded-3 border" style="background: var(--surface2); border-color: var(--border);">
                                <div class="text-muted mb-1" style="font-size: 10px;">📦 الكمية</div>
                                <div class="fw-bold" style="font-size: 13px; color: var(--t1);">${item.quantity || 0} قطع</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-2 text-center rounded-3 border" style="background: var(--surface2); border-color: var(--border);">
                                <div class="text-muted mb-1" style="font-size: 10px;">✨ الحالة</div>
                                <div class="fw-bold" style="font-size: 13px; color: var(--t1);">${item.condition || "-"}</div>
                            </div>
                        </div>
                    </div>

                    <div style="font-size: 12px; color: var(--t4);" class="mb-3">
                        <i class="ti ti-calendar-clock"></i> <strong>تاريخ التقديم:</strong> ${dateStr}
                    </div>

                    ${item.description ? `
                        <div class="p-2 mb-3 rounded border-start border-3" style="background: var(--surface2); border-left-color: var(--teal) !important; font-size: 12.5px; color: var(--t3);">
                            <strong>الوصف المرفق:</strong>
                            <p class="m-0 mt-1" style="font-style: italic;">"${item.description}"</p>
                        </div>
                    ` : ''}
                    
                    ${item.rejectionReason ? `
                        <div class="p-2 mb-3 rounded border-start border-3" style="background: var(--red-dim); border-left-color: var(--red) !important; font-size: 12.5px; color: var(--red);">
                            <strong>سبب رفض الاستلام:</strong>
                            <p class="m-0 mt-1">${item.rejectionReason}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="d-flex justify-content-end gap-2 pt-2 border-top" style="border-top-color: var(--border) !important;">
                    <button class="btn btn-sm btn-secondary text-white px-4 py-2" style="border-radius: 6px;" data-bs-dismiss="modal">إغلاق</button>
                </div>
            </div>
        </div>
    `;

    const modalEl = document.getElementById("donationDetailsModal");
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
};

window.zoomImage = function(src) {
    const zoomedImg = document.getElementById("zoomedImageSrc");
    if (zoomedImg) {
        zoomedImg.src = src;
        const zoomModalEl = document.getElementById("imageZoomModal");
        if (zoomModalEl) {
            const zoomModal = new bootstrap.Modal(zoomModalEl);
            zoomModal.show();
        }
    }
};

/* ==========================================================================
   NEW DONATION SUBMISSION FORM
   ========================================================================== */
function setupQuantitySelector() {
    const qtyInput = document.getElementById("quantity");
    const plusBtn = document.getElementById("qty-plus");
    const minusBtn = document.getElementById("qty-minus");

    if (!qtyInput || !plusBtn || !minusBtn) return;

    plusBtn.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        qtyInput.value = val + 1;
    });

    minusBtn.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) {
            qtyInput.value = val - 1;
        }
    });
}

document.getElementById("donationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const categorySelect = document.getElementById("category");
    const sizeSelect = document.getElementById("size");
    const qtyInput = document.getElementById("quantity");
    const imageInput = document.getElementById("image");
    const descriptionText = document.getElementById("description");
    const conditionRadio = document.querySelector("input[name='condition']:checked");

    if (!categorySelect.value) {
        showToast("يرجى اختيار نوع الملابس", "warning");
        return;
    }
    if (!sizeSelect.value) {
        showToast("يرجى اختيار المقاس", "warning");
        return;
    }

    const files = imageInput.files;
    if (files.length === 0) {
        showToast("يرجى إرفاق صورة حقيقية للملابس قبل الإرسال", "warning");
        return;
    }

    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تقديم التبرع...`;

    try {
        const formData = new FormData();
        formData.append("type", categorySelect.value);
        formData.append("size", sizeSelect.value);
        formData.append("quantity", qtyInput.value);
        formData.append("condition", conditionRadio.value);
        formData.append("description", descriptionText.value.trim() || "تبرع ملابس");
        formData.append("images", files[0]);

        const response = await fetch(`${BASE_URL}/donor`, {
            method: "POST",
            headers: { authorization: token },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showToast("تم إرسال التبرع بنجاح 🎉", "success");
            
            // Reset form
            e.target.reset();
            qtyInput.value = "1";

            // Refresh lists
            await fetchDashboardData();

            // Switch tab to list
            switchTab("donations");
        } else {
            showToast(result.message || "فشل إرسال التبرع", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("حدث عطل أثناء الاتصال بالسيرفر", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="ti ti-send"></i> <span>تقديم التبرع الآن</span>`;
    }
});

/* ==========================================================================
   SETTINGS & NOTIFICATIONS & REPORT
   ========================================================================= */
function setupActionListeners() {
    document.getElementById("refreshBtn")?.addEventListener("click", fetchDashboardData);

    // Theme toggle
    document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("ap-light-theme");
        localStorage.setItem("ap-theme", isLight ? "light" : "dark");
        document.getElementById("themeToggleBtn").querySelector("i").className = isLight ? "ti ti-sun" : "ti ti-moon";
        
        // Re-render chart to adjust colors
        processStats(allDonations);
    });

    const savedTheme = localStorage.getItem("ap-theme");
    if (savedTheme === "light") {
        document.body.classList.add("ap-light-theme");
        document.getElementById("themeToggleBtn").querySelector("i").className = "ti ti-sun";
    }

    // Report problem
    document.getElementById("reportBtn")?.addEventListener("click", () => {
        const modalEl = document.getElementById("reportProblemModal");
        if (modalEl) {
            document.getElementById("reportProblemText").value = "";
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    });

    document.getElementById("submitProblemReportBtn")?.addEventListener("click", submitProblemReport);
}

async function submitProblemReport() {
    const text = document.getElementById("reportProblemText").value.trim();
    if (!text || text.length < 10) {
        showToast("يرجى كتابة وصف لا يقل عن 10 أحرف للمشكلة", "warning");
        return;
    }

    const btn = document.getElementById("submitProblemReportBtn");
    btn.disabled = true;
    btn.textContent = "جاري الإرسال...";

    try {
        const response = await fetch(`${BASE_URL}/report/addReport`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ description: text })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("تم إرسال بلاغك للإدارة بنجاح", "success");
            const modalEl = document.getElementById("reportProblemModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        } else {
            showToast(data.message || "فشل إرسال البلاغ", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("حدث عطل أثناء الاتصال بالخادم", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "إرسال البلاغ";
    }
}

function switchSettingsTab(subTab) {
    const profileBtn = document.getElementById("settings-tab-profile-btn");
    const passBtn = document.getElementById("settings-tab-password-btn");
    const mobProfileBtn = document.getElementById("mobile-settings-tab-profile-btn");
    const mobPassBtn = document.getElementById("mobile-settings-tab-password-btn");

    const profileCard = document.getElementById("settings-card-profile");
    const passCard = document.getElementById("settings-card-password");

    if (subTab === "profile") {
        profileBtn?.classList.add("active");
        mobProfileBtn?.classList.add("active");
        passBtn?.classList.remove("active");
        mobPassBtn?.classList.remove("active");

        profileCard?.classList.remove("d-none");
        passCard?.classList.add("d-none");
    } else {
        passBtn?.classList.add("active");
        mobPassBtn?.classList.add("active");
        profileBtn?.classList.remove("active");
        mobProfileBtn?.classList.remove("active");

        passCard?.classList.remove("d-none");
        profileCard?.classList.add("d-none");
    }
    switchTab("settings");
}
window.switchSettingsTab = switchSettingsTab;

async function loadProfileSettings() {
    try {
        const response = await fetch(`${BASE_URL}/users/profile`, {
            method: "GET",
            headers: { authorization: token }
        });

        if (!response.ok) return;

        const data = await response.json();
        const profile = data.finder || data;

        const displayName = profile.userName || "المتبرع الكريم";
        document.getElementById("user-display-name").textContent = displayName;
        document.getElementById("user-avatar-initial").textContent = displayName[0].toUpperCase();

        const nameInput = document.getElementById("settingUserName");
        const phoneInput = document.getElementById("settingPhone");
        const addressInput = document.getElementById("settingAddress");

        if (nameInput) nameInput.value = profile.userName || "";
        if (phoneInput) phoneInput.value = profile.phone || "";
        if (addressInput) addressInput.value = profile.address || "";

    } catch (e) {
        console.error(e);
    }
}

// Update Profile
document.getElementById("profileSettingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("settingUserName").value.trim();
    const phone = document.getElementById("settingPhone").value.trim();
    const address = document.getElementById("settingAddress").value.trim();

    document.getElementById("error-userName").classList.add("d-none");
    document.getElementById("error-phone").classList.add("d-none");
    document.getElementById("error-address").classList.add("d-none");

    let hasError = false;

    // Validation
    const nameRegex = /^[a-zA-Z\u0621-\u064A][^#&<>"~;$^%{}]{2,29}$/;
    const phoneRegex = /^(002|\+2)?01[0125][0-9]{8}$/;

    if (!nameRegex.test(name)) {
        const err = document.getElementById("error-userName");
        err.textContent = "الاسم غير صالح (يجب أن يبدأ بحرف، بدون رموز خاصة، بين 3 إلى 30 حرف)";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (!phoneRegex.test(phone)) {
        const err = document.getElementById("error-phone");
        err.textContent = "رقم الهاتف غير صالح، يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (!address || address.length < 5) {
        const err = document.getElementById("error-address");
        err.textContent = "العنوان قصير جداً، يرجى كتابته بالتفصيل (5 أحرف على الأقل)";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (hasError) return;

    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...`;

    try {
        const response = await fetch(`${BASE_URL}/users/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: token
            },
            body: JSON.stringify({
                userName: name,
                phone: phone,
                address: address
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("تم تحديث بياناتك الشخصية بنجاح", "success");
            loadProfileSettings();
        } else {
            showToast(data.message || "فشل تحديث البيانات", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("حدث عطل أثناء الاتصال بالخادم", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="ti ti-device-floppy"></i> <span>حفظ التعديلات</span>`;
    }
});

// Change Password
document.getElementById("passwordSettingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("settingOldPassword").value;
    const newPassword = document.getElementById("settingNewPassword").value;
    const confirmPassword = document.getElementById("settingConfirmPassword").value;

    document.getElementById("error-oldPassword").classList.add("d-none");
    document.getElementById("error-newPassword").classList.add("d-none");
    document.getElementById("error-confirmPassword").classList.add("d-none");

    let hasError = false;

    // Validation
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

    if (!oldPassword) {
        const err = document.getElementById("error-oldPassword");
        err.textContent = "يرجى كتابة كلمة المرور الحالية";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (!passwordRegex.test(newPassword)) {
        const err = document.getElementById("error-newPassword");
        err.textContent = "كلمة المرور الجديدة ضعيفة (يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وحرف صغير ورقم)";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (newPassword !== confirmPassword) {
        const err = document.getElementById("error-confirmPassword");
        err.textContent = "تأكيد كلمة المرور الجديدة لا يطابق ما كتبته بالأعلى";
        err.classList.remove("d-none");
        hasError = true;
    }

    if (hasError) return;

    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التحديث...`;

    try {
        const response = await fetch(`${BASE_URL}/users/changePassword`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: token
            },
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("تم تغيير كلمة المرور بنجاح", "success");
            e.target.reset();
        } else {
            showToast(data.message || "فشل تغيير كلمة المرور", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("حدث عطل أثناء تغيير كلمة المرور", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="ti ti-shield-check"></i> <span>تحديث كلمة المرور</span>`;
    }
});