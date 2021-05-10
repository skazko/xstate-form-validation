import { assign, createMachine } from "xstate";

export const fieldValidationStateMachine = createMachine(
    {
        id: "field-validation",
        initial: "idle",
        context: {
            error: null,
        },
        states: {
            idle: {
                on: {
                    INPUT: [
                        {
                            target: "valid",
                            cond: "checkIfValid",
                            actions: "checkError",
                        },
                        {
                            target: "invalid",
                            actions: "checkError",
                        },
                    ],
                },
            },
            valid: {
                on: {
                    INPUT: [
                        {
                            target: "invalid",
                            cond: "checkIfInvalid",
                            actions: "checkError",
                        },
                        {
                            target: "valid",
                            actions: "checkError",
                        },
                    ],
                },
            },
            invalid: {
                on: {
                    INPUT: [
                        {
                            target: "valid",
                            cond: "checkIfValid",
                            actions: "checkError",
                        },
                        {
                            target: "invalid",
                            actions: "checkError",
                        },
                    ],
                },
            },
        },
    },
    {
        actions: {
            checkError: assign({
                error: (context, event) => {
                    const checkResults = event.rules.map((rule) => rule(event.value));
                    const errorMsg = checkResults.find((res) => typeof res === "string") || null;
                    return errorMsg;
                },
            }),
        },
        guards: {
            checkIfValid(context, event) {
                return event.rules.every((rule) => rule(event.value) === true);
            },
            checkIfInvalid(context, event) {
                return event.rules.some((rule) => rule(event.value) !== true);
            },
        },
    }
);
