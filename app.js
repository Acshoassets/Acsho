const main = document.getElementById('assets');
const searchIn = document.getElementById('search');
const categoryLinks = document.querySelectorAll('.category-btn');

const API_BASE_URL = 'http://localhost:3000';

// Utility to capitalize first letter
function capitalize(text) {
  return text && text[0].toUpperCase() + text.slice(1);
}

// Utility to escape HTML special chars
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': "&amp;", '<': "&lt;", '>': "&gt;", '"': "&quot;", "'": "&#39;"
  })[s]);
}

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  let cat = params.get('category');
  if (!cat || cat === 'all') return 'all';
  if (['davinci', 'premiere', 'capcut', 'sfx'].includes(cat)) return cat;
  return 'all';
}

// Fetch assets from backend API
async function fetchAssets() {
  const response = await fetch(`${API_BASE_URL}/assets`);
  if (!response.ok) {
    main.innerHTML = `<p style="color:#f66;">Failed to load assets from server.</p>`;
    return [];
  }
  return await response.json();
}

// Render fetched assets with filters
async function renderAssets(category) {
  main.innerHTML = "Loading...";

  let assets = await fetchAssets();

  if (category && category !== 'all') {
    assets = assets.filter(a => a.category === category);
  }

  const searchVal = searchIn.value.trim().toLowerCase();
  if (searchVal) {
    assets = assets.filter(a => a.name.toLowerCase().includes(searchVal));
  }

  if (assets.length === 0) {
    main.innerHTML = "<p style='color:#999;font-size:1.3em;text-align:center;'>No assets found.</p>";
    return;
  }

  main.innerHTML = '';
  for (const asset of assets) {
    main.innerHTML += `
      <div class="asset-card" data-id="${asset.id}">
        <div class="asset-category">${capitalize(asset.category)}</div>
        <h3 title="${escapeHtml(asset.name)}">${escapeHtml(asset.name)}</h3>
        <div class="asset-uploader" title="Uploaded by ${escapeHtml(asset.uploader)}">By: ${escapeHtml(asset.uploader)}</div>
        <div style="display:flex;gap:8px;">
          <button onclick="downloadAsset('${asset.link}')">Download</button>
          <button onclick="deleteAsset('${asset.id}', '${escapeHtml(asset.uploader)}')">Delete</button>
        </div>
      </div>`;
  }
}

// Download asset link
function downloadAsset(link) {
  window.open(link, '_blank', 'noopener');
}

// Delete asset request
async function deleteAsset(id, uploader) {
  const name = prompt("To confirm deletion, please enter your uploader name:");
  if (!name || name.trim() !== uploader) {
    alert("You can only delete assets you have uploaded.");
    return;
  }

  if (!confirm("Are you sure you want to delete this asset?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploader: name.trim() }),
    });

    if (!response.ok) {
      const msg = (await response.json()).message || "Failed to delete asset";
      alert(msg);
      return;
    }

    alert("Asset deleted successfully.");
    renderAssets(getCategoryFromURL());
  } catch (error) {
    alert("Error deleting asset. Try again.");
  }
}

// Open/close upload modal
function openUploadModal() {
  document.getElementById('uploadModal').style.display = "flex";
}
function closeUploadModal() {
  document.getElementById('uploadModal').style.display = "none";
  clearUploadInputs();
}

// Add new asset using POST request
async function addAsset() {
  const name = document.getElementById('assetNameIn').value.trim();
  const category = document.getElementById('assetCategoryIn').value;
  const link = document.getElementById('assetLinkIn').value.trim();
  const uploader = document.getElementById('uploaderNameIn').value.trim();

  if (!name || !category || !link || !uploader) {
    alert("All fields are required.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, link, uploader }),
    });

    if (!response.ok) {
      const msg = (await response.json()).message || "Failed to upload asset";
      alert(msg);
      return;
    }

    alert("Asset uploaded successfully.");
    closeUploadModal();
    renderAssets(getCategoryFromURL());
  } catch (error) {
    alert("Error uploading asset. Try again.");
  }
}

function clearUploadInputs() {
  document.getElementById('assetNameIn').value = '';
  document.getElementById('assetLinkIn').value = '';
  document.getElementById('uploaderNameIn').value = '';
}

// Search input listener
searchIn.addEventListener("input", () => {
  renderAssets(getCategoryFromURL());
});

// On page load
window.addEventListener('DOMContentLoaded', () => {
  renderAssets(getCategoryFromURL());

  // Set active category link
  const category = getCategoryFromURL();
  categoryLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href').includes(category));
  });
});
