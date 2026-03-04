var mysql = require("../tools/mysql");
const bcrypt = require("bcryptjs");
module.exports = {
    // 帳號密碼登入
    async login(email, username, password, callback) {
        const sql = "SELECT * FROM members WHERE username = ? AND email = ? AND status = 1";
        const params = [username, email];
        try {
            const results = await mysql.query(sql, params);
            if (results.length === 0) {
                callback(1, null);
                return;
            }
            const isPasswordMatch = await bcrypt.compare(password, results[0].paswd);
            callback(isPasswordMatch ? null : 401, isPasswordMatch ? results[0] : null);
        } catch (error) {
            callback(0, error);
        }
    },
    // 建立使用者
    async createUser(username, email, password, callback) {
        try {
            const sql = "SELECT * FROM members WHERE username = ? OR email = ?";
            const params = [username, email];
            const results = await mysql.query(sql, params);
            if (results.length > 0) {
                callback(1, results[0]);
                return;
            }
        } catch (error) {
            callback(0, error);
            return;
        }
        const sql = "INSERT INTO members (username, email, paswd) VALUES (?, ?, ?)";
        const params = [username, email, password];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.insertId);
        } catch (error) {
            callback(0, error);
        }
    },
    // 根據 username、email 查找使用者
    async findUserByUsernameAndEmail(username, email, callback) {
        const sql = "SELECT * FROM members WHERE username = ? OR email = ?";
        const params = [username, email];
        try {
            const results = await mysql.query(sql, params);
            if (results.length === 0) {
                callback(1, null);
                return;
            }
            callback(null, results[0]); // 返回第一個結果
        } catch (error) {
            callback(0, error);
        }
    },

    // 更新密碼
    async updatePassword(username, email, password, callback) {
        const sql = "UPDATE members SET paswd = ? WHERE username = ? AND email = ?";
        const params = [password, username, email];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.affectedRows);
        } catch (error) {
            callback(0, error);
        }
    },
};
