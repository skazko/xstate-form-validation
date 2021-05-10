export const required = (msg) => (value) => !!value || msg;
export const minLength = (min, msg) => (value) => value.length > min || msg;
