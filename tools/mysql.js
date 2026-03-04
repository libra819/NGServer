// tools/mysql.js

const mysql = require('mysql2');

// 1. 設定你的 MySQL 連接資訊
// 建議使用環境變數來管理這些敏感資訊，而不是直接寫在程式碼中
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',      // 資料庫主機位置
  user: process.env.DB_USER || 'demo', // 資料庫使用者名稱
  password: process.env.DB_PASSWORD || '12345678', // 資料庫密碼
  database: process.env.DB_NAME || 'blog', // 資料庫名稱
  waitForConnections: true,
  connectionLimit: 10, // 連線池最多可建立的連線數
  queueLimit: 0
};

// 2. 建立連接池 (Connection Pool)
// 使用連接池可以提高效能和穩定性，避免頻繁地建立和關閉連線
const pool = mysql.createPool(dbConfig);

// 3. 將連接池 Promise 化，方便使用 async/await
const promisePool = pool.promise();

// 4. 建立一個可以重複使用的查詢函式
/**
 * 執行 SQL 查詢
 * @param {string} sql - 要執行的 SQL 語法
 * @param {Array} params - SQL 語法中的參數 (可選)
 * @returns {Promise<Array>} - 回傳查詢結果
 */
async function query(sql, params) {
  try {
    // 從連接池中取得一個連線，並執行查詢
    // 使用 [rows, fields] 解構賦值，我們通常只需要 rows (查詢結果)
    const [rows, fields] = await promisePool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('資料庫查詢出錯:', error);
    // 拋出錯誤，讓呼叫這個函式的地方可以捕捉到
    throw error;
  }
}

// 5. 匯出查詢函式，讓其他檔案可以使用
module.exports = {
  query
};