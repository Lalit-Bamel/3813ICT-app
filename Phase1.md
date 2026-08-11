# Phase 1 – Specification, Design and Prototype

## Student Information

**Name: Lalit Bamel**  
**Student Number: s5383531**  
  

---

## 1. Project Overview

---

## 2. Git Strategy

---


## 3. Functional Requirements and Assumptions

The functional requirements for the application were elicited from the assignment specification, the client briefing, and subsequent requirement clarification announcements. Where later clarification changes an earlier requirement, the latest clarification is treated as the current requirement.

### 3.1 User Accounts and Authentication

| ID | Functional Requirement |
|---|---|
| FR-01 | Users must register their own accounts. |
| FR-02 | The system must provide basic username and password authentication. |
| FR-03 | Passwords must contain at least 8 characters and at least one uppercase character. |
| FR-04 | Passwords must be stored as hashes rather than plain text. |
| FR-05 | Each user must have a unique email address. |
| FR-06 | A user must not be able to change their email address after registration. |
| FR-07 | Users must be able to log in and log out of the application. |
| FR-08 | Information required for the current login session must be stored in browser local storage. |
| FR-09 | Users must be able to change their username. |
| FR-10 | Users must be able to upload and change their profile picture. |
| FR-11 | Users must have access to a private profile page. |
| FR-12 | Users must be able to edit their profile information except for their email address. |
| FR-13 | Other users must not be able to access another user's profile page. |
| FR-14 | An email address belonging to a permanently system-banned user must not be permitted to register again. |

### 3.2 Roles and Permissions

| ID | Functional Requirement |
|---|---|
| FR-15 | The application must support Regular User, Group Administrator and Super Administrator permissions. |
| FR-16 | The system must contain exactly one Super Administrator. |
| FR-17 | The initial Super Administrator must be created through a one-time bootstrap process when the system is first started. |
| FR-18 | After the initial Super Administrator has been created, the bootstrap process must not create another Super Administrator. |
| FR-19 | The application interface must change according to the permissions of the currently logged-in user. |
| FR-20 | Group Administrator permissions must apply to the groups that the user administers. |
| FR-21 | A Group Administrator may administer multiple groups. |
| FR-22 | There is no limit to the number of groups a user may belong to. |
| FR-23 | The Super Administrator does not participate in group chat. |
| FR-24 | The Super Administrator must not have access to group chat history. |

### 3.3 Groups

| ID | Functional Requirement |
|---|---|
| FR-25 | After login, users must be able to view existing groups. |
| FR-26 | Users must be able to search for groups. |
| FR-27 | Users must request permission to join a group rather than being directly invited by a Group Administrator. |
| FR-28 | Users must be able to request the creation of a new group. |
| FR-29 | A group creation request must contain the proposed group title, description, minimum age and theme information. |
| FR-30 | The Super Administrator must create a group only by actioning a group creation request from a user. |
| FR-31 | The user who requested an approved group must become the initial Group Administrator of that group. |
| FR-32 | A group title must contain no more than 30 characters. |
| FR-33 | A group description must contain no more than 250 characters. |
| FR-34 | A group must have a minimum age value. |
| FR-35 | A group must always contain at least one Group Administrator. |
| FR-36 | A group may contain multiple Group Administrators. |
| FR-37 | Group Administrators must be able to modify the group's title, description, minimum age and theme. |
| FR-38 | A Group Administrator must be able to promote an existing group member to Group Administrator. |
| FR-39 | Where multiple Group Administrators exist, one Group Administrator may demote another Group Administrator. |
| FR-40 | A Group Administrator must not be able to leave or be demoted if doing so would leave the group without an administrator. |
| FR-41 | A Group Administrator may step down from the administrator role when another Group Administrator remains. |
| FR-42 | Group Administrators must be able to view the current allowed members of their group. |
| FR-43 | Group Administrators must be able to view users who have been banned from their group. |
| FR-44 | A Group Administrator cannot directly delete a group. |
| FR-45 | A Group Administrator must request group deletion from the Super Administrator. |
| FR-46 | The Super Administrator is responsible for actioning group deletion requests. |
| FR-47 | A group does not require a group profile picture. |
| FR-48 | A group may contain zero or more chat rooms. |

### 3.4 Group Age Restrictions

| ID | Functional Requirement |
|---|---|
| FR-49 | The minimum age restriction applies to the entire group and therefore applies to all rooms within the group. |
| FR-50 | Users must still be able to see groups for which they do not meet the minimum age requirement. |
| FR-51 | A user who does not meet a group's minimum age must not be allowed to join that group. |
| FR-52 | A rejected under-age user must be informed that the age requirement prevented them from joining. |
| FR-53 | If a Group Administrator increases the minimum age of a group, existing members who no longer meet the age requirement must be removed from the group. |

### 3.5 Chat Rooms / Channels

| ID | Functional Requirement |
|---|---|
| FR-54 | Regular group members must be able to propose the creation of a new room. |
| FR-55 | Group Administrators must be able to approve or reject room creation requests. |
| FR-56 | A rejected room request must include a reason. |
| FR-57 | Group Administrators must be able to create an approved room within their group. |
| FR-58 | Group Administrators must be able to edit the details of rooms that they administer. |
| FR-59 | Group Administrators must be able to rename rooms. |
| FR-60 | Group Administrators must be able to remove rooms from their group. |
| FR-61 | The visual theme of the group must also apply to rooms belonging to that group. |
| FR-62 | Once a user becomes a member of a group, they may access the rooms belonging to that group. |

### 3.6 Requests and Request Queue

| ID | Functional Requirement |
|---|---|
| FR-63 | The application must provide a mechanism for requests to be passed between users and the appropriate administrator. |
| FR-64 | Users must be able to submit group join requests to Group Administrators. |
| FR-65 | Users must be able to submit room creation requests to Group Administrators. |
| FR-66 | Users must be able to submit a request/report to a Group Administrator asking for another group member to be banned and must provide a reason. |
| FR-67 | Group Administrators must be able to request that the Super Administrator permanently ban a user from the entire system and must provide a reason. |
| FR-68 | Group Administrators must be able to request deletion of their group from the Super Administrator. |
| FR-69 | Users must not be able to directly communicate with the Super Administrator through the request system except for defined system processes such as requesting group creation. |
| FR-70 | Once a request has been submitted, the requester must not be able to cancel it. |
| FR-71 | Users must be able to view their pending requests. |
| FR-72 | Users must be able to view previously rejected requests. |
| FR-73 | Rejected requests that require administrator review must include a reason for rejection. |
| FR-74 | Group Administrators and the Super Administrator must receive notification of relevant ban requests that require their attention. |

### 3.7 Group and System Bans

| ID | Functional Requirement |
|---|---|
| FR-75 | A Group Administrator may ban a user from an individual group only after receiving an appropriate report/request. |
| FR-76 | A Group Administrator must not be able to create a ban request and then approve their own request. |
| FR-77 | A group ban must prevent the banned account from joining that group again. |
| FR-78 | Removing or banning a user from one group must not delete the user's account from the overall system. |
| FR-79 | Only the Super Administrator may permanently ban/delete a user from the entire system. |
| FR-80 | A system-wide ban must originate from a Group Administrator request. |
| FR-81 | The Super Administrator must not permanently remove a user who is currently the only Group Administrator of a group. |
| FR-82 | Another Group Administrator must be appointed before such a user can be permanently removed. |
| FR-83 | The Super Administrator must be able to view accounts that have previously been permanently banned. |

### 3.8 Chat and Messaging

| ID | Functional Requirement |
|---|---|
| FR-84 | The chat system must support text messages. |
| FR-85 | The chat system must support image messages. |
| FR-86 | The chat system must support GIF messages. |
| FR-87 | The chat system must not support voice messages or video messages. |
| FR-88 | The system does not require automatic message censorship. |
| FR-89 | No application-specific maximum text-message size is required. |
| FR-90 | URLs displayed in chat messages must not automatically be converted into clickable hyperlinks. |
| FR-91 | The application does not require a reply-to-specific-message feature. |
| FR-92 | Users must not be able to edit a message after it has been sent. |
| FR-93 | Users must be able to delete messages that they created. |
| FR-94 | Users must not be able to delete messages created by another user. |
| FR-95 | When a user enters a room, the chat interface must initially show the previous five messages. |
| FR-96 | Users currently in a room must receive a notification when another user enters the room. |
| FR-97 | Users currently in a room must receive a notification when another user leaves the room. |
| FR-98 | A user in a room must be able to see a list of users currently present in that room. |
| FR-99 | A Group Administrator must be visually identified as an administrator while participating in a group chat. |
| FR-100 | Group-message notifications outside the active chat are not required. |

### 3.9 Super Administrator Audit Functions

| ID | Functional Requirement |
|---|---|
| FR-101 | The Super Administrator must have access to an audit-log interface. |
| FR-102 | Audit records must be presented in date order. |
| FR-103 | The Super Administrator must be able to filter audit records according to audit/event type. |
| FR-104 | Relevant administrative and request actions must generate records that can be represented within the audit log. |

### 3.10 Interface and Application Requirements

| ID | Functional Requirement |
|---|---|
| FR-105 | The application must provide different available controls and information according to the current user's permission level. |
| FR-106 | The application must use a responsive interface suitable for different screen sizes. |
| FR-107 | A CSS framework may be used for development of the user interface. |
| FR-108 | The application is not required to support multiple languages. |
| FR-109 | Personal user page theming is optional and is not a core requirement. |
| FR-110 | Displaying a general online/offline indicator for users is optional. |
| FR-111 | Group Administrators must be able to customise the theme of their group. |

### 3.11 Technical Requirements and Constraints

| ID | Requirement |
|---|---|
| TR-01 | The client application will be developed using Angular 22. |
| TR-02 | Node.js and Express will be used for server-side functionality. |
| TR-03 | Phase 1 persistent data will be stored in a server-side JSON file. |
| TR-04 | MongoDB will replace the JSON persistence mechanism during Phase 2. |
| TR-05 | Socket.IO will be used for real-time communication in the completed application. |
| TR-06 | Communication between the production client and server is required to use HTTPS. |
| TR-07 | Git and GitHub must be used throughout development. |
| TR-08 | The GitHub repository will remain private and the teaching staff member will be added as a collaborator. |
| TR-09 | Development progress will be recorded through regular meaningful commits and pushes. |
| TR-10 | Design documents and storyboards will be committed to the Git repository before application implementation begins. |

### 3.12 Assumptions and Design Decisions

The following assumptions and design decisions are used where the specification allows implementation choice or where clarification is required.

| ID | Assumption / Design Decision |
|---|---|
| A-01 | A username will be provided for each user and will be used as the user's display name. The email remains the permanent unique account identifier. |
| A-02 | Group Administrator permission is group-specific. A user may therefore be an administrator in one group while being a regular member in another. |
| A-03 | All groups will be visible in group search results regardless of the user's age. Eligibility will be checked when the user attempts to join. |
| A-04 | Rooms will not contain independent age restrictions because the group's age restriction applies to every room within that group. |
| A-05 | The active-room user list will show users currently present in that room. This interpretation is used because the specification explicitly requires users chatting in a room to see who else is in the room. |
| A-06 | Requests will have a type, requester, target group where applicable, status, reason/details and timestamps so that different request types can be processed using a consistent request mechanism. |
| A-07 | A group ban is permanent for the banned account within that group. A system-wide ban permanently removes the account and prevents reuse of the banned email address. |
| A-08 | Optional personal user theming and a general online/offline indicator will not be prioritised for the Phase 1 prototype. |
| A-09 | The Super Administrator will use administration screens only and will not be given access to room messaging or room history. |
| A-10 | Phase 1 will implement the required user, group and room administration and JSON persistence while advanced real-time chat behaviour may be represented by prototype or mock data where permitted by the Phase 1 specification. |

### 3.13 Requirement Clarification Still to Monitor

One clarification contains potentially conflicting wording regarding whether the user list represents all users currently using the system or only users currently present in a particular room. For the current design, the application will show users currently present in the active room because this directly satisfies the explicit room-presence requirement.

Any later client announcement will supersede the assumptions above where necessary.

## 4. Data Structures

For Phase 1, application data will be persistently stored in a server-side JSON file. Unique IDs will be used to represent relationships between users, groups, rooms and requests.

The main data collections will be:

```json
{
  "users": [],
  "groups": [],
  "rooms": [],
  "requests": [],
  "auditLogs": [],
  "messages": [],
  "bannedUsers": []
}
4.1 User

The User data structure stores account and profile information for each registered user.

Field	Type	Description
id	string	Unique identifier for the user
firstName	string	User's first name
lastName	string	User's last name
username	string	User's display username
email	string	Unique email address used to identify the account
age	number	User's self-reported age
passwordHash	string	Hashed version of the user's password
profilePicture	string	Path or reference to the user's profile picture
systemRole	string	System-level role of either user or superAdmin
createdAt	string	Date and time the account was created

The email address cannot be changed after registration. Password hashes will only be stored on the server and will not be stored in browser local storage.

Group Administrator status is not stored as a global user role because a user may be an administrator of one group while being a normal member of another group.

4.2 Group

The Group data structure stores information about each group and its relationships with users and rooms.

Field	Type	Description
id	string	Unique identifier for the group
title	string	Group title with a maximum length of 30 characters
description	string	Group description with a maximum length of 250 characters
minimumAge	number	Minimum age required for a user to join the group
theme	string	Theme selected for the group and its rooms
adminIds	string[]	IDs of users who are administrators of the group
memberIds	string[]	IDs of users who are members of the group
bannedUserIds	string[]	IDs of users permanently banned from the group
roomIds	string[]	IDs of rooms belonging to the group
createdAt	string	Date and time the group was created

Every group must always contain at least one Group Administrator.

4.3 Room

The Room data structure represents a chat room belonging to a group.

Field	Type	Description
id	string	Unique identifier for the room
groupId	string	ID of the group that owns the room
name	string	Name of the chat room
createdAt	string	Date and time the room was created

A group may contain zero or more rooms. Rooms inherit the minimum age restriction and theme of their parent group.

4.4 Request

The Request data structure is used for requests made between users, Group Administrators and the Super Administrator.

Field	Type	Description
id	string	Unique identifier for the request
type	string	Type of request being made
requesterId	string	ID of the user who created the request
targetGroupId	string/null	ID of the related group where applicable
targetUserId	string/null	ID of the related user where applicable
details	object	Additional information required for the request
reason	string/null	Reason supplied with the request where required
status	string	Current status: pending, approved or rejected
rejectionReason	string/null	Reason an administrator rejected the request
createdAt	string	Date and time the request was submitted

Request types may include:

Group creation request
Group join request
Room creation request
Group user ban request
System-wide user ban request
Group deletion request

Once submitted, a request cannot be cancelled by the requester.

4.5 Audit Log

The Audit Log data structure records important administrative and system actions for review by the Super Administrator.

Field	Type	Description
id	string	Unique identifier for the audit record
type	string	Type of event or administrative action
actorId	string	ID of the user who performed the action
targetId	string/null	ID of the user, group or room affected by the action
details	string	Description of the recorded action
createdAt	string	Date and time the action occurred

Audit records can later be filtered by event type and displayed in date order.

4.6 Message

The Message data structure represents messages sent within chat rooms.

Field	Type	Description
id	string	Unique identifier for the message
roomId	string	ID of the room containing the message
senderId	string	ID of the user who sent the message
type	string	Message type: text, image or gif
content	string	Text content or reference to the uploaded media
createdAt	string	Date and time the message was sent
deleted	boolean	Indicates whether the sender has deleted the message

Messages cannot be edited after being sent. A user may only delete a message that they created.

Full real-time messaging will be implemented in Phase 2. Mock message data may be used for the Phase 1 user interface prototype.

4.7 Banned User

The Banned User data structure retains information required after a user has been permanently removed from the system.

Field	Type	Description
id	string	Unique identifier for the banned-user record
originalUserId	string	ID of the user account that was permanently banned
firstName	string	First name of the banned user
lastName	string	Last name of the banned user
email	string	Email address that must not be allowed to register again
reason	string	Reason for the system-wide ban
bannedBy	string	ID of the Super Administrator who actioned the ban
bannedAt	string	Date and time the permanent ban occurred

The banned-user record allows the Super Administrator to view previously banned accounts and ensures that a permanently banned email address cannot be reused.


### 4.1 User
### 4.2 Group
### 4.3 Room
### 4.4 Request
### 4.5 Audit Log
### 4.6 Message
### 4.7 Banned Email

## 5. Angular Architecture

The Angular frontend will use a component-based architecture. Components represent the major application screens from the Phase 1 storyboards, while services handle shared application logic and communication with the Express server.

### 5.1 Components

| Component | Purpose |
|---|---|
| LoginComponent | Displays the login form and authenticates users |
| RegisterComponent | Allows users to create their own account |
| GroupsComponent | Displays joined groups, available groups, search and group requests |
| GroupRoomsComponent | Displays information and rooms belonging to a selected group |
| ChatRoomComponent | Displays the chat interface, recent messages and room participants |
| ProfileComponent | Displays and updates the logged-in user's private profile |
| GroupAdminComponent | Provides group administration functions for members, rooms, requests and settings |
| SuperAdminComponent | Provides system administration functions including group requests, system bans and audit logs |
| NavbarComponent | Provides shared navigation for authenticated users |

### 5.2 Services

| Service | Purpose |
|---|---|
| AuthService | Handles login, logout, current user state and local storage |
| UserService | Handles registration and user profile operations |
| GroupService | Handles groups, membership, administrators and rooms |
| RequestService | Handles creation, viewing and actioning of requests |
| AdminService | Handles super administrator operations such as audit logs and system bans |
| ChatService | Provides chat-related functionality and will later support Socket.IO in Phase 2 |

`ChatService` may use mock data during Phase 1 because full real-time chat functionality is intended for Phase 2.

### 5.3 Models

| Model | Purpose |
|---|---|
| User | Represents user account information |
| Group | Represents a group and its members/administrators |
| Room | Represents a chat room belonging to a group |
| Request | Represents requests between users and administrators |
| AuditLog | Represents administrative audit records |
| Message | Represents chat messages |

### 5.4 Angular Routes

| Route | Component | Purpose |
|---|---|---|
| `/login` | LoginComponent | User login |
| `/register` | RegisterComponent | User registration |
| `/groups` | GroupsComponent | View/search groups |
| `/groups/:groupId` | GroupRoomsComponent | View a selected group and its rooms |
| `/groups/:groupId/rooms/:roomId` | ChatRoomComponent | Enter a selected chat room |
| `/profile` | ProfileComponent | View/edit private profile |
| `/groups/:groupId/admin` | GroupAdminComponent | Manage a group |
| `/super-admin` | SuperAdminComponent | Super Administrator dashboard |

Routes other than login and registration will require an authenticated user.

Administrator routes will additionally check that the current user has the required permissions.

### 5.5 Route Guards

The frontend will use route guards to prevent users from navigating directly to interfaces for which they do not have permission.

- `authGuard` will protect authenticated application pages.
- `groupAdminGuard` will protect group administration pages.
- `superAdminGuard` will protect the Super Administrator dashboard.

Frontend permission checks improve the user interface but server-side endpoints must also validate permissions because browser data such as local storage can be modified by a user.

### 5.6 Local Storage

Browser local storage will contain only the information required to maintain the current user's login state and interface permissions.

Passwords and password hashes will never be stored in local storage.

### 5.7 Proposed Angular Structure

```text
client/
└── src/
    └── app/
        ├── components/
        │   ├── login/
        │   ├── register/
        │   ├── groups/
        │   ├── group-rooms/
        │   ├── chat-room/
        │   ├── profile/
        │   ├── group-admin/
        │   ├── super-admin/
        │   └── navbar/
        │
        ├── services/
        │   ├── auth.service.ts
        │   ├── user.service.ts
        │   ├── group.service.ts
        │   ├── request.service.ts
        │   ├── admin.service.ts
        │   └── chat.service.ts
        │
        ├── models/
        │   ├── user.ts
        │   ├── group.ts
        │   ├── room.ts
        │   ├── request.ts
        │   ├── audit-log.ts
        │   └── message.ts
        │
        └── guards/
            ├── auth.guard.ts
            ├── group-admin.guard.ts
            └── super-admin.guard.ts

### Components

### Services

### Models

### Routes
Angular Components
        |
        v
Angular Services
        |
        | HTTP
        v
Express REST API
        |
        v
Server-side JSON File


---

## 6. Server REST API

The Express server will expose REST endpoints used by the Angular frontend. Some endpoints are proposed for the completed application and may use prototype/mock behaviour during Phase 1.

### 6.1 Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Validate username/password and return logged-in user information |

### 6.2 Users

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users/:userId` | Retrieve a user's own profile information |
| PUT | `/api/users/:userId` | Update permitted profile fields |
| DELETE | `/api/users/:userId` | Permanently ban/delete a user after an approved Super Administrator action |

### 6.3 Groups

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/groups` | Retrieve available groups |
| GET | `/api/groups/:groupId` | Retrieve details for one group |
| POST | `/api/groups` | Create a group when the Super Administrator actions an approved group request |
| PUT | `/api/groups/:groupId` | Update group title, description, age limit or theme |
| DELETE | `/api/groups/:groupId` | Delete a group after an approved deletion request |
| POST | `/api/groups/:groupId/members/:userId` | Add an approved user to a group |
| DELETE | `/api/groups/:groupId/members/:userId` | Remove a user from a group |
| POST | `/api/groups/:groupId/admins/:userId` | Promote a group member to Group Administrator |
| DELETE | `/api/groups/:groupId/admins/:userId` | Demote a Group Administrator where another administrator remains |
| POST | `/api/groups/:groupId/bans/:userId` | Ban a user from an individual group after an approved report |

### 6.4 Rooms

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/groups/:groupId/rooms` | Retrieve rooms belonging to a group |
| POST | `/api/groups/:groupId/rooms` | Create an approved room |
| PUT | `/api/rooms/:roomId` | Update room details/name |
| DELETE | `/api/rooms/:roomId` | Delete a room |

### 6.5 Requests

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/requests` | Submit a new request |
| GET | `/api/requests` | Retrieve requests available to the current user/admin |
| PUT | `/api/requests/:requestId` | Approve or reject a request |

The request type determines whether the request represents group creation, joining a group, creating a room, banning a user or deleting a group.

### 6.6 Super Administrator

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/audit` | Retrieve audit records |
| GET | `/api/admin/banned-users` | Retrieve permanently banned user records |

### 6.7 Chat

The completed application will require server functionality for retrieving and sending messages. During Phase 1 these features may use mock data because real-time communication using Socket.IO forms part of the later implementation.

Proposed HTTP endpoint:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/rooms/:roomId/messages?limit=5` | Retrieve the five most recent messages when entering a room |

Real-time sending, room joining and room leaving will later use Socket.IO rather than REST.

## 7. Design Documents

The application storyboards were created before implementation and are stored in the `design` directory of this repository.

The storyboards were developed from the elicited functional requirements and illustrate the proposed interface and navigation for regular users, group administrators and the super administrator.

- [Login](design/01-login.png)
- [Registration](design/02-register.png)
- [Groups](design/03-groups.png)
- [Group Rooms](design/04-group-rooms.png)
- [Chat Room](design/05-chat-room.png)
- [Profile](design/06-profile.png)
- [Group Administrator Dashboard](design/07-group-admin.png)
- [Super Administrator Dashboard](design/08-super-admin.png)

The application will use a responsive design approach during implementation so that page content, navigation and interface elements can adapt to different display sizes.