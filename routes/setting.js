var express = require('express');
var settingService = require('../services/setting');
var router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// 取得使用者設定
router.get('/', authMiddleware, function (req, res, next) {
    const userId = req.user.id;
    settingService.getSetting(userId, (status, result) => {
        if (status === 0) {
            return res.status(500).json({ error: result });
        }
        res.json(result);
    });
});

module.exports = router;