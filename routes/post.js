var express = require('express');
var posts = require('../services/post');
var router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

/* GET posts listing. */
// 這個路由不需要驗證
router.get('/', function (req, res, next) {
    posts.getAllPosts(req, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        if (result === undefined) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.json({ data: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
    });
});

// 新增文章，需要驗證
router.post('/addpost', authMiddleware, function (req, res, next) {
    console.log(req.user);
    const { title, content, summary, tags, category } = req.body;
    const authorId = req.user.uuid; // 從 token 中取得使用者 ID

    posts.createPost(title, content, summary, tags, authorId, category, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

// 依照文章的標籤category來看該類別的文章數量
router.get("/getCategory", (req, res, next) => {
    posts.getPostNumByCategory((status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        if (result === undefined) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json(result);
    });
});

// 取得所有category
router.get('/categories', function (req, res, next) {
    console.log("get all categories");
    posts.getAllCategories((status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.json(result);
    });
});

// 新增category，需要驗證
router.post('/categories', authMiddleware, function (req, res, next) {
    const { category } = req.body;
    posts.addCategory(category, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        if (status === 1) {
            return res.status(409).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

// 刪除category，需要驗證
router.delete('/categories/:category', authMiddleware, function (req, res, next) {
    const category = req.params.category;
    posts.deleteCategory(category, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

// 更新category，需要驗證
router.put('/categories/:category', authMiddleware, function (req, res, next) {
    const { category } = req.body;
    const oldCategory = req.params.category;
    posts.updateCategory(oldCategory, category, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});



// 根據 ID 取得文章，不需要驗證
router.get('/:id', function (req, res, next) {
    const postId = req.params.id;
    posts.getPostById(postId, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        if (result === undefined) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.json(result);
    });
});

// 根據 ID 更新文章，需要驗證
router.put('/:id', authMiddleware, function (req, res, next) {
    const { title, content, summary, tags, category } = req.body;
    const authorId = (req.user && req.user.uuid) ? req.user.uuid : null; // 從 token 中取得使用者 ID
    const postId = req.params.id;
    posts.updatePost(postId, title, content, summary, tags, category, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        return res.status(201).json({ id: result });
    });
});

// 根據 ID 刪除文章，需要驗證
router.delete('/:id', authMiddleware, function (req, res, next) {
    const postId = req.params.id;
    posts.deletePost(postId, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

// 根據文章ID取得文章的留言，不需要驗證
router.get('/:id/comments', function (req, res, next) {
    const postId = req.params.id;
    posts.getCommentsByPostId(postId, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.json(result);
    });
});
// 根據文章ID新增文章的留言，不需要驗證
router.post('/:id/comments', function (req, res, next) {
    const postId = req.params.id;
    const { content } = req.body;
    const authorId = req.user.uuid || null; // 從 token 中取得使用者 ID
    const guestName = req.body.guestName || null; // 從 token 中取得使用者 name
    const ipAddress = req.body.ipAddress || null; // 從 token 中取得使用者 IP

    posts.createComment(postId, content, authorId, guestName, ipAddress, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

module.exports = router;