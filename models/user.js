const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        default: "",
    },
    avatar: {
        url: {
            type: String,
            default: "",
        },
        filename: String,
    },
    bio: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
        default: "",
    }
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);