const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  const ownerId = "6756eb34fd1d8b85e449e576";
  let ownerUser = await User.findById(ownerId);
  if (!ownerUser) {
    const admin = new User({
      _id: new mongoose.Types.ObjectId(ownerId),
      email: "admin@wanderlust.com",
      username: "admin"
    });
    await User.register(admin, "admin123");
    console.log("Default admin owner created");
  }

  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({...obj, owner: ownerId}));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

main()
  .then(async () => {
    console.log("connected to DB");
    await initDB();
    await mongoose.disconnect();
    console.log("disconnected from DB");
  })
  .catch((err) => {
    console.log(err);
  });