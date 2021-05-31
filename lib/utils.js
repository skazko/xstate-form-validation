/**
 * Создает функцию для регистрации поля
 */
export function createRegister(state, send, mode = 'onChange') {
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
      [mode]: (e) => {
        fields[name].ref.send({ type: "input", value: e.target.value });
      },
    };
  };
}

/**
 * Создает сервис для отправки формы
 */
export function createSubmitService(cb) {
  return (context) => {
    return cb(Object.fromEntries(Object.entries(context.fields).map(([key, value]) => [key, value.value])));
  };
}

/**
 * Создает функцию для отправки формы 
 */
export function createSubmit(send) {
  return (e) => {
    e.preventDefault();
    send("submit");
  };
}

/**
 * Создает объект с данными формы
 */
export function createFormData(state) {
  const { fields } = state.context;

  const form = {
    submitted: state.matches("submitted"),
    hasError: state.matches("error"),
    errors: {},
    fields: {},
  };
  for (let key in state.context.fields) {
    console.log(fields[key].error);
    form.errors[key] = fields[key].error;
    form.fields[key] = {
      isValid: fields[key].ref.state.matches("valid"),
      hasError: fields[key].ref.state.matches("error"),
      value: fields[key].value,
    };
  }

  form.fields = new Proxy(form.fields, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }

      return {
        isValid: false,
        hasError: false,
        value: undefined,
      };
    },
  });

  return form;
}