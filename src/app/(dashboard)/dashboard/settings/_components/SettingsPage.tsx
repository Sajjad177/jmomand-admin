'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Copy, Check, Camera, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  isSuspend: boolean;
  isBlocked: boolean;
  hasDefaultPaymentMethod: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image?: {
    public_id: string;
    url: string;
  };
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface PlatformSettings {
  pickupGraceDays: number;
  storageFeePerDay: number;
  forfeitureDays: number;
  pickupInstructions?: string;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    pickupGraceDays: 7,
    storageFeePerDay: 0,
    forfeitureDays: 30,
    pickupInstructions: '',
  });

  // Fetch user profile
  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Please login again');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      return result.data as UserProfile;
    },
    enabled: !!token,
  });

  const settingsQuery = useQuery({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      if (!token) throw new Error('Please login again');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to fetch platform settings');
      }
      return result.data as PlatformSettings;
    },
    enabled: Boolean(token),
  });

  // Set form data when user data is loaded
  useEffect(() => {
    if (userData) {
      setPersonalInfo({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });

      // Reset image preview when user data loads
      if (userData.image?.url) {
        setImagePreview(userData.image.url);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (settingsQuery.data) setPlatformSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(userData?.image?.url || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle email copy function
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(personalInfo.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: async (formData: FormData) => {
      if (!token) {
        throw new Error('Please login again');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsEditing(false);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationKey: ['changePassword'],
    mutationFn: async (payload: ChangePasswordPayload) => {
      if (!token) {
        throw new Error('Please login again');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationKey: ['updatePlatformSettings'],
    mutationFn: async (payload: PlatformSettings) => {
      if (!token) throw new Error('Please login again');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to save platform settings');
      }
      return result;
    },
    onSuccess: async (result) => {
      toast.success(result.message || 'Platform settings saved successfully');
      await queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Handle profile update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('firstName', personalInfo.firstName);
    formData.append('lastName', personalInfo.lastName);
    formData.append('email', personalInfo.email);
    formData.append('phone', personalInfo.phone);

    // Append image if selected
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    updateProfileMutation.mutate(formData);
  };

  // Handle password change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5e1a] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-6 flex flex-col gap-5 container font-sans antialiased">
      {/* 1. Profile Header Card */}
      <Card className="bg-white border-[#eef2f6] py-3 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
              <AvatarImage
                src={
                  imagePreview ||
                  userData?.image?.url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                }
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback>
                {personalInfo.firstName?.charAt(0) || 'U'}
                {personalInfo.lastName?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#ff5e1a] hover:bg-[#e04f13] text-white rounded-full p-1.5 shadow-lg transition-colors"
                  title="Change profile picture"
                >
                  <Camera size={14} />
                </button>

                {selectedImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-colors"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-800">
                {personalInfo.firstName} {personalInfo.lastName}
              </h2>
              <Badge
                variant="secondary"
                className="bg-[#e2e8f0] text-slate-600 font-medium px-2.5 py-0.5 rounded-full text-xs"
              >
                {userData?.role || 'User'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span>{personalInfo.email}</span>
              <button
                onClick={handleCopyEmail}
                className="text-[#ff5e1a] hover:opacity-80 transition-opacity p-1 rounded focus:outline-none"
                title="Copy Email"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Personal Information Card */}
      <Card className="bg-white border-[#eef2f6] shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between py-3 items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
            <Button
              onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  // Reset image preview when entering edit mode
                  setImagePreview(userData?.image?.url || '');
                  setSelectedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
              className="bg-[#ff5e1a] hover:bg-[#e04f13] text-white font-medium px-4 py-2 flex items-center gap-2 rounded-lg transition-colors"
              disabled={updateProfileMutation.isPending}
            >
              <Pencil size={16} />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={personalInfo.firstName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full bg-white disabled:bg-white border-slate-200 disabled:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={personalInfo.lastName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full bg-white disabled:bg-white border-slate-200 disabled:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={personalInfo.email}
                  disabled={!isEditing}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  className="w-full bg-white disabled:bg-white border-slate-200 disabled:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                  required
                />
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-slate-800 mb-2">Phone</label>
                <Input
                  type="text"
                  value={personalInfo.phone}
                  disabled={!isEditing}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  className="w-full bg-white disabled:bg-white border-slate-200 disabled:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                />
              </div>

              {isEditing && selectedImage && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <Check size={16} />
                  <span>New image selected: {selectedImage.name}</span>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  className="bg-[#ff5e1a] hover:bg-[#e04f13] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 3. Change Password Card */}
      <Card className="bg-white border-[#eef2f6] py-4 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Change Password</h3>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border-slate-200 placeholder:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                  required
                />
              </div>
              <div>
                <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border-slate-200 placeholder:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                  required
                />
              </div>
              <div>
                <label className="block text-[15px] font-semibold text-slate-800 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-white border-slate-200 placeholder:text-slate-400 font-normal h-11 px-4 rounded-lg focus-visible:ring-[#ff5e1a]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-[#ff5e1a] hover:bg-[#e04f13] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#eef2f6] py-4 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Platform Pickup Settings</h3>
          {settingsQuery.isError ? (
            <p className="mb-5 text-sm text-red-600">Unable to load platform settings.</p>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (platformSettings.forfeitureDays <= platformSettings.pickupGraceDays) {
                toast.error('Forfeiture days must be greater than pickup grace days');
                return;
              }
              updateSettingsMutation.mutate(platformSettings);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {(
                [
                  ['pickupGraceDays', 'Pickup Grace Days'],
                  ['storageFeePerDay', 'Storage Fee Per Day ($)'],
                  ['forfeitureDays', 'Forfeiture Days'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                    {label}
                  </label>
                  <Input
                    type="number"
                    min={key === 'forfeitureDays' ? 1 : 0}
                    step={key === 'storageFeePerDay' ? '0.01' : '1'}
                    value={platformSettings[key]}
                    onChange={(event) =>
                      setPlatformSettings((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                    className="h-11 rounded-lg border-slate-200 focus-visible:ring-[#ff5e1a]"
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-[15px] font-semibold text-slate-800">
                Pickup Instructions
              </label>
              <textarea
                rows={4}
                value={platformSettings.pickupInstructions || ''}
                onChange={(event) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    pickupInstructions: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#ff5e1a] focus:ring-2 focus:ring-orange-500/20"
                placeholder="Instructions shown to customers when scheduling pickup"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={settingsQuery.isLoading || updateSettingsMutation.isPending}
                className="bg-[#ff5e1a] px-6 text-white hover:bg-[#e04f13]"
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Platform Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
