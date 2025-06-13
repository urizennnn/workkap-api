# API Routes

## Users

### POST `/api/users/signup/combination`
Requires Body:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "username": "string",
  "country": "string"
}
```

### POST `/api/users/login/combination`
Requires Body:
```json
{
  "email": "string",
  "password": "string"
}
```

### GET `/api/users/login/google`
No request body.

### GET `/api/users/login/google/redirect`
No request body.

### PATCH `/api/users/update`
Requires Body (example):
```json
{
  "email": "string",
  "country": "string"
}
```
