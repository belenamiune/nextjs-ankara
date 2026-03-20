type PaymentStatusBadgeProps = {
  paid: boolean;
};

const PaymentStatusBadge = ({ paid }: PaymentStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        paid
          ? "border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.12)] text-green-700 dark:text-green-400"
          : "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.14)] text-amber-700 dark:text-amber-400"
      }`}
    >
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
};

export default PaymentStatusBadge;