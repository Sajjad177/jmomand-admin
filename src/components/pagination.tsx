import { Button } from "./ui/button";

export function Pager({
  page,
  totalPages,
  isFetching,
  onPage,
}: {
  page: number;
  totalPages: number;
  isFetching?: boolean;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#d7e2f2] px-4 py-3">
      <Button
        variant="outline"
        disabled={page === 1 || isFetching}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page === totalPages || isFetching}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
