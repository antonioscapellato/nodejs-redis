# Node.js + Redis: GitHub User Caching API

> **Inspiration:** This project is inspired by [this YouTube video](https://www.youtube.com/watch?v=oaJq1mQ3dFI).

This project is a simple Node.js API that fetches GitHub user data and caches it using Redis. It helps reduce the number of requests made to the GitHub API by storing user data in Redis for one hour.

## Installing Redis Locally

### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian (using apt)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server.service
sudo systemctl start redis-server.service
```

### Windows
- Download and follow instructions from the official Redis website: https://redis.io/docs/latest/operate/installation/install-redis-on-windows/

**To check if Redis is running:**
```bash
redis-cli ping
```
You should see: `PONG`

## Features
- Fetches GitHub user profile data by username
- Caches responses in Redis for 1 hour (3600 seconds)
- Returns cached data if available, otherwise fetches from GitHub

## Prerequisites
- [Node.js](https://nodejs.org/)
- [Redis](https://redis.io/)

## Setup
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd nodejs-redis
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start Redis server:**
   Make sure you have Redis running locally on the default port (6379), or set the `REDIS_PORT` environment variable.
   ```bash
   redis-server
   ```
4. **Create a `.env` file (optional):**
   You can specify custom ports:
   ```env
   PORT=5000
   REDIS_PORT=6379
   ```
5. **Start the server:**
   ```bash
   node server.js
   ```

## Usage
Send a GET request to:
```
GET http://localhost:5000/user/<github-username>
```
Example:
```
GET http://localhost:5000/user/octocat
```

## Response
Returns a JSON object with selected GitHub user fields:
- `username`
- `name`
- `public_repos`
- `followers`
- `following`
- `location`
- `bio`
- `avatar_url`

## License
MIT 