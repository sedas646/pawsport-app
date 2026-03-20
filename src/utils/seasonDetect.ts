export function getSeason(date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 12 && day >= 21) || month <= 2 || (month === 3 && day <= 19))
    return "winter";
  if ((month === 3 && day >= 20) || month <= 5 || (month === 6 && day <= 20))
    return "spring";
  if ((month === 6 && day >= 21) || month <= 8 || (month === 9 && day <= 21))
    return "summer";
  return "fall";
}
