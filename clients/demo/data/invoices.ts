export type InvoiceStatus = "paid" | "due" | "overdue";

export type Invoice = {
  id: string;
  customer: string;
  amount: string;
  status: InvoiceStatus;
  dueDate: string;
};

export const invoices: Invoice[] = [
  {
    id: "INV-0042",
    customer: "Acme Pty Ltd",
    amount: "$4,200.00",
    status: "due",
    dueDate: "2026-06-24",
  },
  {
    id: "INV-0041",
    customer: "Globex Corporation",
    amount: "$1,150.00",
    status: "paid",
    dueDate: "2026-06-10",
  },
  {
    id: "INV-0040",
    customer: "Initech",
    amount: "$880.00",
    status: "overdue",
    dueDate: "2026-05-28",
  },
  {
    id: "INV-0039",
    customer: "Wayne Enterprises",
    amount: "$12,640.00",
    status: "due",
    dueDate: "2026-06-30",
  },
  {
    id: "INV-0038",
    customer: "Stark Industries",
    amount: "$3,075.50",
    status: "paid",
    dueDate: "2026-06-02",
  },
  {
    id: "INV-0037",
    customer: "Tyrell Corp",
    amount: "$640.00",
    status: "overdue",
    dueDate: "2026-05-19",
  },
];
