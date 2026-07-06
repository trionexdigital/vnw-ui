export const capitalizeFirstLetter = (value: string): string => {
  const firstLetterIndex = value.search(/[A-Za-z]/);
  if (firstLetterIndex === -1) return value;

  return (
    value.slice(0, firstLetterIndex) +
    value.charAt(firstLetterIndex).toUpperCase() +
    value.slice(firstLetterIndex + 1)
  );
};

export const formatTextInputValue = (
  value: string,
  inputType: string = "text"
): string => {
  if (inputType.toLowerCase() === "password") return value;
  return capitalizeFirstLetter(value);
};
