const apiBase = "https://pen-shield.onrender.com";
const token    = localStorage.getItem("jwt");
const tbody    = document.getElementById("scansTableBody");
const btnRef   = document.getElementById("refreshBtn");
const btnClear = document.getElementById("clearAllBtn");

async function loadScans() {
  const res = await fetch(`${API}/my_scans`,{
    method:"GET",
    headers:{"Authorization":`Bearer ${token}`}
  });
  if(!res.ok) return console.error("Failed",await res.text());
  const scans = await res.json();
  tbody.innerHTML = scans.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.url}</td>
      <td>${s.status_code}</td>
      <td>${s.risk}</td>
      <td>${new Date(s.timestamp).toLocaleString()}</td>
      <td><button data-id="${s.id}" class="delete-scan">Delete</button></td>
    </tr>`).join("");
  document.querySelectorAll(".delete-scan").forEach(b => {
    b.onclick = async () => {
      await fetch(`${API}/scan/${b.dataset.id}`,{
        method:"DELETE",
        headers:{"Authorization":`Bearer ${token}`}
      });
      loadScans();
    };
  });
}

btnRef.onclick   = loadScans;
btnClear.onclick = async () => {
  await fetch(`${API}/scans`,{
    method:"DELETE",
    headers:{"Authorization":`Bearer ${token}`}
  });
  loadScans();
};

document.addEventListener("DOMContentLoaded", loadScans);
