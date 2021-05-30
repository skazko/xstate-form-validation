import { useFormValidateMachine } from "../hooks/useFormValidate";

function App() {
  const { register, send, form } = useFormValidateMachine({
    onSubmit: async (data) => {
      console.log(data)
      return Promise.resolve();
    }
  });
  const { hasError, errors } = form;

  const onSubmit = (e) => {
    e.preventDefault();
    send("submit");
  };
  return (
    <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={onSubmit}>
      <div className="formField">
        <div className="fieldContainer">
          <input
            {...register({
              name: 'name',
              rules: [
                (v) => !!v || "Введите имя",
                (v) => v.trim().length >= 3 || "Имя должно быть как минимум из 3 символов",
              ],
            })}
            className="field"
            type="text"
          />
          {errors.name !== null && <span style={{ color: "red" }}>{errors.name}</span>}
        </div>
      </div>
      <div className="formField">
        <div className="fieldContainer">
          <input
            {...register({
              name: "password",
              rules: [
                (v) => !!v || "Введите пароль",
                (v) => v.trim().length >= 6 || "Пароль должен быть как минимум из 6 символов",
              ],
            })}
            className="field"
            type="password"
          />
          {errors.password !== null && <span style={{ color: "red" }}>{errors.password}</span>}
        </div>
      </div>

      <button disabled={hasError} type="submit">
        Submit
      </button>
    </form>
  );
}

export default App;
