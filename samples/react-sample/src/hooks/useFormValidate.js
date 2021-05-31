import { useMachine } from "@xstate/react";
import { formMachine, utils } from "xstate-form-validation";
const { createRegister, createFormData, createSubmit, createSubmitService } = utils;

export function useFormMachine({ onSubmit = () => Promise.resolve() } = {}) {
  const [state, send] = useFormMachineWithSubmitService(formMachine, onSubmit);
  const register = createRegister(state, send);
  const submit = createSubmit(send);
  const form = createFormData(state);

  return { register, submit, form };
}

function useFormMachineWithSubmitService(machine, submitCb) {
  const [state, send, service] = useMachine(
    machine.withConfig({ services: { submitService: createSubmitService(submitCb) } }),
    { devTools: true }
  );

  return [state, send, service];
}
