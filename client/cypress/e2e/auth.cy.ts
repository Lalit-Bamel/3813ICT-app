describe(
    'Fabulari authentication',
    () => {

        /*
         * Unique values mean the tests can
         * be run repeatedly without duplicate
         * registration conflicts.
         */
        const unique =
            Date.now();


        const existingUser = {

            firstName:
                'Cypress',

            lastName:
                'Tester',

            username:
                `cypressLogin${unique}`,

            email:
                `cypressLogin${unique}@example.com`,

            age:
                20,

            password:
                'Password1'
        };


        const registrationUser = {

            firstName:
                'New',

            lastName:
                'Cypress',

            username:
                `cypressRegister${unique}`,

            email:
                `cypressRegister${unique}@example.com`,

            age:
                '2000-01-01',

            password:
                'Password1'
        };


        /*
         * Create one account directly through
         * the API for the login tests.
         *
         * The login itself is still tested
         * through the real browser interface.
         */
        before(
            () => {

                cy.request(
                    'POST',
                    'http://localhost:3000/api/register',
                    existingUser
                );
            }
        );


        beforeEach(
            () => {

                cy.clearLocalStorage();
            }
        );


        // ==========================================
        // REGISTRATION
        // ==========================================

        it(
            'registers a new user through the UI',
            () => {

                cy.intercept(
                    'POST',
                    '**/api/register'
                ).as(
                    'registerRequest'
                );


                cy.visit(
                    '/register'
                );


                cy.get(
                    '#firstName'
                ).type(
                    registrationUser.firstName
                );


                cy.get(
                    '#lastName'
                ).type(
                    registrationUser.lastName
                );


                cy.get(
                    '#username'
                ).type(
                    registrationUser.username
                );


                cy.get(
                    '#email'
                ).type(
                    registrationUser.email
                );


                cy.get(
                    '#dateOfBirth'
                ).type(
                    registrationUser.age
                );
                

                cy.get(
                    '#password'
                ).type(
                    registrationUser.password
                );


                cy.contains(
                    'button',
                    'Create Account'
                ).click();


                cy.wait(
                    '@registerRequest'
                )
                    .its(
                        'response.statusCode'
                    )
                    .should(
                        'eq',
                        201
                    );
            }
        );


        // ==========================================
        // VALID LOGIN
        // ==========================================

        it(
            'logs in with valid credentials',
            () => {

                cy.intercept(
                    'POST',
                    '**/api/login'
                ).as(
                    'loginRequest'
                );


                cy.visit(
                    '/login'
                );


                cy.get(
                    '#username'
                ).type(
                    existingUser.username
                );


                cy.get(
                    '#password'
                ).type(
                    existingUser.password
                );


                cy.contains(
                    'button',
                    'Login'
                ).click();


                cy.wait(
                    '@loginRequest'
                )
                    .its(
                        'response.statusCode'
                    )
                    .should(
                        'eq',
                        200
                    );


                /*
                 * AuthService stores the logged-in
                 * user in localStorage.
                 */
                cy.window().then(
                    window => {

                        const storedUser =
                            window.localStorage
                                .getItem(
                                    'currentUser'
                                );


                        expect(
                            storedUser
                        ).to.not.be.null;


                        const user =
                            JSON.parse(
                                storedUser!
                            );


                        expect(
                            user.username
                        ).to.equal(
                            existingUser.username
                        );
                    }
                );


                cy.url()
                    .should(
                        'include',
                        '/groups'
                    );
            }
        );


        // ==========================================
        // INVALID LOGIN
        // ==========================================

        it(
            'shows an error for an incorrect password',
            () => {

                cy.intercept(
                    'POST',
                    '**/api/login'
                ).as(
                    'failedLogin'
                );


                cy.visit(
                    '/login'
                );


                cy.get(
                    '#username'
                ).type(
                    existingUser.username
                );


                cy.get(
                    '#password'
                ).type(
                    'WrongPassword1'
                );


                cy.contains(
                    'button',
                    'Login'
                ).click();


                cy.wait(
                    '@failedLogin'
                )
                    .its(
                        'response.statusCode'
                    )
                    .should(
                        'eq',
                        401
                    );


                cy.get(
                    '.error'
                )
                    .should(
                        'be.visible'
                    )
                    .and(
                        'contain.text',
                        'Invalid username or password.'
                    );
            }
        );


        // ==========================================
        // AUTH GUARD
        // ==========================================

        it(
            'redirects an unauthenticated user away from the profile page',
            () => {

                cy.visit(
                    '/profile'
                );


                cy.url()
                    .should(
                        'include',
                        '/login'
                    );


                cy.contains(
                    'Login to Fabulari'
                )
                    .should(
                        'be.visible'
                    );
            }
        );


        // ==========================================
        // LOGIN / REGISTER NAVIGATION
        // ==========================================

        it(
            'navigates between login and registration pages',
            () => {

                cy.visit(
                    '/login'
                );


                cy.contains(
                    'a',
                    'Register'
                ).click();


                cy.url()
                    .should(
                        'include',
                        '/register'
                    );


                cy.contains(
                    'Create Account'
                )
                    .should(
                        'be.visible'
                    );


                cy.contains(
                    'a',
                    'Login'
                ).click();


                cy.url()
                    .should(
                        'include',
                        '/login'
                    );
            }
        );

    }
);