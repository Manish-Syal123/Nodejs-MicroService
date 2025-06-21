const amqp = require("amqplib");

async function start() {
  try {
    connection = await amqp.connect("amqp://rabbitmq_node");
    channel = await connection.createChannel();

    //assertQueue is a method that ensures a queue exists.So the assertQueue call is used to declare a queue named "notification_Queue" and ensure it exists before consuming messages from it.{ durable: true } means the queue will survive broker restarts.
    await channel.assertQueue("task_Queue", { durable: true });
    console.log("Notification service is listening for messages...");

    channel.consume("task_Queue", async (msg) => {
      if (msg !== null) {
        const taskData = JSON.parse(msg.content.toString());
        console.log("Received notification:", taskData);
        console.log(
          `Notification for user ${taskData.data.userId}: ${taskData.data.title}`
        );

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error starting notification service:", error);
  }
}

start();
