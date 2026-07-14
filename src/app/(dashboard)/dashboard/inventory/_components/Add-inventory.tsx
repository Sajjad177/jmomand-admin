"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Plus, X, UploadCloud, Bold, Italic, List, Link2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ListingType = "for_sale" | "for_auction";

type ProductResponse = {
  message?: string;
  success?: boolean;
};

type ImagePreview = {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

export default function AddInventory() {
  const imageInputId = useId();
  const categoryImageInputId = useId();
  const imagesRef = useRef<ImagePreview[]>([]);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Form States
  const [productName, setProductName] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [categoryImage, setCategoryImage] = useState<ImagePreview | null>(null);
  
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  
  // Conditionally Controlled States
  const [type, setType] = useState<ListingType>("for_sale");
  const [day, setDay] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reservePrice, setReservePrice] = useState("");

  // Multiple Colors Array State
  const [colors, setColors] = useState<string[]>([""]);

  // Multiple Images Array State
  const [images, setImages] = useState<ImagePreview[]>([]);

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
    setColors((prev) => [...prev, ""]);
  };

  const removeColorField = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    } else {
      setColors([""]); 
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

    e.target.value = "";
  };

  const removeCategoryImage = () => {
    if (categoryImage) {
      URL.revokeObjectURL(categoryImage.url);
      setCategoryImage(null);
    }
  };

  // Image Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    if (selectedFiles.length > 0) {
      const availableSlots = 5 - images.length;

      if (availableSlots <= 0) {
        alert("You can upload maximum 5 product images");
        e.target.value = "";
        return;
      }

      const previews = selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      })).slice(0, availableSlots);

      setImages((prev) => [...prev, ...previews]);

      if (selectedFiles.length > availableSlots) {
        alert("Only first 5 product images can be uploaded");
      }
    }

    e.target.value = "";
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

    if (nextType === "for_sale") {
      setDay("");
      setReservePrice("");
      return;
    }

    setPrice("");
    setQuantity("1");
  };

  const productMutation = useMutation({
    mutationKey: ["productMutation"],
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error("Please login again before creating a product");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = (await response.json().catch(() => ({}))) as ProductResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to create product");
      }

      return data;
    },
    onSuccess: (data) => {
      alert(data.message || "Product created successfully");
      setProductName("");
      setCondition("");
      setCategory("");
      setCategoryImage(null);
      setManufacturer("");
      setDescription("");
      setDetailDescription("");
      setType("for_sale");
      setDay("");
      setPrice("");
      setQuantity("1");
      setReservePrice("");
      setColors([""]);
      images.forEach((image) => URL.revokeObjectURL(image.url));
      setImages([]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!images.length) {
      toast.error("Please upload at least one product image");
      return;
    }

    if (!condition) {
      toast.error("Please select a product condition");
      return;
    }

    if (!categoryImage) {
      toast.error("Please upload a category image");
      return;
    }

    const formData = new FormData();
    formData.append("title", productName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("condition", condition);
    formData.append("type", type);
    
    // Append category image
    formData.append("categoryImage", categoryImage.file);

    colors
      .filter((color) => color.trim() !== "")
      .forEach((color) => formData.append("color", color.trim()));

    if (manufacturer.trim()) {
      formData.append("manufacturer", manufacturer.trim());
    }

    images.forEach((image) => {
      formData.append("images", image.file);
    });

    if (type === "for_sale") {
      formData.append("price", price);
      formData.append("quantity", quantity);
    } else {
      formData.append("day", day);
      formData.append("reservePrice", reservePrice);
    }

    productMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50/50  flex justify-center items-start">
      <div className=" w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-6 p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#004242] mb-2">
                Basic Information
              </h2>

              {/* Product Name */}
              <div className="space-y-2">
                <Label className="text-[#004242] text-xs font-medium">Product Name *</Label>
                <Input
                  placeholder="e.g. MacBook Pro 16"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="rounded-lg border-slate-200"
                  required
                />
              </div>

              {/* Condition & Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[#004242] text-xs font-medium">Condition *</Label>
                  <Select value={condition} onValueChange={setCondition} required>
                    <SelectTrigger className="rounded-lg w-full border-slate-200">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">                                       
                      <SelectItem value="new">New</SelectItem>                  
                      <SelectItem value="open_box">Open Box</SelectItem>               
                      <SelectItem value="like_new">Like New</SelectItem>                
                      <SelectItem value="used">Used</SelectItem>                
                      <SelectItem value="damaged">Damaged</SelectItem>   
                      <SelectItem value="for_parts">For Parts</SelectItem>                   
                    </SelectContent>                                                                      
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#004242] text-xs font-medium">Listing Type *</Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="rounded-lg w-full border-orange-200 bg-orange-50/10">
                      <SelectValue placeholder="Select Listing Type" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="for_sale">For Sale</SelectItem>
                      <SelectItem value="for_auction">Auction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category & Manufacturer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[#004242] text-xs font-medium">Category *</Label>
                  <Input
                    placeholder="e.g. Electronics, Gadgets"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded-lg border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#004242] text-xs font-medium">Manufacturer</Label>
                  <Input
                    placeholder="Enter Manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="rounded-lg border-slate-200"
                  />
                </div>
              </div>

              {/* Category Image Upload */}
              <div className="space-y-2">
                <Label className="text-[#004242] text-xs font-medium">Category Image *</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50/80 transition relative cursor-pointer group">
                  <input
                    id={categoryImageInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <label htmlFor={categoryImageInputId} className="flex flex-col items-center justify-center cursor-pointer w-full">
                    {categoryImage ? (
                      <div className="relative w-full">
                        <img 
                          src={categoryImage.url} 
                          alt={categoryImage.name} 
                          className="w-full h-32 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategoryImage();
                          }}
                          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-red-500 rounded-full p-1 shadow transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-slate-700">Click to upload category image</span>
                        <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Dynamic Conditional Pricing / Quantity Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {type === "for_sale" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[#004242] text-xs font-medium">Price ($) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="rounded-lg border-slate-200"
                        required={type === "for_sale"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#004242] text-xs font-medium">Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="Enter Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="rounded-lg border-slate-200"
                        required={type === "for_sale"}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-amber-700 text-xs font-bold">Auction Day *</Label>
                      <Input
                        placeholder="e.g. Monday"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="rounded-lg border-amber-300 focus-visible:ring-amber-400 bg-amber-50/10"
                        required={type === "for_auction"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-700 text-xs font-bold">Reserve Price ($) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter Minimum Reserve Auction Price"
                        value={reservePrice}
                        onChange={(e) => setReservePrice(e.target.value)}
                        className="rounded-lg border-amber-300 focus-visible:ring-amber-400 bg-amber-50/10"
                        required={type === "for_auction"}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Colors Multiple Array Input Field Setup */}
              <div className="space-y-2">
                <Label className="text-[#004242] text-xs font-medium">Colors</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter color name"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="rounded-lg border-slate-200 bg-white"
                      />
                      {(colors.length > 1 || color !== "") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-500 shrink-0"
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
                  className="mt-1.5 text-xs flex items-center gap-1 border-dashed border-slate-300 hover:border-[#004242] hover:text-[#004242]"
                  onClick={addColorField}
                >
                  <Plus className="w-3 h-3" /> Add Color
                </Button>
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label className="text-[#004242] text-xs font-medium">Short Description *</Label>
                <Textarea
                  placeholder="Describe condition details, variants..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] rounded-lg"
                  required
                />
              </div>
            </div>

            {/* PRODUCT IMAGES MULTIPLE ZONE */}
            <div className="space-y-4 p-6 rounded-2xl border border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#004242]">
                Product Images
              </h2>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50/80 transition relative cursor-pointer group">
                <input
                  id={imageInputId}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <label htmlFor={imageInputId} className="flex flex-col items-center justify-center cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">Click to upload multiple images</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                </label>
              </div>

              {/* Previews Row */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative aspect-square border border-slate-200 rounded-lg overflow-hidden group shadow-sm bg-white">
                      <img src={image.url} alt={image.name} className="w-full h-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 hover:text-red-500 rounded-full p-1 shadow transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DETAIL DESCRIPTION WITH EDIT BAR */}
            <div className="space-y-4 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[#004242] text-sm font-medium">Detail Description</h3>
                <span className="text-xs text-slate-400">Formatting options enabled</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-slate-400 transition">
                <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 p-2 text-slate-500">
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8"><Bold className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8"><Italic className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8"><List className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8"><Link2 className="w-4 h-4" /></Button>
                </div>
                <Textarea
                  placeholder="Enter deep custom details specification..."
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  className="border-0 focus-visible:ring-0 rounded-none min-h-[150px] resize-y"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={productMutation.isPending}
                className="w-full bg-[#004242] hover:bg-[#003333] text-white py-6 rounded-lg transition-colors font-semibold"
              >
                {productMutation.isPending ? "Publishing..." : "Publish Inventory Item"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: REAL-TIME ITEM PREVIEW */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6 h-fit space-y-6">
          <h3 className="font-bold text-slate-800 text-md">Live Preview</h3>
          
          {/* Category Image Preview */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400">Category Image</span>
            <div className="aspect-[4/3] bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center overflow-hidden p-2 relative">
              {categoryImage ? (
                <img src={categoryImage.url} alt={categoryImage.name} className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-slate-400">No category image</p>
              )}
            </div>
          </div>

          {/* Main Top Image Preview */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400">Product Images</span>
            <div className="aspect-[4/3] bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center overflow-hidden p-2 relative">
              {images.length > 0 ? (
                <img src={images[0].url} alt={images[0].name} className="w-full h-full object-contain" />
              ) : (
                <p className="text-xs text-slate-400">No images chosen</p>
              )}
            </div>
          </div>

          {/* Key Value Side Parameters View */}
          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Item Title</span>
              <span className="font-semibold text-slate-700 max-w-[160px] truncate">{productName || "-"}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Manufacturer</span>
              <span className="font-semibold text-slate-700">{manufacturer || "-"}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Colors Summary</span>
              <span className="font-semibold text-slate-700 max-w-[160px] truncate">
                {colors.filter(Boolean).join(", ") || "-"}
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Category</span>
              <span className="font-semibold text-slate-700">{category || "-"}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">Condition</span>
              <span className="font-semibold text-slate-700">{condition || "-"}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-slate-400">{type === "for_auction" ? "Reserve Price" : "Quantity"}</span>
              <span className="font-semibold text-slate-700">
                {type === "for_auction" ? (reservePrice ? `$${reservePrice}` : "-") : quantity}
              </span>
            </div>
            {type === "for_sale" && (
              <div className="flex justify-between pt-2 text-orange-600 font-semibold">
                <span>Listed Price</span>
                <span>{price ? `$${price}` : "-"}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}