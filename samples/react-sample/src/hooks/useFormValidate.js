import { useMachine } from "@xstate/react";
import { formMachine } from "xstate-form-validation";

function useRegisterField(state, send) {
  const { fields } = state.context;

  return ({ rules = [], name, defaultValue = "" } = {}) => {
    if (!(name in fields)) {
      console.log("register: ", name);
      send({
        type: "FIELD.ADD",
        field: {
          name,
          value: defaultValue,
          rules,
        },
      });
    }

    return {
      name,
      onChange: (e) => {
        fields[name].ref.send({ type: "input", value: e.target.value });
      },
    };
  };
}

export function useFormValidateMachine({ onSubmit = () => {} } = {}) {
  const submitService = (context) => {
    const data = Object.fromEntries(Object.entries(context.fields).map(([key, value]) => [key, value.value]));
    return onSubmit(data);
  };
  const [state, send] = useMachine(formMachine.withConfig({ services: { submitService } }), { devTools: true });
  const register = useRegisterField(state, send);

  const form = {
    hasError: state.matches("error"),
    errors: {},
  };
  for (let key in state.context.fields) {
    form.errors[key] = state.context.fields[key].error;
  }

  return { register, send, form };
}
