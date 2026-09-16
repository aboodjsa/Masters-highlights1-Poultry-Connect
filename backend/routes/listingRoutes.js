const express = require("express");
const router = express.Router();
const {
  getAllListings,
  getMyListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/", getAllListings);
router.get("/my/listings", protect, restrictTo("farmer"), getMyListings);
router.get("/:id", getListingById);
router.post("/", protect, restrictTo("farmer"), createListing);
router.put("/:id", protect, restrictTo("farmer"), updateListing);
router.delete("/:id", protect, restrictTo("farmer"), deleteListing);

module.exports = router;
