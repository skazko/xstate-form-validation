import { useRef, useEffect, useState } from "react";
import { createValidationService } from "xstate-form-validation";

export function useValidate(rules) {
    const [state, setState] = useState({});
    const ref = useRef();
    

    useEffect(() => {
        const { service, register } = createValidationService({ rules });
        register(ref.current);
        service.onTransition((state) => {
            if (state.matches('valid') || state.matches('invalid')) {
                setState({
                    isValid: state.matches("valid"),
                    isInvalid: state.matches("invalid"),
                    error: state.context.error,
                });
            }
            
        });
    }, []);

    return [state, ref];
}
