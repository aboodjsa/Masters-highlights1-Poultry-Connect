const Order = require("../models/Order");
const Listing = require("../models/Listing");

// @route POST /api/orders (buyer only)
exports.createOrder = async (req, res) => {
  try {
    const { listingId, quantityOrdered } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.status === "sold out") {
      return res.status(400).json({ message: "This listing is sold out" });
    }

    if (quantityOrdered > listing.quantity) {
      return res.status(400).json({ message: "Ordered quantity exceeds available quantity" });
    }

    const totalPrice = quantityOrdered * listing.pricePerUnit;

    const order = await Order.create({
      listing: listing._id,
      buyer: req.user._id,
      farmer: listing.farmer,
      quantityOrdered,
      totalPrice,
    });

    res.status(201).json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route GET /api/orders/my (buyer only - orders I placed)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("listing", "title poultryType unit")
      .populate("farmer", "name phone location")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/orders/received (farmer only - orders placed on my listings)
exports.getReceivedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate("listing", "title poultryType unit")
      .populate("buyer", "name phone location")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/orders/:id/status (farmer only - accept/reject/complete)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["accepted", "rejected", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only manage orders on your own listings" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
