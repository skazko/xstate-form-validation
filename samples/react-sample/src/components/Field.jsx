import { forwardRef } from "react";
import Loader from './Loader';

const Field = forwardRef(({ isValid, error, pending, ...rest }, ref) => {
  return (
    <div className="fieldContainer">
      <input
        disabled={pending}
        ref={ref}
        className="field"
        style={{
          borderColor: isValid ? "green" : error ? "red" : "black",
        }}
        type="text"
        {...rest}
      />
      {error && <span style={{ color: "red" }}>{error}</span>}
      {pending && <Loader />}
    </div>
  );
});

export default Field;
