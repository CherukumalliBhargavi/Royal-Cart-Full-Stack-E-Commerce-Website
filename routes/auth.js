const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
const auth = require("../middleware/auth");
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
function makeToken(user) { return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" }); }
router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim(), email = String(req.body.email || "").trim().toLowerCase(), password = String(req.body.password || "");
    if (name.length < 2 || !emailOk(email) || password.length < 6) return res.status(400).json({ message: "Enter a valid name, email and password of at least 6 characters." });
    const hash = await bcrypt.hash(password, 12);
    const result = await query("INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,created_at", [name,email,hash]);
    const user = result.rows[0]; res.status(201).json({ user, token: makeToken(user) });
  } catch (e) { if (e.code === "23505") return res.status(409).json({ message: "This email is already registered. Please log in." }); next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase(), password = String(req.body.password || "");
    const result = await query("SELECT id,name,email,password_hash FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({ message: "Email or password is incorrect." });
    res.json({ user: { id:user.id,name:user.name,email:user.email }, token: makeToken(user) });
  } catch (e) { next(e); }
});
router.get("/me", auth, async (req,res,next) => {
  try { const r=await query("SELECT id,name,email,created_at FROM users WHERE id=$1",[req.user.id]); if(!r.rows[0])return res.status(404).json({message:"User not found"});res.json({user:r.rows[0]}); } catch(e){next(e);}
});
router.post("/logout", (_req,res) => res.json({message:"Logged out on client. Remove the saved token."}));
module.exports = router;
