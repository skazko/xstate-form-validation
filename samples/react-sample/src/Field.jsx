import "./Field.css";
function Field({ current, send, rules, ...rest }) {
    return (
        <div>
            <input
				className="field"
                style={{
                    borderColor: current.matches("valid") ? "green" : current.matches("invalid") ? "red" : "black",
                }}
                onInput={(e) => {
                    if (current.matches('idle')) return;
                    send({ type: "INPUT", rules, value: e.target.value });
                }}
                onBlur={(e) => {
                    if (current.matches('idle')) {
                        send({ type: "INPUT", rules, value: e.target.value })
                    }
                }}
                type="text"
                {...rest}
            />
            {current.context.error && <span style={{ color: "red" }}>{current.context.error}</span>}
        </div>
    );
}

export default Field;
