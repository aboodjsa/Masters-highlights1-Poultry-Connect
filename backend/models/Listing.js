const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    poultryType: {
      type: String,
      enum: ["Broiler Chicken", "Layer Chicken", "Eggs", "Turkey", "Duck", "Other"],
      required: true,
    },
    description: { type: String, trim: true },
    quantity: { type: Number, required: [true, "Quantity is required"], min: 1 },
    unit: {
      type: String,
      enum: ["birds", "crates", "kg"],
      default: "birds",
    },
    pricePerUnit: { type: Number, required: [true, "Price is required"], min: 0 },
    location: { type: String, required: [true, "Location is required"], trim: true },
    status: {
      type: String,
      enum: ["available", "sold out"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
