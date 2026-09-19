/*
 * IMPORTANT:
 * Set the test database before importing
 * the server or MongoDB module.
 */
process.env.MONGO_DB_NAME =
    "fabulari_test";


const chai =
    require("chai");

const chaiHttp =
    require("chai-http");


chai.use(
    chaiHttp
);


const expect =
    chai.expect;


const {
    app
} = require(
    "../../server"
);


const {
    connectToMongo,
    getDb,
    closeMongoConnection
} = require(
    "../../db/mongo"
);


const {
    createIndexes
} = require(
    "../../db/indexes"
);


// ==================================================
// TEST DATA
// ==================================================

function getTestUser() {

    return {
        firstName:
            "Integration",

        lastName:
            "Tester",

        username:
            "integrationUser",

        email:
            "integration@example.com",

        age:
            20,

        password:
            "Password1"
    };
}


// ==================================================
// DATABASE RESET
// ==================================================

async function resetTestDatabase() {

    const db =
        getDb();


    /*
     * Safety protection:
     * never allow these tests to delete
     * the real Fabulari database.
     */
    if (
        db.databaseName !==
        "fabulari_test"
    ) {

        throw new Error(
            `Refusing to clear non-test database: ${db.databaseName}`
        );
    }


    await db.dropDatabase();


    await createIndexes(
        db
    );
}


// ==================================================
// API INTEGRATION TESTS
// ==================================================

describe(
    "Fabulari API integration tests",
    function () {

        /*
         * bcrypt can take a little time,
         * particularly on slower machines.
         */
        this.timeout(
            10000
        );


        before(
            async function () {

                await connectToMongo();
            }
        );


        beforeEach(
            async function () {

                await resetTestDatabase();
            }
        );


        after(
            async function () {

                const db =
                    getDb();


                if (
                    db.databaseName ===
                    "fabulari_test"
                ) {

                    await db.dropDatabase();
                }


                await closeMongoConnection();
            }
        );


        // ==========================================
        // HEALTH CHECK
        // ==========================================

        it(
            "returns server and database health information",
            async function () {

                const response =
                    await chai
                        .request(app)
                        .get(
                            "/api/health"
                        );


                expect(
                    response
                        .status
                ).to.equal(
                    200
                );


                expect(
                    response.body.message
                ).to.equal(
                    "Server is running"
                );


                expect(
                    response.body.database
                ).to.equal(
                    "fabulari_test"
                );


                expect(
                    response.body.storage
                ).to.equal(
                    "MongoDB"
                );
            }
        );


        // ==========================================
        // UNKNOWN API ROUTE
        // ==========================================

        it(
            "returns 404 for an unknown API route",
            async function () {

                const response =
                    await chai
                        .request(app)
                        .get(
                            "/api/does-not-exist"
                        );


                expect(
                    response.status
                ).to.equal(
                    404
                );


                expect(
                    response.body.message
                ).to.equal(
                    "API route not found."
                );
            }
        );


        // ==========================================
        // REGISTER
        // ==========================================

        it(
            "registers a valid user",
            async function () {

                const testUser =
                    getTestUser();


                const response =
                    await chai
                        .request(app)
                        .post(
                            "/api/register"
                        )
                        .send(
                            testUser
                        );


                expect(
                    response.status
                ).to.equal(
                    201
                );


                expect(
                    response.body.message
                ).to.equal(
                    "Account created successfully."
                );


                expect(
                    response.body.user.username
                ).to.equal(
                    testUser.username
                );


                expect(
                    response.body.user.email
                ).to.equal(
                    testUser.email
                );


                /*
                 * Password hashes must never
                 * be returned to the client.
                 */
                expect(
                    response.body.user
                ).to.not.have.property(
                    "passwordHash"
                );


                /*
                 * Confirm that the user really
                 * reached MongoDB.
                 */
                const db =
                    getDb();


                const storedUser =
                    await db
                        .collection(
                            "users"
                        )
                        .findOne({
                            username:
                                testUser.username
                        });


                expect(
                    storedUser
                ).to.not.equal(
                    null
                );


                expect(
                    storedUser.email
                ).to.equal(
                    testUser.email
                );
            }
        );


        // ==========================================
        // DUPLICATE REGISTRATION
        // ==========================================

        it(
            "rejects a duplicate username",
            async function () {

                const testUser =
                    getTestUser();


                const firstResponse =
                    await chai
                        .request(app)
                        .post(
                            "/api/register"
                        )
                        .send(
                            testUser
                        );


                expect(
                    firstResponse.status
                ).to.equal(
                    201
                );


                const duplicateUser = {
                    ...testUser,

                    username:
                        "INTEGRATIONUSER",

                    email:
                        "different@example.com"
                };


                const response =
                    await chai
                        .request(app)
                        .post(
                            "/api/register"
                        )
                        .send(
                            duplicateUser
                        );


                expect(
                    response.status
                ).to.equal(
                    409
                );


                expect(
                    response.body.message
                ).to.equal(
                    "Username is already in use."
                );
            }
        );


        // ==========================================
        // VALID LOGIN
        // ==========================================

        it(
            "logs in with valid credentials",
            async function () {

                const testUser =
                    getTestUser();


                await chai
                    .request(app)
                    .post(
                        "/api/register"
                    )
                    .send(
                        testUser
                    );


                const response =
                    await chai
                        .request(app)
                        .post(
                            "/api/login"
                        )
                        .send({
                            username:
                                testUser.username,

                            password:
                                testUser.password
                        });


                expect(
                    response.status
                ).to.equal(
                    200
                );


                expect(
                    response.body.message
                ).to.equal(
                    "Login successful."
                );


                expect(
                    response.body.user.username
                ).to.equal(
                    testUser.username
                );


                expect(
                    response.body.user
                ).to.not.have.property(
                    "passwordHash"
                );
            }
        );


        // ==========================================
        // INVALID LOGIN
        // ==========================================

        it(
            "rejects an incorrect password",
            async function () {

                const testUser =
                    getTestUser();


                await chai
                    .request(app)
                    .post(
                        "/api/register"
                    )
                    .send(
                        testUser
                    );


                const response =
                    await chai
                        .request(app)
                        .post(
                            "/api/login"
                        )
                        .send({
                            username:
                                testUser.username,

                            password:
                                "WrongPassword1"
                        });


                expect(
                    response.status
                ).to.equal(
                    401
                );


                expect(
                    response.body.message
                ).to.equal(
                    "Invalid username or password."
                );
            }
        );

    }
);