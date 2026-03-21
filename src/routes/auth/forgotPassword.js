const express = require("express");
const router = express.Router();
const { client } = require("../../database/db");
const jwt = require("jsonwebtoken");
const { sendResetPasswordEmail } = require("../../utils/resetPasswordEmail");

const isProduction = process.env.NODE_ENV === "production";
const baseUrl = isProduction ? "https://wordrops.com" : "http://localhost:3000";

const USER_RESET_PASSWORD_SECRET = process.env.USER_RESET_PASSWORD_SECRET;

router.post("/", async (req, res) => {
    try {
        const { userEmail } = req.body;
        console.log(userEmail);

        const query = "SELECT user_id, email FROM users WHERE email = $1";
        const { rows } = await client.query(query, [userEmail]);

        if (rows.length > 0) {
            const user = rows[0];
            console.log(
                `[ResetPassword] User found: user_id=${user.user_id}, email=${user.email}`
            );

            const token = jwt.sign(
                { userId: user.user_id, purpose: "reset" },
                USER_RESET_PASSWORD_SECRET,
                { expiresIn: "15m" }
            );

            const resetLink = `${baseUrl}/reset-password?token=${token}`;

            await sendResetPasswordEmail(user.email, resetLink);
            console.log(`[ResetPassword] Reset email sent to ${user.email}`);
        } else {
            console.log(
                `[ResetPassword] No user found with email: ${userEmail}`
            );
        }

        // Risposta neutra per privacy (anche se non trovato)
        return res.json({
            message:
                "If that email exists, you'll receive a reset link shortly.",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
