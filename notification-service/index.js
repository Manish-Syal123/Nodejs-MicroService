const { Kafka } = require("kafkajs");

// Initialize Kafka client
const kafka = new Kafka({
  clientId: "my-kafka-notification-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"], // Use env var or default
});

// Create a consumer
const consumer = kafka.consumer({ groupId: "notification-service-group" });

async function start() {
  const maxRetries = 10;
  const retryDelay = 5000; // 5 seconds
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await consumer.connect();
      await consumer.subscribe({
        topic: "task_queue_topic",
        fromBeginning: true,
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log(`Received message: ${message.value.toString()}`);
          if (message !== null) {
            const taskData = JSON.parse(message.value.toString());
            console.log("Received notification:", taskData);
            console.log(
              `Notification for user ${taskData.data.userId}: ${taskData.data.title}`
            );
          }
        },
      });

      // Graceful shutdown handling
      const shutdown = async () => {
        console.log("Disconnecting consumer...");
        await consumer.disconnect();
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      // If connected and running successfully, break the retry loop
      break;
    } catch (error) {
      retries++;
      console.error(
        `Error starting notification service (attempt ${retries} of ${maxRetries}):`,
        error
      );
      if (retries >= maxRetries) {
        console.error("Max retries reached. Exiting.");
        process.exit(1);
      }
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

start();
