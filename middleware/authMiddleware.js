const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // 1. 從請求標頭中取得 token
  // 前端通常會將 token 放在 'Authorization' 標頭中，格式為 'Bearer <token>'
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '認證失敗：請求未包含 Token' });
  }

  const token = authHeader.split(' ')[1];

  // 2. 驗證 token
  try {
    // 使用你簽署 token 時用的同一個金鑰來驗證
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. 將解碼後的 payload (包含使用者資訊) 附加到 request 物件上
    // 這樣後續的路由處理函式就可以直接存取 req.user
    req.user = decoded; 

    // 4. 呼叫 next() 繼續執行下一個中介層或路由處理函式
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '認證失敗：Token 已過期' });
    }
    return res.status(403).json({ message: '認證失敗：無效的 Token' });
  }
}

module.exports = authMiddleware;