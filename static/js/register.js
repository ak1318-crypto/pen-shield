const registerBtn = document.getElementById("registerBtn");
const msgP        = document.getElementById("msg");
const API         = "http://127.0.0.1:5000";

registerBtn.onclick = async () => {
  // hide any previous message
  msgP.style.display = "none";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    msgP.textContent = "Username & password required";
    msgP.className = "message error";
    msgP.style.display = "block";
    return;
  }

  try {
    const resp = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await resp.json();

    if (!resp.ok) {
      // show the error from the server
      throw new Error(data.msg || resp.statusText);
    }

    alert("✅ Registered! Please log in next.");
    window.location.href = "login.html";

  } catch (e) {
    msgP.textContent = e.message;
    msgP.className = "message error";
    msgP.style.display = "block";
  }
};
