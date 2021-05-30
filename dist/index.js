'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var xstate = require('xstate');

const createFieldMachine = ({ name, rules, value, error }) =>
  xstate.createMachine(
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
        clearError: xstate.assign({
          error: null,
        }),
        setError: xstate.assign({
          error: (context, event) => event.data.message,
        }),
        updateRules: xstate.assign({
          rules: (context, event) => event.rules,
        }),
        setValue: xstate.assign({
          value: (context, event) => {
            return event.value;
          },
        }),
        updateField: xstate.sendParent((context) => {
          return {
            type: "FIELD.UPDATE",
            field: context,
          };
        }),
        sendSuccess: xstate.sendParent((context) => {
          return {
            type: "FIELD.SUCCESS",
            name: context.name,
          };
        }),
        sendError: xstate.sendParent((context) => {
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

const { pure } = xstate.actions;

function createField({ value, name, rules }) {
  return {
    value,
    name,
    rules,
    error: null,
  };
}

const formMachine = xstate.createMachine(
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
            entry: xstate.send("submit"),
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
      addField: xstate.assign({
        fields: (context, event) => {
          const { field } = event;
          const newField = createField(field);

          return Object.assign(context.fields, {
            [newField.name]: {
              ...newField,
              ref: xstate.spawn(createFieldMachine(newField)),
            },
          });
        },
      }),
      updateField: xstate.assign({
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
          return xstate.send({ type: "validate" }, { to: field.ref });
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

exports.formMachine = formMachine;
