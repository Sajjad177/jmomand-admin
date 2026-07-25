'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Plus, X, UploadCloud, Sparkles, ImageIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import AddInventoryRightSide from './AddInventoryRightSide';
import {
  Category,
  ImagePreview,
  ListingType,
  ProductDetails,
  ProductResponse,
} from '../../../../../types/AuctionType';

type ProductDetailsResponse = { success: boolean; message?: string; data: ProductDetails };
type CategoriesResponse = { success: boolean; message?: string; data: Category[] };

export default function AddInventory({ productId }: { productId?: string }) {
  const imageInputId = useId();
  const categoryImageInputId = useId();
  const imagesRef = useRef<ImagePreview[]>([]);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEditing = Boolean(productId);

  // Form States
  const [productName, setProductName] = useState('');
  const [condition, setCondition] = useState('');
  const [category, setCategory] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [categoryImage, setCategoryImage] = useState<ImagePreview | null>(null);
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');

  const [type, setType] = useState<ListingType>('for_sale');
  const [day, setDay] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reservePrice, setReservePrice] = useState('');
  const [colors, setColors] = useState<string[]>(['']);
  const [images, setImages] = useState<ImagePreview[]>([]);

  const { data: categoriesResponse } = useQuery<CategoriesResponse>({
    queryKey: ['productCategories'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/categories`);
      const data = (await response.json().catch(() => ({}))) as CategoriesResponse;
      if (!response.ok || data.success === false)
        throw new Error(data.message || 'Failed to fetch categories');
      return data;
    },
  });

  const { data: productResponse, isLoading: isProductLoading } = useQuery<ProductDetailsResponse>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`);
      const data = (await response.json().catch(() => ({}))) as ProductDetailsResponse;
      if (!response.ok || data.success === false)
        throw new Error(data.message || 'Failed to fetch product');
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    const product = productResponse?.data;
    if (!product) return;

    setProductName(product.title || '');
    setDescription(product.description || '');
    setCategory(product.category || '');
    setCondition(product.condition || '');
    setType(product.type || 'for_sale');
    setManufacturer(product.manufacturer || '');
    setColors(product.color?.length ? product.color : ['']);
    setPrice(product.price?.toString() || '');
    setQuantity(product.quantity?.toString() || '1');
    setDay(product.day || '');
    setReservePrice(product.reservePrice?.toString() || '');
    setImages(
      (product.images || []).map((image) => ({
        id: image.public_id,
        url: image.url,
        name: 'Existing product image',
        size: 0,
        type: 'image/*',
      })),
    );
    if (product.categoryImage) {
      setCategoryImage({
        id: product.categoryImage.public_id,
        url: product.categoryImage.url,
        name: 'Existing category image',
        size: 0,
        type: 'image/*',
      });
    }
  }, [productResponse]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
      if (categoryImage) {
        URL.revokeObjectURL(categoryImage.url);
      }
    };
  }, [categoryImage]);

  // Color Array handlers
  const handleColorChange = (index: number, value: string) => {
    const updatedColors = [...colors];
    updatedColors[index] = value;
    setColors(updatedColors);
  };

  const addColorField = () => {
    setColors((prev) => [...prev, '']);
  };

  const removeColorField = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    } else {
      setColors(['']);
    }
  };

  // Category Image Upload Handler
  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Clean up previous category image if exists
      if (categoryImage) {
        URL.revokeObjectURL(categoryImage.url);
      }

      const preview: ImagePreview = {
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      };

      setCategoryImage(preview);
    }

    e.target.value = '';
  };

  const removeCategoryImage = () => {
    if (categoryImage) {
      URL.revokeObjectURL(categoryImage.url);
      setCategoryImage(null);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new_category__') {
      setIsCreatingNewCategory(true);
      setCategory('');
      setCategoryImage(null);
      return;
    }

    const selectedCategory = categoriesResponse?.data.find((item) => item.category === value);
    setIsCreatingNewCategory(false);
    setCategory(value);

    if (selectedCategory?.categoryImage) {
      setCategoryImage({
        id: selectedCategory.categoryImage.public_id,
        url: selectedCategory.categoryImage.url,
        name: `${value} category image`,
        size: 0,
        type: 'image/*',
      });
    } else {
      setCategoryImage(null);
    }
  };

  // Image Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    if (selectedFiles.length > 0) {
      // Updating with files replaces the backend's current image set, so show
      // only the replacement selection instead of mixing it with old previews.
      const availableSlots = isEditing ? 5 : 5 - images.length;

      if (availableSlots <= 0) {
        alert('You can upload maximum 5 product images');
        e.target.value = '';
        return;
      }

      const previews = selectedFiles
        .map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        }))
        .slice(0, availableSlots);

      setImages((prev) => (isEditing ? previews : [...prev, ...previews]));

      if (selectedFiles.length > availableSlots) {
        alert('Only first 5 product images can be uploaded');
      }
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTypeChange = (value: string) => {
    const nextType = value as ListingType;

    setType(nextType);

    if (nextType === 'for_sale') {
      setDay('');
      setReservePrice('');
      return;
    }

    setPrice('');
    setQuantity('1');
  };

  const productMutation = useMutation({
    mutationKey: ['productMutation'],
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error(
          `Please login again before ${isEditing ? 'updating' : 'creating'} a product`,
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products${isEditing ? `/${productId}` : ''}`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = (await response.json().catch(() => ({}))) as ProductResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || `Product ${isEditing ? 'updated' : 'created'} successfully`);
      setProductName('');
      setCondition('');
      setCategory('');
      setCategoryImage(null);
      setManufacturer('');
      setDescription('');
      setType('for_sale');
      setDay('');
      setPrice('');
      setQuantity('1');
      setReservePrice('');
      setColors(['']);
      images.forEach((image) => URL.revokeObjectURL(image.url));
      setImages([]);
      await queryClient.invalidateQueries({ queryKey: ['inventoryData'] });
      await queryClient.invalidateQueries({ queryKey: ['auctionData'] });
      router.push('/dashboard/inventory');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category.trim()) {
      toast.error('Please select or enter a category');
      return;
    }

    if (!images.length) {
      toast.error('Please upload at least one product image');
      return;
    }

    if (!condition) {
      toast.error('Please select a product condition');
      return;
    }

    const formData = new FormData();
    formData.append('title', productName);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('condition', condition);
    formData.append('type', type);

    // The update API only accepts product images. New products can optionally
    // include a category image; selected existing categories supply theirs server-side.
    if (!isEditing && categoryImage?.file) formData.append('categoryImage', categoryImage.file);

    colors
      .filter((color) => color.trim() !== '')
      .forEach((color) => formData.append('color', color.trim()));

    if (manufacturer.trim()) {
      formData.append('manufacturer', manufacturer.trim());
    }

    images.forEach((image) => {
      if (image.file) formData.append('images', image.file);
    });

    if (type === 'for_sale') {
      formData.append('price', price);
      formData.append('quantity', quantity);
    } else {
      formData.append('day', day);
      formData.append('reservePrice', reservePrice);
    }

    productMutation.mutate(formData);
  };

  if (isEditing && isProductLoading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center text-sm text-slate-500">
        Loading inventory item...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-start antialiased text-slate-800">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: BASIC DETAILS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="p-2 bg-emerald-50 text-[#004242] rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#004242]">
                  Basic Information
                </h2>
              </div>

              <div className="space-y-6">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                    Product Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. MacBook Pro 16 M3 Max"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] transition-all text-sm"
                    required
                  />
                </div>

                {/* Condition & Type Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                      Condition <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={condition} onValueChange={setCondition} required>
                      <SelectTrigger className="h-11 rounded-lg w-full border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-[#004242]/20 focus:border-[#004242] text-sm">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] max-h-60 rounded-xl shadow-lg border-slate-200">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="open_box">Open Box</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="for_parts">For Parts</SelectItem>
                        <SelectItem value="brand_new">Brand New</SelectItem>
                        <SelectItem value="like_new_open_box">Like New Open Box</SelectItem>
                        <SelectItem value="scratch_and_dent">Scratch &amp; Dent</SelectItem>
                        <SelectItem value="salvage">Salvage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                      Listing Type <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={handleTypeChange}>
                      <SelectTrigger className="h-11 rounded-lg w-full border-amber-200/80 bg-amber-50/20 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm">
                        <SelectValue placeholder="Select Listing Type" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] rounded-xl shadow-lg border-slate-200">
                        <SelectItem value="for_sale">Fixed Price (For Sale)</SelectItem>
                        <SelectItem value="for_auction">Auction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category & Manufacturer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                      Category <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={isCreatingNewCategory ? '__new_category__' : category || undefined}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-11 rounded-lg w-full border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-[#004242]/20 focus:border-[#004242] text-sm">
                        <SelectValue placeholder="Select an existing category" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] max-h-60 rounded-xl shadow-lg border-slate-200">
                        {(categoriesResponse?.data || []).map((item) => (
                          <SelectItem key={item.category} value={item.category}>
                            {item.category}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="__new_category__"
                          className="text-[#004242] font-semibold"
                        >
                          + Create new category
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {isCreatingNewCategory && (
                      <Input
                        placeholder="Enter new category name"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="h-11 mt-2 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm"
                        required
                      />
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      Select a category to use its saved image or create a new one below.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                      Manufacturer
                    </Label>
                    <Input
                      placeholder="e.g. Apple, Sony, Dell"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      className="h-11 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm"
                    />
                  </div>
                </div>

                {/* Dynamic Conditional Pricing / Quantity Fields */}
                <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {type === 'for_sale' ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                          Price ($) <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm"
                          required={type === 'for_sale'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                          Quantity <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="h-11 rounded-lg border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm"
                          required={type === 'for_sale'}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-amber-800 text-xs font-semibold uppercase tracking-wide">
                          Auction Day <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. Monday"
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className="h-11 rounded-lg border-amber-200 bg-white focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 text-sm"
                          required={type === 'for_auction'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-amber-800 text-xs font-semibold uppercase tracking-wide">
                          Reserve Price ($) <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={reservePrice}
                          onChange={(e) => setReservePrice(e.target.value)}
                          className="h-11 rounded-lg border-amber-200 bg-white focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 text-sm"
                          required={type === 'for_auction'}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Colors Multiple Array Input Field Setup */}
                <div className="space-y-2">
                  <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                    Available Colors
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. Space Gray"
                          value={color}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="h-10 rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm"
                        />
                        {(colors.length > 1 || color !== '') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                            onClick={() => removeColorField(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs font-medium border-dashed border-slate-300 text-slate-600 hover:border-[#004242] hover:text-[#004242] hover:bg-emerald-50/30 rounded-lg transition-colors"
                    onClick={addColorField}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Color Variant
                  </Button>
                </div>

                {/* Category Image Upload */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                    Category Image
                  </Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-[#004242]/50 rounded-xl p-4 transition-all duration-200 bg-slate-50/30 hover:bg-slate-50/80 relative group">
                    <input
                      id={categoryImageInputId}
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {categoryImage ? (
                      <div className="relative w-full flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
                        <img
                          src={categoryImage.url}
                          alt={categoryImage.name}
                          className="w-full h-28 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategoryImage();
                          }}
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-rose-600 rounded-full p-1.5 shadow-sm transition hover:scale-105 z-20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="p-3 bg-white rounded-full border border-slate-100 shadow-sm mb-2 group-hover:scale-110 transition-transform duration-200">
                          <UploadCloud className="w-5 h-5 text-[#004242]" />
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          Upload Category Graphic
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          PNG, JPG up to 10MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 text-xs font-semibold uppercase tracking-wide">
                    Short Description <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Describe condition details, key features, included accessories..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[110px] rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#004242]/20 focus-visible:border-[#004242] text-sm resize-y"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRODUCT IMAGES MULTIPLE ZONE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <span className="p-2 bg-emerald-50 text-[#004242] rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#004242]">
                  Product Media Gallery
                </h2>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-[#004242]/50 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-slate-50/80 transition-all duration-200 relative group cursor-pointer">
                <input
                  id={imageInputId}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="p-3 bg-white rounded-full border border-slate-100 shadow-sm mb-3 group-hover:scale-110 transition-transform duration-200">
                  <UploadCloud className="w-6 h-6 text-[#004242]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  Click to upload product photos
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Upload up to 10 high-resolution images (PNG, JPG)
                </span>
              </div>

              {/* Previews Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-5">
                  {images.map((image, index) => (
                    <div
                      key={image.id || index}
                      className="relative aspect-square border border-slate-200/80 rounded-xl overflow-hidden group shadow-sm bg-white"
                    >
                      <img
                        src={image.url}
                        alt={image.name || 'Product Image'}
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-rose-600 rounded-full p-1 shadow-sm transition hover:scale-110 z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT ACTION */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={productMutation.isPending}
                className="w-full bg-[#004242] hover:bg-[#002f2f] active:bg-[#002323] text-white py-6 rounded-xl font-semibold shadow-md shadow-[#004242]/10 transition-all duration-200 text-base"
              >
                {productMutation.isPending
                  ? isEditing
                    ? 'Saving Changes...'
                    : 'Publishing Listing...'
                  : isEditing
                    ? 'Save Inventory Item'
                    : 'Publish Inventory Item'}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: REAL-TIME ITEM PREVIEW */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <AddInventoryRightSide
            categoryImage={categoryImage}
            images={images}
            productName={productName}
            manufacturer={manufacturer}
            colors={colors}
            category={category}
            condition={condition}
            type={type}
            reservePrice={reservePrice}
            quantity={quantity}
            price={price}
          />
        </div>
      </div>
    </div>
  );
}
