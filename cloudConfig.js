const path = require("path");
const fs = require("fs");
const multer = require("multer");

let cloudinary;
let storage;

const isCloudinaryConfigured = 
    process.env.CLOUD_NAME && 
    process.env.CLOUD_API_KEY && 
    process.env.CLOUD_API_SECRET &&
    process.env.CLOUD_NAME !== "" &&
    process.env.CLOUD_NAME !== "undefined";

if (isCloudinaryConfigured) {
    cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: "wanderlust_DEV",
            allowed_formats: ["png", "jpg", "jpeg", "webp"],
        },
    });
} else {
    // Local uploads directory
    const uploadDir = path.join(__dirname, "public/uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname) || ".jpg";
            cb(null, "img-" + uniqueSuffix + ext);
        }
    });
}

module.exports = {
    cloudinary, 
    storage,
};