import { useRef, useEffect, useState } from "react";
import { createValidationService } from "xstate-form-validation";

export function useValidate(rules) {
  const [isValid, setValid] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef();
  const [{ service, register, updateRules }] = useState(createValidationService({ rules }));

  useEffect(() => {
    register(ref.current);
    service.onTransition((state) => {
      if (state.matches("valid") || state.matches("invalid")) {
        setValid(state.matches("valid"));
        setError(state.matches('valid') ? null : state.context.error);
      }
    });
  }, []);

  useEffect(() => {
    updateRules(rules, ref.current.value);
}, [rules]);

  return { isValid, ref, error };
}
