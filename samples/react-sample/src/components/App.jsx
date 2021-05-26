import { useValidate } from "../hooks/useValidate";
import Field from "./Field";
import { minLength, required } from "../rules";
import { useEffect, useState, useCallback } from "react";



function App() {
    const nameRequired = useCallback(required("Input your name"), []);
    const passRequired = useCallback(required("Input password"), []);
    const nameMinLength = useCallback(minLength(3, "Name should be more than 3 symbols"), []);
    const passMinLength = useCallback(minLength(8, "Pass should be more than 8 symbols"), []); 
    const [passRules, setPassRules] = useState([passRequired])
    const [nameRules] = useState([nameRequired, nameMinLength])
    const {isValid: nameIsValid, ref: nameRef, error: nameError} = useValidate(nameRules);
    const {isValid: passIsValid, ref: passRef, error: passError} = useValidate(passRules);

    useEffect(() => {
        if (nameIsValid) {
            setPassRules([passRequired, passMinLength])
        } else {
            setPassRules([passRequired])
        }
    }, [nameIsValid])

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
            <Field name="name" ref={nameRef} isValid={nameIsValid} error={nameError} />
            <Field name="pass" ref={passRef} isValid={passIsValid} error={passError} />
            <button disabled={!nameIsValid || !passIsValid} type="submit">
                Submit
            </button>
        </form>
    );
}

export default App;
