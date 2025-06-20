const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("./db/index");
const User = require("./model/userSchema");
const PORT = 3001;

app.use(bodyParser.json());

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.log("Error creating user:", error.message);

    res
      .status(400)
      .json({ error: "Error creating user", details: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error.message);
    res
      .status(500)
      .json({ error: "Error fetching users", details: error.message });
  }
});
app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.listen(PORT, () => {
  console.log(`User Service is running on port http://localhost:${PORT}`);
});
