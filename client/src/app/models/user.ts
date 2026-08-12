export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    age: number;
    profilePicture: string;
    systemRole: 'user' | 'superAdmin';
    createdAt: string;
}