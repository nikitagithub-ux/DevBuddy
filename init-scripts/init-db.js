db = db.getSiblingDB('devbuddy');
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('recommendations');
print("Collection created successfully");
db.createUser({
    user : "devBuddyUser",
    pwd : "devBuddyPassword",
    roles : [
        {
            role : "readWrite",
            db : "devbuddy"
        }
    ]
});
print("DB user created");