'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var xstate = require('xstate');

function validator(context, event) {
    const { value, rules } = event;
    const rulesLength = rules?.length || 0;
    return new Promise((resolve, reject) => {
        for (let i = 0; i < rulesLength; i++) {
            const checkResult = rules[i](value);
            if (checkResult !== true) {
                reject(new Error(checkResult));
                return;
            }
        }

        resolve();
    });
}

const fieldValidationMachine = xstate.createMachine(
    {
        id: "field-validation",
        initial: "idle",
        states: {
            idle: {
                on: {
                    VALIDATE: { target: "validating" },
                },
            },
            validating: {
                invoke: {
                    id: "sync-validation",
                    src: validator,
                    onDone: {
                        target: "valid",
                        actions: "clearError",
                    },
                    onError: {
                        target: "invalid",
                        actions: "setError",
                    },
                },
            },
            valid: {
                on: {
                    VALIDATE: {
                        target: "validating",
                    },
                },
            },
            invalid: {
                on: {
                    VALIDATE: {
                        target: "validating",
                    },
                },
            },
        },
    },
    {
        actions: {
            clearError: xstate.assign({
                error: null,
            }),
            setError: xstate.assign({
                error: (context, event) => event.data.message,
            }),
        },
    }
);


const createValidationService = ({rules = []}) => {
    const machine = fieldValidationMachine.withContext({
        error: null
    });

    const service = xstate.interpret(machine);

    service.start();

    const validate = (value) => service.send({ type: "VALIDATE", value, rules });
    
    function register(field) {
        field.addEventListener("input", (e) => {
            validate(e.target.value);
        });
    }

    return {
        service,
        register,
    };
};

exports.createValidationService = createValidationService;
