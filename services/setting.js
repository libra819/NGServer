var mysql = require("../tools/mysql");

module.exports = {
    // 取得使用者設定
    async getSetting(userId, callback) {
        const sql = "SELECT * FROM settings WHERE user_id = ?";
        const params = [userId];
        try {
            const results = await mysql.query(sql, params);
            callback(null, results[0]);
        } catch (error) {
            callback(0, error);
        }
    },
    // 更新使用者設定
    async updateSetting(userId, setting, callback) {
        const sql = "UPDATE settings SET ? WHERE user_id = ?";
        const params = [setting, userId];
        try {
            const result = await mysql.query(sql, params);
            callback(null, result.affectedRows);
        } catch (error) {
            callback(0, error);
        }
    },
}
