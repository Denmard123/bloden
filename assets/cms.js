(function () {

    document.addEventListener("DOMContentLoaded", () => {
    
        // ----------------------------------
        // Sidebar Navigation
        // ----------------------------------
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.target;
                document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
                document.getElementById(target).classList.remove("hidden");
            });
        });
    
        // ----------------------------------
        // Check GH Exists
        // ----------------------------------
        if (!window.GH) {
            console.warn("GH is not defined — cms offline mode");
            return;
        }
    
        // ----------------------------------
        // Load posts
        // ----------------------------------
        async function loadPosts() {
            try {
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
                        <a class="text-blue-700" href="posts/${p.slug}.html">Lihat Artikel</a>
                    `;
                    box.appendChild(div);
                });
    
            } catch (err) {
                console.error("LoadPosts error:", err);
            }
        }
    
        // ----------------------------------
        // Submit New Article
        // ----------------------------------
        document.getElementById("formNewPost")?.addEventListener("submit", async e => {
            e.preventDefault();
    
            const title = document.getElementById("title").value.trim();
            const content = document.getElementById("content").value.trim();
    
            if (!title || !content) {
                alert("Judul dan konten wajib!");
                return;
            }
    
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
            const articleHTML = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <link rel="stylesheet" href="../style.css">
    </head>
    <body>
    <div class="container">
    ${content}
    </div>
    </body>
    </html>
    `.trim();
    
            await GH.saveFile(`posts/${slug}.html`, articleHTML);
            await GH.updatePostsJSON({ title, slug, date: new Date().toISOString() });
            await GH.updateSitemap();
    
            alert("Artikel berhasil dipublish");
            loadPosts();
        });
    
        if (document.getElementById("postList")) loadPosts();
    
        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    
    });
    
    })();
    