import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "../sass/components/CustomSelect.scss";

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Select",
  disabled,
  isGhosted = false,
  ghostPlaceholder = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  // 🔥 Determine what label to show based on ghost state vs actual value
  const displayLabel = value
    ? options.find((opt) => opt.value === value)?.label
    : isGhosted
      ? ghostPlaceholder
      : placeholder;

  return (
    <div
      className={`wizard-select ${disabled ? "is-disabled" : ""}`}
      ref={dropdownRef}
      tabIndex={0}
    >
      <div
        // 🔥 Apply the ghost-select class if ghosted and no value selected
        className={`wizard-select__trigger ${isOpen ? "is-open" : ""} ${isGhosted && !value ? "ghost-select" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? "is-placeholder" : ""}>{displayLabel}</span>
        <ChevronDown size={20} className="wizard-select__icon" />
      </div>

      {isOpen && !disabled && (
        <ul className="wizard-select__menu">
          <li
            className="wizard-select__option is-placeholder-option"
            onClick={() => handleSelect({ value: "" })}
          >
            {placeholder}
          </li>

          {options.map((option) => (
            <li
              key={option.value}
              className={`wizard-select__option ${value === option.value ? "is-selected" : ""}`}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
