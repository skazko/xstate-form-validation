import { interpret } from "xstate";
import { fieldValidationMachine } from "../machines/fieldValidationMachine";

export const createValidationService = ({ rules = [], asyncValidator }) => {
  const machine = fieldValidationMachine.withContext({
    error: null,
    rules,
    asyncValidator,
  });

  const service = interpret(machine);

  service.start();

  const validate = (value) => service.send({ type: "VALIDATE", value });
  const asyncValidate = (value) => service.send({ type: "ASYNC_VALIDATE", value });
  const updateRules = (rules, value) => service.send({ type: "UPDATE_RULES", rules, value });

  function register(field) {
    // could be different validation types
    field.addEventListener("input", (e) => {
      validate(e.target.value);
    });

    if (asyncValidator) {
      field.addEventListener("blur", (e) => {
        asyncValidate(e.target.value);
      });
    }
  }

  return {
    service,
    register,
    updateRules,
    validate,
    machine,
  };
};
