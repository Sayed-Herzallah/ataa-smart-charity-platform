document.addEventListener('DOMContentLoaded', () => {

    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('sendBtn');
    
    const attachBtn = document.getElementById("attachBtn");
    const chatImageInput = document.getElementById("chatImageInput");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreviewThumb = document.getElementById("imagePreviewThumb");
    const imageFileName = document.getElementById("imageFileName");
    const cancelImageBtn = document.getElementById("cancelImageBtn");
    
    let selectedFile = null;

    if (!chatInput || !chatMessages || !sendBtn) {
        console.error("Chat Elements Not Found");
        return;
    }

    // تكبير الـ textarea تلقائياً
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });

    // إرسال الرسالة عند الضغط على Enter
    chatInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // إرسال عند الضغط على الزر
    sendBtn.addEventListener('click', async () => {
        await sendMessage();
    });

    // معالجة اختيار صورة
    if (attachBtn && chatImageInput) {
        attachBtn.addEventListener("click", () => {
            chatImageInput.click();
        });

        chatImageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                if (imagePreviewContainer && imagePreviewThumb && imageFileName) {
                    imagePreviewThumb.src = URL.createObjectURL(file);
                    imageFileName.textContent = file.name;
                    imagePreviewContainer.style.display = "flex";
                }
                attachBtn.classList.add("has-file");
                sendBtn.disabled = false;
            }
        });
    }

    // معالجة إلغاء الصورة
    if (cancelImageBtn) {
        cancelImageBtn.addEventListener("click", () => {
            resetImageSelection();
        });
    }

    function resetImageSelection() {
        if (chatImageInput) chatImageInput.value = "";
        if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
        if (imagePreviewThumb) imagePreviewThumb.src = "";
        if (imageFileName) imageFileName.textContent = "";
        if (attachBtn) attachBtn.classList.remove("has-file");
        selectedFile = null;
        
        // Update send button state
        const text = chatInput.value.trim();
        sendBtn.disabled = text.length === 0;
    }

    // تحديث عدد الأحرف وتفعيل الزر
    chatInput.addEventListener('input', () => {
        const text = chatInput.value.trim();
        const charCount = document.getElementById("charCount");
        if (charCount) {
            charCount.textContent = `${chatInput.value.length} / 1000`;
            if (chatInput.value.length > 850) {
                charCount.classList.add("warn");
            } else {
                charCount.classList.remove("warn");
            }
        }
        sendBtn.disabled = text.length === 0 && !selectedFile;
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text && !selectedFile) return;

        let imgHtml = "";
        if (selectedFile) {
            const imgUrl = URL.createObjectURL(selectedFile);
            imgHtml = `<img class="msg-image" src="${imgUrl}" />`;
        }

        appendMessage(text, 'user', imgHtml);

        chatInput.value = '';
        chatInput.style.height = 'auto';
        const charCount = document.getElementById("charCount");
        if (charCount) charCount.textContent = "0 / 1000";

        const fileToUpload = selectedFile;
        resetImageSelection();

        sendBtn.disabled = true;
        showTyping();

        try {
            let response;
            if (fileToUpload) {
                const formData = new FormData();
                formData.append("message", text);
                formData.append("data", fileToUpload);

                response = await fetch(
                    "https://ataa-charity-platform.vercel.app/ai/analysis",
                    {
                        method: "POST",
                        headers: {
                            Authorization: localStorage.getItem("token")
                        },
                        body: formData
                    }
                );
            } else {
                response = await fetch(
                    "https://ataa-charity-platform.vercel.app/ai/chat",
                    {
                        method: "POST",
                        headers: {
                            Authorization: localStorage.getItem("token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message: text
                        })
                    }
                );
            }

            const data = await response.json();
            console.log("AI RESPONSE:", data);

            removeTyping();

            if (!response.ok) {
                if (response.status === 401) {
                    alert("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً");
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "login-register.html?mode=login";
                    return;
                }
                const errMsg = data.message || "حدث خطأ أثناء معالجة الطلب";
                appendMessage(errMsg, 'ai');
                return;
            }

            const aiMessage =
                data.reply ||
                data.analysis ||
                data.message ||
                data.response ||
                (data.data && (data.data.reply || data.data.analysis || data.data.message || data.data.response)) ||
                "لم يتم استلام رد من المساعد الذكي";

            appendMessage(aiMessage, 'ai');

        } catch (error) {
            console.log("AI ERROR:", error);
            removeTyping();
            appendMessage(
                "حدث خطأ أثناء الاتصال بالمساعد الذكي. تأكد من اتصالك بالإنترنت وحاول مجدداً.",
                "ai"
            );
        }

        chatInput.focus();
    }

    function escHtml(t) {
        if (!t) return "";
        return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }

    function appendMessage(text, sender, imgHtml = "") {
        const welcome = document.getElementById('chatWelcome');
        if (welcome) welcome.style.display = 'none';

        const div = document.createElement('div');
        div.className = `msg ${sender}`;

        const now = new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
        
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem("user"));
        } catch (e) {}
        
        const avatar = sender === 'ai' ? '🤖' : (user?.userName?.[0] || '👤');

        div.innerHTML = `
            <div class="msg-avatar">${avatar}</div>
            <div>
                <div class="msg-bubble">
                    ${escHtml(text)}
                    ${imgHtml}
                </div>
                <div class="msg-time">${now}</div>
            </div>
        `;

        chatMessages.appendChild(div);
        scrollToBottom();
        return div;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'msg ai typing-indicator';
        div.id = 'typingIndicator';

        div.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div>
                <div class="msg-bubble typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function removeTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const authNeeded = document.getElementById("authNeeded");
    const chatWelcome = document.getElementById("chatWelcome");
    const chatInputArea = document.getElementById("chatInputArea");
    const token = localStorage.getItem("token");

    if (!token) {
        authNeeded.style.display = "flex";
        chatWelcome.style.display = "none";
        chatInputArea.style.display = "none";
    } else {
        authNeeded.style.display = "none";
        chatWelcome.style.display = "block";
        chatInputArea.style.display = "block";
    }
});

window.fillSuggestion = function (text) {
    if (!localStorage.getItem("token")) {
        alert("يجب تسجيل الدخول أولاً لاستخدام المساعد الذكي");
        window.location.href = 'login-register.html?mode=login';
        return;
    }

    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    if (!chatInput) return;

    chatInput.value = text;
    chatInput.dispatchEvent(new Event("input"));

    if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
    }
};
