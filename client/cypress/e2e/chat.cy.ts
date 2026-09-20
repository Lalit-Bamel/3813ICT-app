describe(
    'Fabulari real-time chat',
    () => {

        const username =
            'cypressChatUser';

        const password =
            'Password1';

        const groupId =
            'e2e-chat-group';

        const roomId =
            'e2e-chat-room';




        beforeEach(
            () => {

                cy.clearLocalStorage();
            }
        );


        it(
            'logs in, opens a room and sends a real-time message',
            () => {

                const message =
                    `Cypress socket message ${Date.now()}`;



                
                // ==================================
                // LOGIN
                // ==================================

                cy.visit(
                    '/login'
                );


                cy.get(
                    '#username'
                )
                    .type(
                        username
                    );


                cy.get(
                    '#password'
                )
                    .type(
                        password
                    );


                cy.contains(
                    'button',
                    'Login'
                )
                    .click();


                cy.url()
                    .should(
                        'include',
                        '/groups'
                    );


                // ==================================
                // OPEN TEST CHAT ROOM
                // ==================================

                cy.visit(
                    `/groups/${groupId}/rooms/${roomId}`
                );


                cy.contains(
                    'Cypress Test Group'
                )
                    .should(
                        'be.visible'
                    );


                cy.contains(
                    'E2E Room'
                )
                    .should(
                        'be.visible'
                    );


                // ==================================
                // SEND SOCKET.IO MESSAGE
                // ==================================

                cy.get(
                    'textarea[placeholder="Type a message..."]'
                )
                    .should(
                        'be.visible'
                    )
                    .type(
                        message
                    );


                cy.contains(
                    'button',
                    'Send Text'
                )
                    .click();


                // ==================================
                // VERIFY LIVE MESSAGE
                // ==================================

                cy.contains(
                    '.message-text',
                    message,
                    {
                        timeout:
                            10000
                    }
                )
                    .should(
                        'be.visible'
                    );


                cy.contains(
                    '.message',
                    username
                )
                    .should(
                        'be.visible'
                    );
            }
        );

    }
);