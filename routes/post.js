var express = require('express');
var posts = require('../services/post');
var router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
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
router.post('/addpost', authMiddleware, async function (req, res, next) {
    const { title, content, summary, tags, category } = req.body;
    const pswd = req.body.pswd ? req.body.pswd : "";
    const authorId = req.user.uuid; // 從 token 中取得使用者 ID
    // 加密密碼
    let hashedPassword = null;
    if (pswd != "") {
        hashedPassword = await bcrypt.hash(pswd, 10);
    }

    posts.createPost(title, content, summary, tags, authorId, category, hashedPassword, (status, result) => {
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
        if (result.paswd === null) {
            result.paswd = false;
        } else {
            result.paswd = true;
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
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '你的_Google_reCAPTCHA_私鑰(Secret_Key)';
// 根據文章ID新增文章的留言，不需要驗證
router.post('/:id/comments', async function (req, res, next) {
    const postId = req.params.id;
    // 接收前端傳來的資料，包含 recaptchaToken
    const { content, guestName, recaptchaToken } = req.body;
    // 手動解析 Token
    let authorId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            // 解析 Token，這裡的 secret 要與你登入時簽發的設定一致
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            authorId = decoded.uuid; // 成功解析出會員 ID
            guestName = decoded.username;
        } catch (err) {
            // 💡 如果 Token 過期，回傳 401 讓 Angular 攔截器自動幫你換新 Token 並重送！
            return res.status(401).json({ error: 'Token 已過期' });
        }
    }
    // 取得使用者 IP (優先看 x-forwarded-for 避免被 Nginx 蓋掉)
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    // 1. 向 Google 驗證 reCAPTCHA Token
    // const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}&remoteip=${ipAddress}`;
    // const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
    // const recaptchaData = await recaptchaRes.json();

    // 1. 改為只打基本網址
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    // 2. 使用 URLSearchParams 來自動處理編碼與格式
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET_KEY);
    params.append('response', recaptchaToken);

    // 在 localhost 開發時，IP 通常是 '::1'，有時候傳送本地 IP 給 Google 會怪怪的
    // remoteip 是選填的，建議在本地測試時先註解掉，上線再打開
    // if (ipAddress) params.append('remoteip', ipAddress);

    // 3. 發送 POST 請求 (URLSearchParams 會自動幫你加上正確的 Content-Type headers)
    const recaptchaRes = await fetch(verifyUrl, {
        method: 'POST',
        body: params
    });

    const recaptchaData = await recaptchaRes.json();
    // console.log('Google 驗證結果:', recaptchaData); // 加上這行方便除錯

    if (!recaptchaData.success) {
        return res.status(403).json({ error: "機器人驗證失敗，請重新勾選" });
    }
    const finalGuestName = authorId ? null : (guestName || '訪客');
    // console.log("create comment：", postId, content, authorId, finalGuestName, ipAddress);
    posts.createComment(postId, content, authorId, finalGuestName, ipAddress, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.status(201).json({ id: result });
    });
});

module.exports = router;