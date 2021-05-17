import { useValidate } from "../hooks/useValidate";
import Field from "./Field";
import { minLength, required } from "../rules";

const nameRequired = required("Input your name");
const passRequired = required("Input password");
const nameMinLength = minLength(3, "Name should be more than 3 symbols");
const passMinLength = minLength(8, "Pass should be more than 8 symbols");

function App() {
    const [nameState, nameRef] = useValidate([nameRequired, nameMinLength]);
    const [passState, passRef] = useValidate([passRequired, passMinLength]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (nameState.isInvalid || passState.isInvalid) {
            return;
        }
        const fd = new FormData(e.target);
        console.log(Object.fromEntries(fd.entries()));
    };
    return (
        <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={onSubmit}>
            <Field name="name" ref={nameRef} state={nameState} />
            <Field name="pass" ref={passRef} state={passState} />
            <button disabled={!nameState.isValid || !passState.isValid} type="submit">
                Submit
            </button>
        </form>
    );
}

export default App;
