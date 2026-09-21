const express = require("express");
const bcrypt = require("bcrypt");

const { getDb } = require("../db/mongo");

const router = express.Router();

/**
 * Removes sensitive and database-only fields before returning a user.
 */
function getSafeUser(user) {

    const {
        passwordHash,
        _id,
        ...safeUser
    } = user;

    return safeUser;
}

/**
 * Escapes special RegExp characters in user input.
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates a calendar date and returns the age calculated on the server.
 * Keeping this calculation on the server prevents a client from submitting
 * an arbitrary age that does not match the selected date of birth.
 */
function getAgeFromDateOfBirth(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return null;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const birthDate =
        new Date(Date.UTC(year, month - 1, day));

    if (
        birthDate.getUTCFullYear() !== year ||
        birthDate.getUTCMonth() !== month - 1 ||
        birthDate.getUTCDate() !== day
    ) {
        return null;
    }

    const today = new Date();
    let age = today.getUTCFullYear() - year;

    if (
        today.getUTCMonth() < month - 1 ||
        (
            today.getUTCMonth() === month - 1 &&
            today.getUTCDate() < day
        )
    ) {
        age -= 1;
    }

    if (birthDate > today || age < 1 || age > 120) {
        return null;
    }

    return age;
}


// ==================================================
// GET OWN PROFILE
// ==================================================

router.get("/:userId", async function (req, res) {

    try {

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const user =
            await usersCollection.findOne({
                id: req.params.userId
            });

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found."
            });
        }

        return res.json(
            getSafeUser(user)
        );

    } catch (error) {

        console.error(
            "Profile retrieval error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to retrieve profile."
        });
    }
});


// ==================================================
// UPDATE PROFILE
// ==================================================

router.put("/:userId", async function (req, res) {

    try {

        const {
            firstName,
            lastName,
            username,
            age,
            dateOfBirth,
            profilePicture,
            newPassword
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !username ||
            (
                dateOfBirth === undefined &&
                age === undefined
            )
        ) {
            return res.status(400).json({
                message:
                    "Required profile fields are missing."
            });
        }

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanUsername =
            username.trim();

        const derivedAge =
            dateOfBirth !== undefined
                ? getAgeFromDateOfBirth(dateOfBirth)
                : Number(age);

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanUsername
        ) {
            return res.status(400).json({
                message:
                    "Profile fields cannot be empty."
            });
        }

        if (
            !Number.isInteger(derivedAge) ||
            derivedAge < 1
        ) {
            return res.status(400).json({
                message:
                    "Date of birth must produce an age of at least 1."
            });
        }

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const groupsCollection =
            db.collection("groups");

        const user =
            await usersCollection.findOne({
                id: req.params.userId
            });

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found."
            });
        }

        // Email cannot be changed.
        if (
            req.body.email !== undefined &&
            req.body.email.toLowerCase() !==
                user.email.toLowerCase()
        ) {
            return res.status(400).json({
                message:
                    "Email address cannot be changed."
            });
        }

        const usernameExists =
            await usersCollection.findOne({
                id: {
                    $ne: user.id
                },
                username: {
                    $regex:
                        `^${escapeRegex(cleanUsername)}$`,
                    $options: "i"
                }
            });

        if (usernameExists) {
            return res.status(409).json({
                message:
                    "Username is already in use."
            });
        }

        let ineligibleGroups = [];

        if (derivedAge !== user.age) {

            ineligibleGroups =
                await groupsCollection
                    .find(
                        {
                            memberIds: user.id,
                            minimumAge: {
                                $gt: derivedAge
                            }
                        },
                        {
                            projection: {
                                _id: 0,
                                id: 1,
                                title: 1,
                                adminIds: 1
                            }
                        }
                    )
                    .toArray();

            const soleAdminGroup =
                ineligibleGroups.find(
                    group =>
                        (group.adminIds || []).includes(
                            user.id
                        ) &&
                        (group.adminIds || []).length <= 1
                );

            if (soleAdminGroup) {
                return res.status(409).json({
                    message:
                        `Date of birth cannot be changed because you are the only administrator of "${soleAdminGroup.title}". Promote another administrator first.`
                });
            }
        }

        const updateFields = {
            firstName:
                cleanFirstName,
            lastName:
                cleanLastName,
            username:
                cleanUsername,
            age:
                derivedAge
        };

        if (dateOfBirth !== undefined) {
            updateFields.dateOfBirth =
                dateOfBirth;
        }

        if (profilePicture !== undefined) {
            updateFields.profilePicture =
                profilePicture;
        }

        if (newPassword) {

            if (
                newPassword.length < 8 ||
                !/[A-Z]/.test(newPassword)
            ) {
                return res.status(400).json({
                    message:
                        "Password must contain at least 8 characters and one uppercase letter."
                });
            }

            updateFields.passwordHash =
                await bcrypt.hash(
                    newPassword,
                    10
                );
        }

        await usersCollection.updateOne(
            {
                id: user.id
            },
            {
                $set:
                    updateFields
            }
        );

        if (ineligibleGroups.length > 0) {

            const ineligibleGroupIds =
                ineligibleGroups.map(
                    group => group.id
                );

            await groupsCollection.updateMany(
                {
                    id: {
                        $in: ineligibleGroupIds
                    }
                },
                {
                    $pull: {
                        memberIds: user.id,
                        adminIds: user.id
                    }
                }
            );

            const io = req.app.get("io");

            for (const group of ineligibleGroups) {

                io?.to(`group:${group.id}`).emit(
                    "groupMembersChanged",
                    { groupId: group.id }
                );

                io?.to(`group:${group.id}`).emit(
                    "groupAccessRevoked",
                    {
                        groupId: group.id,
                        userId: user.id,
                        reason: "ageRestriction"
                    }
                );

                io?.to(`user:${user.id}`).emit(
                    "groupMembershipChanged",
                    {
                        groupId: group.id,
                        userId: user.id,
                        action: "removed"
                    }
                );
            }
        }

        const updatedUser = {
            ...user,
            ...updateFields
        };

        return res.json({
            message:
                ineligibleGroups.length > 0
                    ? `Profile updated. You were removed from ${ineligibleGroups.length} group(s) whose minimum age you no longer meet.`
                    : "Profile updated successfully.",
            user:
                getSafeUser(updatedUser),
            removedFromGroups:
                ineligibleGroups.map(
                    group => ({
                        id: group.id,
                        title: group.title
                    })
                )
        });

    } catch (error) {
        if (
    error.code === 11000
) {

    if (
        error.keyPattern?.username
    ) {

        return res.status(409).json({
            message:
                "Username is already in use."
        });
    }


    return res.status(409).json({
        message:
            "Profile information conflicts with an existing account."
    });
}

        console.error(
            "Profile update error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to update profile."
        });
    }
});

module.exports = router;
