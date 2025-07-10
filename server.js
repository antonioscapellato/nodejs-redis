// Load environment variables from .env file
import dotenv from 'dotenv';
// Import Express framework
import express from 'express';
// Import node-fetch to make HTTP requests
import fetch from 'node-fetch';
// Import Redis client
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

// Set the port for the Express server, default to 5002 if not specified
const PORT = process.env.PORT || 5002;
// Set the port for Redis, default to 6379 if not specified
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Log server startup
console.log('Starting server.js...');

// Log Redis connection attempt
console.log(`Attempting to connect to Redis on port ${REDIS_PORT}...`);

// Initialize Redis client with async/await support
const client = createClient({
  socket: { port: REDIS_PORT }
});

// Handle Redis client errors
client.on("error", (err) => console.log("Redis Client Error", err));
// Connect to Redis server
await client.connect();

// Create an Express application
const app = express();

// Function to fetch user data from GitHub API and cache it in Redis
async function getUserData(req, res, next) {
  try {
    // Log the username being fetched
    console.log(`Fetching data from GitHub for user: ${req.params.username}`);

    // Extract username from request parameters
    const { username } = req.params;

    // Make a GET request to GitHub API for the user
    const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: { 'User-Agent': 'node.js' }
    });
    // Parse the response as JSON
    const data = await response.json();

    // Log the raw data received from GitHub
    console.log(data)

    // Select and format the user data to return
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

    // Cache the user data in Redis as a stringified JSON, expires in 1 hour
    await client.set(username, JSON.stringify(userData), { EX: 3600 });
    console.log(`Cached data for user: ${username} (expires in 1 hour)`);

    // Send the user data as JSON response
    res.json(userData);
  } catch (err) {
    // Handle errors and send a 500 response
    console.error('Error in getUserData:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// Middleware to check Redis cache before making GitHub API request
async function cache(req, res, next) {
  // Extract username from request parameters
  const { username } = req.params;
  // Log cache check
  console.log(`Checking cache for user: ${username}`);
  try {
    // Try to get cached data from Redis
    const data = await client.get(username);
    if (data !== null) {
      // If cache hit, log and return cached data
      console.log(`Cache hit for user: ${username}`);
      res.json(JSON.parse(data));
    } else {
      // If cache miss, log and proceed to next middleware
      console.log(`Cache miss for user: ${username}`);
      next();
    }
  } catch (err) {
    // Handle Redis errors and proceed to next middleware
    console.error('Redis error in cache middleware:', err);
    next(err);
  }
}

// Route to get user data, uses cache middleware first
app.get('/user/:username', cache, getUserData);
// Simple hello route for testing
app.get('/hello', (req, res) => {
  res.send('hello');
});

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Ready to accept requests!');
});