const Listing = require("../models/Listing");

// @route GET /api/listings  (public - buyers browse all available listings)
exports.getAllListings = async (req, res) => {
  try {
    const { poultryType, location } = req.query;
    const filter = {};
    if (poultryType) filter.poultryType = poultryType;
    if (location) filter.location = { $regex: location, $options: "i" };

    const listings = await Listing.find(filter)
      .populate("farmer", "name location phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: listings.length, listings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/listings/my/listings (farmer only - own listings)
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ count: listings.length, listings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/listings/:id (public)
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "farmer",
      "name location phone"
    );
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.status(200).json({ listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/listings (farmer only)
exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, farmer: req.user._id });
    res.status(201).json({ listing });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route PUT /api/listings/:id (farmer, owner only)
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own listings" });
    }

    Object.assign(listing, req.body);
    await listing.save();

    res.status(200).json({ listing });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route DELETE /api/listings/:id (farmer, owner only)
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    await listing.deleteOne();
    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
