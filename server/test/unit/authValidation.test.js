const assert =
    require("node:assert");

const {
    validateRegistrationInput
} = require(
    "../../utils/authValidation"
);


describe(
    "Registration validation",
    function () {


        it(
            "accepts valid registration data",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "USER3@EXAMPLE.COM",

                        age:
                            "20",

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    true
                );


                assert.strictEqual(
                    result.value.email,
                    "user3@example.com"
                );


                assert.strictEqual(
                    result.value.age,
                    20
                );
            }
        );


        it(
            "trims registration text fields",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "  Lalit  ",

                        lastName:
                            "  Bamel  ",

                        username:
                            "  user3  ",

                        email:
                            "  USER3@EXAMPLE.COM  ",

                        age:
                            20,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    true
                );


                assert.strictEqual(
                    result.value.firstName,
                    "Lalit"
                );


                assert.strictEqual(
                    result.value.lastName,
                    "Bamel"
                );


                assert.strictEqual(
                    result.value.username,
                    "user3"
                );


                assert.strictEqual(
                    result.value.email,
                    "user3@example.com"
                );
            }
        );


        it(
            "rejects missing required fields",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "",

                        email:
                            "user3@example.com",

                        age:
                            20,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.status,
                    400
                );


                assert.strictEqual(
                    result.message,
                    "All required fields must be provided."
                );
            }
        );


        it(
            "rejects whitespace-only names or usernames",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "   ",

                        email:
                            "user3@example.com",

                        age:
                            20,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.message,
                    "Name and username cannot be empty."
                );
            }
        );


        it(
            "rejects an invalid email address",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "not-an-email",

                        age:
                            20,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.message,
                    "A valid email address is required."
                );
            }
        );


        it(
            "rejects a negative age",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "user3@example.com",

                        age:
                            -1,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.message,
                    "A valid age is required."
                );
            }
        );


        it(
            "rejects age zero",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "user3@example.com",

                        age:
                            0,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.status,
                    400
                );
            }
        );


        it(
            "rejects a non-integer age",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "user3@example.com",

                        age:
                            20.5,

                        password:
                            "Password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );
            }
        );


        it(
            "rejects a password shorter than eight characters",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "user3@example.com",

                        age:
                            20,

                        password:
                            "Pass1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );


                assert.strictEqual(
                    result.message,
                    "Password must contain at least 8 characters and one uppercase letter."
                );
            }
        );


        it(
            "rejects a password without an uppercase letter",
            function () {

                const result =
                    validateRegistrationInput({
                        firstName:
                            "Lalit",

                        lastName:
                            "Bamel",

                        username:
                            "user3",

                        email:
                            "user3@example.com",

                        age:
                            20,

                        password:
                            "password1"
                    });


                assert.strictEqual(
                    result.valid,
                    false
                );
            }
        );

    }
);
