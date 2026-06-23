
//   // Navbar scroll
//   window.addEventListener('scroll', () => {
//     document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
//   });

//   // Hamburger
//   const ham = document.getElementById('hamBtn');
//   const mob = document.getElementById('mobileNav');
//   ham.addEventListener('click', () => {
//     ham.classList.toggle('open');
//     mob.classList.toggle('open');
//   });

//   // Open signup with role
//   // function openSignup(role) {
//   //   document.getElementById('accountType').value = role;
//   //   document.getElementById('modal-type-label').textContent = 'سجّل كـ ' + role + ' وابدأ رحلة العطاء';
//   //   document.getElementById('signupModal').classList.add('open');
//   // }

//   // Switch modals
//   function switchModal() {
//     document.getElementById('signupModal').classList.remove('open');
//     document.getElementById('loginModal').classList.add('open');
//   }
//   function switchModalLogin() {
//     document.getElementById('loginModal').classList.remove('open');
//     document.getElementById('signupModal').classList.add('open');
//   }

//   // Close on overlay click
//   document.querySelectorAll('.modal-overlay').forEach(m => {
//     m.addEventListener('click', e => { if(e.target === m) m.classList.remove('open'); });
//   });

//   // Reveal on scroll
//   const revealEls = document.querySelectorAll('.reveal');
//   const io = new IntersectionObserver((entries) => {
//     entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
//   }, { threshold: 0.12 });
//   revealEls.forEach(el => io.observe(el));
  
// // contact page
//   window.addEventListener('scroll', () => { document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20); });
//   document.querySelectorAll('.reveal').forEach(el => io.observe(el));
//   function handleSubmit(e) {
//     e.preventDefault();
//     const msg = document.getElementById('successMsg');
//     msg.style.display = 'block';
//     e.target.reset();
//     setTimeout(() => { msg.style.display = 'none'; }, 5000);
//   }
//   // charity page 
//     window.addEventListener('scroll', () => { document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20); });
//   document.querySelectorAll('.reveal').forEach(el => io.observe(el));
//   document.querySelectorAll('.filter-btn').forEach(btn => {
//     btn.addEventListener('click', () => { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
//   });

// window.addEventListener("load", () => {
//   setTimeout(() => {
//     document.getElementById("loader").style.display = "none";
//     document.getElementById("content").style.display = "block";
//   }, 1000); // ⏳ هنا الوقت بالملي ثانية (2000 = 2 ثانية)
// });


// ===================2222222222222222222222222=============================
// ===============================
// Navbar scroll
// ===============================
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");

  if (navbar) {
    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );
  }
});

// ===============================
// DOM Loaded
// ===============================
document.addEventListener(
  "DOMContentLoaded",
  () => {

    // ===============================
    // Hamburger menu
    // ===============================
    const ham =
      document.getElementById(
        "hamBtn"
      );

    const mob =
      document.getElementById(
        "mobileNav"
      );

    if (ham && mob) {
      ham.addEventListener(
        "click",
        () => {
          ham.classList.toggle(
            "open"
          );

          mob.classList.toggle(
            "open"
          );
        }
      );
    }

    // ===============================
    // Login / Register Mode
    // ===============================
    const container =
      document.getElementById(
        "container"
      );

    if (container) {

      const params =
        new URLSearchParams(
          window.location.search
        );

      const mode =
        params.get("mode");

      const loginBtn =
        document.getElementById(
          "login-toggle"
        );

      const registerBtn =
        document.getElementById(
          "register-toggle"
        );

      // الوضع الافتراضي Login
      container.classList.remove(
        "sign-up-mode"
      );

      // فتح حسب URL
      if (
        mode === "register"
      ) {

        container.classList.add(
          "sign-up-mode"
        );
      }

      if (
        mode === "login"
      ) {

        container.classList.remove(
          "sign-up-mode"
        );
      }

      // زر إنشاء حساب
      registerBtn?.addEventListener(
        "click",
        () => {

          container.classList.add(
            "sign-up-mode"
          );
        }
      );

      // زر تسجيل الدخول
      loginBtn?.addEventListener(
        "click",
        () => {

          container.classList.remove(
            "sign-up-mode"
          );
        }
      );
    }

    // ===============================
    // FAQ checkbox
    // ===============================
    const text =
      document.getElementById(
        "check"
      );

    const button =
      document.getElementById(
        "btn"
      );

    if (text && button) {

      text.addEventListener(
        "change",
        function () {

          button.disabled =
            !text.checked;
        }
      );

      button.addEventListener(
        "click",
        function () {

          const message =
            document.getElementById(
              "successmessage"
            );

          if (message) {
            message.style.display =
              "block";
          }
        }
      );
    }

    // ===============================
    // FAQ Accordion
    // ===============================
    const question =
      document.querySelectorAll(
        ".aske"
      );

    question.forEach(
      function (fqe) {

        fqe.addEventListener(
          "click",
          function () {

            const check =
              this.classList.contains(
                "active"
              );

            question.forEach(
              function (test) {

                test.classList.remove(
                  "active"
                );
              }
            );

            if (!check) {

              this.classList.add(
                "active"
              );
            }
          }
        );
      }
    );

    // ===============================
    // Side Menu
    // ===============================
    const menu =
      document.getElementById(
        "menu"
      );

    const nav =
      document.getElementById(
        "nav"
      );

    if (menu && nav) {

      menu.onclick =
        function () {

          nav.style.display =
            nav.style.display ===
            "block"
              ? "none"
              : "block";
        };
    }

    // ===============================
    // ===============================
// Auth Navbar
// ===============================
const navActions =
  document.getElementById(
    "navActions"
  );

if (navActions) {

  const token =
    localStorage.getItem(
      "token"
    );

  let user = null;

  try {

    user = JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  } catch (error) {

    console.error(
      "Invalid user data",
      error
    );

    localStorage.removeItem(
      "user"
    );
  }

  // ===============================
  // Guest Navbar
  // ===============================
  if (
    !token ||
    !user
  ) {

    navActions.innerHTML = `
      <a class="nav-btn-login"
         href="login-register.html?mode=login">
        دخول
      </a>

      <a class="nav-btn-signup"
         href="login-register.html?mode=register">
        حساب جديد
      </a>
    `;

  } else {

    // ===============================
    // Dashboard حسب نوع الحساب
    // ===============================
    let dashboardLink =
      "index.html";

    switch (
      user.roleType?.toLowerCase()
    ) {

      case "user":
        dashboardLink =
          "donor-dashboard.html";
        break;

      case "charity":
        dashboardLink =
          "charity-dashboard.html";
        break;

      case "admin":
        dashboardLink =
          "admin-dashboard.html";
        break;
    }

    // ===============================
    // Logged User Navbar
    // ===============================
    if (!document.getElementById("notificationsDropdown")) {
        navActions.innerHTML = `
          <span class="user-name">
            مرحباً 👋
          </span>

          <a class="nav-btn-settings"
             href="settings.html"
             title="الإعدادات">
             ⚙️
          </a>

          <a class="nav-btn-signup"
             href="${dashboardLink}">
            Dashboard
          </a>

          <button class="nav-btn-login"
                  id="logoutBtn">
            تسجيل خروج
          </button>
        `;
    }
  }
}
  }
);

// ===============================
// Reveal on scroll
// ===============================
const revealEls =
  document.querySelectorAll(
    ".reveal"
  );

if (revealEls.length > 0) {

  const io =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "visible"
              );
            }
          }
        );
      },
      {
        threshold: 0.12
      }
    );

  revealEls.forEach(
    (el) =>
      io.observe(el)
  );
}

// ===============================
// Contact form submit
// ===============================
function handleSubmit(e) {

  e.preventDefault();

  const msg =
    document.getElementById(
      "successMsg"
    );

  if (msg) {
    msg.style.display =
      "block";
  }

  e.target.reset();

  setTimeout(() => {

    if (msg) {
      msg.style.display =
        "none";
    }

  }, 5000);
}

// ===============================
// Charity filter buttons
// ===============================
document
  .querySelectorAll(
    ".filter-btn"
  )
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".filter-btn"
          )
          .forEach((b) => {

            b.classList.remove(
              "active"
            );
          });

        btn.classList.add(
          "active"
        );
      }
    );
  });

// ===============================
// Loader
// ===============================
window.addEventListener(
  "load",
  () => {

    setTimeout(() => {

      const loader =
        document.getElementById(
          "loader"
        );

      const content =
        document.getElementById(
          "content"
        );

      if (loader) {
        loader.style.display =
          "none";
      }

      if (content) {
        content.style.display =
          "block";
      }

    }, 1000);
  }
);


const token = localStorage.getItem("token");

const guestButtons =
    document.getElementById("guestButtons");

const userButtons =
    document.getElementById("userButtons");

const mobileGuestButtons =
    document.getElementById("mobileGuestButtons");

const mobileUserButtons =
    document.getElementById("mobileUserButtons");

// لو المستخدم عامل Login
if (token) {

    if (guestButtons) {
        guestButtons.style.display = "none";
    }

    if (userButtons) {
        userButtons.style.display = "flex";
    }

    if (mobileGuestButtons) {
        mobileGuestButtons.style.display = "none";
    }

    if (mobileUserButtons) {
        mobileUserButtons.style.display = "block";
    }
}

// Logout
function logout() {
    // Clear tokens
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Add styles for the custom spinner animation if not present
    if (!document.getElementById("logout-animation-styles")) {
        const styleSheet = document.createElement("style");
        styleSheet.id = "logout-animation-styles";
        styleSheet.innerText = `
          @keyframes logout-rotate {
            100% { transform: rotate(360deg); }
          }
          @keyframes logout-dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
          }
        `;
        document.head.appendChild(styleSheet);
    }

    // Create a beautiful full-screen logout card overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(27, 75, 90, 0.45)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "99999";
    overlay.style.transition = "opacity 0.4s ease";
    overlay.style.opacity = "0";
    overlay.style.fontFamily = "'Tajawal', sans-serif";

    const card = document.createElement("div");
    card.style.background = "#ffffff";
    card.style.borderRadius = "20px";
    card.style.padding = "30px 40px";
    card.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.15)";
    card.style.textAlign = "center";
    card.style.maxWidth = "400px";
    card.style.width = "90%";
    card.style.transform = "scale(0.85)";
    card.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    card.style.direction = "rtl";

    card.innerHTML = `
        <div style="width: 70px; height: 70px; background: rgba(27, 75, 90, 0.08); color: #1b4b5a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 32px;">
            <i class="fa-solid fa-right-from-bracket"></i>
        </div>
        <h4 style="font-weight: 800; color: #1b4b5a; margin-bottom: 8px;">تم تسجيل الخروج</h4>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">تم تسجيل خروجك بنجاح من منصة عطاء.</p>
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #1b4b5a; font-size: 13.5px; font-weight: 700;">
            <svg viewBox="0 0 50 50" style="width: 20px; height: 20px; animation: logout-rotate 2s linear infinite;">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#1b4b5a" stroke-width="5" style="stroke-linecap: round; animation: logout-dash 1.5s ease-in-out infinite;"></circle>
            </svg>
            <span>جاري تحويلك للرئيسية...</span>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Trigger animations
    setTimeout(() => {
        overlay.style.opacity = "1";
        card.style.transform = "scale(1)";
    }, 10);

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
}

// Universal click listener for all logout buttons (delegation handles dynamic element overwrites)
document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest("#logoutBtn, #mobileLogoutBtn, .logout-btn");
    if (logoutBtn) {
        e.preventDefault();
        logout();
    }
});

// Expose functions globally to ensure HTML inline attributes can access them
window.handleSubmit = handleSubmit;
window.logout = logout;