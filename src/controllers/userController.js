const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { driver } = require('../config/neo4j');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      githubProfile: user.githubProfile,
      linkedinProfile: user.linkedinProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getInitPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('init_preferences');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({
      init_preferences: user.init_preferences,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const connectUsers = async (req, res) => {
  const session = driver.session();
  try {
    const decoded = jwt.verify(req.header('x-auth-token'), process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { userIdToConnect } = req.params;

    const mainUser = await User.findById(userId);
    if (!mainUser) {
      return res.status(404).json({ msg: 'Authenticated user not found' });
    }

    const userToConnect = await User.findById(userIdToConnect);
    if (!userToConnect) {
      return res.status(404).json({ msg: 'User to connect not found' });
    }

    await session.run(
      `MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
       MERGE (u1)-[:CONNECTED]->(u2)`,
      { userId1: userId, userId2: userIdToConnect }
    );

    session.close();
    res.status(200).json({
      message: 'User connected successfully',
      user: { firstName: userToConnect.firstName, lastName: userToConnect.lastName }
    });
  } catch (err) {
    console.error(err.message);
    session.close();
    res.status(500).send('Server error');
  }
};

const getConnectedUsers = async (req, res) => {
  const session = driver.session();
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:CONNECTED]->(connectedUser:User)
       RETURN connectedUser.id AS userId, connectedUser.firstName AS firstName, connectedUser.lastName AS lastName, connectedUser.githubUrl AS githubUrl, connectedUser.linkedinUrl AS linkedinUrl`,
      { userId }
    );

    const connectedUsers = result.records.map(record => ({
      userId: record.get('userId'),
      firstName: record.get('firstName'),
      lastName: record.get('lastName'),
      githubUrl: record.get('githubUrl'),
      linkedinUrl: record.get('linkedinUrl')
    }));

    res.status(200).json({
      message: "Connected users fetched successfully",
      connections: connectedUsers
    });
  } catch (error) {
    console.error('Error fetching connected users:', error.message);
    res.status(500).send('Server error');
  } finally {
    session.close();
  }
};


module.exports = {
  getProfile,
  getInitPreferences,
  connectUsers,
  getConnectedUsers,
};

