import { forwardRef } from "react";

const Field = forwardRef(({ isValid, error, ...rest }, ref) => {
    return (
        <div className="fieldContainer">
            <input
                ref={ref}
                className="field"
                style={{
                    borderColor: isValid ? "green" : error ? "red" : "black",
                }}
                type="text"
                {...rest}
            />
            {error && <span style={{ color: "red" }}>{error}</span>}
        </div>
    );
});

export default Field;
