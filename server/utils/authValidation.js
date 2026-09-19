/**
 * Validates and normalises registration input.
 *
 * This function contains no Express or MongoDB logic,
 * which allows it to be tested independently.
 */
function validateRegistrationInput(data) {

    const {
        firstName,
        lastName,
        username,
        email,
        age,
        password
    } = data;


    if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        age === undefined ||
        !password
    ) {

        return {
            valid: false,
            status: 400,
            message:
                "All required fields must be provided."
        };
    }


    const cleanFirstName =
        firstName.trim();

    const cleanLastName =
        lastName.trim();

    const cleanUsername =
        username.trim();

    const cleanEmail =
        email.trim().toLowerCase();

    const numericAge =
        Number(age);


    if (
        !cleanFirstName ||
        !cleanLastName ||
        !cleanUsername
    ) {

        return {
            valid: false,
            status: 400,
            message:
                "Name and username cannot be empty."
        };
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            cleanEmail
        )
    ) {

        return {
            valid: false,
            status: 400,
            message:
                "A valid email address is required."
        };
    }


    if (
        !Number.isInteger(
            numericAge
        ) ||
        numericAge < 0
    ) {

        return {
            valid: false,
            status: 400,
            message:
                "A valid age is required."
        };
    }


    if (
        password.length < 8 ||
        !/[A-Z]/.test(password)
    ) {

        return {
            valid: false,
            status: 400,
            message:
                "Password must contain at least 8 characters and one uppercase letter."
        };
    }


    return {
        valid: true,

        value: {
            firstName:
                cleanFirstName,

            lastName:
                cleanLastName,

            username:
                cleanUsername,

            email:
                cleanEmail,

            age:
                numericAge,

            password
        }
    };
}


module.exports = {
    validateRegistrationInput
};