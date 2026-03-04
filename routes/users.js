var express = require('express');
var userService = require('../services/users');
var router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// 更新使用者資料的範例路由
router.post('/profile', authMiddleware, function (req, res, next) {
  // 這裡可以使用 req.user 來取得經過驗證的使用者資訊
  const userId = req.user.uuid; // 假設 token payload 中有 id 欄位

  const { username, email } = req.body;
  // 在這裡處理更新使用者資料的邏輯
  userService.updateUser(userId, username, email, (status, result) => {
    if (status === 0) {
      return res.status(500).json({ message: "Error updating user profile" });
    }
    res.json({ message: `User ${userId} profile updated successfully` });
  });
});

// 檢視使用者資料
router.get('/profile', authMiddleware, function (req, res, next) {
  const userId = req.user.uuid; // 假設 token payload 中有 id 欄位

  userService.getUserById(userId, (status, user) => {
    if (status === 0) {
      return res.status(500).json({ message: "Error fetching user profile" });
    }
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }
    res.json({ uuid: user.uuid, username: user.username, email: user.email });
  });
});

module.exports = router;
