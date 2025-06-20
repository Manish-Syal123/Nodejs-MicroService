const mongoose = require("mongoose");
require("dotenv").config();
// const MONGO_URI = "mongodb://localhost:27017/tasks";
const MONGO_URI = "mongodb://mongo:27017/tasks";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB......");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
