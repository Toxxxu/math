import { TextField } from "@mui/material";

import { InputTextProps } from "../types/input";

const InputText = ({ id, label, value, onChange }: InputTextProps) => {
  return(
    <TextField 
      id={id}
      label={label}
      variant="standard"
      required
      value={value}
      onChange={onChange}
    />
  );
}

export default InputText;