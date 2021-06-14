import { assign, createMachine, spawn, send, actions } from "xstate";
import { createFieldMachine } from "./fieldMachine";

const { pure } = actions;

function createField({ value, name, rules }) {
  return {
    value,
    name,
    rules,
    error: null,
  };
}

export const formMachine = createMachine(
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
