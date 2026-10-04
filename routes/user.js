const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const userController = require("../controllers/users.js");

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), userController.login);

router.get("/logout", userController.logout);

// Profile and Account Settings routes
router.get("/profile", isLoggedIn, wrapAsync(userController.renderProfile));
router.put("/profile", isLoggedIn, upload.single("avatar"), wrapAsync(userController.updateProfile));
router.put("/profile/password", isLoggedIn, wrapAsync(userController.changePassword));

module.exports = router;