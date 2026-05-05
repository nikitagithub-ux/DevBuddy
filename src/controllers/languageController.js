const { driver } = require('../config/neo4j');
const User = require('../models/User');

const setLanguagePreferences = async (req, res) => {
  const { userId, languages } = req.body;
  const neoSession = driver.session();

  try {
    const txc = neoSession.beginTransaction();
    for (let lang of languages) {
      const { language, score } = lang;
      await txc.run(
        `MERGE (u:User {id: $userId})
         ON CREATE SET u.createdAt = timestamp()
         MERGE (l:Language {name: $language})
         MERGE (u)-[r:KNOWS]->(l)
         SET r.score = $score`,
        {
          userId,
          language, 
          score
        }
      );
    }
    await txc.commit();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.init_preferences = true;
    await user.save();

    res.status(200).json({ message: 'Language preferences set successfully and MongoDB updated' });
  } catch (error) {
    if (neoSession) {
      await neoSession.rollbackTransaction();
    }
    console.error('Error setting language preferences:', error);
    res.status(500).json({ message: 'Error setting language preferences', error: error.message });
  } finally {
    neoSession.close();
  }
};

module.exports = { setLanguagePreferences };
