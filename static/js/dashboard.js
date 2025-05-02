const apiBase = "http://127.0.0.1:5000";

// pull from "jwt" — the exact same key login.js wrote to
function getToken() {
  return localStorage.getItem("jwt");
}

function showMsg(txt, isError = false) {
  const p = document.getElementById("profileMsg");
  p.textContent = txt;
  p.className = "message " + (isError ? "error" : "success");
  p.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (!token) {
    // no token? send them back to login
    return window.location.href = "home.html";
  }

  // Update Profile
  document.getElementById("updateProfileBtn")
          .addEventListener("click", async () => {
    const u = document.getElementById("newUsername").value.trim();
    const p = document.getElementById("newPassword").value.trim();
    if (!u && !p) {
      return showMsg("Nothing to update", true);
    }

    try {
      const res = await fetch(`${apiBase}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username: u, password: p })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || res.statusText);

      alert("Profile updated – please log in again");
      localStorage.removeItem("jwt");
      window.location.href = "home.html";
    } catch (err) {
      showMsg(err.message, true);
    }
  });

  // Delete Account
  document.getElementById("deleteAccountBtn")
          .addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    try {
      const res = await fetch(`${apiBase}/profile`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || res.statusText);

      alert("Account deleted – redirecting to login");
      localStorage.removeItem("jwt");
      window.location.href = "home.html";
    } catch (err) {
      showMsg(err.message, true);
    }
  });
});
