// =============================
//  GitHub API Handler
// =============================
const GH = {
    owner: "",
    repo: "",
    token: "",

    // ----------------------------
    // SAVE FILE to GitHub
    // ----------------------------
    async saveFile(path, content) {
        console.log("SAVE FILE:", path);

        if (!this.owner || !this.repo || !this.token) {
            console.warn("GH not configured — running in LOCAL MODE");
            return;
        }

        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;

        // get SHA if exists
        let sha = undefined;
        try {
            const existing = await fetch(url);
            if (existing.ok) {
                const json = await existing.json();
                sha = json.sha;
            }
        } catch {}

        const body = {
            message: "Update " + path,
            content: btoa(unescape(encodeURIComponent(content))),
            sha
        };

        await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${this.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    },

    // ----------------------------
    // Get posts.json
    // ----------------------------
    async listPostsIndex() {
        try {
            const res = await fetch("data/posts.json?time=" + Date.now());
            return await res.json();
        } catch (e) {
            console.warn("posts.json not found → return empty");
            return [];
        }
    },

    // ----------------------------
    // Update posts.json
    // ----------------------------
    async updatePostsJSON(newPost) {
        const posts = await this.listPostsIndex();
        posts.push(newPost);

        const json = JSON.stringify(posts, null, 2);
        await this.saveFile("data/posts.json", json);
    },

    // ----------------------------
    // Sitemap.xml (valid GSC)
    // ----------------------------
    async updateSitemap() {
        const posts = await this.listPostsIndex();

        const urls = posts.map(
            p => `
    <url>
        <loc>https://${this.owner}.github.io/${this.repo}/posts/${p.slug}.html</loc>
        <lastmod>${p.date}</lastmod>
    </url>`
        ).join("");

        const xml =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
            urls +
            `</urlset>`;

        await this.saveFile("sitemap.xml", xml);
    }
};

// ---- MAKE GLOBAL ----
window.GH = GH;
