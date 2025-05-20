const apiBase = "https://pen-shield.onrender.com";

const summaryEl = document.getElementById("scanSummary");
const rawEl = document.getElementById("scanResultRaw");
const saveBtn = document.getElementById("saveScanBtn");
const tableBody = document.querySelector("#securityHeadersTable tbody");
const scanBtn = document.getElementById("startScanBtn");

scanBtn.addEventListener("click", async evt => {
  evt.preventDefault();
  console.log("Button clicked: Starting scan");
  await startScan();
});

saveBtn.addEventListener("click", evt => {
  evt.preventDefault();
  console.log("Save button clicked: Saving scan");
  saveScan();
});

// Load previous scan result from sessionStorage on page load
let lastReport = null;
window.addEventListener("load", () => {
  console.log("Page loaded: Checking for previous scan result");
  const savedReport = sessionStorage.getItem("lastScanReport");
  if (savedReport) {
    console.log("Found previous scan result in sessionStorage");
    lastReport = JSON.parse(savedReport);
    renderScanResult(lastReport);
  }
});

async function startScan() {
  console.log("startScan: Starting scan process");
  const urlInput = document.getElementById("scan-url").value.trim();
  console.log("startScan: URL input:", urlInput);
  try {
    new URL(urlInput);
  } catch {
    console.log("startScan: Invalid URL");
    return alert("Please enter a valid URL (e.g., https://example.com)");
  }
  const token = localStorage.getItem("jwt");
  console.log("startScan: Token:", token);
  if (!token) {
    console.log("startScan: No token, showing alert");
    alert("Please log in to perform a scan");
    console.log("startScan: Redirecting to hub.html");
    window.location.href = "hub.html";
    return;
  }

  console.log("startScan: Showing loading state");
  const loadingEl = document.getElementById("loading");
  loadingEl.style.display = "block";
  scanBtn.disabled = true;
  summaryEl.innerHTML = "<p>Loading…</p>";
  tableBody.textContent = "";
  rawEl.textContent = "";
  saveBtn.style.display = "none";

  try {
    console.log("startScan: Sending fetch request to /scan");
    const resp = await fetch(`${apiBase}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ url: urlInput }),
    });
    console.log("startScan: Fetch response status:", resp.status);
    if (!resp.ok) {
      const { msg } = await resp.json().catch(() => ({}));
      console.log("startScan: Fetch failed, msg:", msg);
      if (resp.status === 401 || resp.status === 403) {
        console.log("startScan: Authentication failure, showing alert");
        alert("Session expired. Redirecting to login.");
        console.log("startScan: Redirecting to hub.html");
        localStorage.removeItem("jwt"); // Clear invalid token
        window.location.href = "hub.html";
        return;
      }
      throw new Error(msg || `HTTP error ${resp.status}`);
    }

    const { scan_result } = await resp.json();
    console.log("startScan: Scan result:", scan_result);
    if (!scan_result || !scan_result.url || !scan_result.status_code || !scan_result.security_headers) {
      console.error("startScan: Invalid scan result format");
      throw new Error("Invalid scan result format");
    }
    lastReport = scan_result;

    // Save scan result to sessionStorage to persist across navigation
    console.log("startScan: Saving scan result to sessionStorage");
    sessionStorage.setItem("lastScanReport", JSON.stringify(lastReport));

    renderScanResult(lastReport);
  } catch (e) {
    console.error("startScan: Error:", e.message);
    summaryEl.innerHTML = `<p style="color: red;">Error: ${e.message}</p>`;
    alert(`Scan failed: ${e.message}`);
  } finally {
    console.log("startScan: Hiding loading state");
    loadingEl.style.display = "none";
    scanBtn.disabled = false;
  }
}

function renderScanResult(scan_result) {
  console.log("renderScanResult: Updating UI with scan result");
  summaryEl.innerHTML = `
    <p><strong>URL:</strong> ${scan_result.url}</p>
    <p><strong>Status Code:</strong> ${scan_result.status_code}</p>
    <p><strong>Response Time:</strong> ${scan_result.response_time}s</p>
    <p><strong>Risk:</strong> ${scan_result.risk}</p>
    <p><strong>Notes:</strong> ${scan_result.notes}</p>
  `;
  console.log("renderScanResult: Updating security headers table");
  tableBody.innerHTML = "";
  scan_result.security_headers.checked.forEach((hdr) => {
    const present = scan_result.security_headers.present.includes(hdr);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${hdr}</td><td>${present ? "✅" : "❌"}</td>`;
    tableBody.appendChild(tr);
  });
  console.log("renderScanResult: Updating raw JSON");
  rawEl.textContent = JSON.stringify(scan_result, null, 2);
  console.log("renderScanResult: Showing save button");
  saveBtn.style.display = "inline-block";
}

async function saveScan() {
  console.log("saveScan: Starting save process");
  if (!lastReport) {
    console.log("saveScan: Nothing to save");
    return alert("Nothing to save!");
  }
  const token = localStorage.getItem("jwt");
  console.log("saveScan: Token:", token);
  if (!token) {
    console.log("saveScan: No token, showing alert");
    alert("Please log in to save the scan");
    console.log("saveScan: Redirecting to hub.html");
    window.location.href = "hub.html";
    return;
  }

  const payload = {
    url: lastReport.url,
    status_code: lastReport.status_code,
    response_time: lastReport.response_time,
    risk: lastReport.risk,
    notes: lastReport.notes,
    headers: lastReport.security_headers,
  };

  try {
    console.log("saveScan: Sending fetch request to /save_scan");
    const resp = await fetch(`${apiBase}/save_scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    console.log("saveScan: Fetch response status:", resp.status);
    if (!resp.ok) {
      const { msg } = await resp.json().catch(() => ({}));
      console.log("saveScan: Fetch failed, msg:", msg);
      if (resp.status === 401 || resp.status === 403) {
        console.log("saveScan: Authentication failure, showing alert");
        alert("Session expired. Redirecting to login.");
        console.log("saveScan: Redirecting to hub.html");
        localStorage.removeItem("jwt"); // Clear invalid token
        window.location.href = "hub.html";
        return;
      }
      throw new Error(msg || `HTTP error ${resp.status}`);
    }
    console.log("saveScan: Scan saved successfully");
    alert("✅ Scan saved!");
    saveBtn.style.display = "none";
    // Clear sessionStorage after saving
    sessionStorage.removeItem("lastScanReport");
  } catch (e) {
    console.error("saveScan: Error:", e.message);
    alert(`Save failed: ${e.message}`);
  }
}

// Prevent page reload on form submission (if any)
window.addEventListener("beforeunload", (e) => {
  console.log("beforeunload: Page is about to unload or reload");
  if (lastReport) {
    console.log("beforeunload: Saving lastReport to sessionStorage before unload");
    sessionStorage.setItem("lastScanReport", JSON.stringify(lastReport));
  }
});

// Log navigation events
window.addEventListener("popstate", () => {
  console.log("popstate: Browser navigation occurred (back/forward)");
});