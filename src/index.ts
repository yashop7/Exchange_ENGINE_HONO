import { Hono } from 'hono';
import { Engine } from './trade/Engine';
import { redisToken, redisUrl } from './config';
import { createClient } from 'redis';

const app = new Hono();

// A basic route to show the service is running
app.get('/', (c) => c.text('Hello from Hono on Cloudflare Workers!'));

// Start endpoint launches the background process via waitUntil.
app.post('/start', (c) => {
    // Launch the background process without delaying the response.
    c.executionCtx.waitUntil(main());
    return c.text('Started processing messages');
});

async function main() {
    const engine = new Engine();

    if (!redisUrl || !redisToken) {
        console.log("Redis URL and token must be provided in environment variables.");
        throw new Error("Redis URL and token must be provided in environment variables.");
    }

    // Pass the redis URL and token (as password) to the createClient options.
    const redisClient = createClient({
        url: redisUrl,
        password: redisToken
    });

    // Handle Redis errors
    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log("Connected to Redis Queue");

    const processMessages = async () => {
        try {
            // Use BRPOP to block until a message is available (timeout 0 blocks indefinitely)
            const result = await redisClient.brPop('messages', 0);

            if (result) {
                const { element: message } = result;
                await engine.process(JSON.parse(message));
            }

            // Process the next message immediately
            setImmediate(processMessages);
        } catch (error) {
            console.error('Error processing message:', error);
            // Wait a bit before retrying in case of errors
            setTimeout(processMessages, 1000);
        }
    };

    // Start the message processing loop
    await processMessages();
}

export default app;
