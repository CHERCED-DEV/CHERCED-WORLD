interface loginModalConfig {
    text: string;
    required: boolean;
  }
  
  export const uiText: { [key: string]: loginModalConfig } = {
    user: {
      text: "User",
      required: true,
    },
    password: {
      text: "Password",
      required: true,
    },
    submit: {
      text: "Submit",
      required: false,
    },
  };
  
export const KEY = {
    user: "cherced",
    password: "world"
}
