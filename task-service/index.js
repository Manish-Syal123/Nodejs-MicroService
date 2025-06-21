const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("./db/index");
const Task = require("./model/taskSchema");
const amqp = require("amqplib");
const PORT = 3002;

app.use(bodyParser.json());

let channel, connection;

async function connectToRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq_node");
      channel = await connection.createChannel();
      await channel.assertQueue("task_Queue", { durable: true });
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.log(`Error connecting to RabbitMQ: ${error.message}`);
      retries--;
      console.log(
        `Retrying connection to RabbitMQ in ${
          delay / 1000
        } seconds... (${retries} retries left)`
      );
      if (retries === 0) {
        console.error("Failed to connect to RabbitMQ after multiple attempts");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;

  if (!title || !description || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const task = new Task({ title, description, userId });
    await task.save();

    const taskMessage = {
      type: "task_created",
      data: {
        id: task._id,
        title: task.title,
        description: task.description,
        userId: task.userId,
      },
    };

    if (!channel) {
      return res.status(503).json({ error: "RabbitMq is not connected" });
    }

    channel.sendToQueue("task_Queue", Buffer.from(JSON.stringify(taskMessage)));

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
  connectToRabbitMQWithRetry();
});
