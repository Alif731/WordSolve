const ConceptualQuestion = ({
  problem,
  selectedOption,
  isSuccess,
  isError,
  handleOptionClick,
}) => {
  const question = problem?.question;
  let displayOperands = question?.operands || [];
  const num1 = displayOperands[0];
  const num2 = displayOperands[1];
  const showFullEquation = num1 && num2;

  const conceptualButtons = [];
  if (question?.options) {
    for (let i = 0; i < question.options.length; i++) {
      const option = question.options[i];
      const letter = String.fromCharCode(65 + i);

      let btnClass = "card__options__btn";
      if (selectedOption === option) {
        if (isSuccess) btnClass += " card__options__btn__success";
        if (isError) btnClass += " card__options__btn__error";
      }

      conceptualButtons.push(
        <button
          key={option}
          className={btnClass}
          onClick={() => handleOptionClick(option)}
          disabled={isSuccess || isError}
        >
          <span className="sike">
            <span className="sike__options">{letter}</span>
            {showFullEquation ? `${num1} ${option} ${num2}` : option}
          </span>
        </button>,
      );
    }
  }

  return <div className="card__options">{conceptualButtons}</div>;
};

export default ConceptualQuestion;
