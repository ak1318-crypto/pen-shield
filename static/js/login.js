const apiBase = "http://127.0.0.1:5000";

function setToken(tok) {
  localStorage.setItem("jwt", tok);
}

async function doLogin() {
  const u = document.getElementById("usernameInput").value.trim();
  const p = document.getElementById("passwordInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");
  if (!u || !p) {
    return errorMsg.innerText = "Username/password required";
  }

  try {
    const res = await fetch(`${apiBase}/login`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ username: u, password: p })
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.msg || res.statusText);
    }
    const { access_token } = await res.json();
    setToken(access_token);
    window.location.href = "hub.html";

  } catch (err) {
    errorMsg.innerText = err.message;
  }
}

document.getElementById("loginBtn").addEventListener("click", doLogin);




