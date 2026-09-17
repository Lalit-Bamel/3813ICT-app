# Fabulari — Phase 2: Fully Functioning Application

## Student Information

**Name:** Lalit Bamel  
**Student Number:** s5383531  

---

## 1. Specifications and Requirements

### MongoDB Data Collections

Phase 2 replaces the Phase 1 JSON file persistence with MongoDB using the native Node.js MongoDB driver.

The application will use the following collections:

- `users` – registered user accounts and profile information
- `groups` – group details, membership and administration information
- `rooms` – chat rooms belonging to groups
- `requests` – group, room, join, ban and deletion requests
- `messages` – persistent chat messages
- `auditLogs` – administrative activity records
- `bannedUsers` – permanently banned user records
- `appState` – application-level state such as the Super Administrator bootstrap status

Existing application UUID identifiers will initially be retained during the MongoDB migration so that the Phase 1 Angular routes and relationships remain compatible.

## 2. Server API Documentation

---

## 3. Angular Architecture

### 3.1 Components

### 3.2 Services

### 3.3 Models

### 3.4 Routes and Guards

---

## 4. Design Documents

---

## 5. Testing Methodology

### 5.1 Angular Unit Testing

### 5.2 Node.js Unit Testing

### 5.3 Integration Testing

### 5.4 End-to-End Testing

### 5.5 Automated Test Results

---