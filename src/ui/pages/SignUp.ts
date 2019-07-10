const Ajv = require('ajv');
import { find } from 'lodash';
import axios from 'axios';
import { Machine, interpret, send, assign } from 'xstate';
import NavBar from './../components/NavBar/NavBar.html';NavBar;
import signUpSchema from './../schemas/SignUp';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(signUpSchema);

enum STATES {
  DEFAULT = 'default',
  FILLING = 'filling',
  VALID = 'valid',
  SUBMITTING = 'submitting',
  SUBMITTED = 'submitted'
}

enum EVENTS {
  FILL_FORM = 'FILL_FORM',
  VALIDATE_FORM = 'VALIDATE_FORM',
  SUBMIT_FORM = 'SUBMIT_FORM'
}

const appMachine = Machine({
  id: 'signUpPage',
  initial: STATES.DEFAULT,
  strict: true,
  context: {
    data: {
      username: '',
      email: '',
      password: ''
    },
    errors: []
  },
  states: {
    [STATES.DEFAULT]: {
      on: {
        [EVENTS.FILL_FORM]: STATES.FILLING
      }
    },
    [STATES.FILLING]: {
      on: {
        [EVENTS.FILL_FORM]: {
          actions: ['fillForm', send(EVENTS.VALIDATE_FORM)]
        },
        [EVENTS.VALIDATE_FORM]: {
          target: STATES.VALID,
          cond: 'formValid'
        }
      }
    },
    [STATES.VALID]: {
      on: {
        [EVENTS.SUBMIT_FORM]: {
          target: STATES.SUBMITTING
        },
        [EVENTS.FILL_FORM]: {
          target: STATES.FILLING,
          actions: ['fillForm', send(EVENTS.VALIDATE_FORM)]
        }
      }
    },
    [STATES.SUBMITTING]: {
      invoke: {
        id: 'submitForm',
        src: (context: any, event: any) => submitForm(context),
        onDone: {
          target: STATES.SUBMITTED
        },
        onError: {
          target: STATES.VALID,
          actions: assign({ errors: (context: any, event: any) => [event.data.message] })
        }
      } as any
    },
    [STATES.SUBMITTED]: {
      type: 'final'
    }
  }
}, {
  actions: {
    fillForm: (context, event) => {
      if (event && event.payload && event.payload.username) {
        context.data.username = event.payload.username;
      }
      if (event && event.payload && event.payload.email) {
        context.data.email = event.payload.email;
      }
      if (event && event.payload && event.payload.password) {
        context.data.password = event.payload.password;
      }
    }
  },
  guards: {
    formValid: (context, event) => {
      const validateStatus = validate(context.data);
      let errors = validate.errors
      if (errors === null) errors = []
      context.errors = errors
      return validateStatus as boolean;
    }
  }
})

const intepreter = interpret(appMachine)
  .onTransition((state) => console.log(state.event.type, state.value, state.context))
intepreter.start();

// html vars
let errors: any[] = []
let canSubmitForm = false

// reactive
let errorsInput: any = {}

intepreter.subscribe(state => {
  errors = state.context.errors
  if (state.value === STATES.VALID) {
    canSubmitForm = true
  } else {
    canSubmitForm = false
  }
})

// non-html functions
const submitForm = (data: any) => {
  return axios.post('/api/signup', data)
}

const getError = (arr: any, key: any) => {
  return (find(arr, e => e.dataPath === `.${key}`) || {}).message || ''
}

$: {
  errorsInput.username = getError(errors, 'username')
  errorsInput.email = getError(errors, 'email')
  errorsInput.password = getError(errors, 'password')
}

// html functions
function signUpHandler (this: HTMLFormElement, e: KeyboardEvent) {
  intepreter.send(EVENTS.SUBMIT_FORM)
}

function fillForm (this: HTMLInputElement, e: KeyboardEvent) {
  intepreter.send(EVENTS.FILL_FORM, {
    payload: {
      [this.name]: this.value || ''
    }
  })
}
