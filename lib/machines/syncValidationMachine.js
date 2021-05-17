import { assign, createMachine, interpret } from "xstate";

function validator(context, event) {
    const { value } = event;
    const { rules } = context;
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

export const fieldValidationMachine = createMachine(
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
                    UPDATE_RULES: {
                        actions: "updateRules"
                    }
                },
            },
            invalid: {
                on: {
                    VALIDATE: {
                        target: "validating",
                    },
                    UPDATE_RULES: {
                        actions: "updateRules"
                    }
                },
            },
        },
    },
    {
        actions: {
            clearError: assign({
                error: null,
            }),
            setError: assign({
                error: (context, event) => event.data.message,
            }),
            updateRules: assign({
                rules: (context, event) => event.rules,
            })
        },
    }
);


export const createValidationService = ({rules = []}) => {
    const machine = fieldValidationMachine.withContext({
        error: null,
        rules
    });

    const service = interpret(machine);

    service.start();

    const validate = (value) => service.send({ type: "VALIDATE", value });
    
    function register(field) {
        // could be different validation types
        field.addEventListener("input", (e) => {
            validate(e.target.value);
        });
    }

    return {
        service,
        register,
    };
};
