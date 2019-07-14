import { Rule } from '@cesium133/forgjs';

export default {
  usernameOrEmail: new Rule({
    type: 'string',
    minLength: 1
  }, 'usernameOrEmail: This field is required.'),
  password: new Rule({
    type: 'password',
    minLength: 1
  }, 'password: This field is required.')
}
