import { useMachine } from "@xstate/react";
import { fieldValidationStateMachine } from "./fieldValidationStateMachine";

import Field from "./Field";
import { minLength, required } from "./rules";

const nameRequired = required("Input your name");
const passRequired = required("Input password");
const nameMinLength = minLength(3, "Name should be more than 3 symbols");
const passMinLength = minLength(8, "Pass should be more than 8 symbols");

function App() {
    const [name, sendToName] = useMachine(fieldValidationStateMachine);
    const [pass, sendToPass] = useMachine(fieldValidationStateMachine);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!name.matches("valid") || !pass.matches("valid")) {
            return
        }
        const fd = new FormData(e.target);
        console.log(Object.fromEntries(fd.entries()));
    };
    return (
        <form style={{ margin: "0 auto", maxWidth: "640px", paddingTop: "50px" }} onSubmit={onSubmit}>
            <Field name="name" current={name} send={sendToName} rules={[nameRequired, nameMinLength]} />
            <Field name="pass" current={pass} send={sendToPass} rules={[passRequired, passMinLength]} />
            <button 
                disabled={!name.matches("valid") || !pass.matches("valid")}
                type="submit"
            >
                Submit
            </button>
        </form>
    );
}

export default App;
