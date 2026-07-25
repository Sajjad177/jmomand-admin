import Image from 'next/image';
import { Package, QrCode, ReceiptText, Truck, User } from 'lucide-react';
import { Order } from '../../features/admin-dashboard/types';
import { Badge, currencyFormatter, fullName } from '../../lib/helper';

export function OrderDetail({ order }: { order: Order }) {
  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;

  return (
    <div className="space-y-5 text-sm text-slate-600">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#FF5A1F]">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order</p>
              <h3 className="text-lg font-bold text-slate-950">
                {order.orderNumber || 'Order Details'}
              </h3>
            </div>
          </div>
          <Badge value={order.status} />
        </div>

        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SummaryBlock label="Order Total" value={currencyFormatter.format(order.totalAmount ?? 0)} />
          <SummaryBlock label="Total Items" value={`${itemCount} item${itemCount === 1 ? '' : 's'}`} />
          <SummaryBlock label="Pickup Code" value={order.pickupCode || '-'} mono />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <User className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-slate-950">Customer Information</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <DetailField label="Name" value={fullName(order.customer)} />
            <DetailField label="Email" value={order.customer?.email || '-'} />
            <DetailField label="Phone" value={order.customer?.phone || '-'} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FF5A1F]">
              <Truck className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-slate-950">Pickup QR</h3>
          </div>
          {order.pickupQrDataUrl ? (
            <div className="flex justify-center rounded-xl border border-slate-100 bg-slate-50 p-3">
              <Image
                src={order.pickupQrDataUrl}
                alt="Pickup QR code"
                width={144}
                height={144}
                className="h-32 w-32 rounded-lg object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
              <QrCode className="h-8 w-8" />
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Package className="h-4 w-4 text-[#FF5A1F]" />
          <h3 className="font-semibold text-slate-950">Order Items</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {(order.items ?? []).length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-slate-500">No items found.</p>
          ) : (
            order.items?.map((item, index) => {
              const product = item.product;
              const imageUrl = product?.images?.[0]?.url || product?.categoryImage?.url;
              const quantity = item.quantity ?? 1;
              const price = item.price ?? product?.price ?? 0;
              const lineTotal = price * quantity;

              return (
                <div
                  key={product?._id || index}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[64px_minmax(0,1fr)_auto]"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product?.title || 'Product image'}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {product?.title || 'Product'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      {product?.inventoryId && <MetaPill>{product.inventoryId}</MetaPill>}
                      {product?.category && <MetaPill>{product.category}</MetaPill>}
                      {product?.condition && <MetaPill>{product.condition}</MetaPill>}
                      {product?.color?.length ? <MetaPill>{product.color.join(', ')}</MetaPill> : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Qty {quantity} x {currencyFormatter.format(price)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-950">{currencyFormatter.format(lineTotal)}</p>
                    <p className="mt-1 text-xs text-slate-400">Line total</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryBlock({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-bold text-slate-950 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-600">
      {children}
    </span>
  );
}
