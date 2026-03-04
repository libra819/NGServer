var mysql = require("../tools/mysql");

module.exports = {
  // 取得所有使用者
  async getAllUsers() {
    const sql = "SELECT * FROM members";
    return await mysql.query(sql);
  },

  // 建立使用者
  async createUser(username, email, callback) {
    // 檢查 username 和 email 是否已存在
    const user = await this.getUserByUsername(username, (status, result) => {
      if (status==0) {
        return callback(status, result);
      }
      return result;
    });
    if (user) {
      return callback(1, "Username already exists");
    }
    const emailUser = await this.getUserByEmail(email, (status, result) => {
      if (status==0) {
        return callback(status, result);
      }
      return result;
    });
    if (emailUser) {
      return callback(1, "Email already exists");
    }

    // 建立新使用者
    const sql = "INSERT INTO members (username, email) VALUES (?, ?)";
    const params = [username, email];
    try {
        const result = await mysql.query(sql, params);
        callback(null, result.insertId);
    } catch (error) {
        callback(0,error);
    }
  },
  // 根據 username 取得使用者
  async getUserByUsername(username, callback) {
    const sql = "SELECT * FROM members WHERE username = ?";
    const params = [username];
    try {
        const results = await mysql.query(sql, params);
        callback(null, results[0]);
    } catch (error) {
        callback(0,error);
    }
  },
  // 根據 email 取得使用者
  async getUserByEmail(email, callback) {
    const sql = "SELECT * FROM members WHERE email = ?";
    const params = [email];
    try {
        const results = await mysql.query(sql, params);
        callback(null, results[0]);
    } catch (error) {
        callback(0,error);
    }
  },
  // 更新使用者
  async updateUser(userId, username, email, callback) {
    // 先確認使用者是否存在
    const user = await this.getUserByUsername(username, (status, result) => {
      if (status==0) {
        return callback(status, result);
      }
      return result;
    });
    if (!user) {
      return callback(1, "User not found");
    }
    // 更新使用者資訊
    const sql = "UPDATE members SET username = ?, email = ? WHERE id = ?";
    const params = [username, email, user.id];
    try {
        const result = await mysql.query(sql, params);
        callback(null, result.affectedRows);
    } catch (error) {
        callback(0,error);
    }
  },
  // 刪除使用者
  async deleteUser(username, callback) {
    // 先確認使用者是否存在
    const user = await this.getUserByUsername(username, (err, user) => {
      if (err) {
        return callback(err);
      }
      return user;
    });
    if (!user) {
      return callback(new Error("User not found"));
    }
    // 刪除使用者
    const sql = "DELETE FROM members WHERE id = ?";
    const params = [user.id];
    try {
        const result = await mysql.query(sql, params);
        callback(null, result.affectedRows);
    } catch (error) {
        callback(0,error);
    }
  },
  // 根據 ID 取得使用者
  async getUserById(userId, callback) {
    const sql = "SELECT * FROM members WHERE id = ?";
    const params = [userId];
    try {
        const results = await mysql.query(sql, params);
        callback(null, results[0]);
    } catch (error) {
        callback(0,error);
    }
  }
};
