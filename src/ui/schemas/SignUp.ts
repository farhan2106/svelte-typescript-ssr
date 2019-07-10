export default {
  "title": "SignUpSchema",
  "description": "Schema for sign up form",
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "minLength": 6
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string",
      "minLength": 8
    }
  },
  "required": [ "username", "email", "password" ]
}
