/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UserDetailsModalProps {
    selectedId: string | null;
    onClose: () => void;
    isLoading: boolean;
    user: any;
}