import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import { createClient } from 'redis';

dotenv.config();

const PORT = process.env.PORT || 5002;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log('Starting server.js...');
console.log(`Connecting to Redis on port ${REDIS_PORT}...`);

// Create and configure Redis client
const client = createClient({
  socket: { port: REDIS_PORT }
});

// Handle Redis connection errors
client.on("error", (err) => console.log("Redis Client Error", err));
// Connect to Redis (async/await required at top-level)
await client.connect();

const app = express();

// Middleware to check Redis cache before fetching from GitHub
async function cache(req, res, next) {
  const { username } = req.params;
  try {
    // Try to get cached data from Redis
    const data = await client.get(username);
    if (data) {
      console.log(`Cache hit: ${username}`);
      // If found, return cached data
      res.json(JSON.parse(data));
    } else {
      console.log(`Cache miss: ${username}`);
      // If not found, proceed to fetch from GitHub
      next();
    }
  } catch (err) {
    console.error('Redis error:', err);
    next(err);
  }
}

// Route handler to fetch user data from GitHub and cache it in Redis
async function getUserData(req, res) {
  try {
    const { username } = req.params;
    console.log(`Fetching GitHub data for: ${username}`);

    // Fetch user data from GitHub API
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'node.js' }
    });
    const data = await response.json();

    // Prepare user data object
    const userData = {
      username: data.login,
      name: data.name,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      location: data.location,
      bio: data.bio,
      avatar_url: data.avatar_url,
    };

    // Cache the user data in Redis for 1 minute (EX: 60 seconds)
    await client.set(username, JSON.stringify(userData), { EX: 60 });

    console.log(`Cached: ${username}`);
    res.json(userData);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// Main route: checks cache first, then fetches from GitHub if needed
app.get('/user/:username', cache, getUserData);
app.get('/hello', (req, res) => res.send('hello'));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
