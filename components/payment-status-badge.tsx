type PaymentStatusBadgeProps = {
  paid: boolean;
};

const PaymentStatusBadge = ({ paid }: PaymentStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {paid ? "Pagó" : "No pagó"}
    </span>
  );
};

export default PaymentStatusBadge;