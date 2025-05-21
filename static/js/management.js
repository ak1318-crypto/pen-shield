const apiBase  = "https://pen-shield.onrender.com";
const token    = localStorage.getItem("jwt");
const tbody    = document.getElementById("scansTableBody");
const btnRef   = document.getElementById("refreshBtn");
const btnClear = document.getElementById("clearAllBtn");

async function loadScans() {
  const res = await fetch(`${apiBase}/my_scans`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch scans:", await res.text());
    return;
  }

  const scans = await res.json();
  tbody.innerHTML = scans.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.url}</td>
      <td>${s.status_code}</td>
      <td>${s.risk}</td>
      <td>${new Date(s.timestamp).toLocaleString()}</td>
      <td><button data-id="${s.id}" class="delete-scan">Delete</button></td>
    </tr>
  `).join("");

  // Hook up delete buttons
  document.querySelectorAll(".delete-scan").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const delRes = await fetch(`${apiBase}/scan/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (delRes.ok) {
        loadScans(); // Reload updated list
      } else {
        console.error(`Failed to delete scan ${id}`, await delRes.text());
      }
    };
  });
}

// Refresh list
btnRef.onclick = loadScans;

// Clear all scans
btnClear.onclick = async () => {
  const res = await fetch(`${apiBase}/scans`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (res.ok) {
    loadScans();
  } else {
    console.error("Failed to clear scans:", await res.text());
  }
};

// Load on page ready
document.addEventListener("DOMContentLoaded", loadScans);
