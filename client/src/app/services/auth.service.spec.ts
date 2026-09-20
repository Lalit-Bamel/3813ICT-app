import {
    TestBed
} from '@angular/core/testing';

import {
    provideHttpClient
} from '@angular/common/http';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import {
    beforeEach,
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    AuthService
} from './auth.service';

import {
    User
} from '../models/user';


describe(
    'AuthService',
    () => {

        let service:
            AuthService;

        let httpTesting:
            HttpTestingController;


        const mockUser: User = {

            id:
                'user-test-1',

            firstName:
                'Test',

            lastName:
                'User',

            username:
                'testuser',

            email:
                'test@example.com',

            age:
                20,

            profilePicture:
                '',

            systemRole:
                'user',

            createdAt:
                '2026-09-19T00:00:00.000Z'
        };


        beforeEach(
            () => {

                /*
                 * AuthService reads localStorage
                 * when it is first created.
                 */
                localStorage.clear();


                TestBed.configureTestingModule({

                    providers: [

                        provideHttpClient(),

                        provideHttpClientTesting()
                    ]
                });


                service =
                    TestBed.inject(
                        AuthService
                    );


                httpTesting =
                    TestBed.inject(
                        HttpTestingController
                    );
            }
        );


        afterEach(
            () => {

                httpTesting.verify();

                localStorage.clear();
            }
        );


        // ==========================================
        // REGISTER
        // ==========================================

        it(
            'sends registration data to the backend',
            () => {

                const registrationData = {

                    firstName:
                        'Test',

                    lastName:
                        'User',

                    username:
                        'testuser',

                    email:
                        'test@example.com',

                    age:
                        20,

                    password:
                        'Password1'
                };


                service
                    .register(
                        registrationData
                    )
                    .subscribe(
                        response => {

                            expect(
                                response.user.username
                            ).toBe(
                                'testuser'
                            );
                        }
                    );


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/register'
                    );


                expect(
                    request.request.method
                ).toBe(
                    'POST'
                );


                expect(
                    request.request.body
                ).toEqual(
                    registrationData
                );


                request.flush({

                    message:
                        'Account created successfully.',

                    user:
                        mockUser
                });
            }
        );


        // ==========================================
        // LOGIN
        // ==========================================

        it(
            'sends login credentials to the backend',
            () => {

                service
                    .login(
                        'testuser',
                        'Password1'
                    )
                    .subscribe();


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/login'
                    );


                expect(
                    request.request.method
                ).toBe(
                    'POST'
                );


                expect(
                    request.request.body
                ).toEqual({

                    username:
                        'testuser',

                    password:
                        'Password1'
                });


                request.flush({

                    message:
                        'Login successful.',

                    user:
                        mockUser
                });
            }
        );


        it(
            'stores the logged-in user after successful login',
            () => {

                service
                    .login(
                        'testuser',
                        'Password1'
                    )
                    .subscribe(
                        () => {

                            expect(
                                service.getCurrentUser()
                            ).toEqual(
                                mockUser
                            );


                            const storedUser =
                                JSON.parse(
                                    localStorage.getItem(
                                        'currentUser'
                                    ) || '{}'
                                );


                            expect(
                                storedUser.username
                            ).toBe(
                                'testuser'
                            );
                        }
                    );


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/login'
                    );


                request.flush({

                    message:
                        'Login successful.',

                    user:
                        mockUser
                });
            }
        );


        // ==========================================
        // CURRENT USER
        // ==========================================

        it(
            'sets and returns the current user',
            () => {

                service.setCurrentUser(
                    mockUser
                );


                expect(
                    service.getCurrentUser()
                ).toEqual(
                    mockUser
                );


                expect(
                    service.isLoggedIn()
                ).toBe(
                    true
                );
            }
        );


        // ==========================================
        // LOGOUT
        // ==========================================

        it(
            'clears the current user during logout',
            () => {

                service.setCurrentUser(
                    mockUser
                );


                service.logout();


                expect(
                    service.getCurrentUser()
                ).toBeNull();


                expect(
                    service.isLoggedIn()
                ).toBe(
                    false
                );


                expect(
                    localStorage.getItem(
                        'currentUser'
                    )
                ).toBeNull();
            }
        );


        // ==========================================
        // SUPER ADMIN
        // ==========================================

        it(
            'identifies a super administrator',
            () => {

                const superAdmin = {

                    ...mockUser,

                    systemRole:
                        'superAdmin' as const
                };


                service.setCurrentUser(
                    superAdmin
                );


                expect(
                    service.isSuperAdmin()
                ).toBe(
                    true
                );
            }
        );

    }
);