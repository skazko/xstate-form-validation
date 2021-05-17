import { interpret } from "xstate";
import { fieldValidationMachine } from "../machines/fieldValidationMachine";

export const createValidationService = ({ rules = [] }) => {
  const machine = fieldValidationMachine.withContext({
    error: null,
    rules,
  });

  const service = interpret(machine);

  service.start();

  const validate = (value) => service.send({ type: "VALIDATE", value });
  const updateRules = (rules) => service.send({ type: "UPDATE_RULES", rules });

  function register(field) {
    // could be different validation types
    field.addEventListener("input", (e) => {
      validate(e.target.value);
    });
  }

  return {
    service,
    register,
    updateRules,
    validate,
    machine,
  };
};
