var express = require("express");
var authService = require("../services/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendMail } = require('../tools/mail');
var router = express.Router();

// POST /api/auth/login
router.post("/login", async function (req, res, next) {
  const { email, username, password } = req.body;
  console.log(email, username, password);
  // 驗證使用者
  authService.login(email, username, password, (status, user) => {
    if (status === 0) {
      res.status(500).json({ message: "Error during login" });
      return;
    }
    if (status === 1) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // TODO: Generate JWT token
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.username,
      // 你可以加入 role 等其他資訊
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    // 簽發 Refresh Token (長效，例如 7 天)
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: "Login successful", accessToken: accessToken,
      refreshToken: refreshToken
    });
  });
});

// 2. 新增換發 Token 的 API
router.post('/refresh', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: '請提供 Refresh Token' });
  }

  // (選用) 檢查資料庫確認這個 Refresh Token 是否合法且未被撤銷

  // 驗證 Refresh Token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Refresh Token 過期或無效，請重新登入' });

    // 剔除 jwt 產生 payload 時自帶的 iat, exp 等過期時間屬性
    // TODO: Generate JWT token
    const payload = {
      uuid: user.uuid,
      email: user.email,
      name: user.username,
      // 你可以加入 role 等其他資訊
    };

    // 重新簽發一把新的 Access Token
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  });
});

// POST /api/auth/register
router.post("/register", async function (req, res, next) {
  const { username, email, password } = req.body;

  if (!process.env.register) {
    return res.status(403).json({ message: "Services is disabled" });
  }
  // 在呼叫 service 之前，檢查變數是否為 undefined 或空值
  if (!username || !email || !password) {
    // 如果缺少任何一個，就回傳一個錯誤請求(400)的狀態碼
    return res
      .status(400)
      .json({ message: "必須提供使用者名稱、電子郵件和密碼" });
  }
  // 加密密碼
  const hashedPassword = await bcrypt.hash(password, 10);

  // 儲存新使用者
  await authService.createUser(
    username,
    email,
    hashedPassword,
    (status, userId) => {
      if (status === 0) {
        res.status(500).json({ message: "Error creating user" });
        return;
      }
      if (status === 1) {
        return res
          .status(409)
          .json({ message: "Username or email already exists" });
      }
      res.status(201).json({ message: "User registered successfully" });
    }
  );
});

// POST /api/auth/forgetpassword
router.post("/forgetpassword", async function (req, res, next) {
  const { username, email, password } = req.body;

  // 在呼叫 service 之前，檢查變數是否為 undefined 或空值
  if (!username || !email || !password) {
    // 如果缺少任何一個，就回傳一個錯誤請求(400)的狀態碼
    return res
      .status(400)
      .json({ message: "必須提供使用者名稱、電子郵件和密碼" });
  }
  // 加密密碼
  const hashedPassword = await bcrypt.hash(password, 10);

  // 檢查使用者是否存在
  authService.findUserByUsernameAndEmail(username, email, (status, user) => {
    if (status === 0) {
      res.status(500).json({ message: "Error checking user" });
      return;
    }
    else if (status === 1) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    else {
      authService.updatePassword(username, email, hashedPassword, (status, result) => {
        if (status === 0) {
          res.status(500).json({ message: "Error updating password" });
          return;
        }
        res.status(200).json({ message: "Password updated successfully" });
      });
    }
  });
});
// 更新token註冊的路由
router.post("/updateToken", async function (req, res, next) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
});

module.exports = router;
