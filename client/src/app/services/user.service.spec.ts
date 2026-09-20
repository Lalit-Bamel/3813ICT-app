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
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    UserService
} from './user.service';

import {
    User
} from '../models/user';


describe(
    'UserService',
    () => {

        let service:
            UserService;

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

                TestBed.configureTestingModule({

                    providers: [

                        provideHttpClient(),

                        provideHttpClientTesting()
                    ]
                });


                service =
                    TestBed.inject(
                        UserService
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
            }
        );


        // ==========================================
        // GET PROFILE
        // ==========================================

        it(
            'retrieves a user profile',
            () => {

                service
                    .getProfile(
                        'user-test-1'
                    )
                    .subscribe(
                        user => {

                            expect(
                                user.username
                            ).toBe(
                                'testuser'
                            );
                        }
                    );


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/users/user-test-1'
                    );


                expect(
                    request.request.method
                ).toBe(
                    'GET'
                );


                request.flush(
                    mockUser
                );
            }
        );


        // ==========================================
        // UPDATE PROFILE
        // ==========================================

        it(
            'sends updated profile data',
            () => {

                const updateData = {

                    firstName:
                        'Updated',

                    lastName:
                        'User',

                    username:
                        'updateduser',

                    age:
                        21,

                    profilePicture:
                        ''
                };


                service
                    .updateProfile(
                        'user-test-1',
                        updateData
                    )
                    .subscribe(
                        response => {

                            expect(
                                response.message
                            ).toBe(
                                'Profile updated successfully.'
                            );
                        }
                    );


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/users/user-test-1'
                    );


                expect(
                    request.request.method
                ).toBe(
                    'PUT'
                );


                expect(
                    request.request.body
                ).toEqual(
                    updateData
                );


                request.flush({

                    message:
                        'Profile updated successfully.',

                    user: {
                        ...mockUser,

                        firstName:
                            'Updated',

                        username:
                            'updateduser',

                        age:
                            21
                    }
                });
            }
        );


        // ==========================================
        // PROFILE IMAGE
        // ==========================================

        it(
            'uploads a profile picture using FormData',
            () => {

                const file =
                    new File(
                        [
                            'fake-image-data'
                        ],
                        'profile.png',
                        {
                            type:
                                'image/png'
                        }
                    );


                service
                    .uploadProfilePicture(
                        'user-test-1',
                        file
                    )
                    .subscribe();


                const request =
                    httpTesting.expectOne(
                        'http://localhost:3000/api/uploads/profile-image'
                    );


                expect(
                    request.request.method
                ).toBe(
                    'POST'
                );


                expect(
                    request.request.body
                        instanceof FormData
                ).toBe(
                    true
                );


                const formData = request.request.body as FormData;

                expect(
                    formData.get(
                        'userId'
                    )
                ).toBe(
                    'user-test-1'
                );


                expect(
                    formData.get(
                        'image'
                    )
                ).toBe(
                    file
                );


                request.flush({

                    message:
                        'Profile picture updated successfully.',

                    user: {
                        ...mockUser,

                        profilePicture:
                            '/uploads/profiles/test.png'
                    }
                });
            }
        );

    }
);