const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getReceivedOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, restrictTo } = require("../middleware/auth");

router.post("/", protect, restrictTo("buyer"), createOrder);
router.get("/my", protect, restrictTo("buyer"), getMyOrders);
router.get("/received", protect, restrictTo("farmer"), getReceivedOrders);
router.put("/:id/status", protect, restrictTo("farmer"), updateOrderStatus);

module.exports = router;
