'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Clock3,
  CreditCard,
  Mail,
  Package,
  Phone,
  ReceiptText,
  Tag,
} from 'lucide-react';
import { Badge, currencyFormatter, formatDate, formatTime, fullName } from '@/lib/helper';
import type { PickupSchedule, PickupScheduleStatus } from './pickup-requests';
import { PickupStatusActionBar } from './PickupStatusActionBar';

type PickupRequestDetailsProps = {
  schedule: PickupSchedule;
  selectedStatus: PickupScheduleStatus;
  isUpdating: boolean;
  onStatusChange: (status: PickupScheduleStatus) => void;
  onUpdateStatus: () => void;
};

export function PickupRequestDetails({
  schedule,
  selectedStatus,
  isUpdating,
  onStatusChange,
  onUpdateStatus,
}: PickupRequestDetailsProps) {
  const product = schedule.auctionProductId?.productId;
  const auctionProduct = schedule.auctionProductId;
  const productImage = getProductImage(product);
  const requestId = schedule._id ? `REQ-${schedule._id.slice(-6).toUpperCase()}` : 'REQUEST';

  return (
    <div className="mx-auto flex max-h-[calc(90vh-88px)] w-full flex-col overflow-hidden bg-white text-slate-950">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <section className="overflow-hidden rounded-lg border border-[#D8E1EF] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid md:grid-cols-[212px_minmax(0,1fr)]">
            <div className="relative h-52 bg-slate-100 md:h-full">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={product?.title || 'Product image'}
                  fill
                  sizes="(max-width: 700px) 90vw, 200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full min-h-52 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <Package className="h-12 w-12" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-medium text-slate-950">
                    {product?.title || 'Auction Product'}
                  </h3>
                  <p className="mt-2 font-mono text-xs font-semibold text-slate-500">{requestId}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <ProductLine
                  label="Product ID:"
                  value={product?.inventoryId || product?._id || '-'}
                  mono
                />
                <ProductLine
                  label="Auction:"
                  value={schedule.auctionId?.auctionId || schedule.auctionId?.title || '-'}
                  mono
                />
                <ProductLine label="Status:" value={<Badge value={schedule.status} />} />
              </div>

              <div className="my-5 h-px bg-slate-200" />

              <p className="text-xs font-semibold text-green-600">Winning Bid</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#052F6F]">
                {currencyFormatter.format(
                  auctionProduct?.soldPrice ?? auctionProduct?.highestBid?.amount ?? 0,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#C9D5E5] bg-white px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#0046B8]">
            Customer Details
          </p>

          <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
            <div>
              <div className="flex items-center gap-3">
                <CustomerAvatar
                  name={fullName(schedule.userId)}
                  imageUrl={schedule.userId?.image?.url}
                />
                <h3 className="min-w-0 truncate text-xl font-bold text-slate-950">
                  {fullName(schedule.userId)}
                </h3>
              </div>

              <div className="mt-5 space-y-3">
                <ContactLine
                  icon={<Mail className="h-5 w-5" />}
                  value={schedule.userId?.email || '-'}
                />
                <ContactLine
                  icon={<Phone className="h-5 w-5" />}
                  value={schedule.userId?.phone || 'No phone provided'}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#D8E1EF] bg-white px-4 py-4">
          <p className="text-base text-slate-500">Request Details</p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <DetailItem
              icon={<ReceiptText className="h-4 w-4" />}
              label="Auction Title"
              value={schedule.auctionId?.title || '-'}
            />
            <DetailItem
              icon={<Tag className="h-4 w-4" />}
              label="Starting Bid"
              value={currencyFormatter.format(auctionProduct?.startingBid ?? 0)}
            />
            <DetailItem
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment Status"
              value={<Badge value={auctionProduct?.paymentStatus} />}
            />
            <DetailItem
              icon={<Package className="h-4 w-4" />}
              label="Pickup Status"
              value={<Badge value={auctionProduct?.pickupStatus ?? schedule.status} />}
            />
            <DetailItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Pickup Date"
              value={formatDate(schedule.pickupDate)}
            />
            <DetailItem
              icon={<Clock3 className="h-4 w-4" />}
              label="Pickup Time"
              value={formatTime(schedule.pickupTime)}
            />
          </div>
        </section>
      </div>

      <div className="shrink-0 py-5">
        <PickupStatusActionBar
          currentStatus={schedule.status}
          selectedStatus={selectedStatus}
          isUpdating={isUpdating}
          onStatusChange={onStatusChange}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    </div>
  );
}

function ProductLine({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          mono ? 'truncate font-mono font-bold text-slate-950' : 'truncate font-bold text-slate-950'
        }
      >
        {value}
      </span>
    </div>
  );
}

function CustomerAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-sm font-bold text-white">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function ContactLine({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-sm text-slate-800">
      <span className="text-slate-700">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="mt-0.5 truncate font-semibold text-slate-950">{value}</div>
      </div>
    </div>
  );
}

function getProductImage(product?: NonNullable<PickupSchedule['auctionProductId']>['productId']) {
  if (!product) return undefined;
  const image = product.image;
  if (typeof image === 'string') return image;
  return product.images?.[0]?.url || image?.url || product.categoryImage?.url;
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CU'
  );
}
