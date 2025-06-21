# Node.js Microservice Demo Project

## Overview

This is a demo microservice project built with Node.js, demonstrating a simple architecture with multiple services communicating via RabbitMQ and MongoDB. The project includes the following services:

- **User Service**: Manages user data stored in MongoDB.
- **Task Service**: Manages tasks and communicates with RabbitMQ for messaging.
- **Notification Service**: Listens to RabbitMQ queues to process notifications (e.g., sending emails or push notifications).
- **MongoDB**: Database service for storing user and task data.
- **RabbitMQ**: Message broker for asynchronous communication between services.

The services are containerized using Docker and orchestrated with Docker Compose.

## Services

### MongoDB

- Uses the official MongoDB community server image.
- Data is persisted using a Docker volume named `mongo_data`.
- Exposes port `27017` for database connections.

### RabbitMQ

- Uses the official RabbitMQ image with management UI.
- Exposes port `5672` for AMQP protocol and `15672` for the management UI.
- Acts as the message broker for the microservices.

### User Service

- Built from the `user-service` directory.
- Connects to MongoDB to manage user data.
- Exposes port `3001`.

### Task Service

- Built from the `task-service` directory.
- Connects to MongoDB and RabbitMQ.
- Sends messages to RabbitMQ queues for asynchronous processing.
- Exposes port `3002`.

### Notification Service

- Built from the `notification-service` directory.
- Connects to RabbitMQ to consume messages from the `notification_Queue`.
- Processes notifications such as sending emails or push notifications (currently logs notifications for demonstration).
- Exposes port `3003`.

## How to Run

1. Make sure you have Docker and Docker Compose installed on your machine.

2. Clone this repository and navigate to the project root directory.

3. Build and start all services using Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. The services will start in the following order due to dependencies:

   - MongoDB
   - RabbitMQ
   - User Service
   - Task Service
   - Notification Service

5. You can access the RabbitMQ management UI at: [http://localhost:15672](http://localhost:15672)  
   Default credentials: guest / guest

## Notification Service Details

The Notification Service connects to RabbitMQ and asserts the existence of a durable queue named `notification_Queue`. It consumes messages from this queue, parses the notification data, and processes it. Currently, it logs the notification details to the console. This service can be extended to send real emails or push notifications.

Key code snippet from `notification-service/index.js`:

```javascript
const amqp = require("amqplib");

async function start() {
  const connection = await amqp.connect("amqp://rabbitmq_node");
  const channel = await connection.createChannel();
  await channel.assertQueue("notification_Queue", { durable: true });

  channel.consume("notification_Queue", async (msg) => {
    if (msg !== null) {
      const notification = JSON.parse(msg.content.toString());
      console.log("Received notification:", notification);
      // Process notification here
      channel.ack(msg);
    }
  });
}

start().catch(console.error);
```

## Project Structure

```
.
├── docker-compose.yml
├── notification-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── task-service/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── db/
│   └── model/
└── user-service/
    ├── Dockerfile
    ├── index.js
    ├── package.json
    ├── db/
    └── model/
```

## Notes

- Ensure Docker daemon is running before starting the services.
- Modify service ports in `docker-compose.yml` if there are conflicts on your machine.
- Extend the services as needed for your application requirements.

## License

This project is provided as-is for demonstration purposes.
