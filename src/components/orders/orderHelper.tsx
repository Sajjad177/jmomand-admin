import { Order } from '../../features/admin-dashboard/types';
import { currencyFormatter, fullName, ReportCard } from '../../lib/helper';

export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="min-w-0 space-y-4 text-sm text-slate-600">
      <ReportCard
        title={order.orderNumber || 'Order'}
        rows={[
          ['Customer', fullName(order.customer)],
          ['Email', order.customer?.email || '-'],
          ['Status', order.status || '-'],
          ['Total', currencyFormatter.format(order.totalAmount ?? 0)],
          ['Pickup Code', order.pickupCode || '-'],
          // ["Stripe Session", order.stripeSessionId || "-"],
          ['Stripe Payment', order.stripePaymentIntentId || '-'],
        ]}
      />
      <div className="min-w-0 rounded-lg border border-slate-200 p-4">
        <p className="font-semibold text-slate-950">Items</p>
        <div className="mt-3 space-y-2">
          {(order.items ?? []).map((item, index) => (
            <div
              key={`${item.product?._id || index}`}
              className="grid gap-2 border-b border-slate-100 pb-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <span className="min-w-0 break-words">
                {item.product?.title || 'Product'} x {item.quantity ?? 1}
              </span>
              <span className="font-medium text-slate-700">
                {currencyFormatter.format(item.price ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
