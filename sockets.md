# Realtime Sockets (Socket.IO)

<!--toc:start-->

- [Realtime Sockets (Socket.IO)](#realtime-sockets-socketio)
  - [Overview](#overview)
  - [Authentication](#authentication)
    - [Example: JavaScript client](#example-javascript-client)
  - [Rooms and Delivery Model](#rooms-and-delivery-model)
  - [Client → Server Events](#client-server-events)
    - [`send_message`](#sendmessage)
    - [`read_messages`](#readmessages)
  - [Server → Client Events](#server-client-events)
    - [`new_message`](#newmessage)
    - [`unread_count`](#unreadcount)
  - [HTTP Endpoints (related)](#http-endpoints-related)
  - [Error Handling](#error-handling)
  - [Reconnection](#reconnection)
  - [Notes & Tips](#notes-tips)
  <!--toc:end-->

This document explains how the realtime messaging socket works, how to connect, authenticate, and the client/server events.

Implementation reference:

- Gateway: `src/modules/message/message.gateway.ts`
- Service: `src/modules/message/message.service.ts`

## Overview

- Protocol: Socket.IO over WebSocket.
- Namespace/Path: Default namespace, default Socket.IO path (`/socket.io`).
- Host/Port: Same host and port as the HTTP API server.
- CORS: Enabled and restricted by `ALLOWED_ORIGINS` (see `src/main.ts`).
- CORS: Enabled; the Socket.IO gateway currently allows any origin via `@WebSocketGateway({ cors: true })` (see `src/modules/message/message.gateway.ts`). HTTP CORS restrictions via `ALLOWED_ORIGINS` in `src/main.ts` do not apply to the socket gateway unless configured on the gateway itself.
- Auth: JWT required in the Socket.IO handshake (see below).

The WebSocket gateway is independent of the HTTP routing prefix (`/api`) used for REST; Socket.IO uses its own default path.

## Authentication

On connection, the gateway expects a JWT in the handshake. If the token is missing or invalid, the server disconnects the client.

Accepted handshake locations (first present wins):

- `handshake.auth.token` (recommended)
- `handshake.query.token`

Pseudocode (see `handleConnection` in the gateway):

```ts
const token = client.handshake.auth?.token ?? client.handshake.query.token;
verify(token); // sets client.data.userId
client.join(userId);
```

### Example: JavaScript client

```ts
import { io } from 'socket.io-client';

const socket = io(API_BASE_URL, {
  // If your API is at https://api.example.com, use that origin
  // The default Socket.IO path is /socket.io
  auth: { token: YOUR_JWT },
  // alternatively: query: { token: YOUR_JWT },
});

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('unread_count', ({ count }) => {
  console.log('unread:', count);
});

socket.on('new_message', (msg) => {
  console.log('new_message:', msg);
});

// Send a message
socket.emit('send_message', {
  conversationId: 'uuid-of-conversation',
  content: 'Hello!',
  attachments: [
    // optional
    // { url: 'https://...', type: 'IMAGE' | 'PDF' }
  ],
});

// Mark messages as read
socket.emit('read_messages', { conversationId: 'uuid-of-conversation' });
```

## Rooms and Delivery Model

- After successful auth, the server joins the socket to a room named by the authenticated user’s ID: `client.join(userId)`.
- Server emits to user-specific rooms to deliver events, so a user receives events across all active devices/sessions.
- On connect, the server computes the unread message count and emits `unread_count` to the user room.

## Client → Server Events

### `send_message`

Send a chat message within an existing conversation.

Payload

```json
{
  "conversationId": "string",
  "content": "string | null",
  "attachments": [
    { "url": "string", "type": "IMAGE" | "PDF" }
  ]
}
```

- `conversationId` is required.
- `content` and `attachments` are optional; at least one of them should typically be provided.

Behavior

- Validates sender participation in the conversation.
- Persists the message and caches it.
- Emits `new_message` to both participants (their userId rooms).
- Recomputes and emits `unread_count` for the receiver.

Acknowledgement

- No explicit ack is returned by the gateway; clients should rely on the `new_message` event to confirm delivery.

### `read_messages`

Mark messages in a conversation as read for the authenticated user.

Payload

```json
{ "conversationId": "string" }
```

Behavior

- Marks unread messages where `receiverId` is the current user as read.
- Recomputes and emits `unread_count` to the user’s room.

Acknowledgement

- No explicit ack; clients should watch for the `unread_count` update.

## Server → Client Events

### `new_message`

Emitted to both participants when a message is sent.

Typical shape

```json
{
  "id": "string",
  "conversationId": "string",
  "senderId": "string",
  "receiverId": "string",
  "content": "string",
  "attachments": [ { "url": "string", "type": "IMAGE" | "PDF" } ],
  "isRead": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Note: The exact fields come from the `Message` Prisma model. Attachments are normalized to an array.

### `unread_count`

Emitted to a user’s room:

```json
{ "count": 3 }
```

- Emitted on connect.
- Emitted after `send_message` to the receiver.
- Emitted after `read_messages` to the reader.

## HTTP Endpoints (related)

While realtime delivery uses sockets, message history is fetched over HTTP:

- `GET /api/messages/with/:otherUserId` — paginated conversation messages, optionally mark-as-read.
- `GET /api/messages/conversations` — list conversations with last message and unread counts.
  Both are documented in Swagger at `/api/docs`.

## Error Handling

- Connection: Missing/invalid token → immediate disconnect (no event emitted).
- Events: The current gateway does not emit per-event error acks; validation errors propagate as server errors and may disconnect the socket in severe cases.

## Reconnection

Socket.IO automatically attempts reconnection. The handshake (including JWT) re-runs, and the server re-joins the socket to the user room, then re-emits the current `unread_count`.

## Notes & Tips

- Prefer `auth.token` over query parameters for JWT.
- If you proxy the API, ensure the Socket.IO path `/socket.io` is forwarded and websockets are enabled.
- The socket gateway's CORS is configured on the gateway itself and currently allows all origins. `ALLOWED_ORIGINS` in `src/main.ts` applies to HTTP only. To restrict socket origins, set `@WebSocketGateway({ cors: { origin: ["https://your-app"] } })`.
- For local dev, HTTP CORS default origins include `http://localhost:5173` unless overridden.
