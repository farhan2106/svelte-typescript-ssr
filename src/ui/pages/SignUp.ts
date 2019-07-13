const djv = require('djv');
import axios from 'axios';
import { Machine, interpret, send, assign } from 'xstate';
import NavBar from './../components/NavBar/NavBar.html';NavBar;
import signUpSchema from './../schemas/SignUp';

const djvEnv = new djv();
djvEnv.addSchema('default', signUpSchema);

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

interface AppContext {
  data: {
    [key:string]: any,
    username: string,
    email: string,
    password: string
  },
  errors: any[]
}

const appMachine = Machine<AppContext>({
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
        [EVENTS.FILL_FORM]: {
          target: STATES.FILLING,
          actions: ['fillForm', send(EVENTS.VALIDATE_FORM)]
        },
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
      const key = event.payload.key
      context.data[key] = event.payload.value
    }
  },
  guards: {
    formValid: (context, event) => {
      const validateError = djvEnv.validate('default#/common', context.data);
      if (validateError) {
        context.errors = [validateError]
      } else {
        context.errors = []
      }
      return !validateError;
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
  return (arr.find((e: any) => e.dataPath === `'${key}'`) || {}).schemaPath || ''
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
      key: this.name,
      value: this.value || ''
    }
  })
}
