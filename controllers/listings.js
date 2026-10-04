const Listing = require("../models/listing");
const { geocodeAddress } = require("../utils/geocode");

module.exports.index = async (req, res) => {
    const { search, category } = req.query;
    let filter = {};
    let searchQuery = "";

    if (search) {
        searchQuery = search.trim();
        filter.$or = [
            { title: new RegExp(searchQuery, "i") },
            { location: new RegExp(searchQuery, "i") },
            { country: new RegExp(searchQuery, "i") },
            { category: new RegExp(searchQuery, "i") }
        ];
    }

    if (category && category !== "All") {
        filter.category = new RegExp(`^${category}$`, "i");
    }

    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings, searchQuery, activeCategory: category || "All" });
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" }, }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exists!!");
        res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let url = "";
    let filename = "listingimage";

    // 1. If file was uploaded from device
    if (req.file) {
        if (req.file.path && req.file.path.startsWith("http")) {
            url = req.file.path;
        } else if (req.file.filename) {
            url = "/uploads/" + req.file.filename;
        }
        filename = req.file.filename || "uploaded_file";
    }

    // 2. If image link / URL was provided in text input
    if (!url) {
        const potentialUrl = 
            (req.body.listing && req.body.listing.imageUrl) ||
            (req.body.listing && typeof req.body.listing.image === "string" && req.body.listing.image) ||
            (req.body.listing && req.body.listing.image && req.body.listing.image.url) ||
            req.body.imageUrl ||
            req.body.image;

        if (potentialUrl && typeof potentialUrl === "string" && potentialUrl.trim().length > 0) {
            url = potentialUrl.trim();
            filename = "custom_url";
        }
    }

    // 3. Fallback only if no file and no link provided
    if (!url) {
        url = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60";
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    const coordinates = await geocodeAddress(req.body.listing.location, req.body.listing.country);
    newListing.geometry = {
        type: "Point",
        coordinates: coordinates
    };

    await newListing.save();
    req.flash("success", "New Listing Created!!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exists!!");
        return res.redirect("/listings");
    }

    let originalImageUrl = "";
    if (listing.image) {
        if (typeof listing.image === "string") {
            originalImageUrl = listing.image;
        } else if (listing.image.url) {
            originalImageUrl = listing.image.url;
        }
    }
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    let updatedUrl = "";
    let updatedFilename = "";

    if (typeof req.file !== "undefined" && req.file) {
        if (req.file.path && req.file.path.startsWith("http")) {
            updatedUrl = req.file.path;
        } else if (req.file.filename) {
            updatedUrl = "/uploads/" + req.file.filename;
        }
        updatedFilename = req.file.filename || "updated_file";
    } else {
        const potentialUrl = 
            (req.body.listing && req.body.listing.imageUrl) ||
            (req.body.listing && typeof req.body.listing.image === "string" && req.body.listing.image) ||
            (req.body.listing && req.body.listing.image && req.body.listing.image.url) ||
            req.body.imageUrl ||
            req.body.image;

        if (potentialUrl && typeof potentialUrl === "string" && potentialUrl.trim().length > 0) {
            updatedUrl = potentialUrl.trim();
            updatedFilename = "custom_url";
        }
    }

    if (updatedUrl) {
        listing.image = { url: updatedUrl, filename: updatedFilename };
        await listing.save();
    }

    if (req.body.listing && (req.body.listing.location || req.body.listing.country)) {
        const coordinates = await geocodeAddress(listing.location, listing.country);
        listing.geometry = {
            type: "Point",
            coordinates: coordinates
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated!!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!!");
    res.redirect("/listings");
};