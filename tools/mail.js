// tools/mail.js

const nodemailer = require('nodemailer');

// 1. 設定你的 SMTP 連接資訊
// 建議使用環境變數來管理敏感資訊，預設值已根據你的需求填入
const mailConfig = {
    host: process.env.MAIL_HOST || 'mail.test.com', // SMTP 伺服器
    port: process.env.MAIL_PORT || 587,               // 埠號 (通常 587 使用 TLS)
    secure: false,                                    // 587 埠通常設為 false (STARTTLS)
    auth: {
        user: process.env.MAIL_USER || 'service',      // 驗證帳號
        pass: process.env.MAIL_PASS || 'test', // 驗證密碼
    },
    tls: {
        // 根據你的 --tls 參數，這裡確保啟用安全傳輸
        rejectUnauthorized: false // 如果伺服器憑證是自簽的，可設為 false
    }
};

// 2. 建立傳送器 (Transporter)
const transporter = nodemailer.createTransport(mailConfig);

/**
 * 3. 建立一個可以重複使用的寄信函式
 * @param {string} to - 收件人信箱
 * @param {string} subject - 郵件主旨
 * @param {string} html - 郵件內容 (支援 HTML)
 * @param {string} text - 郵件內容 (純文字備案，可選)
 * @returns {Promise<Object>} - 回傳寄送結果資訊
 */
async function sendMail(to, subject, html, text = '') {
    try {
        const mailOptions = {
            from: `"Service" <${process.env.MAIL_FROM || 'service@mail.test.com'}>`, // 寄件者
            to: to,           // 收件者
            subject: subject, // 主旨
            text: text,       // 純文字內容
            html: html        // HTML 內容
        };

        // 執行寄送
        const info = await transporter.sendMail(mailOptions);

        console.log('郵件寄送成功: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('郵件寄送出錯:', error);
        // 拋出錯誤，讓呼叫這個函式的地方可以捕捉到
        throw error;
    }
}

// 4. 匯出寄信函式
module.exports = {
    sendMail
};