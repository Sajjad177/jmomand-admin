'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Category } from '../../features/admin-dashboard/types';
import {
  createCategory,
  getCategories,
  toggleCategory,
  updateCategory,
} from '../../features/admin-dashboard/api';
import { toast } from 'sonner';
import { Badge, formatDate, PageShell, SearchBox, TableState } from '../../lib/helper';
import { Button } from '../ui/button';
import Image from 'next/image';
import { Pager } from '../pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

export function CategoriesAdminPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => getCategories({ page, searchTerm: search.trim() }, token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!image) throw new Error('Category image is required');
      return createCategory({ name, image }, token);
    },
    onSuccess: async (result) => {
      toast.success(result.message || 'Category created');
      setCreateOpen(false);
      setName('');
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: () => updateCategory({ id: editing?._id || '', name, image }, token),
    onSuccess: async (result) => {
      toast.success(result.message || 'Category updated');
      setEditing(null);
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (categoryId: string) => toggleCategory(categoryId, token),
    onSuccess: async (result) => {
      toast.success(result.message || 'Category updated');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const meta = categoriesQuery.data?.meta;

  return (
    <PageShell
      title="Categories"
      count={meta?.total ?? 0}
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBox
            value={search}
            onChange={(value) => {
              setPage(1);
              setSearch(value);
            }}
            placeholder="Search categories..."
          />
          <Button
            className="bg-[#FF5A1F] hover:bg-[#e04e18]"
            onClick={() => {
              setCreateOpen(true);
              setName('');
              setImage(null);
            }}
          >
            Create Category
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-[#d7e2f2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="bg-[#E2EAF8] text-sm font-medium text-[#3A5B77]">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {categoriesQuery.isLoading ? (
                <TableState colSpan={5} label="Loading categories..." />
              ) : categoriesQuery.isError ? (
                <TableState colSpan={5} label="Unable to load categories." />
              ) : (categoriesQuery.data?.data ?? []).length === 0 ? (
                <TableState colSpan={5} label="No categories found." />
              ) : (
                (categoriesQuery.data?.data ?? []).map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.image?.url ? (
                          <Image
                            src={category.image.url}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-slate-100" />
                        )}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{category.totalProduct ?? 0}</td>
                    <td className="px-4 py-4">
                      <Badge value={category.isDeleted ? 'deleted' : 'active'} />
                    </td>
                    <td className="px-4 py-4">{formatDate(category.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(category);
                            setName(category.name);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(category._id)}
                        >
                          {category.isDeleted ? 'Restore' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager
          page={page}
          totalPages={Math.max(meta?.totalPage ?? 1, 1)}
          isFetching={categoriesQuery.isFetching}
          onPage={setPage}
        />
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
            <Button
              disabled={!name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
            <Button
              disabled={!name.trim() || !image || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="w-full bg-[#FF5A1F] hover:bg-[#e04e18]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
