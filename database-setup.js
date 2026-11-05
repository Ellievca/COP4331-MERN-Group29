// paste this file into mongosh w hile connected to the cluster

const DB_NAME = "StudySync";
db = db.getSiblingDB(DB_NAME); 

function ensureCollection(name, schema) {
    const options = {
        validator: { $jsonSchema: schema},
        validationLevel: "strict",
        validationAction: "error"
    };

    if (db.getCollectionNames().includes(name)) {
        db.runCommand(Object.assign({
            collMod: name }, 
            options));
            print("Updated rules on " + name);
        }
    else {
        db.createCollection(name, options);
        print("Created " + name);
    }
}

// ---------------------- USERS ----------------------

// One user per account. Login + password info, etc.
ensureCollection("Users", {
    bsonType: "object",

    // required fields
    required: [
        "firstName",
        "lastName",
        "email",
        "login",
        "passwordHash",
        "isVerified",
        "createdAt"
    ],
    properties: {
        firstName:                  { bsonType: "string", minLength: 1 },
        lastName:                   { bsonType: "string", minLength: 1 },
        email:                      { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"},
        login:                      { bsonType: "string", minLength: 3 },
        passwordHash:               { bsonType: "string" }, // bcrypt hash
        isVerified:                 { bsonType: "bool" }, // email verification link
        verificationToken:          { bsonType: ["string", "null"] },
        verificationTokenExpires:   { bsonType: ["date", "null"] },
        resetToken:                 { bsonType: ["string", "null"] },
        resetTokenExpires:          { bsonType: ["date", "null"] },
        createdAt:                  { bsonType: "date" },
        updatedAt:                  { bsonType: "date" }
    }
});

db.Users.createIndex({ email: 1 }, { unique: true });
db.Users.createIndex({ login: 1 }, { unique: true });
db.Users.createIndex({ verificationToken: 1 }, { sparse: true });
db.Users.createIndex({ resetToken: 1 }, { sparse: true });

// ---------------------- COURSES ----------------------

// Used to group decks by course code
ensureCollection("Courses", {
    bsonType: "object",
    required: ["userId", "name", "createdAt"],
    properties: {
        userId: { bsonType: "objectId" }, // --> Users._id
        name:   { bsonType: "string", minLength: 1 },
        code:   { bsonType: "string" }, // e.g. "COP4331"
        color:  { bsonType: "string" }, // hex code e.g. "#000000"
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
    }
});
// prevent duplicate courses per user
db.Courses.createIndex(
    { userId: 1, name: 1 },
    { unique: true }
);

// ---------------------- DECKS ----------------------

// A set of flashcards. Can belong to a course or be on its own.
ensureCollection("Decks", {
    bsonType: "object",
    required: [
        "userId", 
        "title", 
        "isPublic", 
        "createdAt"
    ],
    properties: {
        userId:         { bsonType: "objectId" }, // --> User._id (owner)
        courseId:       { bsonType: ["objectId", "null"] }, // --> Courses._id (optional)
        title:          { bsonType: "string", minLength: 1 },
        description:    { bsonType: "string" },
        isPublic:       { bsonType: "bool" }, // Public or private deck
        cardCount:      { bsonType: "number", minimum: 0 }, // API can keep this in sync ?
        createdAt:      { bsonType: "date" },
        updatedAt:      { bsonType: "date" }
    }
});
// sort decks
db.Decks.createIndex({ userId: 1, updatedAt: -1 }); // decks sorted by most recent first
db.Decks.createIndex({ courseId: 1 }); // decks in this course
db.Decks.createIndex({ title: "text", description: "text" });

// ---------------------- CARDS ---------------------- 

// Individual flashcards in a deck. 
// Not embedded so decks can grow
// Each card can be created/edited/deleted/searched through its own endpoint
ensureCollection("Cards", {
    bsonType: "object",
    required: [
        "deckId",
        "userId",
        "front",
        "back",
        "createdAt"
    ],
    properties: {
        deckId:         { bsonType: "objectId" }, // --> Decks._id
        userId:         { bsonType: "objectId" }, // --> Users._id (owner, for permission checks)
        front:          { bsonType: "string", minLength: 1 }, // front side of flashcard, question/term
        back:           { bsonType: "string", minLength: 1 }, // answer/definition
        timesReviewed:  { bsonType: "number", minimum: 0 },
        timesCorrect:   { bsonType: "number", minimum: 0 },
        lastReviewedAt: { bsonType: ["date", "null"] },
        nextReviewAt:   { bsonType: ["date", "null"] }, // optional: implement spaced repetition
        createdAt:      { bsonType: "date" },
        updatedAt:      { bsonType: "date" }
    }
});
// sort options
db.Cards.createIndex({ deckId: 1, createdAt: 1 }); // all cards in this deck
db.Cards.createIndex({ userId: 1, nextReviewAt: 1 }) // cards due for review
db.Cards.createIndex({ front: "text", back: "text" }); // card search

// ---------------------- STUDY SESSIONS ----------------------

// Records stats, streaks, progress charts, etc. per study session
ensureCollection("StudySessions", {
    bsonType: "object",
    required: ["userId", "startedAt"],
    properties: {
        userId:         { bsonType: "objectId" }, // --> User._id
        deckId:         { bsonType: ["objectId", "null"] }, // --> Decks._id 
        courseId:       { bsonType: ["objectId", "null"] }, // --> Courses._id
        startedAt:      { bsonType: "date" },
        endedAt:        { bsonType: [ "date", "null"] },
        cardsReviewed:  { bsonType: "number", minimum: 0 },
        cardsCorrect:   { bsonType: "number", minimum: 0 }
    }   
});
// sort options
db.StudySessions.createIndex({ userId: 1, startedAt: -1 }); // newest sessions first

// ---------------------- REPORT ----------------------
print("\nDatabase: " + DB_NAME);
db.getCollectionNames().sort().forEach(function (c) {
    const keys = db.getCollection(c).getIndexes().map(function (i ) {
        return JSON.stringify(i.key) + (i.unique ? " (unique)" : "");
    });
    print(" " + c + ": " + keys.join(", "));
});