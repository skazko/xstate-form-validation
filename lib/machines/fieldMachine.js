import { assign, createMachine, sendParent } from "xstate";

export const createFieldMachine = ({ name, rules, value, error }) =>
  createMachine(
    {
      id: "field",
      initial: "idle",
      context: {
        name,
        rules,
        error,
        value,
      },
      states: {
        idle: {
          on: {
            validate: "validation",
            input: {
              actions: "setValue",
            },
            UPDATE_RULES: {
              actions: "updateRules",
            },
          },
        },
        validation: {
          invoke: {
            id: "sync-validation",
            src: "syncValidator",
            onDone: {
              target: "valid",
              actions: "clearError",
            },
            onError: {
              target: "error",
              actions: "setError",
            },
          },
        },
        valid: {
          entry: ["updateField", "sendSuccess"],
          on: {
            input: {
              actions: "setValue",
              target: "validation",
            },
            UPDATE_RULES: {
              actions: "updateRules",
              target: "validation",
            },
          },
        },
        error: {
          entry: ["updateField", "sendError"],
          on: {
            input: {
              actions: "setValue",
              target: "validation",
            },
            UPDATE_RULES: {
              actions: "updateRules",
              target: "validation",
            },
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
        }),
        setValue: assign({
          value: (context, event) => {
            return event.value;
          },
        }),
        updateField: sendParent((context) => {
          return {
            type: "FIELD.UPDATE",
            field: context,
          };
        }),
        sendSuccess: sendParent((context) => {
          return {
            type: "FIELD.SUCCESS",
            name: context.name,
          };
        }),
        sendError: sendParent((context) => {
          return {
            type: "FIELD.ERROR",
            name: context.name,
          };
        }),
      },
      services: {
        syncValidator: (context, event) => {
          const { rules, value } = context;
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
        },
      },
    }
  );
