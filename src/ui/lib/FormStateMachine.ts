import { Machine, send, assign, EventObject } from 'xstate';
import { Validator } from '@cesium133/forgjs';

export enum STATES {
  DEFAULT = 'default',
  FILLING = 'filling',
  VALID = 'valid',
  SUBMITTING = 'submitting',
  SUBMITTED = 'submitted'
}

export enum EVENTS {
  FILL_FORM = 'FILL_FORM',
  VALIDATE_FORM = 'VALIDATE_FORM',
  SUBMIT_FORM = 'SUBMIT_FORM'
}

interface FormContext {
  data: {
    [key: string]: any
  },
  errors: any[],
  networkError: string
}

interface FormSubmitHandler {
  (context: FormContext): void
}

export default (formSchema: any, formSubmitHandler: FormSubmitHandler) => {

  const vComplex = new Validator(formSchema);

  return Machine<FormContext>({
    id: 'signUpPage',
    initial: STATES.DEFAULT,
    strict: true,
    context: {
      data: {},
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
          src: (context: any, event: any) => formSubmitHandler(context),
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
      fillForm: (context: FormContext, event: EventObject) => {
        const key = event.payload.key
        context.data[key] = event.payload.value
      }
    },
    guards: {
      formValid: (context: FormContext, event: EventObject) => {
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
}
