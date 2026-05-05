const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { driver } = require('../config/neo4j');

const signup = async (req, res) => {
    const { email, password, githubProfile, linkedinProfile, firstName, lastName } = req.body;
    const session = driver.session();
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email,
            password: hashedPassword,
            githubProfile,
            linkedinProfile,
            firstName,
            lastName
        });

        await user.save();

        const userId = user._id.toString();
        const result = await session.run(
            'CREATE (u:User {id: $userId}) RETURN u',
            { userId }
        );

        const createdUser = result.records[0].get('u').properties;

        session.close();

        res.status(201).json({
            message: 'User created successfully',
            user: createdUser,
        });
    } catch (err) {
        console.error('Error during signup:', err.message);
        res.status(500).send('Server error');
    }
};



const login = async(req, res) => {
    const {email, password} = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        res.json({ token });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


module.exports = {signup, login};