const neo4j = require('neo4j-driver');
const User = require('../models/User');

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const dotenv = require('dotenv');
dotenv.config();

const { driver } = require('../config/neo4j');

const getPagerankRecommendations = async(dampingFactor = 0.85, numIterations = 100, convergenceThreshold = 0.0001) => {
    const session = driver.session();
    const graph = {};

    const query = `
        MATCH (u:User)-[:CONNECTED]->(v:User)
        OPTIONAL MATCH (u)-[:KNOWS]->(l:Language)<-[:KNOWS]-(v)
        RETURN u.id AS userId, collect(DISTINCT v.id) AS connections, collect(DISTINCT l.id) AS languages
    `;
    
    const result = await session.run(query);

    result.records.forEach(record => {
        const userId = record.get('userId');
        const connections = record.get('connections');
        const languages = record.get('languages');
    
        graph[userId] = {
            users: connections,
            languages: languages,
        };
    });

    session.close();

    const N = Object.keys(graph).length;
    let pageRank = {};

    for (let user in graph) {
        pageRank[user] = 1 / N;
    }

    let converged = false;
    let iteration = 0;

    while (!converged && iteration < numIterations) {
        let newPageRank = {};
        let maxDifference = 0;

        for (let user in graph) {
            let rankSum = 0;

            for (let linkedUser in graph) {
                if (graph[linkedUser].users.includes(user)) {
                    const outlinks = graph[linkedUser].users.length;
                    rankSum += pageRank[linkedUser] / outlinks;
                }

                if (graph[linkedUser].languages.some(lang => graph[user].languages.includes(lang))) {
                    const outlinks = graph[linkedUser].languages.length;
                    rankSum += pageRank[linkedUser] / outlinks;
                }
            }

            newPageRank[user] = (1 - dampingFactor) / N + dampingFactor * rankSum;
            maxDifference = Math.max(maxDifference, Math.abs(newPageRank[user] - pageRank[user]));
        }

        pageRank = newPageRank;
        iteration++;
        converged = maxDifference < convergenceThreshold;
    }

    const userIds = Object.keys(pageRank);
    const sortedUsers = userIds.sort((a, b) => pageRank[b] - pageRank[a]).slice(0, 10);

    const recommendations = await Promise.all(sortedUsers.map(async userId => {
        const user = await User.findById(userId);
        return {
            user: user.toObject(),
            score: pageRank[userId]
        };
    }));

    return {
        message: "Recommendations fetched successfully",
        recommendations
    };
};

const getBFSRecommendations = async (userId, mainUser) => {
    const session = driver.session();
    try {
        const userUserSet = new Set();
        const queue = [{ id: userId, depth: 0 }];
        const visited = new Set([userId]);

        while (queue.length > 0) {
            const { id, depth } = queue.shift();

            if (depth >= 2) continue;

            const result = await session.run(
                `MATCH (u:User {id: $id})-[:CONNECTED]-(other:User)
                 WHERE other.id <> $id
                 RETURN other.id AS userId`,
                { id }
            );

            for (const record of result.records) {
                const otherUserId = record.get('userId');
                if (!visited.has(otherUserId)) {
                    visited.add(otherUserId);
                    userUserSet.add(otherUserId);
                    queue.push({ id: otherUserId, depth: depth + 1 });
                }
            }
        }

        const userLanguageSet = new Set();
        const languagesResult = await session.run(
            `MATCH (u:User {id: $userId})-[:KNOWS]->(l:Language)
             RETURN l.name AS language`,
            { userId }
        );
        const languagesKnown = languagesResult.records.map(record => record.get('language'));

        const userLanguageResult = await session.run(
            `MATCH (u:User)-[:KNOWS]->(l:Language)
             WHERE l.name IN $languagesKnown
             RETURN u.id AS userId, COLLECT(l.name) AS languages`,
            { languagesKnown }
        );

        userLanguageResult.records.forEach(record => {
            userLanguageSet.add({
                userId: record.get('userId'),
                languages: record.get('languages')
            });
        });

        const recommendedUsers = [];
        for (let userLanguage of userLanguageSet) {
            const user = await User.findById(userLanguage.userId);
            if (!user || user.id === mainUser.id) continue;

            const similarityScore = userLanguage.languages.filter(language => languagesKnown.includes(language)).length;
            let score = similarityScore;

            if (userUserSet.has(userLanguage.userId)) {
                score += 10;
            }
            recommendedUsers.push({ user, score });
        }

        recommendedUsers.sort((a, b) => b.score - a.score);
        const topRecommendations = recommendedUsers.slice(0, 10);
        
        return topRecommendations;

    } catch (error) {
        console.error('Error in fetching recommendations', error.message);
        throw error;
    } finally {
        session.close();
    }
};



const getRecommendations = async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const mainUser = await User.findById(userId);
        if (!mainUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const randomNumber = Math.random() * 0.1;
        let recommendations;
        if(randomNumber < 0.5) {
            recommendations = await getBFSRecommendations(userId, mainUser);
        } else {
            recommendations = await getPagerankRecommendations();
        }

        res.status(200).json({
            message:"Recommendations fetched successfully", 
            recommendations
        });
    } catch(err) {
        res.status(500).json({error : "An error occcured while generating recommendations"});
    }
    
};



module.exports = {getRecommendations, getPagerankRecommendations};
