const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    'bolt://neo4j_container:7687',
    neo4j.auth.basic('neo4j', 'testpassword'),
    { encrypted: 'ENCRYPTION_OFF' }
);

const session = driver.session();

module.exports = { driver, session };
