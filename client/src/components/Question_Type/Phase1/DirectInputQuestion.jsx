import React from "react";

const DirectInputQuestion = ({
  answer,
  setAnswer,
  isSuccess,
  isError,
  handleSubmit,
}) => {
  return (
    <form onSubmit={handleSubmit} className="answer__form">
      <input
        type="number"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className={
          isSuccess
            ? "answer__input visual__input__success"
            : isError
              ? "answer__input visual__input__error"
              : "answer__input"
        }
        autoFocus
      />
      <button
        onClick={handleSubmit}
        className="submit__btn"
        disabled={isSuccess || isError}
      >
        {isSuccess ? "Correct!" : isError ? "Wrong..." : "Submit Answer"}
      </button>
    </form>
  );
};

export default DirectInputQuestion;
