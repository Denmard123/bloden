// =============================
// GitHub API Handler (CMS-Friendly)
// =============================
const GH = {
    owner: "",   // akan diisi dari localStorage
    repo: "",    // akan diisi dari localStorage
    token: "",   // akan diisi dari localStorage

    // ----------------------------
    // SAVE FILE TO GITHUB
    // ----------------------------
    async saveFile(path, content) {
        console.log("SAVE FILE:", path);

        if (!this.owner || !this.repo || !this.token) {
            console.warn("GH offline mode — tidak upload");
            return;
        }

        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;

        // GET SHA file lama (jika ada)
        let sha = undefined;
        try {
            const exist = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Accept": "application/vnd.github+json"
                }
            });
            if (exist.ok) {
                const json = await exist.json();
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
                const errText = await res.text();
                console.error("Gagal upload file:", errText);
            } else {
                console.log("File berhasil diupload:", path);
            }
        } catch (err) {
            console.error("Error fetch PUT:", err);
        }
    },

    // ----------------------------
    // GET posts.json
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

        const json = JSON.stringify(posts, null, 2);
        await this.saveFile("data/posts.json", json);
    },

    // ----------------------------
    // UPDATE SITEMAP.XML
    // ----------------------------
    async updateSitemap() {
        const posts = await this.listPostsIndex();

        const urls = posts.map(p => `
    <url>
        <loc>https://${this.owner}.github.io/${this.repo}/posts/${p.slug}.html</loc>
        <lastmod>${p.date}</lastmod>
    </url>`).join("");

        const xml =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
            urls +
            `</urlset>`;

        await this.saveFile("sitemap.xml", xml);
    },

    // ----------------------------
    // INIT CONFIG dari localStorage
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
