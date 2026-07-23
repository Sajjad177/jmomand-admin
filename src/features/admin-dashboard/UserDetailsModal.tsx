import {
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, fullName } from '../../lib/helper';
import { UserDetailsModalProps } from '@/types/userTypes';
import type { LucideIcon } from 'lucide-react';

export function UserDetailsModal({ selectedId, onClose, isLoading, user }: UserDetailsModalProps) {
    const address = [user?.street, user?.location, user?.postalCode]
        .filter(Boolean)
        .join(', ');

    const name = fullName(user) || 'Unnamed User';

    return (
        <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md overflow-hidden p-0 sm:rounded-2xl">
                {/* Header Title */}
                <DialogHeader className="border-b border-slate-100 px-6 pt-5 pb-4">
                    <DialogTitle className="text-lg font-bold text-slate-900">
                        User Account Details
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Loading user profile...</span>
                    </div>
                ) : !user ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                        No user details found.
                    </div>
                ) : (
                    <div className="space-y-6 pb-6">
                        {/* Profile Overview Header / Banner */}
                        <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-2 pb-4 text-center">
                            <div className="relative mx-auto h-20 w-20">
                                {user?.image?.url ? (
                                    <img
                                        src={user.image.url}
                                        alt={name}
                                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 text-xl ring-4 ring-white shadow-md">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {/* Verification Badge Icon */}
                                {user?.isVerified && (
                                    <div className="absolute bottom-0 right-0 rounded-full bg-white p-0.5 shadow-sm" title="Verified User">
                                        <CheckCircle2 className="h-5 w-5 fill-emerald-500 text-white" />
                                    </div>
                                )}
                            </div>

                            <h3 className="mt-3 text-lg font-semibold text-slate-900">{name}</h3>
                            <p className="text-xs text-slate-500">{user?.email || '-'}</p>

                            {/* Status Pill Badges */}
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 capitalize">
                                    {user?.role || 'user'}
                                </span>

                                <StatusPill isBlocked={user?.isBlocked} isSuspend={user?.isSuspend} />
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="space-y-3 px-6 text-sm">
                            <InfoRow
                                icon={Mail}
                                label="Email Address"
                                value={user?.email}
                            />

                            <InfoRow
                                icon={Phone}
                                label="Phone Number"
                                value={user?.phone || 'Not provided'}
                            />

                            <InfoRow
                                icon={MapPin}
                                label="Address"
                                value={address || 'No address specified'}
                            />

                            <InfoRow
                                icon={CreditCard}
                                label="Default Payment"
                                value={
                                    user?.hasDefaultPaymentMethod ? (
                                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 font-medium text-slate-400">
                                            <XCircle className="h-3.5 w-3.5" /> Not saved
                                        </span>
                                    )
                                }
                            />

                            <InfoRow
                                icon={Calendar}
                                label="Member Since"
                                value={formatDate(user?.createdAt)}
                            />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------------------------------------------------------- */
/*                            HELPER SUB-COMPONENTS                           */
/* -------------------------------------------------------------------------- */

// Information Single Row Component
function InfoRow({
    icon: Icon,
    label,
    value
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center gap-2.5 text-slate-500">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{label}</span>
            </div>
            <div className="text-right text-xs font-semibold text-slate-900">
                {value || '-'}
            </div>
        </div>
    );
}

// Account Status Pill Helper
function StatusPill({ isBlocked, isSuspend }: { isBlocked?: boolean; isSuspend?: boolean }) {
    if (isBlocked) {
        return (
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                Blocked
            </span>
        );
    }

    if (isSuspend) {
        return (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Suspended
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Active
        </span>
    );
}
