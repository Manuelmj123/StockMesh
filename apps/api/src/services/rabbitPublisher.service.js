const amqp = require("amqplib");

const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const exchangeName = process.env.RABBITMQ_EXCHANGE || "inventory.exchange";

let connection = null;
let channel = null;
let isConnecting = false;

async function ensureChannel() {
  if (channel) {
    return channel;
  }

  if (isConnecting) {
    while (!channel) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return channel;
  }

  isConnecting = true;

  try {
    connection = await amqp.connect(rabbitUrl);

    connection.on("error", (error) => {
      console.error("RabbitMQ connection error", error);
      channel = null;
      connection = null;
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      channel = null;
      connection = null;
    });

    channel = await connection.createChannel();

    await channel.assertExchange(exchangeName, "topic", {
      durable: true
    });

    return channel;
  } finally {
    isConnecting = false;
  }
}

async function publishInventoryUpdate(payload) {
  const routingKey = process.env.RABBITMQ_ROUTING_KEY || "inventory.updated";
  const activeChannel = await ensureChannel();

  activeChannel.publish(
    exchangeName,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: "application/json"
    }
  );
}

module.exports = {
  publishInventoryUpdate
};