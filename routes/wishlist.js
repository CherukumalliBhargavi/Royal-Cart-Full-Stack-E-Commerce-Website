const router = require("express").Router();
const { query } = require("../db");
const auth = require("../middleware/auth");
router.use(auth);
router.get("/",async(req,res,next)=>{try{const r=await query("SELECT product_id AS \"productId\" FROM wishlist_items WHERE user_id=$1 ORDER BY created_at DESC",[req.user.id]);res.json({items:r.rows});}catch(e){next(e)}});
router.post("/",async(req,res,next)=>{try{const id=Number(req.body.productId);if(!Number.isInteger(id)||id<1)return res.status(400).json({message:"Invalid product."});await query("INSERT INTO wishlist_items(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[req.user.id,id]);res.status(201).json({message:"Added to wishlist"});}catch(e){next(e)}});
router.delete("/:id",async(req,res,next)=>{try{await query("DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2",[req.user.id,Number(req.params.id)]);res.json({message:"Removed from wishlist"});}catch(e){next(e)}});
module.exports=router;
