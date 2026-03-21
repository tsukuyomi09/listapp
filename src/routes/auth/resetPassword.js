const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");

const USER_RESET_PASSWORD_SECRET = process.env.USER_RESET_PASSWORD_SECRET;

router.post("/", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
        return res
            .status(400)
            .json({ message: "Invalid token or password too short." });
    }

    try {
        const decoded = jwt.verify(token, USER_RESET_PASSWORD_SECRET);

        if (decoded.purpose !== "reset") {
            return res.status(400).json({ message: "Invalid token purpose." });
        }

        const userId = decoded.userId;

        // Hash nuova password
        const hashedPassword = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });

        const query = "UPDATE users SET password = $1 WHERE user_id = $2";
        await client.query(query, [hashedPassword, userId]);

        return res.json({ message: "Password reset successfully." });
    } catch (err) {
        console.error("[ResetPassword]", err);
        if (err.name === "TokenExpiredError") {
            return res.status(400).json({ message: "Token expired." });
        }
        return res.status(400).json({ message: "Invalid token." });
    }
});

module.exports = router;
