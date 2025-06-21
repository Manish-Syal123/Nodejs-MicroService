const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("./db/index");
const Task = require("./model/taskSchema");
const { Kafka } = require("kafkajs");
const PORT = 3002;

app.use(bodyParser.json());

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "my-kafka-task-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"], // Use env var or default
});

const producer = kafka.producer();

async function connectToKafkaWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      await producer.connect();
      console.log("Connected to Kafka");
      return;
    } catch (error) {
      console.log(`Error connecting to Kafka: ${error.message}`);
      retries--;
      console.log(
        `Retrying connection to Kafka in ${
          delay / 1000
        } seconds... (${retries} retries left)`
      );
      if (retries === 0) {
        console.error("Failed to connect to Kafka after multiple attempts");
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

    // Removed invalid isConnected check

    await producer.send({
      topic: "task_queue_topic",
      messages: [{ value: JSON.stringify(taskMessage) }],
    });
    console.log("Messages sent successfully!");
    // Removed producer.disconnect() to keep connection alive

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
  connectToKafkaWithRetry();
});
