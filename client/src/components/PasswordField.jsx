import { IoEyeOutline } from "react-icons/io5";

const PasswordField = ({
  value,
  onChange,
  placeholder,
  isVisible,
  onPeekStart,
  onPeekEnd,
  autoComplete,
}) => {
  return (
    <div className="input__group input__group--password">
      <input
        className="login__container__password"
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className={`input__peek ${isVisible ? "input__peek--active" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          onPeekStart();
        }}
        onPointerUp={onPeekEnd}
        onPointerLeave={onPeekEnd}
        onPointerCancel={onPeekEnd}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            onPeekStart();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            onPeekEnd();
          }
        }}
        onBlur={onPeekEnd}
        aria-label={`Press and hold to show ${placeholder.toLowerCase()}`}
      >
        <IoEyeOutline aria-hidden="true" className="input__peekIcon" />
      </button>
    </div>
  );
};

export default PasswordField;
