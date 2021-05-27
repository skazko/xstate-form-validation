import { assign, createMachine } from "xstate";

export const fieldValidationMachine = createMachine(
  {
    id: "field-validation",
    initial: "idle",
    states: {
      idle: {
        on: {
          VALIDATE: { target: "validating" },
          UPDATE_RULES: {
            actions: "updateRules",
            target: "idle",
          },
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
      pending: {
        invoke: {
          id: "async-validation",
          src: asyncValidatorService,
          onDone: {
            target: "valid",
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
            actions: "updateRules",
            target: "validating",
          },
          ASYNC_VALIDATE: {
            target: "pending",
          },
        },
      },
      invalid: {
        on: {
          VALIDATE: {
            target: "validating",
          },
          UPDATE_RULES: {
            actions: "updateRules",
            target: "validating",
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
    },
    guards: {
      shoudStartAsyncValidation({ asyncValidator }) {
        return asyncValidator && typeof asyncValidator === "function";
      },
    },
  }
);

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

function asyncValidatorService(context, event) {
  const { value } = event;
  const { asyncValidator } = context;
  const result = asyncValidator(value);
  if (result && "then" in result) {
    return result;
  } else {
    throw new TypeError("async validator should return Promise");
  }
}
