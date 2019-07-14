import { Rule } from '@cesium133/forgjs';

export default {
  username: new Rule({
    type: 'string',
    minLength: 6
  }, 'username: Should be at least 6 characters long.'),
  email: new Rule({
    type: 'email',
  }, 'email: Should be valid email.'),
  password: new Rule({
    type: 'password',
    minLength: 8
  }, 'password: Should be at least 6 characters long.')
}
