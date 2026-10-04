const User = require("../models/user.js");
const Listing = require("../models/listing.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });

        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to WanderLust");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

// Profile Dashboard
module.exports.renderProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    const userListings = await Listing.find({ owner: req.user._id });
    res.render("users/profile.ejs", { user, userListings });
};

// Update Personal Details & Profile Picture
module.exports.updateProfile = async (req, res) => {
    try {
        let { name, email, bio, phone } = req.body;
        let user = await User.findById(req.user._id);

        if (email) user.email = email.trim();
        if (typeof name !== "undefined") user.name = name.trim();
        if (typeof bio !== "undefined") user.bio = bio.trim();
        if (typeof phone !== "undefined") user.phone = phone.trim();

        if (req.file) {
            let url;
            if (req.file.path.startsWith("http")) {
                url = req.file.path;
            } else {
                url = "/uploads/" + req.file.filename;
            }
            user.avatar = {
                url: url,
                filename: req.file.filename
            };
        } else if (req.body.avatarUrl && req.body.avatarUrl.trim()) {
            user.avatar = {
                url: req.body.avatarUrl.trim(),
                filename: "custom_avatar"
            };
        }

        await user.save();
        req.flash("success", "Profile updated successfully!");
        res.redirect("/profile");
    } catch (err) {
        req.flash("error", err.message || "Failed to update profile.");
        res.redirect("/profile");
    }
};

// Update Password
module.exports.changePassword = async (req, res) => {
    try {
        let { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword) {
            req.flash("error", "Both current and new passwords are required.");
            return res.redirect("/profile");
        }
        if (newPassword !== confirmPassword) {
            req.flash("error", "New password and confirm password do not match.");
            return res.redirect("/profile");
        }
        if (newPassword.length < 4) {
            req.flash("error", "New password must be at least 4 characters long.");
            return res.redirect("/profile");
        }

        let user = await User.findById(req.user._id);
        await user.changePassword(oldPassword, newPassword);
        req.flash("success", "Password updated successfully!");
        res.redirect("/profile");
    } catch (err) {
        req.flash("error", err.message || "Failed to update password. Please check your current password.");
        res.redirect("/profile");
    }
};