// =============================
// GitHub API Handler (CMS-Friendly & Optimized)
// =============================
const GH = {
    owner: "",   // akan diisi dari localStorage
    repo: "",    // akan diisi dari localStorage
    token: "",   // akan diisi dari localStorage

    // ----------------------------
    // SAVE FILE KE GITHUB
    // ----------------------------
    async saveFile(path, content) {
        console.log("SAVE FILE:", path);

        if (!this.owner || !this.repo || !this.token) {
            console.warn("GH offline mode — tidak upload");
            return;
        }

        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        let sha;

        // Cek apakah file sudah ada
        try {
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Accept": "application/vnd.github+json"
                }
            });
            if (res.ok) {
                const json = await res.json();
                sha = json.sha;
            }
        } catch (err) {
            console.warn("File belum ada, akan dibuat baru", err);
        }

        const body = {
            message: `Update ${path}`,
            content: btoa(unescape(encodeURIComponent(content))),
            sha
        };

        try {
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Accept": "application/vnd.github+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error("Gagal upload file:", text);
            } else {
                console.log("File berhasil diupload:", path);
            }
        } catch (err) {
            console.error("Error fetch PUT:", err);
        }
    },

    // ----------------------------
    // LIST POSTS
    // ----------------------------
    async listPostsIndex() {
        try {
            const res = await fetch("data/posts.json?time=" + Date.now());
            return await res.json();
        } catch {
            console.warn("posts.json missing → []");
            return [];
        }
    },

    // ----------------------------
    // UPDATE posts.json
    // ----------------------------
    async updatePostsJSON(newPost) {
        const posts = await this.listPostsIndex();
        posts.push(newPost);

        // Simpan posts.json baru
        await this.saveFile("data/posts.json", JSON.stringify(posts, null, 2));

        // Update sitemap secara otomatis
        await this.updateSitemap(posts);
    },

    // ----------------------------
    // UPDATE SITEMAP.XML
    // ----------------------------
    async updateSitemap(posts = null) {
        // Jika posts belum di-pass, fetch dulu
        if (!posts) posts = await this.listPostsIndex();

        // Generate XML valid
        const urls = posts.map(p => `
    <url>
        <loc>https://${this.owner}.github.io/${this.repo}/posts/${p.slug}.html</loc>
        <lastmod>${p.date}</lastmod>
    </url>`).join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        await this.saveFile("sitemap.xml", xml);
    },

    // ----------------------------
    // INIT CONFIG DARI LOCALSTORAGE
    // ----------------------------
    initFromStorage() {
        this.owner = localStorage.getItem("GH_OWNER") || "";
        this.repo = localStorage.getItem("GH_REPO") || "";
        this.token = localStorage.getItem("GH_TOKEN") || "";
        console.log("GH Config:", { owner: this.owner, repo: this.repo, token: this.token ? "SET" : "EMPTY" });
    }
};

// Inisialisasi otomatis
GH.initFromStorage();

// GLOBAL
window.GH = GH;
