import { createMachine, assign, sendParent, send, spawn, actions } from 'xstate';

const createFieldMachine = ({ name, rules, value, error }) =>
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

const { pure } = actions;

function createField({ value, name, rules }) {
  return {
    value,
    name,
    rules,
    error: null,
  };
}

const formMachine = createMachine(
  {
    id: "form",
    initial: "idle",
    context: {
      fields: {},
    },
    on: {
      "FIELD.UPDATE": {
        actions: ["updateField"],
      },
      "FIELD.ADD": {
        actions: ["addField"],
      },
      submit: [
        {
          target: "submit",
          cond: "formValid",
        },
        {
          target: "error",
        },
      ],
    },
    states: {
      idle: {
        on: {
          submit: "validation",
        },
      },
      error: {
        entry: ["focusError"],
        on: {
          "FIELD.SUCCESS": {
            target: "valid",
            cond: "formValid",
          },
        },
      },
      valid: {
        on: {
          "FIELD.ERROR": {
            target: "error",
          },
        },
      },
      validation: {
        initial: "active",
        states: {
          active: {
            entry: "validateAllFields",
            on: {
              "FIELD.ERROR": {
                target: "done",
                cond: "allValidated",
              },
              "FIELD.SUCCESS": {
                target: "done",
                cond: "allValidated",
              },
            },
          },
          done: {
            entry: send("submit"),
          },
        },
      },
      submit: {
        invoke: {
          src: "submitService",
          onDone: "submitted",
          onError: "error",
        },
      },
      submitted: {
        type: "final",
      },
    },
  },
  {
    actions: {
      addField: assign({
        fields: (context, event) => {
          const { field } = event;
          const newField = createField(field);

          return Object.assign(context.fields, {
            [newField.name]: {
              ...newField,
              ref: spawn(createFieldMachine(newField)),
            },
          });
        },
      }),
      updateField: assign({
        fields: (context, event) => ({
          ...context.fields,
          [event.field.name]: {
            ...context.fields[event.field.name],
            ...event.field,
          },
        }),
      }),
      validateAllFields: pure((context, event) => {
        return Object.values(context.fields).map((field) => {
          return send({ type: "validate" }, { to: field.ref });
        });
      }),
    },
    guards: {
      formValid: (context) => Object.values(context.fields).every((field) => field.error === null),
      allValidated: (context, event) =>
        Object.values(context.fields)
          .filter((field) => field.name !== event.name)
          .every((field) => ["valid", "error"].some(field.ref.state.matches)),
    },
  }
);

export { formMachine };
