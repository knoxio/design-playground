export type ConsignmentStatus = "booked" | "in-transit" | "delivered" | "delayed";

export type Consignment = {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  status: ConsignmentStatus;
  eta: string;
};

export const consignments: Consignment[] = [
  {
    id: "CON-2107",
    origin: "Sydney",
    destination: "Perth",
    carrier: "Westhaul",
    status: "in-transit",
    eta: "2026-06-14",
  },
  {
    id: "CON-2106",
    origin: "Melbourne",
    destination: "Brisbane",
    carrier: "Pacific Line",
    status: "delayed",
    eta: "2026-06-12",
  },
  {
    id: "CON-2105",
    origin: "Adelaide",
    destination: "Sydney",
    carrier: "Westhaul",
    status: "in-transit",
    eta: "2026-06-11",
  },
  {
    id: "CON-2104",
    origin: "Brisbane",
    destination: "Cairns",
    carrier: "NorthFreight",
    status: "booked",
    eta: "2026-06-17",
  },
  {
    id: "CON-2101",
    origin: "Sydney",
    destination: "Melbourne",
    carrier: "Pacific Line",
    status: "delivered",
    eta: "2026-06-06",
  },
];
