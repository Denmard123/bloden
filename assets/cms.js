(function () {
    document.addEventListener("DOMContentLoaded", () => {
  
      // -----------------------------
      // Sidebar navigation
      // -----------------------------
      document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.target;
          document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
          document.getElementById(target).classList.remove("hidden");
        });
      });
  
      // -----------------------------
      // Load GitHub Settings dari localStorage
      // -----------------------------
      const ownerInput = document.getElementById("ghOwner");
      const repoInput = document.getElementById("ghRepo");
      const tokenInput = document.getElementById("ghToken");
      const saveBtn = document.getElementById("saveSetting");
  
      if (localStorage.getItem("GH_OWNER")) ownerInput.value = localStorage.getItem("GH_OWNER");
      if (localStorage.getItem("GH_REPO")) repoInput.value = localStorage.getItem("GH_REPO");
      if (localStorage.getItem("GH_TOKEN")) tokenInput.value = localStorage.getItem("GH_TOKEN");
  
      saveBtn?.addEventListener("click", () => {
        localStorage.setItem("GH_OWNER", ownerInput.value.trim());
        localStorage.setItem("GH_REPO", repoInput.value.trim());
        localStorage.setItem("GH_TOKEN", tokenInput.value.trim());
  
        // Update GH global config
        if (window.GH) {
          GH.owner = ownerInput.value.trim();
          GH.repo = repoInput.value.trim();
          GH.token = tokenInput.value.trim();
        }
  
        alert("Setting GitHub berhasil disimpan!");
      });
  
      // -----------------------------
      // Cek GH Object
      // -----------------------------
      if (!window.GH) {
        console.warn("GH undefined — offline mode");
        return;
      }
  
      // Isi otomatis GH config dari localStorage
      GH.owner = localStorage.getItem("GH_OWNER") || GH.owner;
      GH.repo = localStorage.getItem("GH_REPO") || GH.repo;
      GH.token = localStorage.getItem("GH_TOKEN") || GH.token;
  
      // -----------------------------
      // Load posts
      // -----------------------------
      async function loadPosts() {
        const posts = await GH.listPostsIndex();
        const box = document.getElementById("postList");
        box.innerHTML = "";
  
        if (!posts || posts.length === 0) {
          box.innerHTML = "<p class='text-gray-500'>Belum ada postingan</p>";
          return;
        }
  
        posts.forEach(p => {
          const div = document.createElement("div");
          div.className = "p-4 mb-2 bg-white rounded shadow";
          div.innerHTML = `
            <h2 class="font-bold">${escapeHtml(p.title)}</h2>
            <p class="text-sm text-gray-600">${escapeHtml(p.date)}</p>
            <a class="text-blue-700" href="posts/${p.slug}.html" target="_blank">Lihat Artikel</a>
          `;
          box.appendChild(div);
        });
      }
  
      // -----------------------------
      // Submit new article
      // -----------------------------
      document.getElementById("formNewPost")?.addEventListener("submit", async e => {
        e.preventDefault();
  
        const title = document.getElementById("title").value.trim();
        const content = document.getElementById("content").value.trim();
  
        if (!title || !content) {
          alert("Judul & konten wajib diisi!");
          return;
        }
  
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="../assets/style.css">
  </head>
  <body>
  <div class="container">
  ${content}
  </div>
  </body>
  </html>`.trim();
  
        try {
          await GH.saveFile(`posts/${slug}.html`, html);
          await GH.updatePostsJSON({ title, slug, date: new Date().toISOString() });
          await GH.updateSitemap();
  
          alert("Artikel berhasil dipublish!");
          loadPosts();
        } catch (err) {
          console.error("Error publish:", err);
          alert("Gagal publish artikel. Cek console untuk detail.");
        }
      });
  
      if (document.getElementById("postList")) loadPosts();
  
      // -----------------------------
      // Helper: Escape HTML
      // -----------------------------
      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
  
    });
  })();
  