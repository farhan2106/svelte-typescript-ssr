import axios from 'axios';
import { Machine, interpret, send, assign } from 'xstate';
import { Validator } from '@cesium133/forgjs';
import NavBar from './../components/NavBar/NavBar.html';NavBar;
import signUpSchema from './../schemas/SignUp';

const vComplex = new Validator(signUpSchema);

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
  errors: any[],
  networkError: string
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
    errors: [],
    networkError: ''
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
          actions: assign({ networkError: (context: any, event: any) => event.data.message })
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
      const validationErrors = vComplex.getErrors(context.data)
      if (validationErrors.length > 0) {
        context.errors = validationErrors
      } else {
        context.errors = []
      }
      return (context.errors.length === 0);
    }
  }
})

let intepreter = interpret(appMachine)
if (process.env.NODE_ENV === 'development') {
  intepreter = intepreter.onTransition((state) => console.log(state.event.type, state.value, state.context))
}
intepreter.start();

// html vars
let networkError = ''
let errors: any[] = []
let canSubmitForm = false

// reactive
let errorsInput: any = {}

intepreter.subscribe(state => {
  networkError = state.context.networkError
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
  const errStr = arr.find((e: any) => {
    if (e.includes(`${key}:`)) return e
  })
  if (errStr) {
    return errStr.replace(`${key}:`, '')
  }
}

$: {
  errorsInput.username = getError(errors, 'username') || ''
  errorsInput.email = getError(errors, 'email') || ''
  errorsInput.password = getError(errors, 'password') || ''
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
