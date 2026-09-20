const {
    MongoClient
} = require("mongodb");

const bcrypt =
    require("bcrypt");


const MONGO_URI =
    "mongodb://127.0.0.1:27017";

const DATABASE_NAME =
    "fabulari_e2e";


const USER_ID =
    "e2e-chat-user";

const GROUP_ID =
    "e2e-chat-group";

const ROOM_ID =
    "e2e-chat-room";


async function seedChatData() {

    const client =
        new MongoClient(
            MONGO_URI
        );


    try {

        await client.connect();


        const db =
            client.db(
                DATABASE_NAME
            );


        /*
         * Safety check.
         * Never seed the real Fabulari database.
         */
        if (
            db.databaseName !==
            "fabulari_e2e"
        ) {

            throw new Error(
                "Refusing to seed a non-E2E database."
            );
        }


        const users =
            db.collection(
                "users"
            );

        const groups =
            db.collection(
                "groups"
            );

        const rooms =
            db.collection(
                "rooms"
            );

        const messages =
            db.collection(
                "messages"
            );


        const passwordHash =
            await bcrypt.hash(
                "Password1",
                10
            );


        // ==========================================
        // TEST USER
        // ==========================================

        await users.updateOne(
            {
                id: USER_ID
            },
            {
                $set: {

                    id:
                        USER_ID,

                    firstName:
                        "Cypress",

                    lastName:
                        "Chat",

                    username:
                        "cypressChatUser",

                    email:
                        "cypresschat@example.com",

                    age:
                        20,

                    passwordHash,

                    profilePicture:
                        "",

                    systemRole:
                        "user",

                    createdAt:
                        new Date()
                            .toISOString()
                }
            },
            {
                upsert: true
            }
        );


        // ==========================================
        // TEST GROUP
        // ==========================================

        await groups.updateOne(
            {
                id: GROUP_ID
            },
            {
                $set: {

                    id:
                        GROUP_ID,

                    title:
                        "Cypress Test Group",

                    description:
                        "Group used for Cypress E2E testing.",

                    minimumAge:
                        18,

                    theme:
                        "default",

                    adminIds: [
                        USER_ID
                    ],

                    memberIds: [
                        USER_ID
                    ],

                    bannedUserIds:
                        [],

                    roomIds: [
                        ROOM_ID
                    ],

                    createdAt:
                        new Date()
                            .toISOString()
                }
            },
            {
                upsert: true
            }
        );


        // ==========================================
        // TEST ROOM
        // ==========================================

        await rooms.updateOne(
            {
                id: ROOM_ID
            },
            {
                $set: {

                    id:
                        ROOM_ID,

                    groupId:
                        GROUP_ID,

                    name:
                        "E2E Room",

                    createdAt:
                        new Date()
                            .toISOString()
                }
            },
            {
                upsert: true
            }
        );


        /*
         * Start the room with no messages so
         * each Cypress run begins cleanly.
         */
        await messages.deleteMany({
            roomId:
                ROOM_ID
        });


        console.log(
            "E2E chat data seeded successfully."
        );


    } finally {

        await client.close();
    }
}


seedChatData()
    .catch(
        error => {

            console.error(
                error
            );

            process.exit(1);
        }
    );