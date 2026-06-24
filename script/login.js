// login.js — تسجيل الدخول مع validation مطابق للباك + أيقونة العين

// document.addEventListener('DOMContentLoaded', () => {
//     const form      = document.getElementById('loginForm');

//     /* ─── Toast helper ─── */
//     const toast = (title, icon, text = '') => Swal.fire({
//         toast: true,
//         position: 'top-end',
//         icon,
//         title,
//         text,
//         showConfirmButton: false,
//         timer: 3500,
//         timerProgressBar: true,
//         customClass: { popup: 'swal-toast-custom' },
//         didOpen: (t) => {
//             t.addEventListener('mouseenter', Swal.stopTimer);
//             t.addEventListener('mouseleave', Swal.resumeTimer);
//         }
//     });

//     /* ─── Validation rules (مطابقة للباك) ─── */
//     const rules = {
//         email:    { re: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.(com|net|edu)$/,  msg: 'صيغة البريد غير صحيحة — يجب أن ينتهي بـ .com أو .net أو .edu' },
//         password: { re: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, msg: 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم و8 أحرف على الأقل' }
//     };

//     const validate = (value, rule) => rule.re.test(value);

//     /* ─── Inline field feedback ─── */
//     const setFieldState = (id, ok) => {
//         const input = document.getElementById(id);
//         if (!input) return;
//         input.classList.toggle('input-valid',   ok);
//         input.classList.toggle('input-invalid', !ok);
//     };

//     const togglePassword = (inputId, btn) => {
//         const input = document.getElementById(inputId);
//         if (!input || !btn) return;
//         const isHidden = input.type === 'password';
//         input.type = isHidden ? 'text' : 'password';
//         const icon = btn.querySelector('i');
//         if (icon) {
//             icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
//         }
//     };

//     document.getElementById('toggle-login-password')?.addEventListener('click', function () {
//         togglePassword('login-password', this);
//     });

//     if (form) {
//         /* Live feedback on blur */
//         document.getElementById('login-email')?.addEventListener('blur', e => {
//             setFieldState('login-email', validate(e.target.value.trim(), rules.email));
//         });
//         document.getElementById('login-password')?.addEventListener('blur', e => {
//             setFieldState('login-password', validate(e.target.value, rules.password));
//         });

//         form.addEventListener('submit', (e) => {
//             e.preventDefault();

//             const email    = document.getElementById('login-email')?.value.trim();
//             const password = document.getElementById('login-password')?.value;

//             if (!validate(email, rules.email)) {
//                 setFieldState('login-email', false);
//                 return toast(rules.email.msg, 'error');
//             }
//             if (!validate(password, rules.password)) {
//                 setFieldState('login-password', false);
//                 return toast(rules.password.msg, 'error');
//             }


//             toast('تم التحقق بنجاح ✓', 'success','سيتم تسجيل الدخول الآن...');
//         });
//     }
// });

// ==============================22222222222222222222222222222222222222222=============================



// document.addEventListener('DOMContentLoaded', () => {

//     const form =
//         document.getElementById('loginForm');

//     /* ══════════════════════════════════════════
    //    Toast Helper
//     ══════════════════════════════════════════ */

//     const toast = (
//         title,
//         icon,
//         text = ''
//     ) => {

//         Swal.fire({
//             toast: true,
//             position: 'top-end',
//             icon,
//             title,
//             text,
//             showConfirmButton: false,
//             timer: 3500,
//             timerProgressBar: true,
//             customClass: {
//                 popup: 'swal-toast-custom'
//             },
//             didOpen: (t) => {

//                 t.addEventListener(
//                     'mouseenter',
//                     Swal.stopTimer
//                 );

//                 t.addEventListener(
//                     'mouseleave',
//                     Swal.resumeTimer
//                 );
//             }
//         });
//     };

//     /* ══════════════════════════════════════════
    //    Validation Rules
//     ══════════════════════════════════════════ */

//     const rules = {

//         email: {

//             re: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.(com|net|edu)$/,

//             msg:
//                 'صيغة البريد غير صحيحة'
//         },

//         password: {

//             re: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,

//             msg:
//                 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم و8 أحرف على الأقل'
//         }
//     };

//     const validate = (
//         value,
//         rule
//     ) => {

//         return rule.re.test(value);
//     };

//     /* ══════════════════════════════════════════
//        Input Validation Style
//     ══════════════════════════════════════════ */

//     const setFieldState = (
//         id,
//         ok
//     ) => {

//         const input =
//             document.getElementById(id);

//         if (!input) return;

//         input.classList.toggle(
//             'input-valid',
//             ok
//         );

//         input.classList.toggle(
//             'input-invalid',
//             !ok
//         );
//     };

//     /* ══════════════════════════════════════════
//        Toggle Password
//     ══════════════════════════════════════════ */

//     const togglePassword = (
//         inputId,
//         btn
//     ) => {

//         const input =
//             document.getElementById(inputId);

//         if (!input || !btn) return;

//         const isHidden =
//             input.type === 'password';

//         input.type =
//             isHidden
//                 ? 'text'
//                 : 'password';

//         const icon =
//             btn.querySelector('i');

//         if (icon) {

//             icon.className =
//                 isHidden
//                     ? 'fa-solid fa-eye-slash'
//                     : 'fa-solid fa-eye';
//         }
//     };

//     document
//         .getElementById(
//             'toggle-login-password'
//         )
//         ?.addEventListener(
//             'click',
//             function () {

//                 togglePassword(
//                     'login-password',
//                     this
//                 );
//             }
//         );

//     /* ══════════════════════════════════════════
//        Live Validation
//     ══════════════════════════════════════════ */

//     document
//         .getElementById('login-email')
//         ?.addEventListener(
//             'blur',
//             (e) => {

//                 setFieldState(
//                     'login-email',

//                     validate(
//                         e.target.value.trim(),
//                         rules.email
//                     )
//                 );
//             }
//         );

//     document
//         .getElementById(
//             'login-password'
//         )
//         ?.addEventListener(
//             'blur',
//             (e) => {

//                 setFieldState(
//                     'login-password',

//                     validate(
//                         e.target.value,
//                         rules.password
//                     )
//                 );
//             }
//         );

//     /* ══════════════════════════════════════════
//        Login Submit
//     ══════════════════════════════════════════ */

//     if (form) {

//         form.addEventListener(
//             'submit',
//             async (e) => {

//                 e.preventDefault();

//                 const email =
//                     document
//                         .getElementById(
//                             'login-email'
//                         )
//                         ?.value.trim();

//                 const password =
//                     document
//                         .getElementById(
//                             'login-password'
//                         )
//                         ?.value;

//                 /* Validation */

//                 if (
//                     !validate(
//                         email,
//                         rules.email
//                     )
//                 ) {

//                     setFieldState(
//                         'login-email',
//                         false
//                     );

//                     return toast(
//                         rules.email.msg,
//                         'error'
//                     );
//                 }

//                 if (
//                     !validate(
//                         password,
//                         rules.password
//                     )
//                 ) {

//                     setFieldState(
//                         'login-password',
//                         false
//                     );

//                     return toast(
//                         rules.password.msg,
//                         'error'
//                     );
//                 }

//                 setFieldState(
//                     'login-email',
//                     true
//                 );

//                 setFieldState(
//                     'login-password',
//                     true
//                 );

//                 /* Loading */

//                 const loginBtn =
//                     document.getElementById(
//                         'sign_in'
//                     );

//                 loginBtn.disabled = true;

//                 loginBtn.innerHTML = `
//                     <i class="fa-solid fa-spinner fa-spin"></i>
//                     جاري تسجيل الدخول...
//                 `;

//                 try {

//                     const response =
//                         await fetch(
//                             'https://ataa-charity-platform.vercel.app/auth/login',
//                             {
//                                 method: 'POST',

//                                 headers: {
//                                     'Content-Type':
//                                         'application/json'
//                                 },

//                                 body: JSON.stringify({
//                                     email,
//                                     password
//                                 })
//                             }
//                         );

//                     const data =
//                         await response.json();

//                     console.log(data);

//                     /* Success */

//                     if (response.ok) {

//                         /* Save Token */

//                         if (data.token) {

//                             localStorage.setItem(
//                                 'token',
//                                 data.token
//                             );
//                         }

//                         /* Save User */

//                         if (data.user) {

//                             localStorage.setItem(
//                                 'user',
//                                 JSON.stringify(
//                                     data.user
//                                 )
//                             );
//                         }

//                         Swal.fire({
//                             icon: 'success',
//                             title:
//                                 'تم تسجيل الدخول بنجاح',

//                             text:
//                                 'مرحباً بعودتك',

//                             confirmButtonText:
//                                 'متابعة'
//                         }).then(() => {

//                             window.location.href =
//                                 'index.html';
//                         });

//                     } else {

//                         /* Account Not Verified */

//                         if (
//                             data.message
//                                 ?.toLowerCase()
//                                 .includes(
//                                     'verify'
//                                 ) ||

//                             data.message
//                                 ?.includes(
//                                     'مفعل'
//                                 )
//                         ) {

//                             localStorage.setItem(
//                                 'verifyEmail',
//                                 email
//                             );

//                             Swal.fire({
//                                 icon: 'warning',

//                                 title:
//                                     'يجب تفعيل البريد الإلكتروني أولاً',

//                                 text:
//                                     'سيتم تحويلك لصفحة التحقق'
//                             }).then(() => {

//                                 window.location.href =
//                                     'Email.html';
//                             });

//                             return;
//                         }

//                         Swal.fire({
//                             icon: 'error',

//                             title:
//                                 'فشل تسجيل الدخول',

//                             text:
//                                 data.message ||
//                                 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
//                         });
//                     }

//                 } catch (error) {

//                     console.error(error);

//                     Swal.fire({
//                         icon: 'error',

//                         title:
//                             'خطأ في الاتصال',

//                         text:
//                             'تعذر الاتصال بالسيرفر'
//                     });

//                 } finally {

//                     loginBtn.disabled = false;

//                     loginBtn.innerHTML = `
//                         <i class="fa-solid fa-right-to-bracket"></i>
//                         تسجيل الدخول
//                     `;
//                 }
//             }
//         );
//     }
// });


// =========================














document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById('loginForm');

    /* ══════════════════════════════════════════
       Toast Helper
    ══════════════════════════════════════════ */

    const toast = (
        title,
        icon,
        text = ''
    ) => {

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon,
            title,
            text,
            showConfirmButton: false,
            timer: 3500,
            timerProgressBar: true,
            customClass: {
                popup: 'swal-toast-custom'
            },
            didOpen: (t) => {

                t.addEventListener(
                    'mouseenter',
                    Swal.stopTimer
                );

                t.addEventListener(
                    'mouseleave',
                    Swal.resumeTimer
                );
            }
        });
    };

    /* ══════════════════════════════════════════
       Validation Rules
    ══════════════════════════════════════════ */

    const rules = {

        email: {
            re: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.(com|net|edu)$/,
            msg: 'صيغة البريد غير صحيحة'
        },

        password: {
            re: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
            msg:
                'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم و8 أحرف على الأقل'
        }
    };

    const validate = (
        value,
        rule
    ) => {

        return rule.re.test(value);
    };

    /* ══════════════════════════════════════════
       Input Validation Style
    ══════════════════════════════════════════ */

    const setFieldState = (
        id,
        ok
    ) => {

        const input =
            document.getElementById(id);

        if (!input) return;

        input.classList.toggle(
            'input-valid',
            ok
        );

        input.classList.toggle(
            'input-invalid',
            !ok
        );
    };

    /* ══════════════════════════════════════════
       Toggle Password
    ══════════════════════════════════════════ */

    const togglePassword = (
        inputId,
        btn
    ) => {

        const input =
            document.getElementById(inputId);

        if (!input || !btn) return;

        const isHidden =
            input.type === 'password';

        input.type =
            isHidden
                ? 'text'
                : 'password';

        const icon =
            btn.querySelector('i');

        if (icon) {

            icon.className =
                isHidden
                    ? 'fa-solid fa-eye-slash'
                    : 'fa-solid fa-eye';
        }
    };

    document
        .getElementById(
            'toggle-login-password'
        )
        ?.addEventListener(
            'click',
            function () {

                togglePassword(
                    'login-password',
                    this
                );
            }
        );

    /* ══════════════════════════════════════════
       Live Validation
    ══════════════════════════════════════════ */

    document
        .getElementById('login-email')
        ?.addEventListener(
            'blur',
            (e) => {

                setFieldState(
                    'login-email',

                    validate(
                        e.target.value.trim(),
                        rules.email
                    )
                );
            }
        );

    document
        .getElementById(
            'login-password'
        )
        ?.addEventListener(
            'blur',
            (e) => {

                setFieldState(
                    'login-password',

                    validate(
                        e.target.value,
                        rules.password
                    )
                );
            }
        );

    /* ══════════════════════════════════════════
       Login Submit
    ══════════════════════════════════════════ */

    if (form) {

        form.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const email =
                    document
                        .getElementById(
                            'login-email'
                        )
                        ?.value.trim();

                const password =
                    document
                        .getElementById(
                            'login-password'
                        )
                        ?.value;

                if (
                    !validate(
                        email,
                        rules.email
                    )
                ) {

                    setFieldState(
                        'login-email',
                        false
                    );

                    return toast(
                        rules.email.msg,
                        'error'
                    );
                }

                if (
                    !validate(
                        password,
                        rules.password
                    )
                ) {

                    setFieldState(
                        'login-password',
                        false
                    );

                    return toast(
                        rules.password.msg,
                        'error'
                    );
                }

                setFieldState(
                    'login-email',
                    true
                );

                setFieldState(
                    'login-password',
                    true
                );

                const loginBtn =
                    document.getElementById(
                        'sign_in'
                    );

                loginBtn.disabled = true;

                loginBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    جاري تسجيل الدخول...
                `;

                try {

                    const response =
                        await fetch(
                            'https://ataa-charity-platform.vercel.app/auth/login',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                body: JSON.stringify({
                                    email,
                                    password
                                })
                            }
                        );

                    const data =
                        await response.json();

                    console.log(data);

                    const token =
                        data.token || 
                        data.accessToken || 
                        data.tokens?.accessToken || 
                        data.data?.token || 
                        data.data?.accessToken;
                    let payload = null;

                    if (token) {
                        try {
                            payload =
                                JSON.parse(
                                    atob(
                                        token.split('.')[1]
                                    )
                                );

                            console.log(
                                'TOKEN PAYLOAD:',
                                payload
                            );

                            // حفظ التوكن
                            localStorage.setItem(
                                'token',
                                token
                            );

                            // حفظ بيانات اليوزر بشكل مدمج لضمان وجود جميع الحقول
                            const userObj = {
                                ...(data.user || data.data?.user || {}),
                                ...payload,
                                roleType: payload.roleType || payload.role || data.user?.roleType || data.data?.user?.roleType
                            };

                            localStorage.setItem(
                                'user',
                                JSON.stringify(
                                    userObj
                                )
                            );
                        } catch (err) {
                            console.error("Error parsing token/payload:", err);
                        }
                    } else {
                        console.error("Token not found in response:", data);
                    }

                    if (response.ok) {

                        Swal.fire({
                            icon: 'success',
                            title:
                                'تم تسجيل الدخول بنجاح',

                            text:
                                'مرحباً بعودتك',

                            confirmButtonText:
                                'متابعة'
                        }).then(() => {
                            // التحويل للوحة التحكم مباشرة حسب الصلاحية
                            let dashboardLink = 'index.html';
                            let userRole = "";

                            const storedUserStr = localStorage.getItem("user");
                            if (storedUserStr) {
                                try {
                                    const u = JSON.parse(storedUserStr);
                                    userRole = u.roleType || u.role || "";
                                } catch (e) {}
                            }

                            if (!userRole && payload) {
                                userRole = payload.roleType || payload.role || "";
                            }

                            userRole = userRole.toLowerCase().trim();
                            console.log("Redirecting user with role:", userRole);

                            switch (userRole) {
                                case 'user':
                                case 'donor':
                                    dashboardLink = 'donor-dashboard.html';
                                    break;
                                case 'charity':
                                    dashboardLink = 'charity-dashboard.html';
                                    break;
                                case 'admin':
                                    dashboardLink = 'admin-dashboard.html';
                                    break;
                                default:
                                    dashboardLink = 'index.html';
                                    break;
                            }
                            window.location.href = dashboardLink;
                        });

                    } else {

                        Swal.fire({
                            icon: 'error',

                            title:
                                'فشل تسجيل الدخول',

                            text:
                                data.message ||
                                'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                        });
                    }

                } catch (error) {

                    console.error(error);

                    Swal.fire({
                        icon: 'error',

                        title:
                            'خطأ في الاتصال',

                        text:
                            'تعذر الاتصال بالسيرفر'
                    });

                } finally {

                    loginBtn.disabled = false;

                    loginBtn.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        تسجيل الدخول
                    `;
                }
            }
        );
    }
});