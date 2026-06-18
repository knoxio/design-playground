export type QuoteStatus = "pending" | "quoted" | "accepted" | "expired";

export type Quote = {
  id: string;
  lane: string;
  pallets: number;
  weightKg: number;
  status: QuoteStatus;
  amount?: string;
};

export const quotes: Quote[] = [
  {
    id: "Q-0883",
    lane: "Sydney → Perth",
    pallets: 6,
    weightKg: 2400,
    status: "quoted",
    amount: "$3,180.00",
  },
  { id: "Q-0882", lane: "Melbourne → Hobart", pallets: 2, weightKg: 640, status: "pending" },
  {
    id: "Q-0881",
    lane: "Brisbane → Darwin",
    pallets: 10,
    weightKg: 4800,
    status: "accepted",
    amount: "$6,450.00",
  },
  {
    id: "Q-0879",
    lane: "Adelaide → Sydney",
    pallets: 4,
    weightKg: 1520,
    status: "expired",
    amount: "$1,940.00",
  },
];
