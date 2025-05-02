const apiBaseUrl = "http://127.0.0.1:5000";  // ✅ Ensure it uses port 5000

// ✅ Function to switch to the Login section
function showLogin() {
    document.getElementById("register-section").style.display = "none";
    document.getElementById("login-section").style.display = "block";
}

// ✅ Function to switch to the Register section
function showRegister() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("register-section").style.display = "block";
}

// ✅ Register a new user
async function register() {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    try {
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || "Registration failed");
        }

        alert("Registration successful! Please log in.");
        showLogin();  // ✅ Switch to login section after successful registration
    } catch (error) {
        console.error("Error:", error);
        alert("Registration failed: " + error.message);
    }
}  // ✅ Correct placement of closing bracket

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || "Login failed");
        }

        alert("Login successful!");
        localStorage.setItem("token", data.access_token); // ✅ Store token for authentication

        // ✅ Redirect to the Hub screen after login
        window.location.href = "hub.html"; 

    } catch (error) {
        console.error("Error:", error);
        alert("Login failed: " + error.message);
    }
}