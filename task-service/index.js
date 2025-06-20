const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("./db/index");
const Task = require("./model/taskSchema");
const PORT = 3002;

app.use(bodyParser.json());

app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;

  if (!title || !description || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const task = new Task({ title, description, userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Task Service is running");
});

app.listen(PORT, () => {
  console.log(`Task Service is running on port http://localhost:${PORT}`);
});
