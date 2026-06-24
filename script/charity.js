

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

const BASE_URL = "https://ataa-charity-platform.vercel.app";

const token = localStorage.getItem("token");

/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

    getStats();

    fetchDonations();

    fetchRequests();
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

        document.getElementById("total-donations").textContent =
            data.totalDonations ||
            data.donations ||
            0;

        document.getElementById("beneficiary-requests").textContent =
            data.totalRequests ||
            data.requests ||
            0;

        document.getElementById("active-volunteers").textContent =
            data.activeVolunteers ||
            data.volunteers ||
            0;

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

        const donations =
            data.donations ||
            data.data ||
            [];

        const list =
            document.getElementById("donations-list");

        if (!donations.length) {

            list.innerHTML = `
                <li class="list-group-item text-center">
                    لا توجد تبرعات حالياً
                </li>
            `;

            return;
        }

        list.innerHTML = donations.map(item => `

            <li class="list-group-item border-0 p-0 mb-2 mt-3">

                <div
                    class="request-box"
                    style="
                        padding:15px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    "
                >

                    <div class="text-box">

                        <span class="text fw-bold">
                            ${item.type || "تبرع جديد"}
                        </span>

                        <br>

                        <small class="text-muted">
                            المقاس: ${item.size || "-"} |
                            الكمية: ${item.quantity || 0}
                        </small>

                    </div>

                    <div class="d-flex gap-2">

                        <button
                            class="fw-bold"
                            style="
                                background-color:#1b4b5a;
                                color:white;
                                border:none;
                                padding:7px 15px;
                                border-radius:5px;
                            "
                            onclick="requestDonation('${item._id}', this)"
                        >
                           قبول التبرع
                        </button>

                    </div>

                </div>

            </li>

        `).join("");

    } catch (error) {

        console.log("Donations Error:", error);
    }
}




// =========================
async function requestDonation(id, btn) {

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
                    status: "accepted"
                })
            }
        );

        const data = await response.json();

        console.log("ACCEPT DONATION:", data);

        if (response.ok) {

            btn.innerText = "تم القبول";
            btn.disabled = true;
            btn.style.backgroundColor = "#198754";
            btn.style.color = "#fff";

            setTimeout(() => {
                btn.closest("li").remove();
            }, 2000);

        } else {

            alert(data.message || "فشل قبول التبرع");
        }

    } catch (error) {

        console.log(error);
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

        const requests =
            data.requests ||
            data.data ||
            [];

        const list =
            document.getElementById("beneficiary-list");

        if (!requests.length) {

            list.innerHTML = `
                <li class="list-group-item text-center">
                    لا توجد طلبات حالياً
                </li>
            `;

            return;
        }

        list.innerHTML = requests.map(item => `

            <li class="list-group-item border-0 p-0 mt-3">

                <div
                    class="request-box"
                    style="
                        padding:15px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                    "
                >

                    <div class="text-box">

                        <span class="text fw-bold">

                            ${item.title ||
                              item.requestTitle ||
                              item.userName ||
                              "طلب جديد"}

                        </span>

                    </div>

                    <button
                        class="fw-bold"
                        style="
                            background-color: #1b4b5a;
                            color: white;
                            border: none;
                            padding: 7px 15px;
                            border-radius: 5px;
                        "
                        onclick="assignVolunteer(this)"
                    >
                        تعيين متطوع
                    </button>

                </div>

            </li>

        `).join("");

    } catch (error) {

        console.log("Requests Error:", error);
    }
}

/* =========================
   CHANGE REQUEST STATUS
========================= */

async function changeRequestStatus(id, status, btn) {

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

        console.log(data);

        if (response.ok) {

            if (status === "accepted") {

                btn.innerText = "تم القبول";

                btn.disabled = true;

                btn.style.backgroundColor = "#198754";

                btn.style.color = "#fff";

            } else {

                btn.closest("li").remove();
            }

        } else {

            alert(data.message || "فشل تحديث الطلب");
        }

    } catch (error) {

        console.log("Status Error:", error);
    }
}

/* =========================
   ASSIGN VOLUNTEER
========================= */

function assignVolunteer(btn) {

    btn.innerText = "تم تعيين متطوع";

    btn.disabled = true;

    btn.style.backgroundColor = "#198754";
}