var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware'); // 引入你的驗證 middleware

// 1. 從環境變數讀取上傳目錄，如果沒讀到則給予一個預設的 fallback 路徑
const uploadDir = process.env.uploadDir == '../public/uploads' ? path.join(__dirname, '../public/uploads') : process.env.uploadDir;

// 2. 確保該目錄存在 (若無則自動建立)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 設定 multer 儲存引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // 將圖片儲存到 public/uploads 資料夾
    },
    filename: function (req, file, cb) {
        // 重新命名檔案，避免檔名衝突 (時間戳記 + 隨機亂數 + 原始副檔名)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

/* * POST 圖片上傳
 * 使用 authMiddleware 進行 Token 防護
 * Editor.js 預設會將檔案放在名為 'image' 的表單欄位中
 */
router.post('/image', authMiddleware, upload.single('image'), (req, res, next) => {
    // req.user 已經由 authMiddleware 解析出來了
    // console.log(`User ${req.user.uuid} is uploading an image.`);

    if (!req.file) {
        return res.status(400).json({
            success: 0,
            message: '沒有接收到檔案'
        });
    }

    // 因為 app.js 已經把 'public' 設為靜態資料夾
    // 所以檔案在 public/uploads/xxx.jpg，可以直接用 /uploads/xxx.jpg 訪問
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // 嚴格遵守 Editor.js 要求的 JSON 回傳格式
    res.status(200).json({
        success: 1,
        file: {
            url: fileUrl
        }
    });
});

module.exports = router;