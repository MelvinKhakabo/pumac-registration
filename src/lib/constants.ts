export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

export const KES_RATE = 130;

export const COMPETITION_DEADLINE = new Date("2027-01-23T23:59:59");
export const COMPETITION_DATE = new Date("2027-01-30T23:59:59");
export const SHOW_COMPETITION_DATE_PILL = new Date() <= COMPETITION_DATE;

export const EARLY_BIRD_DEADLINE = new Date("2026-07-30T23:59:59");
export const IS_EARLY_BIRD = new Date() < EARLY_BIRD_DEADLINE;

export const COMPETITION_INDIVIDUAL_EARLY_BIRD_PRICE = 12.5;
export const COMPETITION_INDIVIDUAL_STANDARD_PRICE = 15;
export const COMPETITION_INDIVIDUAL_PRICE = IS_EARLY_BIRD
  ? COMPETITION_INDIVIDUAL_EARLY_BIRD_PRICE
  : COMPETITION_INDIVIDUAL_STANDARD_PRICE;
export const COMPETITION_TEAM_PRICE = 100;

export const allTrainingMonths = [
  {
    id: "july-2026",
    label: "July 2026",
    dates: "July 4, 11, 18, 25",
    topic: "Algebra",
    priceUsd: 62,
    firstSessionDate: new Date("2026-07-04T23:59:59"),
    lastSessionDate: new Date("2026-07-25T23:59:59"),
    closeDate: new Date("2026-07-25T23:59:59"),
  },
  {
    id: "august-2026",
    label: "August 2026",
    dates: "August 8, 15, 22, 29",
    topic: "Geometry",
    priceUsd: 62,
    firstSessionDate: new Date("2026-08-08T23:59:59"),
    lastSessionDate: new Date("2026-08-29T23:59:59"),
    closeDate: new Date("2026-08-29T23:59:59"),
  },
  {
    id: "september-2026",
    label: "September 2026",
    dates: "September 5, 12, 19, 26",
    topic: "Number Theory",
    priceUsd: 62,
    firstSessionDate: new Date("2026-09-05T23:59:59"),
    lastSessionDate: new Date("2026-09-26T23:59:59"),
    closeDate: new Date("2026-09-26T23:59:59"),
  },
  {
    id: "october-2026",
    label: "October 2026",
    dates: "October 3, 10, 17, 24",
    topic: "Combinatorics",
    priceUsd: 62,
    firstSessionDate: new Date("2026-10-03T23:59:59"),
    lastSessionDate: new Date("2026-10-24T23:59:59"),
    closeDate: new Date("2026-10-31T23:59:59"),
  },
  {
    id: "november-2026",
    label: "November 2026",
    dates: "November 7, 14, 21, 28",
    topic: "Algebra",
    priceUsd: 62,
    firstSessionDate: new Date("2026-11-07T23:59:59"),
    lastSessionDate: new Date("2026-11-28T23:59:59"),
    closeDate: new Date("2026-11-28T23:59:59"),
  },
  {
    id: "january-2027",
    label: "January 2027",
    dates: "January 2, 9, 16, 23",
    topic: "Geometry",
    priceUsd: 62,
    firstSessionDate: new Date("2027-01-02T23:59:59"),
    lastSessionDate: new Date("2027-01-23T23:59:59"),
    closeDate: new Date("2027-01-23T23:59:59"),
  },
];

export const mockTests = [
  {
    id: "october-mock-2026",
    label: "October Mock Test",
    date: "October 3, 2026",
    priceUsd: 10,
  },
  {
    id: "december-mock-2026",
    label: "December Mock Test",
    date: "December 5, 2026",
    priceUsd: 10,
  },
];

export function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function formatKes(amount: number) {
  return `KES ${Math.round(amount).toLocaleString()}`;
}

export function isKenya(country: string) {
  return country.trim().toLowerCase() === "kenya";
}