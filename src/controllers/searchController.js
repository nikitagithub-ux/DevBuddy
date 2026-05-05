const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { driver } = require('../config/neo4j');

const searchLanguage = async (req, res) => {
    const language = req.params.language;
    const session = driver.session();

    try {
        const result = await session.run(
            `MATCH (u:User)-[r:KNOWS]->(l:Language {name: $language})
            RETURN u.userId AS userId, r.score AS score
            ORDER BY r.score DESC
            LIMIT 10`,
            { language }
        );

        const userIds = result.records.map(record => record.get('userId'));

        if (userIds.length === 0) {
            return res.json({ message: "No users found for this language" });
        }

        const users = await User.find({ userId: { $in: userIds } });

        const usersWithScores = users.map(user => {
            const userScore = result.records.find(record => record.get('userId') === user.userId);
            return {
                userId: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                score: userScore ? userScore.get('score') : 0
            };
        });

        res.json({ users: usersWithScores });
    } catch (error) {
        console.error("Error fetching language search:", error);
        res.status(500).json({ msg: 'Internal server error' });
    } finally {
        await session.close();
    }
};

module.exports = searchLanguage;
