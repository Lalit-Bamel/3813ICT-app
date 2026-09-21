# Fabulari — Phase 2: Fully Functioning Application

## Student Information

**Name:** Lalit Bamel  
**Student Number:** s5383531  

---
## 1. Specifications and Requirements

Fabulari is a group-based chat application developed using Angular, Node.js,
Express, MongoDB and Socket.IO.

Phase 1 of the application used JSON file persistence. Phase 2 replaces the
runtime JSON storage with MongoDB and adds real-time communication, image
uploads and automated testing.

The major Phase 2 requirements implemented are:

- MongoDB persistence using the native MongoDB Node.js driver.
- Persistent storage of users, groups, rooms, requests, messages,
  administrative audit records and application state.
- Real-time chat communication using Socket.IO.
- Real-time room join and leave notifications.
- Real-time synchronisation when messages are deleted.
- Uploading and displaying images in chat.
- Uploading and displaying user profile pictures.
- Input validation and user-friendly error handling.
- Backend unit testing.
- Backend API integration testing.
- Angular unit testing.
- Cypress end-to-end testing.


### 1.1 Technology Stack

The Phase 2 application uses the following technologies:

- Angular 22 for the client application.
- TypeScript for Angular application development.
- Node.js for the backend runtime.
- Express for REST API routing.
- MongoDB for persistent data storage.
- Native MongoDB Node.js driver for database communication.
- Socket.IO for real-time communication.
- bcrypt for password hashing.
- Multer for multipart image uploads.
- RxJS Observables for Angular Socket.IO event handling.
- Mocha and Node assert for backend unit tests.
- Mocha and Chai for backend integration tests.
- Vitest and Angular TestBed for frontend unit tests.
- Cypress for browser-based end-to-end testing.


### 1.2 MongoDB Data Collections

Phase 2 replaces the Phase 1 JSON file persistence with MongoDB using the
native Node.js MongoDB driver.

The application uses the following collections:

- `users` – registered user accounts and profile information.
- `groups` – group details, membership and administration information.
- `rooms` – chat rooms belonging to groups.
- `requests` – group, room, join, ban and deletion requests.
- `messages` – persistent chat messages.
- `auditLogs` – administrative activity records.
- `bannedUsers` – permanently banned user records.
- `appState` – application-level state such as the Super Administrator
  bootstrap status.

Existing application UUID identifiers were retained during the MongoDB
migration so that the existing Angular routes, relationships and application
logic remained compatible.

MongoDB also creates its own `_id` value for each document. The application
UUID `id` remains the identifier used by Fabulari.


### 1.3 Authentication Requirements

Users can register using:

- First name.
- Last name.
- Username.
- Email address.
- Age.
- Password.

Usernames are case-insensitively unique.

Email addresses are unique and cannot be changed after registration.

Passwords are hashed using bcrypt before being stored in MongoDB.

The password must:

- Contain at least eight characters.
- Contain at least one uppercase character.

Users log in using their username and password.

The application contains a single Super Administrator. The Super Administrator
is created using the controlled server bootstrap process rather than public
registration.


### 1.4 Group Requirements

Users can view groups and request membership.

A group contains:

- Title.
- Description.
- Minimum age.
- Theme.
- Administrator IDs.
- Member IDs.
- Banned user IDs.
- Room IDs.
- Creation date.

A group must always contain at least one administrator.

A user may belong to multiple groups.

Users who do not satisfy the minimum age requirement cannot join the group.

Group Administrators can manage group information, membership and rooms
according to the application authorization rules.


### 1.5 Room Requirements

Groups may contain zero or more chat rooms.

Each room belongs to one group.

Only members of the parent group can participate in that room.

Group Administrators can create, rename and delete rooms.

When a room is deleted, its associated messages are removed from the database.


### 1.6 Real-Time Chat Requirements

Chat rooms use Socket.IO for real-time communication.

When a user opens a chat room:

1. The application retrieves the room and the most recent messages through
   the REST API.
2. The Angular client connects to Socket.IO.
3. The client requests to join the Socket.IO room.
4. The server validates the user, room and group membership.
5. The socket joins the room if authorization succeeds.

Text messages and GIF messages are sent using Socket.IO.

When a message is sent:

1. The server validates the sender.
2. The server verifies room membership.
3. The message is stored in MongoDB.
4. The server broadcasts the saved message to all connected clients in that
   room.
5. The Angular client updates the chat interface immediately.

The chat interface displays the five most recent messages.


### 1.7 Presence Requirements

Socket.IO is also used to indicate when users enter or leave a room.

The server broadcasts:

- `userJoined` when another user joins a room.
- `userLeft` when a user leaves or disconnects.

The Angular application listens for these events and displays the presence
message without requiring a page refresh.


### 1.8 Message Deletion Requirements

Users can delete only their own messages.

Message deletion is initiated through the REST API.

The backend verifies message ownership and performs a soft deletion by setting:

`deleted: true`

After the database operation succeeds, the backend emits the Socket.IO event:

`messageDeleted`

All connected clients in the room then remove the deleted message from their
local message list immediately.


### 1.9 Image Upload Requirements

Users can:

- Upload images as chat messages.
- Upload a profile picture.

Images are not stored directly as Base64 or binary data inside MongoDB.

The implemented process is:

1. Angular sends the actual image file using `multipart/form-data`.
2. Multer validates and receives the file on the Node.js server.
3. The image file is stored on the server filesystem.
4. MongoDB stores the public file path and image metadata.
5. Express static file hosting makes the image accessible to the Angular
   frontend.

Chat images are stored under:

`server/uploads/chat/`

Profile pictures are stored under:

`server/uploads/profiles/`

Supported image types are:

- JPEG.
- PNG.
- GIF.
- WEBP.

The maximum allowed image size is 5 MB.


### 1.10 Validation and Error Handling Requirements

Validation is performed at both application and database levels.

Examples include:

- Required field validation.
- Email format validation.
- Integer age validation.
- Password validation.
- Case-insensitive username uniqueness.
- Email uniqueness.
- Group membership authorization.
- Group Administrator authorization.
- Message ownership validation.
- Image MIME-type validation.
- Image size validation.

MongoDB unique indexes provide an additional database-level protection against
duplicate identifiers, usernames and email addresses.

The API returns appropriate HTTP status codes including:

- `200` for successful requests.
- `201` for successful resource creation.
- `400` for invalid input.
- `401` for invalid login credentials.
- `403` for unauthorized operations.
- `404` for resources that cannot be found.
- `409` for duplicate/conflicting data.
- `500` for unexpected server errors.

Unknown API routes return a JSON `404` response rather than the default Express
error page.

## 2. Server API Documentation

The Fabulari backend provides a REST API using Node.js and Express.

The development server runs at:

`http://localhost:3000`

Most API responses use JSON. Image upload endpoints use
`multipart/form-data`.

The API is divided into authentication, users, groups, requests, rooms,
administration and image-upload routes.

---

### 2.1 General Server Routes

| Method | Endpoint | Purpose | Successful Response |
|---|---|---|---|
| GET | `/api/health` | Checks server and MongoDB availability and returns collection counts | `200` with server/database information |
| Any | Unknown `/api/*` route | Handles invalid API paths | `404` with `API route not found.` |

The server also exposes uploaded files through:

`/uploads/*`

using Express static file hosting.

This allows chat images and user profile pictures stored on the Node.js
filesystem to be displayed by the Angular frontend.

---

### 2.2 Authentication API

Authentication routes are mounted under:

`/api`

| Method | Endpoint | Request Data | Purpose | Success |
|---|---|---|---|---|
| POST | `/api/register` | `firstName`, `lastName`, `username`, `email`, `age`, `password` | Creates a new user account | `201` |
| POST | `/api/login` | `username`, `password` | Authenticates an existing user | `200` |

#### POST `/api/register`

The registration endpoint:

1. Validates all required fields.
2. Trims user-entered text.
3. Converts the email address to lowercase.
4. Validates the email format.
5. Validates the user's age.
6. Requires a password containing at least eight characters and one uppercase
   letter.
7. Prevents duplicate email addresses.
8. Prevents case-insensitive duplicate usernames.
9. Prevents an email belonging to a permanently banned user from registering.
10. Hashes the password using bcrypt.
11. Generates a UUID for the user.
12. Saves the user in MongoDB.

The returned user object does not expose the password hash or MongoDB `_id`.

Important responses include:

- `201` – account created successfully.
- `400` – invalid registration information.
- `403` – banned email address.
- `409` – username or email already exists.
- `500` – unexpected registration error.

MongoDB unique indexes also provide a second layer of protection against
duplicate usernames and email addresses.

#### POST `/api/login`

The login endpoint performs a case-insensitive username lookup.

The supplied password is compared with the stored bcrypt password hash.

A successful login returns the user information without exposing
`passwordHash` or MongoDB `_id`.

Important responses include:

- `200` – login successful.
- `400` – username or password missing.
- `401` – invalid username or password.
- `500` – unexpected login error.

---

### 2.3 User API

User routes are mounted under:

`/api/users`

| Method | Endpoint | Request Data | Purpose |
|---|---|---|---|
| GET | `/api/users/:userId` | Path parameter: `userId` | Retrieves a user's profile |
| PUT | `/api/users/:userId` | `firstName`, `lastName`, `username`, `age`, optional `profilePicture`, optional `newPassword` | Updates profile information |

#### GET `/api/users/:userId`

This endpoint retrieves the requested user profile.

The server removes:

- `passwordHash`
- MongoDB `_id`

before returning the profile to the Angular application.

A `404` response is returned if the requested user does not exist.

#### PUT `/api/users/:userId`

This endpoint allows a user profile to be updated.

The endpoint:

- Validates first name.
- Validates last name.
- Validates username.
- Validates age.
- Prevents duplicate usernames.
- Keeps the registered email address unchanged.
- Optionally hashes and stores a new password.
- Updates the MongoDB user document.
- Returns a safe user object.

MongoDB duplicate-key errors are converted into user-friendly `409` responses.

---

### 2.4 Group API

Group routes are mounted under:

`/api/groups`

| Method | Endpoint | Request Data | Purpose |
|---|---|---|---|
| GET | `/api/groups` | None | Returns all groups |
| GET | `/api/groups/:groupId` | Path parameter: `groupId` | Returns one group |
| GET | `/api/groups/:groupId/rooms` | Path parameter: `groupId` | Returns rooms belonging to a group |
| POST | `/api/groups/:groupId/rooms` | `actorId`, `name` | Allows a Group Administrator to create a room |
| GET | `/api/groups/:groupId/members` | Path parameter: `groupId` | Returns members of a group |
| POST | `/api/groups/:groupId/admins/resign` | `actorId` | Allows a Group Administrator to resign |
| POST | `/api/groups/:groupId/admins/:userId` | `actorId` | Promotes a member to Group Administrator |
| DELETE | `/api/groups/:groupId/admins/:userId` | `actorId` | Demotes a Group Administrator |
| PUT | `/api/groups/:groupId` | `actorId`, `title`, `description`, `minimumAge`, `theme` | Updates group information |

#### Group Administration Rules

Group administration operations are protected by backend authorization checks.

The implementation ensures that:

- Only existing Group Administrators can perform administrative actions.
- Only group members can be promoted to Group Administrator.
- An existing Group Administrator cannot be promoted again.
- Administrators cannot demote themselves using the normal demotion endpoint.
- Administrator resignation uses a separate operation.
- A group cannot be left without at least one administrator.
- Group titles have a maximum length of 30 characters.
- Group descriptions have a maximum length of 250 characters.
- Minimum age must be a valid non-negative integer.

When a group's minimum age is increased, members who no longer satisfy the age
requirement are removed from the group.

The update is rejected if the age change would result in the group having no
remaining administrator.

---

### 2.5 Request API

Request routes are mounted under:

`/api/requests`

Fabulari uses requests for operations that require approval from either a Group
Administrator or the Super Administrator.

| Method | Endpoint | Request Data | Purpose |
|---|---|---|---|
| POST | `/api/requests/group-creation` | `requesterId`, `title`, `description`, `minimumAge`, `theme` | Requests creation of a new group |
| POST | `/api/requests/join` | `requesterId`, `groupId` | Requests membership of a group |
| POST | `/api/requests/room-creation` | `requesterId`, `groupId`, `roomName` | Proposes creation of a new room |
| POST | `/api/requests/group-ban` | `requesterId`, `groupId`, `targetUserId`, `reason` | Requests a group-level ban |
| POST | `/api/requests/system-ban` | `requesterId`, `groupId`, `targetUserId`, `reason` | Requests a system-wide ban |
| POST | `/api/requests/group-deletion` | `requesterId`, `groupId`, optional `reason` | Requests deletion of a group |
| GET | `/api/requests/super-admin/:userId` | Path parameter: `userId` | Returns pending requests for the Super Administrator |
| GET | `/api/requests/group-admin/:userId/:groupId` | Path parameters: `userId`, `groupId` | Returns pending requests for a Group Administrator |
| GET | `/api/requests/user/:userId/history` | Path parameter: `userId` | Returns the user's request history |
| PUT | `/api/requests/:requestId` | `actorId`, `status`, optional `rejectionReason` | Approves or rejects a request |

---

### 2.6 Request Types and Approval Behaviour

#### Group Creation

Request type:

`groupCreation`

The requester supplies the proposed:

- Group title.
- Description.
- Minimum age.
- Theme.

The Super Administrator approves or rejects the request.

When approved:

- A new group UUID is generated.
- The requester becomes a member.
- The requester becomes the first Group Administrator.
- The group initially contains no rooms.
- The group initially contains no banned users.

#### Join Group

Request type:

`joinGroup`

Before creating or approving the request, the application checks that:

- The user exists.
- The user is not already a member.
- The user is not banned from the group.
- The user meets the minimum age requirement.
- A duplicate pending join request does not already exist.

A Group Administrator approves or rejects the request.

#### Room Creation

Request type:

`roomCreation`

A regular group member can propose a room.

The request stores the proposed room name and target group.

A Group Administrator approves or rejects the request.

When approved, a new room is created and associated with the group.

#### Group Ban

Request type:

`groupBan`

A group member can request that another member be banned from the group.

A user cannot create a ban request against themselves.

A Group Administrator approves or rejects the request.

The administrator who submitted a ban request cannot approve their own
request.

If approved:

- The target is added to `bannedUserIds`.
- The target is removed from `memberIds`.
- The target is removed from `adminIds` when applicable.

The operation cannot leave a group without an administrator.

#### System Ban

Request type:

`systemBan`

A system ban request is created by a Group Administrator and actioned by the
Super Administrator.

If approved:

- The target user is removed from relevant groups.
- A permanent banned-user record is stored in `bannedUsers`.
- The account is removed from the `users` collection.

A system ban cannot be completed if the target is the sole administrator of a
group.

#### Group Deletion

Request type:

`groupDeletion`

Only a Group Administrator can request deletion of their group.

The Super Administrator approves or rejects the request.

If approved:

- The group is deleted.
- Rooms belonging to the group are deleted.
- Messages belonging to those rooms are deleted.

#### Approving or Rejecting Requests

Requests are actioned through:

`PUT /api/requests/:requestId`

The body contains:

- `actorId`
- `status`
- Optional `rejectionReason`

The accepted status values are:

`approved`

or:

`rejected`

A rejection requires a rejection reason.

The backend verifies that the person performing the action has the correct
administrative role for that request type.

A request that has already been actioned cannot be actioned again.

Important administrative actions are recorded in the `auditLogs` collection.

---

### 2.7 Room and Message API

Room routes are mounted under:

`/api/rooms`

| Method | Endpoint | Request Data | Purpose |
|---|---|---|---|
| GET | `/api/rooms/:roomId` | Path parameter: `roomId` | Retrieves one room |
| PUT | `/api/rooms/:roomId` | `actorId`, `name` | Renames a room |
| DELETE | `/api/rooms/:roomId` | `actorId` | Deletes a room |
| GET | `/api/rooms/:roomId/messages` | Query: `userId`, optional `limit` | Retrieves recent non-deleted messages |
| POST | `/api/rooms/:roomId/messages` | `senderId`, `type`, `content` | Creates a message using REST |
| DELETE | `/api/rooms/:roomId/messages/:messageId` | `actorId` | Soft-deletes the user's own message |

#### GET `/api/rooms/:roomId/messages`

The endpoint verifies that:

- The room exists.
- The requesting user exists.
- The requester is not the Super Administrator.
- The parent group exists.
- The requester belongs to the parent group.

The default message limit is:

`5`

The maximum accepted limit is:

`50`

Messages where:

`deleted: true`

are excluded.

Returned messages are enriched with:

- `senderUsername`
- `senderProfilePicture`
- `senderIsAdmin`

#### POST `/api/rooms/:roomId/messages`

This REST route supports the following message types:

- `text`
- `image`
- `gif`

The final real-time Angular chat primarily uses Socket.IO for text and GIF
messages.

The REST endpoint remains available for persistent message creation.

#### DELETE `/api/rooms/:roomId/messages/:messageId`

A user can delete only a message they originally sent.

Deletion is implemented as a soft delete by updating:

`deleted: true`

After MongoDB is successfully updated, the backend emits the Socket.IO event:

`messageDeleted`

to clients in that room.

This allows the deleted message to disappear from all connected clients without
a page refresh.

#### PUT `/api/rooms/:roomId`

Only a Group Administrator belonging to the room's parent group can rename the
room.

#### DELETE `/api/rooms/:roomId`

Only a Group Administrator can delete a room.

Deleting a room:

1. Removes the room document.
2. Removes the room ID from the parent group's `roomIds`.
3. Deletes messages belonging to the room.

---

### 2.8 Administration API

Administration routes are mounted under:

`/api/admin`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/banned-users/:userId` | Returns permanently banned users |
| GET | `/api/admin/audit-logs/:userId` | Returns administrative audit records |

Both routes verify that the supplied `userId` belongs to the Super
Administrator.

Unauthorized users receive:

`403 Access denied.`

Audit logs are returned in reverse chronological order and are enriched with
available user information.

---

### 2.9 Image Upload API

Image upload routes are mounted under:

`/api/uploads`

The endpoints use:

`multipart/form-data`

The uploaded file field is named:

`image`

Supported MIME types are:

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

The maximum supported image size is:

`5 MB`

| Method | Endpoint | Multipart Fields | Purpose |
|---|---|---|---|
| POST | `/api/uploads/chat-image` | `image`, `roomId`, `senderId` | Uploads an image as a chat message |
| POST | `/api/uploads/profile-image` | `image`, `userId` | Uploads a user's profile picture |

#### POST `/api/uploads/chat-image`

The endpoint:

1. Validates the room.
2. Validates the sender.
3. Checks that the sender belongs to the parent group.
4. Prevents the Super Administrator from participating in chat.
5. Generates a unique file name.
6. Saves the actual image under `server/uploads/chat/`.
7. Stores the image path and metadata in MongoDB.
8. Creates a message with type `image`.
9. Broadcasts `newMessage` using Socket.IO.
10. Returns the created message using HTTP status `201`.

Stored image metadata includes:

- Generated file name.
- Original file name.
- MIME type.
- File size.

#### POST `/api/uploads/profile-image`

The endpoint:

1. Validates the user.
2. Validates the uploaded image.
3. Generates a unique file name.
4. Saves the image under `server/uploads/profiles/`.
5. Stores the public image path in `profilePicture`.
6. Stores image metadata in `profilePictureMetadata`.
7. Returns the updated safe user object.

Profile image metadata includes:

- Generated file name.
- Original file name.
- MIME type.
- File size.
- Upload timestamp.

---

### 2.10 Socket.IO API

Socket.IO is attached to the same Node.js HTTP server used by Express.

During development, Socket.IO accepts connections from the Angular application
running at:

`http://localhost:4200`

Fabulari uses Socket.IO rooms so events are delivered only to users currently
viewing the relevant chat room.

#### Client-to-Server Socket Events

| Event | Payload | Purpose | Acknowledgement |
|---|---|---|---|
| `joinRoom` | `{ roomId, userId }` | Validates the user and joins the socket to a chat room | `{ success, message }` |
| `leaveRoom` | `{ roomId }` | Removes the socket from its current chat room | `{ success, message }` |
| `sendMessage` | `{ roomId, senderId, type, content }` | Validates, persists and broadcasts a real-time message | `{ success, message }` |

#### `joinRoom`

Before allowing a socket to join a room, the backend verifies:

- `roomId` is supplied.
- `userId` is supplied.
- The room exists.
- The user exists.
- The user is not the Super Administrator.
- The parent group exists.
- The user belongs to the parent group.

If the socket was already inside another room, it leaves that room first.

The server stores the current:

- Room ID.
- User ID.
- Username.

inside `socket.data`.

After a successful join, other users in the room receive:

`userJoined`

#### `leaveRoom`

The backend verifies that the socket is currently inside the supplied room.

The socket then:

1. Leaves the Socket.IO room.
2. Causes `userLeft` to be broadcast.
3. Clears its current room information.

#### `sendMessage`

The event accepts:

- `roomId`
- `senderId`
- `type`
- `content`

Supported message types are:

- `text`
- `image`
- `gif`

The backend verifies:

- The room exists.
- The sender exists.
- The sender is not the Super Administrator.
- The parent group exists.
- The sender belongs to the group.
- The socket has joined the requested room.
- The Socket.IO user matches the supplied sender ID.

After validation:

1. A UUID is generated for the message.
2. The message is inserted into MongoDB.
3. Sender information is added to the outgoing message.
4. `newMessage` is broadcast to every socket currently inside that room,
   including the original sender.

---

### 2.11 Server-to-Client Socket Events

| Event | Payload | Purpose |
|---|---|---|
| `userJoined` | `{ userId, username, roomId }` | Indicates that another user entered the room |
| `userLeft` | `{ userId, username, roomId }` | Indicates that another user left the room |
| `newMessage` | Chat message object | Delivers a newly persisted message to connected clients |
| `messageDeleted` | `{ roomId, messageId }` | Removes a deleted message from connected clients |

#### `newMessage`

A normal real-time message contains information including:

- `id`
- `roomId`
- `senderId`
- `type`
- `content`
- `createdAt`
- `deleted`
- `senderUsername`
- `senderProfilePicture`
- `senderIsAdmin`

Image uploads also cause a `newMessage` event after the file and MongoDB message
have been successfully stored.

Image messages additionally contain image metadata.

#### `userJoined`

This event is broadcast to other users in the room after a successful room
join.

#### `userLeft`

This event can be broadcast when:

- A user explicitly leaves a room.
- A user changes rooms.
- A socket disconnects while inside a room.

#### `messageDeleted`

This event is emitted after the REST message-deletion endpoint successfully
marks a message as deleted in MongoDB.

The Angular client receives the event and removes the matching message from its
local message array.

This keeps all active users in the room synchronized without requiring a page
refresh.

## 3. Angular Architecture

The Fabulari client is implemented using Angular 22 and TypeScript.

The application uses Angular's standalone application architecture rather than
an NgModule-based structure.

The application is started using `bootstrapApplication()` in `main.ts`.

`app.config.ts` provides:

- Angular routing through `provideRouter(routes)`.
- HTTP communication through `provideHttpClient()`.
- Browser-level global error listeners.

The frontend is divided into:

- Components for user-interface features.
- Services for REST and Socket.IO communication.
- Models for application data structures.
- Route guards for authentication and role-based navigation.

The frontend communicates with the Node.js backend at:

`http://localhost:3000`

---

### 3.1 Components

Fabulari contains the following Angular components.

| Component | Main Responsibility |
|---|---|
| `LoginComponent` | Authenticates existing users |
| `RegisterComponent` | Creates new user accounts |
| `NavbarComponent` | Provides shared navigation and logout functionality |
| `GroupsComponent` | Displays groups, group searching, membership requests and group creation requests |
| `GroupRoomsComponent` | Displays and manages rooms within a group |
| `GroupAdminComponent` | Provides Group Administrator management functions |
| `SuperAdminComponent` | Provides Super Administrator request and audit management |
| `ProfileComponent` | Displays and updates the current user's profile and profile picture |
| `ChatRoomComponent` | Provides persistent and real-time chat functionality |

---

#### 3.1.1 LoginComponent

`LoginComponent` provides the Fabulari login interface.

The user enters:

- Username.
- Password.

The component calls:

`AuthService.login()`

If authentication succeeds, the authenticated user is stored by
`AuthService` and the application navigates to the appropriate protected area.

If authentication fails, the backend error message is displayed to the user.

`ChangeDetectorRef.markForCheck()` is used after asynchronous responses so
error information is displayed immediately.

---

#### 3.1.2 RegisterComponent

`RegisterComponent` provides the public account registration interface.

The component collects:

- First name.
- Last name.
- Username.
- Email.
- Age.
- Password.

Registration data is sent using:

`AuthService.register()`

The backend performs the authoritative validation and account creation.

The component displays backend validation errors such as:

- Invalid input.
- Duplicate username.
- Duplicate email address.
- Password validation failures.

After successful registration, the user can proceed to login.

---

#### 3.1.3 NavbarComponent

`NavbarComponent` provides shared navigation across authenticated pages.

It accesses the current user through `AuthService`.

The navbar can determine whether the current account is the Super
Administrator through the `isSuperAdmin` state.

The component also provides logout functionality.

Logout:

1. Removes the current user from local storage.
2. Clears the authentication signal.
3. Returns the user to the login interface.

---

#### 3.1.4 GroupsComponent

`GroupsComponent` is the main page for normal authenticated users.

The component loads:

- Available groups.
- The current user's request history.

Group data is obtained through:

`GroupService`

Request information is obtained through:

`RequestService`

The component supports:

- Viewing available groups.
- Searching groups by title or description.
- Determining whether the current user is a member.
- Determining whether the current user is a Group Administrator.
- Requesting membership of a group.
- Submitting a group-creation request.
- Viewing previous request statuses.

The component does not directly create groups because new group creation
requires Super Administrator approval.

---

#### 3.1.5 GroupRoomsComponent

`GroupRoomsComponent` displays the contents of a selected group.

The group ID is obtained from the Angular route parameter:

`groupId`

When the component loads, it retrieves:

- The group.
- Rooms belonging to the group.
- Members belonging to the group.

The component uses:

- `GroupService`
- `RoomService`
- `RequestService`

The available functionality depends on whether the current user is a normal
member or Group Administrator.

Group Administrators can:

- Create rooms directly.
- Rename rooms.
- Delete rooms.

Normal group members can:

- View available rooms.
- Open chat rooms.
- Propose a new room through a room-creation request.

Group members can also create a group-ban request against another eligible
member.

The component contains client-side helper functions that determine:

- Whether the current user is a Group Administrator.
- Whether another member is an administrator.

Backend authorization is still performed for all protected operations.

---

#### 3.1.6 GroupAdminComponent

`GroupAdminComponent` provides the management interface for Group
Administrators.

Access to this component is protected by:

- `authGuard`
- `userGuard`
- `groupAdminGuard`

The component loads:

- Current group information.
- Group members.
- Pending requests requiring Group Administrator action.

The component supports:

- Editing the group title.
- Editing the group description.
- Editing the minimum age.
- Editing the group theme.
- Promoting members to Group Administrator.
- Demoting Group Administrators.
- Resigning as Group Administrator.
- Approving pending requests.
- Rejecting pending requests with a reason.
- Creating system-ban requests.
- Creating group-deletion requests.

The backend still performs all authorization and business-rule checks.

This prevents client-side manipulation from bypassing rules such as the
requirement for a group to always contain at least one administrator.

---

#### 3.1.7 SuperAdminComponent

`SuperAdminComponent` provides the interface available only to the single
Super Administrator.

Access is protected by:

- `authGuard`
- `superAdminGuard`

The component uses:

- `RequestService`
- `AdminService`

The Super Administrator interface loads pending requests and separates them
according to request type.

The component handles:

- Group-creation requests.
- System-ban requests.
- Group-deletion requests.
- Request approval.
- Request rejection with a rejection reason.
- Viewing permanently banned users.
- Viewing administrative audit logs.
- Filtering audit-log information.

The Super Administrator account does not participate in normal group chat.

---

#### 3.1.8 ProfileComponent

`ProfileComponent` displays and updates the authenticated user's profile.

The component initially retrieves the latest profile information from the
backend using:

`UserService.getProfile()`

Editable profile fields include:

- First name.
- Last name.
- Username.
- Age.
- Password.

The email address is displayed but cannot be edited.

Profile updates use:

`UserService.updateProfile()`

The component also supports profile-picture uploads.

When an image is selected:

1. The file type is validated.
2. The size is limited to 5 MB.
3. `FileReader` creates a Base64 preview only inside the browser.
4. The actual `File` object is retained for upload.
5. The file is sent using `multipart/form-data`.
6. The backend stores the image on the filesystem.
7. The returned image path becomes the user's `profilePicture`.

The Base64 preview is not stored in MongoDB.

After an update, `AuthService.setCurrentUser()` refreshes the stored client-side
user information.

---

#### 3.1.9 ChatRoomComponent

`ChatRoomComponent` provides the main real-time communication functionality.

The route contains:

- `groupId`
- `roomId`

When the component initializes, it:

1. Reads the route parameters.
2. Connects to Socket.IO.
3. Registers Socket.IO event listeners.
4. Retrieves the group.
5. Retrieves the room.
6. Retrieves the most recent five messages using REST.
7. Joins the Socket.IO room after the room has been validated.

The component uses:

- `AuthService`
- `GroupService`
- `RoomService`
- `SocketService`

Initial message history is retrieved using REST.

Live communication is handled with Socket.IO.

The component listens for:

- `newMessage`
- `userJoined`
- `userLeft`
- `messageDeleted`

When `newMessage` is received, the message is added to the local message array.

The interface keeps the most recent five messages using:

`slice(-5)`

Text messages are sent using:

`SocketService.sendMessage()`

GIF messages are also sent through Socket.IO.

Chat images use a hybrid process:

1. The actual image file is uploaded through HTTP.
2. The backend saves the image file.
3. MongoDB stores the message and image metadata.
4. The backend broadcasts `newMessage`.
5. Every connected client displays the image immediately.

Image selection validates:

- JPEG.
- PNG.
- GIF.
- WEBP.

The maximum image size is 5 MB.

`FileReader` is used only for a local image preview.

Message deletion uses REST for the state-changing request.

After a message is soft-deleted, the server broadcasts:

`messageDeleted`

The component responds by filtering the deleted message from the local
`messages` array.

This allows the deletion to appear immediately on every client currently
viewing the room.

When the component is destroyed, it:

1. Leaves the Socket.IO room.
2. Unsubscribes from Socket.IO/RxJS subscriptions.
3. Disconnects the socket.

This prevents unused listeners from remaining active after the user leaves the
chat page.

---

### 3.2 Services

Angular services separate backend communication and application state from the
visual components.

Fabulari uses the following services.

| Service | Responsibility |
|---|---|
| `AuthService` | Authentication and current-user state |
| `UserService` | Profile retrieval, updating and profile-image upload |
| `GroupService` | Group and Group Administrator operations |
| `RoomService` | Room management, message history and chat-image upload |
| `RequestService` | Creation and actioning of application requests |
| `AdminService` | Super Administrator banned-user and audit-log retrieval |
| `SocketService` | Socket.IO connection and real-time chat events |

---

#### 3.2.1 AuthService

`AuthService` manages authentication and current-user state.

The service communicates with:

- `POST /api/register`
- `POST /api/login`

The service maintains the authenticated user using an Angular signal:

`currentUserSignal`

A read-only version is exposed to components through:

`currentUser`

The current user is also stored in browser `localStorage` using the key:

`currentUser`

This allows the authenticated user state to survive a normal browser refresh.

Important methods include:

- `register()`
- `login()`
- `setCurrentUser()`
- `getCurrentUser()`
- `logout()`
- `isLoggedIn()`
- `isSuperAdmin()`

The login operation uses RxJS `tap()` to store the user after a successful
response.

---

#### 3.2.2 UserService

`UserService` handles user-profile communication.

Important methods include:

- `getProfile()`
- `updateProfile()`
- `uploadProfilePicture()`

Profile-image uploads use `FormData`.

The service sends:

- `userId`
- The actual image file

to:

`POST /api/uploads/profile-image`

This keeps binary image handling separate from normal JSON profile updates.

---

#### 3.2.3 GroupService

`GroupService` communicates with the group API.

Important methods include:

- `getGroups()`
- `getGroup()`
- `getGroupMembers()`
- `updateGroup()`
- `promoteAdmin()`
- `demoteAdmin()`
- `resignAdmin()`

The service is used by normal group interfaces and the Group Administrator
interface.

Administrative requests include the acting user's ID so the backend can
perform authorization checks.

---

#### 3.2.4 RoomService

`RoomService` handles room and persistent-message HTTP operations.

Important methods include:

- `getRooms()`
- `getRoom()`
- `createRoom()`
- `renameRoom()`
- `deleteRoom()`
- `getMessages()`
- `sendMessage()`
- `uploadChatImage()`
- `deleteMessage()`

`getMessages()` requests the most recent five messages.

`sendMessage()` represents the REST message endpoint retained by the
application, although the live chat primarily uses Socket.IO for text and GIF
messages.

`uploadChatImage()` creates a `FormData` object containing:

- `roomId`
- `senderId`
- `image`

and sends it to the chat-image upload API.

`deleteMessage()` uses the REST API to perform the database update before the
server broadcasts the real-time deletion event.

---

#### 3.2.5 RequestService

`RequestService` handles the request/approval system.

Important methods include:

- `createGroupRequest()`
- `requestJoin()`
- `createRoomRequest()`
- `createGroupBanRequest()`
- `createSystemBanRequest()`
- `createGroupDeletionRequest()`
- `getSuperAdminRequests()`
- `getGroupJoinRequests()`
- `getUserRequestHistory()`
- `actionRequest()`

`actionRequest()` sends:

- Request ID.
- Acting administrator ID.
- `approved` or `rejected` status.
- Optional rejection reason.

The backend determines whether the acting user has permission to action the
specific request type.

---

#### 3.2.6 AdminService

`AdminService` provides Super Administrator data retrieval.

Important methods are:

- `getBannedUsers()`
- `getAuditLogs()`

Both operations include the Super Administrator user ID.

The backend performs the final role validation.

---

#### 3.2.7 SocketService

`SocketService` isolates Socket.IO communication from Angular components.

The service connects to:

`http://localhost:3000`

The socket is created with:

`autoConnect: false`

This means the application explicitly connects when a chat room requires
real-time communication.

Connection methods include:

- `connect()`
- `disconnect()`

Client-to-server methods include:

- `joinRoom()`
- `leaveRoom()`
- `sendMessage()`

These methods use Socket.IO acknowledgement callbacks and return a
`Promise<SocketActionResult>`.

The acknowledgement contains:

- `success`
- `message`

Server-to-client Socket.IO events are exposed as RxJS Observables.

Listener methods include:

- `onNewMessage()`
- `onUserJoined()`
- `onUserLeft()`
- `onMessageDeleted()`

Each Observable removes its Socket.IO listener when the Angular subscription is
unsubscribed.

This prevents duplicate listeners when components are destroyed and recreated.

---

### 3.3 Models

TypeScript interfaces define the frontend representation of application data.

These models provide consistent typing between components and services.

---

#### 3.3.1 User Model

The `User` interface contains:

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Application UUID |
| `firstName` | `string` | User's first name |
| `lastName` | `string` | User's last name |
| `username` | `string` | Unique username |
| `email` | `string` | Registered email |
| `age` | `number` | User age |
| `profilePicture` | `string` | Stored profile-image path |
| `systemRole` | `'user' \| 'superAdmin'` | System-level role |
| `createdAt` | `string` | Account creation timestamp |

The same model file also defines `BannedUser`.

`BannedUser` contains:

- `id`
- `originalUserId`
- `firstName`
- `lastName`
- `email`
- `reason`
- `bannedBy`
- `bannedAt`

---

#### 3.3.2 Group Model

The `Group` interface contains:

| Field | Type |
|---|---|
| `id` | `string` |
| `title` | `string` |
| `description` | `string` |
| `minimumAge` | `number` |
| `theme` | `string` |
| `adminIds` | `string[]` |
| `memberIds` | `string[]` |
| `bannedUserIds` | `string[]` |
| `roomIds` | `string[]` |
| `createdAt` | `string` |

The group model file also defines:

`GroupMember`

which contains:

- `id`
- `username`

This smaller representation is used when displaying and managing group
membership.

---

#### 3.3.3 Room Model

The `Room` interface contains:

| Field | Type |
|---|---|
| `id` | `string` |
| `groupId` | `string` |
| `name` | `string` |
| `createdAt` | `string` |

`groupId` links each room to its parent group.

---

#### 3.3.4 Message Model

The `Message` interface contains:

| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Message UUID |
| `roomId` | `string` | Parent room |
| `senderId` | `string` | Sending user |
| `type` | `'text' \| 'image' \| 'gif'` | Message type |
| `content` | `string` | Text, URL or stored image path |
| `senderProfilePicture` | optional `string` | Sender avatar |
| `createdAt` | `string` | Creation timestamp |
| `deleted` | `boolean` | Soft-deletion state |
| `senderUsername` | optional `string` | Display username |
| `senderIsAdmin` | optional `boolean` | Group Administrator indicator |

The sender-related fields are used to enrich the chat interface without
requiring an additional user request for every rendered message.

---

#### 3.3.5 Request Model

The `Request` interface contains:

- `id`
- `type`
- `requesterId`
- Optional `requesterUsername`
- Optional `targetUsername`
- Optional `groupTitle`
- `targetGroupId`
- `targetUserId`
- `details`
- `reason`
- `status`
- `rejectionReason`
- `createdAt`

The `status` field is restricted to:

- `pending`
- `approved`
- `rejected`

The flexible `details` property stores information specific to each request
type.

---

#### 3.3.6 AuditLog Model

The `AuditLog` interface contains:

- `id`
- `type`
- `actorId`
- `targetId`
- `details`
- `createdAt`
- Optional `actorUsername`
- Optional `targetUsername`

Audit records can therefore contain both persisted IDs and enriched usernames
for display in the Super Administrator interface.

---

### 3.4 Routes and Guards

Angular Router controls navigation between application features.

The configured routes are:

| Route | Component | Guards |
|---|---|---|
| `/` | Redirects to `/login` | None |
| `/login` | `LoginComponent` | None |
| `/register` | `RegisterComponent` | None |
| `/groups` | `GroupsComponent` | `authGuard`, `userGuard` |
| `/profile` | `ProfileComponent` | `authGuard`, `userGuard` |
| `/groups/:groupId/rooms/:roomId` | `ChatRoomComponent` | `authGuard`, `userGuard` |
| `/groups/:groupId/admin` | `GroupAdminComponent` | `authGuard`, `userGuard`, `groupAdminGuard` |
| `/groups/:groupId` | `GroupRoomsComponent` | `authGuard`, `userGuard` |
| `/super-admin` | `SuperAdminComponent` | `authGuard`, `superAdminGuard` |
| `**` | Redirects to `/login` | None |

The specific chat-room and Group Administrator routes appear before the
generic:

`/groups/:groupId`

route so that Angular matches the intended route correctly.

---

#### 3.4.1 authGuard

`authGuard` checks:

`AuthService.isLoggedIn()`

If a user is authenticated, navigation is allowed.

Otherwise the guard returns a URL tree redirecting to:

`/login`

This protects authenticated application pages from unauthenticated access.

---

#### 3.4.2 userGuard

`userGuard` prevents the Super Administrator from entering interfaces intended
for normal users.

If the current account is not the Super Administrator, navigation is allowed.

If the current account is the Super Administrator, the user is redirected to:

`/super-admin`

This separates normal-user functionality from system administration.

---

#### 3.4.3 superAdminGuard

`superAdminGuard` checks:

`AuthService.isSuperAdmin()`

Only the Super Administrator can access the Super Administrator page.

Other authenticated users are redirected to:

`/groups`

---

#### 3.4.4 groupAdminGuard

`groupAdminGuard` protects the Group Administrator interface.

The guard:

1. Retrieves the current user.
2. Reads `groupId` from the route.
3. Requests the current group using `GroupService`.
4. Checks whether the user's ID appears in `group.adminIds`.

If the user is a Group Administrator, navigation is allowed.

Otherwise the user is redirected to:

`/groups`

Errors while retrieving the group are also handled by redirecting away from
the protected route.

The guard provides client-side navigation protection, while the Node.js backend
still independently validates authorization for every protected API action.

---

### 3.5 Angular State and Communication Flow

Fabulari uses several different frontend communication mechanisms depending on
the type of operation.

#### Authentication State

`AuthService`

uses:

- Angular signals for reactive current-user state.
- `localStorage` for browser persistence.

Components can therefore access the current authenticated user without
repeatedly requesting it from the backend.

#### REST Communication

Angular's `HttpClient` is used for persistent operations such as:

- Registration.
- Login.
- Profile management.
- Group operations.
- Room operations.
- Request operations.
- Message history.
- Image uploads.
- Message deletion.

#### Real-Time Communication

`SocketService`

uses `socket.io-client` for:

- Room joining.
- Room leaving.
- Text and GIF messages.
- New-message delivery.
- Presence events.
- Real-time message-deletion synchronization.

RxJS Observables wrap server-to-client Socket.IO events so components can
subscribe and unsubscribe using normal Angular patterns.

#### Change Detection

Several components use:

`ChangeDetectorRef.markForCheck()`

after asynchronous HTTP and Socket.IO updates.

This ensures that newly received data, validation errors and real-time events
are reflected immediately in the interface.

## 4. Design Documents

Fabulari Phase 2 uses a MEAN-style client-server architecture consisting of
Angular, Express/Node.js and MongoDB, with Socket.IO providing real-time
communication.

The application was designed so that persistent CRUD operations, file uploads
and administration are handled using HTTP/REST, while events that need to
appear immediately for multiple connected users are handled using Socket.IO.

---

### 4.1 Overall System Architecture

The overall application architecture is:

```text
Angular 22 Client
        |
        | HTTP / REST
        | Socket.IO
        v
Node.js + Express Server
        |
        | Native MongoDB Driver
        v
MongoDB
```

The backend also stores uploaded image files on the server filesystem:

```text
Node.js Server
    |
    +-- uploads/
        |
        +-- chat/
        |
        +-- profiles/
```

MongoDB stores references and metadata for those files rather than storing the
image binary directly.

---

### 4.2 Application Communication Design

Fabulari uses both REST and Socket.IO because different operations have
different communication requirements.

#### REST is used for:

- Registration.
- Login.
- Profile retrieval.
- Profile updates.
- Group management.
- Room management.
- Request creation.
- Request approval and rejection.
- Super Administrator data.
- Initial message-history retrieval.
- Chat-image uploads.
- Profile-image uploads.
- Message deletion.

#### Socket.IO is used for:

- Joining a chat room.
- Leaving a chat room.
- Sending live text messages.
- Sending live GIF messages.
- Broadcasting uploaded image messages.
- User join notifications.
- User leave notifications.
- Synchronising message deletion.

This creates a hybrid design:

```text
Persistent request/response operation
             |
             v
            REST


Immediate multi-user update
             |
             v
         Socket.IO
```

For example, deleting a message uses REST to perform the authenticated database
operation.

After the deletion succeeds, Socket.IO broadcasts `messageDeleted` so all
users currently viewing the room update immediately.

---

### 4.3 Server Startup Design

The backend connects to MongoDB before accepting HTTP connections.

The startup sequence is:

```text
Start Node.js server
        |
        v
Load environment variables
        |
        v
Connect to MongoDB
        |
        v
Create/verify MongoDB indexes
        |
        v
Run Super Administrator bootstrap check
        |
        v
Start HTTP server
        |
        v
Express + Socket.IO available
```

This prevents the application from accepting normal requests when the database
connection has not been established.

Socket.IO is attached to the same Node.js HTTP server used by Express.

---

### 4.4 MongoDB Design

Phase 1 used a JSON file for application persistence.

Phase 2 migrated the live application data to MongoDB using the native
MongoDB Node.js driver.

Mongoose is not used.

The MongoDB database is:

`fabulari`

The main collections are:

| Collection | Purpose |
|---|---|
| `users` | Registered users and profile information |
| `groups` | Group configuration, membership and administrator relationships |
| `rooms` | Chat rooms |
| `requests` | Approval workflow requests |
| `messages` | Persistent chat messages |
| `auditLogs` | Administrative activity |
| `bannedUsers` | Permanently banned users |
| `appState` | Application-level state |

---

### 4.5 Application IDs and MongoDB `_id`

MongoDB automatically creates an `_id` value for each document.

Fabulari also retains its existing UUID-based `id` properties.

For example:

```text
MongoDB _id
    |
    +-- Internal MongoDB document identity

Fabulari id
    |
    +-- Application UUID used by Angular,
        routes and relationships
```

The Phase 1 application already used UUIDs throughout its routes and
relationships.

Retaining these identifiers during the migration reduced unnecessary frontend
changes and preserved compatibility between Phase 1 and Phase 2.

MongoDB `_id` values are generally removed before objects are returned to the
Angular client.

---

### 4.6 MongoDB Relationships

Fabulari uses application UUIDs to represent relationships between collections.

#### Group relationships

A group stores:

- `adminIds`
- `memberIds`
- `bannedUserIds`
- `roomIds`

These values reference application UUIDs.

Example:

```text
Group
 |
 +-- adminIds --------> User IDs
 |
 +-- memberIds -------> User IDs
 |
 +-- bannedUserIds ---> User IDs
 |
 +-- roomIds ---------> Room IDs
```

#### Room relationships

Each room contains:

`groupId`

which identifies its parent group.

```text
Group
  |
  +---- Room
          |
          +---- groupId
```

#### Message relationships

Each message contains:

- `roomId`
- `senderId`

```text
User
  |
  +---- senderId
          |
        Message
          |
          +---- roomId ----> Room
```

#### Request relationships

Requests contain identifiers such as:

- `requesterId`
- `targetGroupId`
- `targetUserId`

The exact fields used depend on the request type.

---

### 4.7 MongoDB Index Design

Indexes were added for identifiers, uniqueness requirements and frequently
used query patterns.

#### Users

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate application user UUIDs |
| `email` unique | Prevent duplicate email addresses |
| `username` unique with case-insensitive collation | Prevent usernames that differ only by letter case |

The username index uses case-insensitive collation.

Therefore usernames such as:

```text
user1
User1
USER1
```

cannot exist as separate accounts.

#### Groups

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate group UUIDs |

#### Rooms

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate room UUIDs |
| `groupId` | Improve retrieval of rooms belonging to a group |

#### Requests

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate request UUIDs |
| `requesterId + createdAt` | Improve user request-history queries |
| `type + status + targetGroupId` | Improve pending administrative request queries |

#### Messages

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate message UUIDs |
| `roomId + createdAt DESC` | Improve retrieval of recent room messages |

The message index is particularly relevant because the chat repeatedly asks
for the newest messages belonging to one room.

#### Audit Logs

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate audit-log UUIDs |
| `createdAt DESC` | Improve chronological audit-log queries |

#### Banned Users

| Index | Purpose |
|---|---|
| `id` unique | Prevent duplicate banned-user records |
| `originalUserId` unique | Prevent multiple permanent-ban records for the same user |

#### Application State

| Index | Purpose |
|---|---|
| `key` unique | Prevent duplicate application-state keys |

MongoDB also maintains its normal `_id` index automatically.

---

### 4.8 MongoDB Migration Design

Phase 2 required existing Phase 1 information to be moved from JSON
persistence to MongoDB.

Dedicated migration scripts were used for this process.

The migration was separated from the final runtime routes.

Conceptually:

```text
Phase 1 data.json
        |
        v
Migration scripts
        |
        v
MongoDB collections
```

After migration:

```text
Angular
   |
   v
Express
   |
   v
MongoDB
```

The Phase 1 JSON file is no longer used as live runtime persistence.

Migration utilities remain separate from normal application execution.

---

### 4.9 Super Administrator Bootstrap Design

Fabulari supports exactly one Super Administrator.

The account is not created using normal public registration.

Instead, application startup performs a controlled bootstrap check.

The bootstrap logic uses:

- The `users` collection.
- The `appState` collection.

The design allows the server to determine whether the one-time Super
Administrator bootstrap has already been completed.

Conceptually:

```text
Server starts
      |
      v
Check application state
      |
      +-- Super Admin already exists
      |        |
      |        v
      |     Continue
      |
      +-- No Super Admin and bootstrap allowed
               |
               v
          Create account
               |
               v
       Mark bootstrap complete
```

This prevents normal registration from creating additional Super
Administrators.

---

### 4.10 Socket.IO Room Design

Socket.IO rooms are used to prevent chat events from being broadcast to every
connected user.

When a user opens a chat room:

```text
Angular ChatRoomComponent
          |
          v
SocketService.joinRoom()
          |
          v
Socket.IO server
          |
          v
Validate room
Validate user
Validate group membership
          |
          v
socket.join(roomId)
```

Only after server-side validation does the socket join the requested room.

New messages are broadcast using:

```text
io.to(roomId).emit(...)
```

Therefore a message from one room is not sent to users viewing unrelated rooms.

The socket stores information about its active session in `socket.data`,
including the current:

- Room ID.
- User ID.
- Username.

This information is also used for presence and sender validation.

---

### 4.11 Real-Time Message Design

Text and GIF messages use the following flow:

```text
User types message
       |
       v
ChatRoomComponent
       |
       v
SocketService.sendMessage()
       |
       v
Socket.IO server
       |
       v
Validate sender + membership
       |
       v
Insert message into MongoDB
       |
       v
io.to(roomId).emit("newMessage")
       |
       v
All connected clients receive message
       |
       v
Angular messages[] updated
```

The sender also receives the server's `newMessage` event.

Therefore the frontend does not manually add the sent message after a
successful acknowledgement.

This avoids displaying duplicate messages.

---

### 4.12 Initial Chat History Design

Socket.IO handles new messages, but persisted message history is loaded using
REST.

When the room opens:

```text
GET /api/rooms/:roomId/messages
               |
               v
MongoDB messages collection
               |
               v
Newest five non-deleted messages
               |
               v
Angular messages[]
```

The default chat interface displays the five most recent messages.

New Socket.IO messages are added to the local array and the frontend retains
the latest five using:

`slice(-5)`

This separates:

- Historical/persisted retrieval through REST.
- Live updates through Socket.IO.

---

### 4.13 Presence Design

Socket.IO provides room-presence information.

When a user successfully joins:

`userJoined`

is sent to other users in the room.

When a user leaves or disconnects:

`userLeft`

is broadcast.

The frontend displays these events using a presence message.

Conceptually:

```text
User2 joins
    |
    v
Socket.IO server
    |
    v
userJoined
    |
    v
User1 sees:
"User2 joined the room."
```

The same structure applies when the user leaves.

---

### 4.14 Message Deletion Design

Message deletion combines REST and Socket.IO.

The flow is:

```text
User clicks Delete
       |
       v
DELETE REST request
       |
       v
Backend validates ownership
       |
       v
MongoDB:
deleted = true
       |
       v
messageDeleted Socket.IO event
       |
       v
Every connected room client
removes matching message
```

Messages are soft-deleted rather than immediately removing the MongoDB
document.

The normal message-history query excludes documents where:

`deleted: true`

The Angular client handles the real-time deletion event using:

```text
messages.filter(...)
```

to remove the matching message from the currently displayed message array.

---

### 4.15 Image Storage Design

The original Phase 1 approach could represent images using Base64 data.

For Phase 2, the final design stores actual image files separately from
MongoDB.

The image-upload flow is:

```text
User chooses image
       |
       v
Angular File object
       |
       v
multipart/form-data
       |
       v
Multer
       |
       v
Node.js filesystem
       |
       +-- chat image
       |      |
       |      +--> uploads/chat/
       |
       +-- profile image
              |
              +--> uploads/profiles/

MongoDB stores:
- public path
- file metadata
```

This design prevents MongoDB documents from becoming unnecessarily large by
storing complete Base64 image content.

---

### 4.16 Chat Image Design

Chat images use both HTTP and Socket.IO.

The flow is:

```text
Select image
     |
     v
Local preview using FileReader
     |
     v
HTTP multipart upload
     |
     v
Multer validates file
     |
     v
File stored in uploads/chat/
     |
     v
Message metadata stored in MongoDB
     |
     v
newMessage Socket.IO event
     |
     v
Image appears for all room users
```

`FileReader` is used only for the browser preview.

The Base64 preview is not persisted.

MongoDB stores information such as:

- File path.
- Generated file name.
- Original file name.
- MIME type.
- File size.

---

### 4.17 Profile Image Design

Profile-image uploads follow a similar design:

```text
Select profile image
       |
       v
Local preview
       |
       v
FormData upload
       |
       v
uploads/profiles/
       |
       v
users.profilePicture
       |
       v
Profile + chat avatar display
```

The user document stores the public image path and image metadata.

The same profile-picture path is returned when chat messages are enriched with
sender information.

This allows messages to display the sender's avatar.

---

### 4.18 Authentication State Design

The Angular frontend uses `AuthService` to maintain the current user's state.

The service uses:

- An Angular signal.
- Browser `localStorage`.

Conceptually:

```text
Successful login
      |
      v
AuthService.setCurrentUser()
      |
      +--> Angular signal
      |
      +--> localStorage
```

The signal allows components and guards to access the current user.

`localStorage` allows the client-side user state to survive a normal browser
refresh.

Sensitive password hashes are never stored in the Angular user object.

Backend routes independently check the supplied user or administrator IDs when
performing protected operations.

---

### 4.19 Angular Service Design

Angular components do not directly contain HTTP implementation details for
every backend operation.

Instead, functionality is separated into services.

```text
Component
    |
    v
Angular Service
    |
    +--> HttpClient
    |
    +--> Socket.IO
```

Examples include:

- `AuthService` for authentication.
- `UserService` for profiles.
- `GroupService` for group operations.
- `RoomService` for rooms/messages.
- `RequestService` for approval workflows.
- `AdminService` for system administration.
- `SocketService` for real-time communication.

This separation makes components primarily responsible for user-interface
state and presentation.

---

### 4.20 Request and Approval Workflow Design

Fabulari separates actions that users can perform directly from actions that
require administrative approval.

Examples include:

```text
User
 |
 +--> Group creation request ------> Super Admin
 |
 +--> Join request ----------------> Group Admin
 |
 +--> Room proposal ---------------> Group Admin
 |
 +--> Group ban request -----------> Group Admin

Group Admin
 |
 +--> System ban request ----------> Super Admin
 |
 +--> Group deletion request ------> Super Admin
```

The request remains stored with a status such as:

- `pending`
- `approved`
- `rejected`

The backend performs the final authorization check when an administrator
attempts to action the request.

This means frontend controls alone are not relied upon for authorization.

---

### 4.21 Validation and Error-Handling Design

Validation occurs at multiple levels.

#### Client-side validation

Examples include:

- Required form fields.
- Image MIME-type checking.
- Image size checking.
- Preventing empty chat messages.

#### Backend validation

The server validates:

- Required request data.
- Email format.
- Password rules.
- Age values.
- Group membership.
- Administrative roles.
- Message ownership.
- Request status.
- File type and size.

#### Database-level validation

Unique indexes protect values such as:

- Application IDs.
- Email addresses.
- Usernames.

MongoDB duplicate-key errors are converted into user-friendly HTTP responses.

#### Global API handling

Unknown API endpoints return:

`404 API route not found.`

Unexpected errors are handled by the Express global error handler and return a
controlled `500` response.

---

### 4.22 Accessibility and Interface Design

The final interface includes accessibility improvements such as:

- Explicit `<label>` elements for form fields.
- Explicit button types.
- Descriptive image alternative text.
- `role="alert"` for important errors.
- `aria-live` regions for dynamic status and presence messages.
- Semantic headings.
- Keyboard-accessible buttons and links.

Dynamic chat information is particularly suitable for `aria-live` because
messages and presence information can change without a full page refresh.

---

### 4.23 Key Design Decisions

The main Phase 2 design decisions were:

1. Use the native MongoDB Node.js driver instead of Mongoose.
2. Preserve application UUIDs while also allowing MongoDB to maintain `_id`.
3. Connect to MongoDB before starting the HTTP server.
4. Use REST for persistent CRUD and Socket.IO for real-time communication.
5. Use Socket.IO rooms to scope chat events.
6. Load initial chat history using REST.
7. Persist messages before broadcasting them.
8. Store image files outside MongoDB.
9. Store image metadata and file references inside MongoDB.
10. Use Base64 only for temporary browser image previews.
11. Use soft deletion for individual chat messages.
12. Keep frontend services separate from components.
13. Perform backend authorization even when Angular route guards or UI checks
    are present.
14. Use separate MongoDB databases for automated integration and end-to-end
    testing.

---

## 5. Testing Methodology

Fabulari Phase 2 uses multiple levels of automated testing.

The purpose of using several levels is to test individual logic, interactions
between backend systems, Angular frontend behaviour and complete user journeys.

The testing layers are:

```text
Unit Testing
     |
     v
Integration Testing
     |
     v
Angular Unit Testing
     |
     v
End-to-End Testing
```

A total of 31 automated tests were implemented and passed during Phase 2
development.

---

### 5.1 Angular Unit Testing

Angular frontend tests use:

- Vitest.
- Angular TestBed.
- `HttpTestingController`.

The Angular tests run without requiring the real Node.js server.

HTTP requests are intercepted and controlled using Angular's HTTP testing
utilities.

The test command is:

```bash
npm test -- --watch=false
```

The Angular test suite contains:

- 6 `AuthService` tests.
- 3 `UserService` tests.
- 1 application-component test.

Total:

`10 tests`

---

#### 5.1.1 AuthService Tests

`AuthService` contains six automated tests.

| Test | Purpose |
|---|---|
| Sends registration data to the backend | Verifies the correct registration endpoint, HTTP method and request body |
| Sends login credentials to the backend | Verifies the login request |
| Stores the logged-in user after successful login | Verifies authentication state and `localStorage` |
| Sets and returns the current user | Verifies current-user state management |
| Clears the current user during logout | Verifies logout and local-storage cleanup |
| Identifies a Super Administrator | Verifies role detection |

The HTTP tests use `HttpTestingController` so no real backend is required.

For example, the registration test checks that Angular sends a `POST` request
to:

`http://localhost:3000/api/register`

with the expected registration data.

---

#### 5.1.2 UserService Tests

`UserService` contains three automated tests.

| Test | Purpose |
|---|---|
| Retrieves a user profile | Verifies the profile `GET` request |
| Sends updated profile data | Verifies the profile `PUT` request and body |
| Uploads a profile picture using FormData | Verifies multipart profile-image construction |

The image-upload test verifies that the request body is a `FormData` object and
contains:

- `userId`
- `image`

This confirms that the frontend sends the actual file rather than storing a
Base64 image inside the normal JSON profile object.

---

#### 5.1.3 Application Test

The Angular root application includes one component-creation test.

The test uses Angular TestBed to create the root `App` component and verifies
that the application instance is successfully created.

---

### 5.2 Node.js Unit Testing

Backend unit testing uses:

- Mocha.
- Node.js `assert`.

The tests focus on isolated registration validation logic.

The test command is:

```bash
npm run test:unit
```

The validation logic was separated from Express and MongoDB into a function
that can be tested independently.

This means the unit tests do not require:

- Express.
- An HTTP server.
- MongoDB.
- A browser.

The tested function receives registration data and returns either validated,
normalised information or an appropriate validation error.

Nine backend unit tests were implemented.

| Test | Purpose |
|---|---|
| Accepts valid registration data | Confirms valid information passes |
| Trims registration text fields | Confirms whitespace is removed |
| Rejects missing required fields | Confirms required-field validation |
| Rejects whitespace-only names or usernames | Confirms blank text cannot bypass validation |
| Rejects an invalid email address | Confirms email validation |
| Rejects a negative age | Confirms invalid negative ages fail |
| Rejects a non-integer age | Confirms age must be an integer |
| Rejects a password shorter than eight characters | Confirms password-length rule |
| Rejects a password without an uppercase letter | Confirms uppercase-password rule |

Result:

`9 passing`

This test layer demonstrates isolated unit testing because no external
application systems are involved.

---

### 5.3 Integration Testing

Backend API integration tests use:

- Mocha.
- Chai.
- Chai HTTP.
- Express.
- MongoDB.

The purpose of integration testing is to test several backend layers operating
together.

For example:

```text
HTTP request
     |
     v
Express route
     |
     v
Validation
     |
     v
MongoDB
     |
     v
HTTP response
```

The integration test command is:

```bash
npm run test:integration
```

---

#### 5.3.1 Separate Integration Test Database

Integration tests do not use the normal:

`fabulari`

database.

Instead they use:

`fabulari_test`

The environment variable is set before the server/database modules are
imported.

The test database is reset between tests.

A safety check confirms that the database name is:

`fabulari_test`

before destructive cleanup is allowed.

This protects the real development data.

---

#### 5.3.2 Importable Express Application

The server startup design was adjusted so importing `server.js` during a test
does not automatically open port 3000.

Normal execution still starts the server.

Conceptually:

```text
node server.js
     |
     v
startServer()


Integration test imports server.js
     |
     v
Express app available
without starting normal listener
```

This allows Chai HTTP to test the Express application directly.

---

#### 5.3.3 Integration Test Cases

Six backend integration tests were implemented.

| Test | Purpose |
|---|---|
| Returns server and database health information | Verifies `/api/health` and test database connection |
| Returns `404` for an unknown API route | Verifies API fallback error handling |
| Registers a valid user | Tests Express, validation, bcrypt and MongoDB insertion |
| Rejects a duplicate username | Verifies duplicate detection and case-insensitive username handling |
| Logs in with valid credentials | Tests MongoDB lookup and bcrypt password comparison |
| Rejects an incorrect password | Verifies authentication failure behaviour |

Result:

`6 passing`

The valid-registration test also directly checks MongoDB to confirm that the
new user was actually persisted.

The returned response is checked to confirm that `passwordHash` is not exposed
to the client.

---

### 5.4 End-to-End Testing

End-to-end testing uses:

`Cypress`

Cypress tests the application from the user's browser perspective.

Unlike the Angular unit tests, the end-to-end tests use the real:

- Angular application.
- Node.js server.
- Express API.
- MongoDB database.
- Socket.IO server.

The normal E2E execution command is:

```bash
npx cypress run
```

Cypress can also be opened interactively using:

```bash
npx cypress open
```

---

#### 5.4.1 End-to-End Test Environment

End-to-end tests use a separate MongoDB database:

`fabulari_e2e`

This prevents automated browser tests from modifying normal Fabulari
development data.

The E2E environment consists of:

```text
MongoDB
   |
   v
fabulari_e2e

Node.js / Express / Socket.IO
   |
   v
http://localhost:3000

Angular
   |
   v
http://localhost:4200

Cypress Browser
```

Controlled chat data is seeded into `fabulari_e2e` for the real-time chat test.

---

#### 5.4.2 Authentication End-to-End Tests

Five authentication/navigation E2E tests were implemented.

| Test | Purpose |
|---|---|
| Registers a new user through the UI | Completes the registration form and verifies a successful backend response |
| Logs in with valid credentials | Uses the real login UI and verifies authenticated state |
| Shows an error for an incorrect password | Confirms backend authentication errors appear in the interface |
| Redirects an unauthenticated user away from the profile page | Verifies route-guard behaviour |
| Navigates between login and registration pages | Verifies public navigation |

The login test also checks that the successful user is stored in browser
`localStorage` and that the application navigates to `/groups`.

---

#### 5.4.3 Real-Time Chat End-to-End Test

One E2E test targets the main Phase 2 real-time feature.

The test:

1. Uses controlled E2E user/group/room data.
2. Opens the real Fabulari login page.
3. Logs in through the browser.
4. Navigates to the seeded chat room.
5. Types a message into the real chat composer.
6. Clicks `Send Text`.
7. Uses the application's Socket.IO connection.
8. Allows the server to validate and persist the message.
9. Waits for `newMessage`.
10. Confirms the message appears in the browser.

The tested flow is:

```text
Cypress
   |
   v
Angular login
   |
   v
Express authentication
   |
   v
MongoDB
   |
   v
Angular chat room
   |
   v
Socket.IO sendMessage
   |
   v
MongoDB message insert
   |
   v
Socket.IO newMessage
   |
   v
Message visible in browser
```

This test verifies multiple application layers together rather than mocking the
real-time connection.

---

### 5.5 Automated Test Results

The final automated testing results are:

| Testing Layer | Technology | Number of Tests | Result |
|---|---|---:|---|
| Backend Unit Testing | Mocha + Node assert | 9 | 9 passed |
| Backend Integration Testing | Mocha + Chai / Chai HTTP | 6 | 6 passed |
| Angular Unit Testing | Vitest + Angular TestBed | 10 | 10 passed |
| End-to-End Testing | Cypress | 6 | 6 passed |
| **Total** |  | **31** | **31 passed** |

The automated testing strategy therefore covers:

- Isolated validation logic.
- Backend API behaviour.
- MongoDB persistence.
- Authentication.
- Duplicate-data handling.
- Angular HTTP services.
- Angular authentication state.
- Multipart profile uploads.
- Route protection.
- User registration and login journeys.
- Real-time Socket.IO chat.

---

### 5.6 Manual Testing

Automated testing was supplemented by manual functional testing.

Manual testing was useful for behaviour involving multiple simultaneously
connected users and visual interface behaviour.

The following functionality was manually verified:

| Feature | Manual Verification |
|---|---|
| User registration | Valid and invalid registrations tested |
| Login | Valid and invalid credentials tested |
| Duplicate usernames | Case-insensitive duplicate username rejected |
| Duplicate email | Existing email rejected |
| Profile editing | Changes persisted after refresh |
| Profile picture | File stored and displayed after refresh |
| Group access | Group membership rules verified |
| Minimum age | Under-age membership behaviour tested |
| Room access | Group members could enter valid rooms |
| Real-time text | Message appeared for two connected users without refresh |
| Join presence | Other user saw join notification |
| Leave presence | Other user saw leave notification |
| Chat image | Image appeared for connected users |
| Image persistence | Physical file stored under `uploads/chat/` |
| Image MongoDB storage | Path and metadata stored instead of Base64 |
| Profile-image persistence | Physical file stored under `uploads/profiles/` |
| GIF message | GIF appeared through real-time chat |
| Message deletion | Deleted message disappeared for both connected clients |
| Soft deletion | MongoDB message stored with `deleted: true` |
| Invalid API route | Controlled JSON `404` response returned |
| Oversized image | File larger than 5 MB rejected |
| Navigation guards | Unauthorized navigation redirected |
| Accessibility regression | Labels, buttons and keyboard navigation checked |

---

### 5.7 MongoDB Verification

MongoDB behaviour was also manually inspected using `mongosh`.

Example commands used include:

```javascript
use fabulari
```

```javascript
show collections
```

```javascript
db.users.find()
```

```javascript
db.groups.find()
```

```javascript
db.messages.find()
```

Indexes were verified using:

```javascript
db.messages.getIndexes()
```

and:

```javascript
db.users.getIndexes()
```

The message collection confirmed the compound index:

```text
roomId: 1
createdAt: -1
```

The users collection confirmed:

- Unique application user IDs.
- Unique email addresses.
- Case-insensitive unique usernames.

MongoDB inspection was also used to verify that uploaded chat images store a
file path and metadata rather than Base64 image content.

---

### 5.8 Testing Summary

The Phase 2 testing strategy combines multiple levels of verification.

```text
Node Unit Tests
      |
      | Isolated logic
      v

Backend Integration Tests
      |
      | API + MongoDB
      v

Angular Unit Tests
      |
      | Frontend services/state
      v

Cypress E2E Tests
      |
      | Complete user journey
      v

Manual Multi-User Testing
      |
      | Realtime + visual behaviour
      v

MongoDB Inspection
```

Using several testing levels reduces reliance on one type of testing.

Unit tests provide fast checks of isolated logic.

Integration tests confirm that backend modules and MongoDB operate together.

Angular tests verify frontend services and state without depending on a real
backend.

Cypress verifies actual browser workflows.

Manual multi-user testing verifies real-time behaviours that are easier to
observe with two active sessions.

Together these approaches provide evidence that the main Phase 2 requirements
operate correctly.