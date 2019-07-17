import axios from 'axios';
import { interpret } from 'xstate';
import NavBar from './../components/NavBar/NavBar.html';NavBar;
import signUpSchema from './../schemas/SignUp';
import FormStateMachine, { STATES, EVENTS } from '../lib/FormStateMachine';

const appMachine = FormStateMachine(signUpSchema, (data: any) => {
  return axios.post('/api/signup', data)
})

let intepreter = interpret(appMachine)
if (process.env.NODE_ENV === 'development') {
  intepreter = intepreter.onTransition((state) => console.log(state.event.type, state.value, state.context))
}
intepreter.start();

// html vars
let networkError = ''
let errors: string[] = []
let canSubmitForm = false

// reactive
let errorsInput: { [key: string]: string } = {}

intepreter.subscribe(state => {
  networkError = state.context.networkError
  errors = state.context.errors
  if (state.value === STATES.VALID) {
    canSubmitForm = true
  } else {
    canSubmitForm = false
  }
})

const getError = (arr: string[], key: string) => {
  const errStr = arr.find((e: string) => {
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
function submitFormHandler (this: HTMLFormElement, e: KeyboardEvent) {
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
