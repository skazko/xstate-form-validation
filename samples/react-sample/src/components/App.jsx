import { useValidate } from "../hooks/useValidate";
import Field from "./Field";
import { minLength, required } from "../rules";
import { useEffect, useState, useCallback } from "react";

function checkName(name) {
  return fetch(`https://jsonplaceholder.typicode.com/users?username=${name}`)
    .then((res) => res.json())
    .then((users) => {
      if (users.length) {
        throw new Error("Name already exists");
      }
      return true;
    });
}

function App() {
  const nameCheck = useCallback(checkName, []);
  const nameRequired = useCallback(required("Input your name"), []);
  const passRequired = useCallback(required("Input password"), []);
  const nameMinLength = useCallback(minLength(3, "Name should be more than 3 symbols"), []);
  const passMinLength = useCallback(minLength(8, "Pass should be more than 8 symbols"), []);
  const [passRules] = useState([passRequired, passMinLength]);
  const [nameRules] = useState([nameRequired, nameMinLength]);
  const { isValid: nameIsValid, ref: nameRef, error: nameError, pending } = useValidate(nameRules, nameCheck);
  const { isValid: passIsValid, ref: passRef, error: passError } = useValidate(passRules);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!nameIsValid || !passIsValid) {
      return;
    }
    const fd = new FormData(e.target);
    console.log(Object.fromEntries(fd.entries()));
  };
  return (
    <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={onSubmit}>
      <p style={{opacity: 0.6}}>Bret name exists</p>
      <div>
        <Field pending={pending} name="name" ref={nameRef} isValid={nameIsValid} error={nameError} />
      </div>
      <div>
        <Field name="pass" ref={passRef} isValid={passIsValid} error={passError} />
      </div>
      <button disabled={pending || !nameIsValid || !passIsValid} type="submit">
        Submit
      </button>
    </form>
  );
}

export default App;
