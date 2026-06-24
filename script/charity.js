// Security and Authorisation Check
(function checkSecurity() {
    const localToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {}

    if (!localToken || !user || user.roleType?.toLowerCase() !== "charity") {
        window.location.href = "login-register.html?mode=login";
        throw new Error("Unauthorized access");
    }
})();

const BASE_URL = "https://ataa-charity-platform.vercel.app";
const token = localStorage.getItem("token");

// Dashboard States
let activeTab = "stats";
let allDonations = [];
let filteredDonations = [];
let currentPage = 1;
const limit = 6;
let donView = "cards"; // "cards" or "table"
let lineChartInstance = null;
let donutChartInstance = null;

// Cron Automation States
let schedulerTimer = null;
let cronLogs = [];

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Tab Toggling
    setupTabNavigation();

    // 2. Sidebar Collapsible handler
    setupSidebarCollapsible();

    // 3. Live Header Clock
    setupLiveHeaderClock();

    // 4. API Data Fetching
    fetchDashboardData();

    // 5. Setup Action Click Listeners
    setupActionListeners();

    // 6. Init Automation Panel
    initAutomationScheduler();

    // 7. Load Profile Settings
    loadProfileSettings();
});

/* ==========================================================================
   SIDEBAR & TABS ROUTING
   ========================================================================== */
function setupTabNavigation() {
    const navItems = document.querySelectorAll(".ap-sidebar-nav .ap-nav-item[data-tab]");
    const breadcrumbLabel = document.getElementById("breadcrumb-current-tab");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabName = item.getAttribute("data-tab");
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    activeTab = tabName;

    // 1. Toggle Sidebar Active State
    const navItems = document.querySelectorAll(".ap-sidebar-nav .ap-nav-item");
    navItems.forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // 2. Toggle Tab Pane Visibility
    const panes = document.querySelectorAll(".ap-tab-pane");
    panes.forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
        }
    });

    // 3. Update Breadcrumb
    const breadcrumbLabel = document.getElementById("breadcrumb-current-tab");
    if (breadcrumbLabel) {
        const labelsMap = {
            stats: "نظرة عامة",
            donations: "كل التبرعات",
            automation: "التشغيل التلقائي",
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

    // Restore state from LocalStorage
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
   FETCH DASHBOARD DATA
   ========================================================================== */
async function fetchDashboardData() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.classList.add("fa-spin");
    }

    try {
        await Promise.all([
            getStats(),
            fetchDonations(),
            loadNotifications()
        ]);
    } catch (e) {
        console.error("Dashboard Loading Error:", e);
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove("fa-spin");
        }
    }
}

/* ==========================================================================
   STATS CARD & CHARTS
   ========================================================================== */
async function getStats() {
    try {
        const response = await fetch(`${BASE_URL}/dashboard/stats`, {
            method: "GET",
            headers: { Authorization: token }
        });

        if (!response.ok) throw new Error("Stats fetch failed");

        const data = await response.json();
        const stats = data.stats || data;

        // Extract Stats counts
        const total = stats.Total_Donations !== undefined ? stats.Total_Donations : (stats.totalDonations || stats.donations || 0);
        const pending = stats.Pending_Donations !== undefined ? stats.Pending_Donations : (stats.totalRequests || stats.requests || 0);
        const accepted = stats.Accepted_Donations !== undefined ? stats.Accepted_Donations : (stats.activeVolunteers || stats.volunteers || 0);
        const rejected = stats.Rejected_Donations !== undefined ? stats.Rejected_Donations : (total - pending - accepted);

        // Update UI counters
        document.getElementById("kpi-total").textContent = total;
        document.getElementById("kpi-pending").textContent = pending;
        document.getElementById("kpi-accepted").textContent = accepted;

        document.getElementById("detail-total-pending").textContent = pending;
        document.getElementById("detail-total-accepted").textContent = accepted;
        document.getElementById("detail-total-rejected").textContent = rejected;

        // Percentages
        const pendingPct = total ? Math.round((pending / total) * 100) : 0;
        const acceptedPct = total ? Math.round((accepted / total) * 100) : 0;
        document.getElementById("detail-pending-percent").textContent = `${pendingPct}%`;
        document.getElementById("detail-accepted-percent").textContent = `${acceptedPct}%`;
        document.getElementById("detail-pending-urgent").textContent = pending;

        // Render Donut Chart
        renderDonutChart(pending, accepted, rejected);

    } catch (error) {
        console.error("Stats Error:", error);
    }
}

function toggleKpiExpand(btn) {
    const card = btn.closest(".ap-kpi-card");
    const container = card.querySelector(".ap-kpi-expand");
    const isExpanded = btn.classList.toggle("expanded");
    
    if (isExpanded) {
        container.classList.add("open");
        btn.querySelector("span").textContent = "إخفاء التفاصيل";
    } else {
        container.classList.remove("open");
        btn.querySelector("span").textContent = "عرض التفاصيل";
    }
}
window.toggleKpiExpand = toggleKpiExpand;

function renderDonutChart(pending, accepted, rejected) {
    const canvas = document.getElementById("donutChart");
    if (!canvas) return;

    if (donutChartInstance) {
        donutChartInstance.destroy();
    }

    const isDark = !document.body.classList.contains("ap-light-theme");
    const textColor = isDark ? "#cbd5e1" : "#374151";

    const total = pending + accepted + rejected;
    if (total === 0) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("chart-legends-container").innerHTML = `<span class="text-muted text-center py-4">لا توجد بيانات كافية للرسم البياني</span>`;
        return;
    }

    donutChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['معلق', 'مقبول', 'مرفوض'],
            datasets: [{
                data: [pending, accepted, rejected],
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            cutout: '70%'
        }
    });

    // Populate Custom Legend Labels
    const container = document.getElementById("chart-legends-container");
    container.innerHTML = `
        <div class="d-flex align-items-center gap-1" style="font-size: 11.5px; color: ${textColor}; font-weight: 600;">
            <span style="width:8px; height:8px; border-radius:50%; background:#f59e0b; display:inline-block;"></span>
            <span>معلق (${pending})</span>
        </div>
        <div class="d-flex align-items-center gap-1" style="font-size: 11.5px; color: ${textColor}; font-weight: 600;">
            <span style="width:8px; height:8px; border-radius:50%; background:#10b981; display:inline-block;"></span>
            <span>مقبول (${accepted})</span>
        </div>
        <div class="d-flex align-items-center gap-1" style="font-size: 11.5px; color: ${textColor}; font-weight: 600;">
            <span style="width:8px; height:8px; border-radius:50%; background:#ef4444; display:inline-block;"></span>
            <span>مرفوض (${rejected})</span>
        </div>
    `;
}

function renderLineChart(timelineData) {
    const canvas = document.getElementById("lineChart");
    if (!canvas) return;

    if (lineChartInstance) {
        lineChartInstance.destroy();
    }

    const isDark = !document.body.classList.contains("ap-light-theme");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#9ca3af" : "#6b7280";

    const labels = timelineData.map(d => d.month);
    const counts = timelineData.map(d => d.count);

    lineChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد التبرعات',
                data: counts,
                borderColor: '#10b981',
                borderWidth: 3,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#10b981',
                pointBorderWidth: 0,
                pointRadius: 4,
                pointHoverRadius: 6
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
                    ticks: { color: textColor, font: { family: 'Tajawal', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    border: { dash: [3, 3] },
                    ticks: { color: textColor, font: { family: 'Tajawal', size: 10 }, stepSize: 1 }
                }
            }
        }
    });

    // Update Pro Header stats
    const totalCurrentTimeline = counts.reduce((a, b) => a + b, 0);
    document.getElementById("chart-total-donations-num").textContent = totalCurrentTimeline;
}

/* ==========================================================================
   DONATIONS LOGIC (FILTERS, TOGGLES, PAGINATION)
   ========================================================================== */
async function fetchDonations() {
    try {
        const response = await fetch(`${BASE_URL}/dashboard/donations`, {
            method: "GET",
            headers: { Authorization: token }
        });

        if (!response.ok) throw new Error("Donations fetch failed");

        const data = await response.json();
        allDonations = data.donations || data.data || data.Data || (Array.isArray(data) ? data : []);
        
        // Setup line chart timeline based on fetched donations
        processDonationsTimeline(allDonations);

        // Update badge in sidebar
        const pendingCount = allDonations.filter(d => d.status === "pending").length;
        const badge = document.getElementById("donations-nav-badge");
        if (badge) {
            badge.textContent = pendingCount;
            if (pendingCount > 0) {
                badge.classList.remove("d-none");
            } else {
                badge.classList.add("d-none");
            }
        }

        applyFilters();

    } catch (error) {
        console.error("Donations Error:", error);
        showToast("فشل جلب قائمة التبرعات من السيرفر", "error");
    }
}

function processDonationsTimeline(donations) {
    const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const curDate = new Date();
    const curYear = curDate.getFullYear();
    document.getElementById("current-year-display").textContent = curYear;

    const timelineData = [];
    // Last 6 months timeline
    for (let i = 5; i >= 0; i--) {
        const d = new Date(curYear, curDate.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const label = MONTHS_AR[m];

        const count = donations.filter(don => {
            if (!don.createdAt) return false;
            const donDate = new Date(don.createdAt);
            return donDate.getFullYear() === y && donDate.getMonth() === m;
        }).length;

        timelineData.push({ month: label, count });
    }

    renderLineChart(timelineData);
}

function applyFilters() {
    const searchQ = document.getElementById("donationSearchInput").value.trim().toLowerCase();
    const statusVal = document.getElementById("statusFilterSelect").value;
    const dateFrom = document.getElementById("dateFilterFrom").value;
    const dateTo = document.getElementById("dateFilterTo").value;
    const sortOrder = document.getElementById("sortOrderSelect").value;

    // Filter
    filteredDonations = allDonations.filter(d => {
        // Status filter
        if (statusVal !== "all" && d.status !== statusVal) return false;
        
        // Date filter
        if (dateFrom && d.createdAt && new Date(d.createdAt) < new Date(dateFrom)) return false;
        if (dateTo && d.createdAt && new Date(d.createdAt) > new Date(dateTo + "T23:59:59")) return false;

        // Search filter
        if (searchQ) {
            const donorName = d.donorId?.userName || d.donorId?.name || "";
            const isMatch = d.type?.toLowerCase().includes(searchQ) || 
                            donorName.toLowerCase().includes(searchQ) ||
                            d._id?.toLowerCase().includes(searchQ);
            if (!isMatch) return false;
        }

        return true;
    });

    // Sort
    filteredDonations.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    // Reset filters visibility
    const hasActiveFilters = searchQ || statusVal !== "all" || dateFrom || dateTo || sortOrder !== "newest";
    document.getElementById("resetFiltersBtn").classList.toggle("d-none", !hasActiveFilters);

    currentPage = 1;
    renderDonationsPage();
}

function renderDonationsPage() {
    const grid = document.getElementById("donations-cards-grid");
    const tableWrap = document.getElementById("donations-table-wrap");
    const emptyState = document.getElementById("donations-empty-state");
    
    document.getElementById("filtered-donations-count").textContent = filteredDonations.length;

    if (filteredDonations.length === 0) {
        grid.classList.add("d-none");
        tableWrap.classList.add("d-none");
        emptyState.classList.remove("d-none");

        document.getElementById("prevPageBtn").disabled = true;
        document.getElementById("nextPageBtn").disabled = true;
        document.getElementById("pageIndicator").textContent = "الصفحة 1 من 1";
        return;
    }

    emptyState.classList.add("d-none");

    // Client-side pagination
    const totalPages = Math.ceil(filteredDonations.length / limit) || 1;
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filteredDonations.slice(startIndex, endIndex);

    if (donView === "cards") {
        grid.classList.remove("d-none");
        tableWrap.classList.add("d-none");
        renderCardsView(paginated);
    } else {
        grid.classList.add("d-none");
        tableWrap.classList.remove("d-none");
        renderTableView(paginated);
    }

    // Pagination controls
    document.getElementById("prevPageBtn").disabled = currentPage === 1;
    document.getElementById("nextPageBtn").disabled = endIndex >= filteredDonations.length;
    document.getElementById("pageIndicator").textContent = `الصفحة ${currentPage} من ${totalPages}`;
}

function renderCardsView(donationsList) {
    const grid = document.getElementById("donations-cards-grid");
    
    grid.innerHTML = donationsList.map(item => {
        const status = (item.status || "pending").toLowerCase();
        let statusBadge = "";
        let actionsHtml = "";

        if (status === "accepted" || status === "approved") {
            statusBadge = `<span class="ap-badge text-success" style="background: var(--green-dim); color: var(--green);"><span class="ap-badge-dot" style="background: var(--green);"></span>مقبول</span>`;
            actionsHtml = `<span class="text-success fw-bold" style="font-size:12.5px;"><i class="ti ti-check me-1"></i>تم القبول بنجاح</span>`;
        } else if (status === "rejected" || status === "refused") {
            statusBadge = `<span class="ap-badge text-danger" style="background: var(--red-dim); color: var(--red);"><span class="ap-badge-dot" style="background: var(--red);"></span>مرفوض</span>`;
            actionsHtml = `<span class="text-danger fw-bold" style="font-size:12.5px;"><i class="ti ti-x me-1"></i>تم رفض الطلب</span>`;
        } else {
            statusBadge = `<span class="ap-badge text-warning" style="background: var(--amber-dim); color: var(--amber);"><span class="ap-badge-dot" style="background: var(--amber);"></span>معلق</span>`;
            actionsHtml = `
                <button class="ap-action-btn approve" onclick="handleCardAction('${item._id}', 'accepted', this); event.stopPropagation();">
                    <i class="ti ti-check"></i>قبول
                </button>
                <button class="ap-action-btn reject" onclick="handleCardAction('${item._id}', 'rejected', this); event.stopPropagation();">
                    <i class="ti ti-x"></i>رفض
                </button>
            `;
        }

        // Image extractor
        let imageSrc = extractImageUrl(item);
        let imageHtml = imageSrc ? `
            <div class="donation-card-img-wrap" style="height: 140px; overflow: hidden; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--border);">
                <img src="${imageSrc}" alt="صورة التبرع" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
            </div>
        ` : `
            <div class="d-flex align-items-center justify-content-center border rounded-3 mb-2 text-muted" style="height: 60px; background: var(--surface2); border-color: var(--border);">
                <i class="ti ti-package" style="font-size: 20px;"></i>
            </div>
        `;

        const donorName = item.donorId?.userName || item.donorId?.name || "متبرع كريم";
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : "";

        return `
            <div class="ap-entity-card" onclick="showDonationDetails('${item._id}')" style="cursor: pointer;">
                ${imageHtml}
                <div class="ap-entity-card-header">
                    <div style="flex:1; min-width:0;">
                        <div class="ap-entity-name">${item.type || "ملابس"}</div>
                        <div class="ap-entity-email">${donorName}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div style="flex: 1; margin: 4px 0 10px 0;">
                    <div class="d-flex flex-wrap gap-2 text-muted" style="font-size: 11px;">
                        <span><strong>المقاس:</strong> ${item.size || "-"}</span>
                        <span><strong>الكمية:</strong> ${item.quantity || 0}</span>
                        <span><strong>الحالة:</strong> ${item.condition || "-"}</span>
                    </div>
                </div>
                <div class="ap-entity-date">
                    <i class="ti ti-calendar"></i>${dateStr}
                </div>
                <div class="ap-entity-actions" onclick="event.stopPropagation();">
                    ${actionsHtml}
                    <button class="ap-card-eye-btn" onclick="showDonationDetails('${item._id}'); event.stopPropagation();" title="تفاصيل كاملة">
                        <i class="ti ti-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function renderTableView(donationsList) {
    const tbody = document.getElementById("donations-table-body");
    
    tbody.innerHTML = donationsList.map(item => {
        const status = (item.status || "pending").toLowerCase();
        let statusBadge = "";
        let actionsHtml = "";

        if (status === "accepted" || status === "approved") {
            statusBadge = `<span class="ap-badge text-success" style="background: var(--green-dim); color: var(--green);"><span class="ap-badge-dot" style="background: var(--green);"></span>مقبول</span>`;
            actionsHtml = `<span class="text-success fw-bold" style="font-size:12px;"><i class="ti ti-check me-1"></i>تم القبول</span>`;
        } else if (status === "rejected" || status === "refused") {
            statusBadge = `<span class="ap-badge text-danger" style="background: var(--red-dim); color: var(--red);"><span class="ap-badge-dot" style="background: var(--red);"></span>مرفوض</span>`;
            actionsHtml = `<span class="text-danger fw-bold" style="font-size:12px;"><i class="ti ti-x me-1"></i>تم الرفض</span>`;
        } else {
            statusBadge = `<span class="ap-badge text-warning" style="background: var(--amber-dim); color: var(--amber);"><span class="ap-badge-dot" style="background: var(--amber);"></span>معلق</span>`;
            actionsHtml = `
                <button class="btn btn-sm btn-success text-white px-2 py-0" style="font-size: 11px; border:none;" onclick="handleCardAction('${item._id}', 'accepted', this); event.stopPropagation();" title="قبول"><i class="ti ti-check"></i></button>
                <button class="btn btn-sm btn-danger text-white px-2 py-0" style="font-size: 11px; border:none;" onclick="handleCardAction('${item._id}', 'rejected', this); event.stopPropagation();" title="رفض"><i class="ti ti-x"></i></button>
            `;
        }

        const donorName = item.donorId?.userName || item.donorId?.name || "متبرع كريم";
        const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : "";

        return `
            <tr onclick="showDonationDetails('${item._id}')" class="ap-table-row-clickable">
                <td style="font-weight: 700; color: var(--t1);">${item.type}</td>
                <td>${donorName}</td>
                <td>${item.quantity || 0} قطع</td>
                <td>${item.size || "-"}</td>
                <td>${statusBadge}</td>
                <td>${dateStr}</td>
                <td onclick="event.stopPropagation();">
                    <div class="d-flex align-items-center gap-1">
                        ${actionsHtml}
                        <button class="ap-eye-btn" onclick="showDonationDetails('${item._id}'); event.stopPropagation();"><i class="ti ti-eye"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function extractImageUrl(item) {
    let imageSrc = "";
    if (item.imageUrl && item.imageUrl.length > 0) {
        imageSrc = item.imageUrl[0].secure_url;
    } else if (item.images && item.images.length > 0) {
        imageSrc = item.images[0].secure_url || item.images[0].url || item.images[0];
    } else if (item.image) {
        imageSrc = item.image.secure_url || item.image;
    }
    
    if (imageSrc && typeof imageSrc === 'string') {
        if (imageSrc.startsWith('/')) {
            imageSrc = BASE_URL + imageSrc;
        }
        return imageSrc;
    }
    return null;
}

/* ==========================================================================
   ACCEPT / REJECT OPERATIONS
   ========================================================================== */
window.handleCardAction = function(id, actionStatus, btn) {
    if (actionStatus === "accepted") {
        updateDonationStatus(id, "accepted", btn);
    } else {
        promptRejectionReason(id, btn);
    }
};

let activeRejectionId = null;
let activeRejectionBtn = null;

function promptRejectionReason(id, btn) {
    activeRejectionId = id;
    activeRejectionBtn = btn;

    const modalEl = document.getElementById("rejectionReasonModal");
    if (modalEl) {
        const select = document.getElementById("rejectionReasonSelect");
        const textarea = document.getElementById("rejectionReasonText");
        select.value = select.options[0].value;
        textarea.value = "";
        textarea.classList.add("d-none");

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// Toggle rejection textarea if "other" is selected
document.getElementById("rejectionReasonSelect").addEventListener("change", (e) => {
    const textarea = document.getElementById("rejectionReasonText");
    if (e.target.value === "other") {
        textarea.classList.remove("d-none");
    } else {
        textarea.classList.add("d-none");
    }
});

document.getElementById("confirmRejectBtn").addEventListener("click", () => {
    if (!activeRejectionId) return;

    const select = document.getElementById("rejectionReasonSelect");
    const textarea = document.getElementById("rejectionReasonText");
    let reason = select.value;
    if (reason === "other") {
        reason = textarea.value.trim();
        if (!reason) {
            showToast("يرجى كتابة سبب الرفض", "warning");
            return;
        }
    }

    // Close Rejection Modal
    const modalEl = document.getElementById("rejectionReasonModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    // Call update status with reason
    updateDonationStatus(activeRejectionId, "rejected", activeRejectionBtn, reason);
});

async function updateDonationStatus(id, status, btn, reason = "") {
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;
    }

    try {
        const bodyObj = { status };
        if (status === "rejected" && reason) {
            bodyObj.rejectionReason = reason;
        }

        const response = await fetch(`${BASE_URL}/dashboard/request/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyObj)
        });

        const data = await response.json();

        if (response.ok) {
            showToast(status === "accepted" ? "تم قبول استلام التبرع بنجاح" : "تم رفض استلام التبرع", "success");
            
            // Refresh counts and lists
            await fetchDashboardData();
        } else {
            showToast(data.message || "فشل تحديث حالة التبرع", "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = status === "accepted" ? `<i class="ti ti-check"></i>قبول` : `<i class="ti ti-x"></i>رفض`;
            }
        }
    } catch (e) {
        console.error("Update Status Error:", e);
        showToast("حدث عطل أثناء الاتصال بالسيرفر", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = status === "accepted" ? `<i class="ti ti-check"></i>قبول` : `<i class="ti ti-x"></i>رفض`;
        }
    }
}

/* ==========================================================================
   DONATION DETAILS MODAL
   ========================================================================== */
window.showDonationDetails = function(id) {
    const item = allDonations.find(d => d._id === id);
    if (!item) return;

    const modalBody = document.getElementById("donationDetailsBody");
    if (!modalBody) return;

    const imageSrc = extractImageUrl(item);
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : "غير محدد";

    // Badges
    const status = (item.status || "pending").toLowerCase();
    let statusHtml = "";
    if (status === "accepted" || status === "approved") {
        statusHtml = `<span class="badge text-success px-3 py-2 rounded-pill fs-6" style="background: var(--green-dim); border: 1px solid var(--green);"><i class="fa-solid fa-circle-check me-1"></i> تم قبول التبرع</span>`;
    } else if (status === "rejected" || status === "refused") {
        statusHtml = `<span class="badge text-danger px-3 py-2 rounded-pill fs-6" style="background: var(--red-dim); border: 1px solid var(--red);"><i class="fa-solid fa-circle-xmark me-1"></i> تم رفض التبرع</span>`;
    } else {
        statusHtml = `<span class="badge text-warning px-3 py-2 rounded-pill fs-6" style="background: var(--amber-dim); border: 1px solid var(--amber);"><i class="fa-solid fa-circle-minus me-1"></i> قيد المراجعة</span>`;
    }

    const donorName = item.donorId?.userName || item.donorId?.name || "متبرع كريم";
    const donorEmail = item.donorId?.email || "غير متوفر";
    const donorPhone = item.donorId?.phone || "غير متوفر";
    const donorAddress = item.donorId?.address || "غير متوفر";

    modalBody.innerHTML = `
        <div class="row g-4" style="direction: rtl; text-align: right; color: var(--t2);">
            <!-- Image Left -->
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
                        <p class="text-center" style="font-size: 11px; max-width: 180px; margin: 0;">لم يقم المتبرع بإرفاق صورة لهذا التبرع.</p>
                    </div>
                `}
            </div>

            <!-- Details Right -->
            <div class="col-md-7 d-flex flex-column justify-content-between">
                <div>
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <span class="fs-5 fw-bold text-teal" style="color: var(--teal); font-weight: 800;">
                            <i class="ti ti-tag me-1"></i> ${item.type || "تبرع ملابس"}
                        </span>
                        <div>${statusHtml}</div>
                    </div>

                    <!-- Donor details Card -->
                    <div class="p-3 mb-3 rounded-3" style="background: var(--surface2); border: 1px solid var(--border);">
                        <h6 class="fw-bold mb-2 text-teal d-flex align-items-center" style="font-size: 14px;">
                            <i class="ti ti-id me-2"></i> بيانات المتبرع
                        </h6>
                        <div class="row g-2" style="font-size: 12.5px; color: var(--t2);">
                            <div class="col-sm-6"><strong>الاسم:</strong> ${donorName}</div>
                            <div class="col-sm-6"><strong>الهاتف:</strong> <span style="direction: ltr; display: inline-block;">${donorPhone}</span></div>
                            <div class="col-sm-6" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><strong>البريد:</strong> ${donorEmail}</div>
                            <div class="col-sm-6"><strong>العنوان:</strong> ${donorAddress}</div>
                        </div>
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
                            <strong>ملاحظة المتبرع:</strong>
                            <p class="m-0 mt-1" style="font-style: italic;">"${item.description}"</p>
                        </div>
                    ` : ''}
                    
                    ${item.rejectionReason ? `
                        <div class="p-2 mb-3 rounded border-start border-3" style="background: var(--red-dim); border-left-color: var(--red) !important; font-size: 12.5px; color: var(--red);">
                            <strong>سبب الرفض:</strong>
                            <p class="m-0 mt-1">${item.rejectionReason}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="d-flex justify-content-end gap-2 pt-2 border-top" style="border-top-color: var(--border) !important;">
                    ${status === "pending" ? `
                        <button class="btn btn-sm btn-success text-white px-3 py-2" style="border-radius: 6px; font-weight:700;" onclick="handleModalAction('${item._id}', 'accepted')">
                            <i class="ti ti-check"></i> قبول استلام
                        </button>
                        <button class="btn btn-sm btn-danger text-white px-3 py-2" style="border-radius: 6px; font-weight:700;" onclick="handleModalAction('${item._id}', 'rejected')">
                            <i class="ti ti-x"></i> رفض التبرع
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-secondary text-white px-3 py-2" style="border-radius: 6px;" data-bs-dismiss="modal">إغلاق</button>
                    `}
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

window.handleModalAction = function(id, actionStatus) {
    // Hide details modal first
    const detailsModalEl = document.getElementById("donationDetailsModal");
    const detailsModal = bootstrap.Modal.getInstance(detailsModalEl);
    if (detailsModal) detailsModal.hide();

    // Call card action
    setTimeout(() => {
        handleCardAction(id, actionStatus, null);
    }, 400);
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
   FILTERS ACTIONS LISTENERS
   ========================================================================== */
function setupActionListeners() {
    document.getElementById("donationSearchInput")?.addEventListener("input", applyFilters);
    document.getElementById("statusFilterSelect")?.addEventListener("change", applyFilters);
    document.getElementById("dateFilterFrom")?.addEventListener("change", applyFilters);
    document.getElementById("dateFilterTo")?.addEventListener("change", applyFilters);
    document.getElementById("sortOrderSelect")?.addEventListener("change", applyFilters);

    document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
        document.getElementById("donationSearchInput").value = "";
        document.getElementById("statusFilterSelect").value = "all";
        document.getElementById("dateFilterFrom").value = "";
        document.getElementById("dateFilterTo").value = "";
        document.getElementById("sortOrderSelect").value = "newest";
        applyFilters();
    });

    // View Switching
    document.getElementById("viewBtnTable")?.addEventListener("click", () => {
        donView = "table";
        document.getElementById("viewBtnTable").classList.add("active");
        document.getElementById("viewBtnCards").classList.remove("active");
        renderDonationsPage();
    });

    document.getElementById("viewBtnCards")?.addEventListener("click", () => {
        donView = "cards";
        document.getElementById("viewBtnCards").classList.add("active");
        document.getElementById("viewBtnTable").classList.remove("active");
        renderDonationsPage();
    });

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderDonationsPage();
        }
    });

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        renderDonationsPage();
    });

    // Refresh Dashboard Button
    document.getElementById("refreshBtn")?.addEventListener("click", fetchDashboardData);

    // Theme Switcher Button
    document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("ap-light-theme");
        localStorage.setItem("ap-theme", isLight ? "light" : "dark");
        document.getElementById("themeToggleBtn").querySelector("i").className = isLight ? "ti ti-sun" : "ti ti-moon";
        
        // Re-render chart to update grid colors
        getStats();
    });

    // Restore Theme preference
    const savedTheme = localStorage.getItem("ap-theme");
    if (savedTheme === "light") {
        document.body.classList.add("ap-light-theme");
        document.getElementById("themeToggleBtn").querySelector("i").className = "ti ti-sun";
    }

    // Report issue Modal
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
            showToast("تم إرسال بلاغك بنجاح، سيتم الرد من فريق الدعم الفني", "success");
            const modalEl = document.getElementById("reportProblemModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        } else {
            showToast(data.message || "فشل إرسال البلاغ", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("حدث عطل أثناء الاتصال بالسيرفر", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "إرسال البلاغ";
    }
}

/* ==========================================================================
   CRON AUTOMATION SCHEDULER
   ========================================================================== */
function initAutomationScheduler() {
    // 1. Setup Time inputs to next minute
    const schedDate = document.getElementById("schedDateInput");
    const schedTime = document.getElementById("schedTimeInput");
    const schedSecs = document.getElementById("schedSecondsInput");

    const now = new Date();
    schedDate.value = now.toISOString().split('T')[0];
    
    now.setMinutes(now.getMinutes() + 1);
    schedTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    schedSecs.value = "0";

    // 2. Load cached scheduled target
    const savedTarget = localStorage.getItem("ap-cron-target-time");
    if (savedTarget) {
        const targetDate = new Date(savedTarget);
        if (targetDate > new Date()) {
            startSchedulerTimer(targetDate);
        } else {
            localStorage.removeItem("ap-cron-target-time");
        }
    }

    // 3. Load logs
    const savedLogs = localStorage.getItem("ap-cron-logs");
    if (savedLogs) {
        try {
            cronLogs = JSON.parse(savedLogs);
            renderCronLogs();
        } catch (e) {
            cronLogs = [];
        }
    }

    // Bind Button Click Events
    document.getElementById("confirmScheduleBtn")?.addEventListener("click", confirmCronSchedule);
    document.getElementById("cancelScheduleBtn")?.addEventListener("click", cancelCronSchedule);
    document.getElementById("runCronNowBtn")?.addEventListener("click", runCronNow);
    document.getElementById("clearCronLogsBtn")?.addEventListener("click", () => {
        cronLogs = [];
        localStorage.removeItem("ap-cron-logs");
        renderCronLogs();
    });
}

function confirmCronSchedule() {
    const schedDate = document.getElementById("schedDateInput").value;
    const schedTime = document.getElementById("schedTimeInput").value;
    const schedSecs = parseInt(document.getElementById("schedSecondsInput").value) || 0;

    if (!schedDate || !schedTime) {
        showToast("يرجى تحديد التاريخ والوقت للجدولة", "warning");
        return;
    }

    const [hrs, mins] = schedTime.split(":").map(Number);
    const targetDate = new Date(schedDate);
    targetDate.setHours(hrs, mins, schedSecs, 0);

    if (targetDate <= new Date()) {
        showToast("تنبيه: يجب اختيار وقت وتاريخ في المستقبل للجدولة التلقائية", "warning");
        return;
    }

    localStorage.setItem("ap-cron-target-time", targetDate.toISOString());
    startSchedulerTimer(targetDate);
    showToast("تمت جدولة تذكيرات التبرعات بنجاح", "success");
}

function cancelCronSchedule() {
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
    }
    localStorage.removeItem("ap-cron-target-time");

    // UI Updates
    document.getElementById("scheduler-status-badge").className = "ap-auto-status-badge inactive";
    document.getElementById("scheduler-status-badge").textContent = "غير مجدولة";
    document.getElementById("next-run-details-box").classList.add("d-none");
    document.getElementById("confirmScheduleBtn").classList.remove("d-none");
    document.getElementById("cancelScheduleBtn").classList.add("d-none");
    
    showToast("تم إلغاء جدولة المهمة التلقائية", "info");
}

function startSchedulerTimer(targetDate) {
    if (schedulerTimer) clearInterval(schedulerTimer);

    // Show Scheduler status as Active
    document.getElementById("scheduler-status-badge").className = "ap-auto-status-badge active";
    document.getElementById("scheduler-status-badge").textContent = "مجدولة ونشطة";
    document.getElementById("next-run-details-box").classList.remove("d-none");
    document.getElementById("confirmScheduleBtn").classList.add("d-none");
    document.getElementById("cancelScheduleBtn").classList.remove("d-none");

    const timeStr = targetDate.toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById("next-run-time-str").textContent = timeStr;

    const timerSpan = document.getElementById("countdown-timer-span");

    function tick() {
        const remainingMs = targetDate.getTime() - new Date().getTime();
        
        if (remainingMs <= 0) {
            clearInterval(schedulerTimer);
            schedulerTimer = null;
            
            // Execute Cron reminder automatically
            triggerCronReminder(true);
            
            // Cleanup state
            cancelCronSchedule();
            return;
        }

        // Calculate hours, minutes, seconds remaining
        const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

        let countdownText = "";
        if (hrs > 0) countdownText += `${hrs} ساعة و `;
        if (mins > 0 || hrs > 0) countdownText += `${mins} دقيقة و `;
        countdownText += `${secs} ثانية`;

        timerSpan.textContent = countdownText;
    }
    
    tick();
    schedulerTimer = setInterval(tick, 1000);
}

async function runCronNow() {
    const btn = document.getElementById("runCronNowBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري التشغيل...`;

    await triggerCronReminder(false);

    btn.disabled = false;
    btn.innerHTML = `<i class="ti ti-player-play"></i> تشغيل الآن`;
}

async function triggerCronReminder(isScheduledTrigger = false) {
    const banner = document.getElementById("cron-message-banner");
    banner.className = "alert alert-info py-2 px-3 m-0";
    banner.classList.remove("d-none");
    banner.textContent = "جاري الاتصال بـ Vercel Cron لتذكير المتبرعين...";

    try {
        const response = await fetch(`${BASE_URL}/cron/donationReminder`, {
            method: "GET",
            headers: { Authorization: token }
        });

        const data = await response.json();
        
        // Log details
        const logTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logObj = {
            time: logTime,
            text: isScheduledTrigger ? "تشغيل مجدول: تذكير المتبرعين بالتبرعات المعلقة" : "تشغيل فوري يدوي: إرسال تذكيرات التبرعات المعلقة"
        };

        if (response.ok) {
            banner.className = "alert alert-success py-2 px-3 m-0";
            banner.textContent = `✅ نجاح التشغيل: ${data.message || "تم إرسال تذكيرات البريد للمتبرعين بنجاح"}`;
            
            logObj.type = "success";
            logObj.text += " - نجح بنجاح";
        } else {
            banner.className = "alert alert-danger py-2 px-3 m-0";
            banner.textContent = `✕ فشل التشغيل: ${data.message || "حدث خطأ غير معروف أثناء الإرسال"}`;
            
            logObj.type = "error";
            logObj.text += ` - فشل: ${data.message || "عطل داخلي"}`;
        }

        cronLogs.unshift(logObj);
        if (cronLogs.length > 50) cronLogs.pop(); // keep last 50 logs
        localStorage.setItem("ap-cron-logs", JSON.stringify(cronLogs));
        renderCronLogs();

    } catch (e) {
        console.error(e);
        banner.className = "alert alert-danger py-2 px-3 m-0";
        banner.textContent = "✕ فشل التشغيل: حدث عطل في الشبكة أثناء تشغيل الـ Cron";
        
        const logTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        cronLogs.unshift({
            type: "error",
            time: logTime,
            text: (isScheduledTrigger ? "تشغيل مجدول" : "تشغيل فوري") + " - فشل: عطل في الشبكة والاتصال"
        });
        localStorage.setItem("ap-cron-logs", JSON.stringify(cronLogs));
        renderCronLogs();
    }
}

function renderCronLogs() {
    const container = document.getElementById("cron-logs-container");
    const emptyState = document.getElementById("cron-logs-empty-state");

    if (cronLogs.length === 0) {
        container.innerHTML = "";
        container.appendChild(emptyState);
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");
    container.innerHTML = cronLogs.map(log => `
        <div class="ap-cron-log-item ${log.type}">
            <div class="d-flex justify-content-between">
                <span>${log.type === 'success' ? '✓' : '✕'} ${log.text}</span>
                <span class="text-muted" style="font-size: 10px;">${log.time}</span>
            </div>
        </div>
    `).join("");
}

/* ==========================================================================
   SETTINGS PROFILE & PASSWORD
   ========================================================================== */
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
    
    // Switch to settings tab in general
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

        // Set layout user info details
        const charityName = profile.charityName || profile.userName || "الجمعية";
        document.getElementById("user-display-name").textContent = charityName;
        document.getElementById("user-avatar-initial").textContent = charityName[0].toUpperCase();

        // Fill inputs
        const nameInput = document.getElementById("settingCharityName");
        const phoneInput = document.getElementById("settingPhone");
        const addressInput = document.getElementById("settingAddress");

        if (nameInput) nameInput.value = profile.charityName || profile.userName || "";
        if (phoneInput) phoneInput.value = profile.phone || "";
        if (addressInput) addressInput.value = profile.address || "";

    } catch (e) {
        console.error(e);
    }
}

// Update Profile
document.getElementById("profileSettingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("settingCharityName").value.trim();
    const phone = document.getElementById("settingPhone").value.trim();
    const address = document.getElementById("settingAddress").value.trim();

    // Reset errors
    document.getElementById("error-charityName").classList.add("d-none");
    document.getElementById("error-phone").classList.add("d-none");
    document.getElementById("error-address").classList.add("d-none");

    let hasError = false;

    // Validation
    const nameRegex = /^[a-zA-Z\u0621-\u064A][^#&<>"~;$^%{}]{2,29}$/;
    const phoneRegex = /^(002|\+2)?01[0125][0-9]{8}$/;

    if (!nameRegex.test(name)) {
        const err = document.getElementById("error-charityName");
        err.textContent = "الاسم غير صالح (يجب أن يبدأ بحرف، وبدون رموز خاصة، بين 3 إلى 30 حرف)";
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
                charityName: name,
                userName: name,
                phone: phone,
                address: address
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("تم تحديث بيانات الجمعية بنجاح", "success");
            
            // Refresh layout user metadata
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