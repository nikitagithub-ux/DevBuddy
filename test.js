const neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://neo4j_container:7687', 
  neo4j.auth.basic('neo4j', 'testpassword'), 
  { encrypted: 'ENCRYPTION_ON' });

const session = driver.session();

session.run('MATCH (n) RETURN n LIMIT 1')
  .then(result => {
    console.log('Neo4j connection successful!', result);
  })
  .catch(error => {
    console.error('Error connecting to Neo4j', error);
  })
  .finally(() => {
    session.close();
    driver.close();
  });
