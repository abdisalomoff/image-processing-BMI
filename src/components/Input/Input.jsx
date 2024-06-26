import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Input.css";

const Input = ({
  type,
  placeholder,
  onChange,
  id,
  value,
  min,
  max,
  step,
  w100,
  name,
  checked,
}) => {
  const [content, setContent] = useState(value);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    setContent(newValue);
    if (type === "checkbox") {
      onChange(event.target.checked);
    } else {
      onChange(type === "number" ? Number(newValue) : newValue);
    }
  };

  return (
    <input
      id={id}
      type={type}
      className={w100 ? "input input--full" : "input"}
      onChange={handleChange}
      placeholder={placeholder}
      value={content}
      min={min}
      max={max}
      step={step}
      name={name}
      checked={checked}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func,
  checked: PropTypes.bool,
  id: PropTypes.string,
  w100: PropTypes.bool,
  name: PropTypes.string,
};

export default Input;
