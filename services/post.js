var mysql = require("../tools/mysql");

module.exports = {
    // 取得所有文章
    async getAllPosts(req, callback) {
        // 取得?後的變數category或tags的內容
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const tags = req.query.tags;
        if (category) {
            const countSql = "SELECT COUNT(*) as total FROM posts WHERE category = ?";
            const sql = "SELECT * FROM posts WHERE category = ? ORDER BY id DESC LIMIT ? OFFSET ?";
            const params = [category, limit, (page - 1) * limit];
            try {
                const countResult = await mysql.query(countSql, [category]);
                const total = countResult[0].total;
                const totalPages = Math.ceil(total / limit);
                const results = await mysql.query(sql, params);
                callback(null, { data: results, total: total, page: page, totalPages: totalPages });
            } catch (error) {
                callback(0, error);
            }
            return;
        } else if (tags) {
            const countSql = "SELECT COUNT(*) as total FROM posts WHERE tags like ?";
            const sql = "SELECT * FROM posts WHERE tags like ? ORDER BY id DESC LIMIT ? OFFSET ?";
            const params = ["%" + tags + "%", limit, (page - 1) * limit];
            try {
                const countResult = await mysql.query(countSql, ["%" + tags + "%"]);
                const total = countResult[0].total;
                const totalPages = Math.ceil(total / limit);
                const results = await mysql.query(sql, params);
                callback(null, { data: results, total: total, page: page, totalPages: totalPages });
            } catch (error) {
                callback(0, error);
            }
            return;
        } else {
            // 僅取得 id, title, summary, category, tags, created_at 顯示於首頁
            // 1. 先查詢總文章數量
            const countSql = "SELECT COUNT(*) as total FROM posts";
            const sql = "SELECT id, title, summary, category, tags, created_at FROM posts ORDER BY id DESC LIMIT ? OFFSET ?";
            const params = [limit, (page - 1) * limit];
            try {
                const countResult = await mysql.query(countSql);
                const total = countResult[0].total;
                const totalPages = Math.ceil(total / limit);
                const results = await mysql.query(sql, params);
                callback(null, { data: results, total: total, page: page, totalPages: totalPages });
            } catch (error) {
                callback(0, error);
            }
        }
    },
    // 根據page數來取得文章
    async getPostsByPage(page, callback) {
        const sql = "SELECT * FROM posts ORDER BY id DESC LIMIT ? OFFSET ?";
        const params = [10, (page - 1) * 10];
        try {
            const results = await mysql.query(sql, params);
            callback(null, results);
        } catch (error) {
            callback(0, error);
        }
    },
    // 取得最新文章
    async getLatestPosts(callback) {
        const sql = "SELECT * FROM posts ORDER BY id DESC LIMIT 10";
        try {
            const results = await mysql.query(sql);
            callback(null, results);
        } catch (error) {
            callback(0, error);
        }
    },

    // 根據 ID 取得文章
    async getPostById(postId, callback) {
        const sql = "SELECT posts.*, members.username as author_name FROM posts join members on posts.author_id = members.uuid WHERE posts.id = ?";
        const params = [postId];
        try {
            const results = await mysql.query(sql, params);
            callback(null, results[0]);
        } catch (error) {
            callback(0, error);
        }
    },
    // 建立文章
    async createPost(title, content, summary, tags, authorId, category, paswd, callback) {
        const sql = "INSERT INTO posts (title, content, summary, tags, author_id, category, paswd) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const params = [title, content, summary, tags, authorId, category, paswd];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.insertId);
        } catch (error) {
            callback(0, error);
        }
    },
    // 更新文章
    async updatePost(postId, title, content, summary, tags, category, callback) {
        const sql = "UPDATE posts SET title = ?, content = ?, summary = ?, tags = ?, category = ? WHERE id = ?";
        const params = [title, content, summary, tags, category, postId];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 刪除文章
    async deletePost(postId, callback) {
        const sql = "DELETE FROM posts WHERE id = ?";
        const params = [postId];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 依照文章的標籤category來看所有類別的文章數量
    async getPostNumByCategory(callback) {
        const sql = "SELECT category, COUNT(*) AS count FROM posts GROUP BY category";
        try {
            const results = await mysql.query(sql);
            callback(null, results);
        } catch (error) {
            callback(0, error);
        }
    },
    // 根據作者 ID 取得文章
    async getPostsByAuthorId(authorId, callback) {
        const sql = "SELECT * FROM posts WHERE author_id = ?";
        const params = [authorId];
        try {
            const results = await mysql.query(sql, params);
            callback(null, results);
        } catch (error) {
            callback(0, error);
        }
    },
    // 根據文章ID取得文章的留言
    async getCommentsByPostId(postId, callback) {
        const sql = "SELECT * FROM comments WHERE post_id = ? ORDER BY id DESC";
        const params = [postId];
        try {
            const results = await mysql.query(sql, params);
            callback(null, results);
        } catch (error) {
            callback(0, error);
        }
    },
    // 建立文章的留言
    async createComment(postId, content, authorId, guestName, ipAddress, callback) {
        const sql = "INSERT INTO comments (post_id, content, author_id, guest_name, ip_address) VALUES (?, ?, ?, ?, ?)";
        const params = [postId, content, authorId, guestName, ipAddress];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.insertId);
        } catch (error) {
            callback(0, error);
        }
    },
    // 刪除文章的留言
    async deleteComment(commentId, callback) {
        const sql = "DELETE FROM comments WHERE id = ?";
        const params = [commentId];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 更新文章的留言
    async updateComment(commentId, content, callback) {
        const sql = "UPDATE comments SET content = ? WHERE id = ?";
        const params = [content, commentId];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 取得所有類別
    async getAllCategories(callback) {
        const sql = "SELECT content FROM postsettings WHERE posttype = 'category'";
        try {
            const results = await mysql.query(sql);
            // 將結果轉換成單純的字串陣列回傳，例如 ['Web Development', 'Python']
            const categories = results.map(row => row.content);
            callback(null, categories);
        } catch (error) {
            callback(0, error);
        }
    },
    // 新增分類
    async addCategory(category, callback) {
        const checksql = "SELECT * FROM postsettings WHERE content = ? AND posttype = 'category'";
        const checkparams = [category];
        try {
            const checkresult = await mysql.query(checksql, checkparams);
            if (checkresult.length > 0) {
                callback(1, "Category already exists");
                return;
            }
        } catch (error) {
            callback(0, error);
            return;
        }
        const sql = "INSERT INTO postsettings (content, posttype) VALUES (?, 'category')";
        const params = [category];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.insertId);
        } catch (error) {
            callback(0, error);
        }
    },
    // 刪除分類
    async deleteCategory(category, callback) {
        const sql = "DELETE FROM postsettings WHERE content = ? AND posttype = 'category'";
        const params = [category];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 更新分類
    async updateCategory(oldCategory, newCategory, callback) {
        const sql = "UPDATE postsettings SET content = ? WHERE content = ? AND posttype = 'category'";
        const params = [newCategory, oldCategory];
        try {
            await mysql.query(sql, params);
            callback(null);
        } catch (error) {
            callback(0, error);
        }
    },
};