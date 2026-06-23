
// document.addEventListener("DOMContentLoaded", function () {
//     const token = localStorage.getItem('token');
//     const trustBar = document.getElementById("trustBar");
//     const sizesBox = document.getElementById("sizesBox");
//     const ctx = document.getElementById('myChart');

    
//     fetch('https://reqres.in/api/users?page=1')
//     .then(response => response.json())
//     .then(result => {
//         const tableBody = document.getElementById("userdonationsTable");
        
//         if (tableBody) {
//             tableBody.innerHTML = result.data.map((item) => `
//                 <tr>
//                     <td>-</td> <td>${item.id % 2 === 0 ? 'مقبول' : 'قيد الانتظار'}</td>
//                     <td>${item.id}</td> 
//                     <td>-</td> <td>-</td> </tr>
//             `).join('');
//         }
//     })
//     .catch(err => console.log("Table Fetch Error:", err));

    
//     const statsData = {
//         trustPercent: 82,
//         categories: ['أطفال', 'حريمي', 'رجالي'],
//         needsData: [15, 45, 60],
//         availableSizes: [
//             { name: "S", percent: 55 }, { name: "M", percent: 40 }, { name: "L", percent: 35 },
//             { name: "XL", percent: 20 }, { name: "XXL", percent: 15 },
//             { name: "أطفال سنتين", percent: 50 }, { name: "أطفال (5 سنوات)", percent: 55 }, { name: "أطفال (10 سنوات)", percent: 60 }
//         ]
//     };

    
//     if (trustBar) {
//         let trust = 0;
//         let interval = setInterval(() => {
//             if (trust >= statsData.trustPercent) { clearInterval(interval); } 
//             else { trust++; trustBar.style.width = trust + "%"; trustBar.innerText = trust + "%"; }
//         }, 30);
//     }

    
//     if (sizesBox) {
//         sizesBox.innerHTML = "";
//         statsData.availableSizes.forEach(size => {
//             let span = document.createElement("span");
//             span.className = "badge bg-light text-dark border p-2 m-1";
//             span.innerText = `${size.name} (${size.percent}%)`;
//             sizesBox.appendChild(span);
//         });
//     }

    
//     if (ctx) {
//         new Chart(ctx, {
//             type: 'bar',
//             data: {
//                 labels: statsData.categories,
//                 datasets: [{ label: 'الاحتياج', data: statsData.needsData, backgroundColor: ['#dc3545', '#ffc107', '#28a745'] }]
//             },
//             options: { responsive: true, plugins: { legend: { display: false } } }
//         });
//     }
// });
// ========================================222222222222222222222222222222============================



console.log("DONOR FILE LOADED");

// فحص الأمان والصلاحيات فوراً قبل تحميل الصفحة
(function checkSecurity() {
    const localToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
        user = JSON.parse(userStr);
    } catch (e) {}

    if (!localToken || !user || user.roleType?.toLowerCase() !== "user") {
        alert("غير مصرح لك بالدخول لهذه الصفحة!");
        window.location.href = "login-register.html?mode=login";
        throw new Error("Unauthorized access");
    }
})();

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    let donations = [];

        try {

            const response =
                await fetch(
                    "https://ataa-charity-platform.vercel.app/donor",
                    {
                        method: "GET",

                        headers: {
                            authorization:
                                token
                        }
                    }
                );

            const result =
                await response.json();

            console.log(
                "FULL DATA:",
                result
            );

            // ==========================
            // HANDLE INVALID TOKEN
            // ==========================
            if (
                response.status === 401
            ) {

                alert(
                    "انتهت صلاحية تسجيل الدخول"
                );

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                window.location.href =
                    "login-register.html?mode=login";

                return;
            }

            // ==========================
            // GET DONATIONS
            // ==========================
            if (
                result.success
            ) {

                donations =
                    result.Data || [];

            } else {

                donations = [];
            }

        } catch (error) {

            console.error(
                "Fetch Error:",
                error
            );

            donations = [];
        }

        console.log(
            "DONATIONS:",
            donations
        );

        // ==========================
        // RENDER DATA
        // ==========================
        renderTable(
            donations
        );

        updateTrustBar(
            donations
        );

        renderSizes(
            donations
        );

        renderChart(
            donations
        );
    }
);


// ==========================
// TABLE
// ==========================
function renderTable(
    donations
) {

    const tableBody =
        document.getElementById(
            "userdonationsTable"
        );

    if (!tableBody)
        return;

    tableBody.innerHTML =
        "";

    if (
        !donations.length
    ) {

        tableBody.innerHTML =
            `
            <tr>
                <td colspan="5" class="text-center">
                    لا توجد تبرعات حتى الآن
                </td>
            </tr>
        `;

        return;
    }

    donations.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );

            const date =
                item.createdAt
                    ? new Date(
                        item.createdAt
                    ).toLocaleDateString(
                        "ar-EG"
                    )
                    : "-";

            row.innerHTML =
                `
                <td>${date}</td>

                <td>
                    <span class="badge ${getStatusClass(item.status)}">
                        ${translateStatus(item.status)}
                    </span>
                </td>

                <td>
                    ${item.quantity || "-"}
                </td>

                <td>
                    ${item.size || "-"}
                </td>

                <td>
                    ${item.type || "-"}
                </td>
            `;

            tableBody.appendChild(
                row
            );
        }
    );
}


// ==========================
// STATUS TEXT
// ==========================
function translateStatus(
    status
) {

    switch (status) {

        case "pending":
            return "قيد الانتظار";

        case "accepted":
            return "مقبول";

        case "rejected":
            return "مرفوض";

        default:
            return "قيد الانتظار";
    }
}


// ==========================
// STATUS COLOR
// ==========================
function getStatusClass(
    status
) {

    switch (status) {

        case "accepted":
            return "bg-success";

        case "rejected":
            return "bg-danger";

        case "pending":
            return "bg-warning text-dark";

        default:
            return "bg-secondary";
    }
}


// ==========================
// TRUST BAR
// ==========================
function updateTrustBar(
    donations
) {

    const trustBar =
        document.getElementById(
            "trustBar"
        );

    if (!trustBar)
        return;

    const accepted =
        donations.filter(
            item =>
                item.status ===
                "accepted"
        ).length;

    const percent =
        donations.length
            ? Math.round(
                (
                    accepted /
                    donations.length
                ) * 100
            )
            : 0;

    trustBar.style.width =
        percent + "%";

    trustBar.innerText =
        percent + "%";
}


// ==========================
// SIZES
// ==========================
function renderSizes(
    donations
) {

    const sizesBox =
        document.getElementById(
            "sizesBox"
        );

    if (!sizesBox)
        return;

    sizesBox.innerHTML =
        "";

    const sizeMap =
        {};

    donations.forEach(
        item => {

            const size =
                item.size ||
                "غير محدد";

            sizeMap[size] =
                (
                    sizeMap[
                        size
                    ] || 0
                ) + 1;
        }
    );

    for (
        const size in sizeMap
    ) {

        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            "badge bg-light text-dark border p-2 m-1";

        badge.innerText =
            `${size} (${sizeMap[size]})`;

        sizesBox.appendChild(
            badge
        );
    }
}


// ==========================
// CHART
// ==========================
function renderChart(
    donations
) {

    const canvas =
        document.getElementById(
            "donationChart"
        );

    if (!canvas)
        return;

    const ctx =
        canvas.getContext(
            "2d"
        );

    const types = {
        رجالي: 0,
        حريمي: 0,
        أطفال: 0
    };

    donations.forEach(
        item => {

            if (
                types[
                    item.type
                ] !== undefined
            ) {

                types[
                    item.type
                ]++;
            }
        }
    );

    new Chart(
        ctx,
        {
            type: "bar",

            data: {
                labels: [
                    "رجالي",
                    "حريمي",
                    "أطفال"
                ],

                datasets: [
                    {
                        label:
                            "عدد التبرعات",

                        data: [
                            types[
                                "رجالي"
                            ],
                            types[
                                "حريمي"
                            ],
                            types[
                                "أطفال"
                            ]
                        ]
                    }
                ]
            },

            options: {
                responsive:
                    true,

                plugins: {
                    legend: {
                        display:
                            false
                    }
                },

                scales: {
                    y: {
                        beginAtZero:
                            true
                    }
                }
            }
        }
    );
}