# DevBuddy

A LinkedIn-like developer recommendation engine that connects developers based on shared skills and interests.

## Features
- Graph-based recommendation engine using Neo4j with relationship-weighted traversal and index-backed filters
- Background cron job to calculate recommendations on a fixed schedule and cache results in MongoDB
- JWT-based authentication
- User search functionality
- Dockerised setup for easy deployment

## Tech Stack
Node.js, Express, Neo4j, MongoDB, JWT, Docker

## Project Structure
├── src/
│   ├── controllers/    ← route handlers and business logic
│   ├── routes/         ← API route definitions
│   ├── models/         ← MongoDB schemas
│   ├── middleware/     ← auth middleware
│   └── config/         ← database connections
├── init-scripts/       ← database initialisation
├── docker-compose.yml
└── package.json

## Setup
1. Create a `.env` file with:
   - MONGO_URI=your_mongodb_uri
   - NEO4J_URI=your_neo4j_uri
   - NEO4J_USER=neo4j
   - NEO4J_PASSWORD=your_password
   - JWT_SECRET=your_jwt_secret
2. Run with Docker: `docker-compose up`
3. Or install dependencies: `npm install` then `node src/app.js`

## Note
Built collaboratively. This repo reflects my contributions to the project.