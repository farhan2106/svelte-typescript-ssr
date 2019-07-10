import axios from 'axios';
const Ajv = require('ajv')
import { Machine, interpret, send } from 'xstate';
import NavBar from './../components/NavBar/NavBar.html';NavBar;
import signUpSchema from './../schemas/SignUp';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(signUpSchema);

const appMachine = Machine({
  id: 'signUpPage',
  initial: 'default',
  context: {
    username: '',
    email: '',
    password: ''
  },
  states: {
    'default': {
      on: {
        FILL_FORM: 'filling'
      }
    },
    'filling': {
      on: {
        FILL_FORM: {
          actions: ['fillForm', send('VALIDATE_FORM')]
        },
        VALIDATE_FORM: {
          target: 'valid',
          cond: 'formValid'
        }
      }
    },
    'valid': {
      on: {
        SUBMIT_FORM: 'submitted'
      }
    },
    // 'submitted': {
    //   final: true
    // }
  }
}, {
  actions: {
    fillForm: (context: any, event: any) => {
      if (event && event.payload && event.payload.username) {
        context.username = event.payload.username;
      }
      if (event && event.payload && event.payload.email) {
        context.email = event.payload.email;
      }
      if (event && event.payload && event.payload.password) {
        context.password = event.payload.password;
      }
    }
  },
  guards: {
    formValid: (context: any, event: any) => {
      const validateStatus = validate(context);
      console.log(validate.errors)
      return validateStatus as boolean;
    }
  }
})

const intepreter = interpret(appMachine).onTransition((state: any) => console.log(state))
intepreter.start();

function signUpHandler (this: HTMLFormElement, e: KeyboardEvent) {
  // return axios.post('/api/signup', {
  //   username: (this.elements.namedItem('username') as HTMLInputElement).value,
  //   email: (this.elements.namedItem('email') as HTMLInputElement).value,
  //   password: (this.elements.namedItem('password') as HTMLInputElement).value
  // })
}

function fillForm (this: HTMLInputElement, e: KeyboardEvent) {
  intepreter.send('FILL_FORM', {
    payload: {
      [this.name]: this.value
    }
  })
}
