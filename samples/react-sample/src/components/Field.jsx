import { forwardRef } from "react";

const Field = forwardRef(({ state, ...rest }, ref) => {
    const { isInvalid, isValid, error } = state;
    return (
        <div className="fieldContainer">
            <input
                ref={ref}
                className="field"
                style={{
                    borderColor: isValid ? "green" : isInvalid ? "red" : "black",
                }}
                type="text"
                {...rest}
            />
            {error && <span style={{ color: "red" }}>{error}</span>}
        </div>
    );
});

export default Field;
