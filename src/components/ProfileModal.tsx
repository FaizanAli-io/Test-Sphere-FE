"use client";

import { createPortal } from "react-dom";
import React, { useEffect } from "react";
import Image from "next/image";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import ProfileImageUpload from "./ProfileImageUpload";
import { X, Edit2, Save, CheckCircle, AlertCircle } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  role: string;
  email: string;
  verified: boolean;
  createdAt: string;
  profileImage?: string;
  cnic?: string;
}

interface ProfileModalProps {
  userProfile: UserProfile | null;
  loading: boolean;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}

export default function ProfileModal({
  userProfile,
  loading,
  onClose,
  onSaved,
}: ProfileModalProps) {
  const {
    // Form state
    name,
    setName,
    cnic,
    setCnic,
    profileImage,
    setProfileImage,

    // UI state
    editing,
    saving,
    msg,

    // Actions
    handleSave,
    handleCancel,
    toggleEditing,
  } = useProfileEditor(userProfile, onSaved);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="User profile"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-indigo-50 overflow-hidden transform transition-all duration-300 ease-out animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-white">
              {userProfile?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{userProfile?.name ?? "User"}</h3>
              <p className="text-sm font-medium text-indigo-600 capitalize">
                {userProfile?.role ?? "Member"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {msg?.type === "success" && (
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-100 shadow-sm animate-fadeIn">
                <CheckCircle className="w-4 h-4" /> {msg.text}
              </div>
            )}
            {msg?.type === "error" && (
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-100 shadow-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4" /> {msg.text}
              </div>
            )}

            <button
              onClick={toggleEditing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-indigo-200 active:bg-gray-100 transition-all"
              aria-pressed={editing}
              title={editing ? "Cancel edit" : "Edit profile"}
            >
              <Edit2 className="w-4 h-4 text-indigo-600" />
              <span className="text-gray-700">{editing ? "Cancel" : "Edit"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="px-6 py-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin border-4 border-indigo-200 border-t-indigo-600 w-12 h-12 rounded-full shadow-md" />
            </div>
          ) : (
            <>
              {/* Profile Preview */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-lg ring-4 ring-indigo-50 transform hover:scale-105 transition-transform duration-300">
                  {profileImage || userProfile?.profileImage ? (
                    <Image
                      src={(profileImage || userProfile?.profileImage) as string}
                      alt="avatar"
                      fill
                      className="object-cover"
                      onError={() => {
                        // Clear the profile image to show fallback
                        setProfileImage("");
                      }}
                    />
                  ) : (
                    <div className="text-2xl font-bold text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 w-full h-full flex items-center justify-center">
                      {userProfile?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
                    Name
                  </p>
                  <p className="text-base text-gray-900 font-semibold">{userProfile?.name}</p>

                  <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mt-4 mb-1">
                    CNIC
                  </p>
                  <p className="text-sm text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded-md border border-gray-100 inline-block">
                    {userProfile?.cnic || "Not set"}
                  </p>
                </div>
              </div>

              {/* Edit fields */}
              {editing && (
                <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                      Full name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 px-4 py-3 text-gray-700 bg-white transition-colors duration-200"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                      CNIC Number
                    </label>
                    <input
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 px-4 py-3 text-gray-700 bg-white transition-colors duration-200 font-mono"
                      placeholder="e.g., TCH123"
                    />
                  </div>

                  <ProfileImageUpload profileImage={profileImage} onImageChange={setProfileImage} />

                  <div className="flex items-center gap-4 justify-end pt-4">
                    <button
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium text-sm shadow-sm hover:bg-gray-50 hover:text-gray-800 transition-colors duration-200 active:bg-gray-100"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-medium text-sm shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {saving ? (
                        <svg className="w-4.5 h-4.5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="white"
                            strokeWidth="3"
                            strokeOpacity="0.2"
                            fill="none"
                          />
                          <path
                            d="M22 12a10 10 0 0 1-10 10"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      ) : (
                        <Save className="w-4.5 h-4.5" />
                      )}
                      <span>{saving ? "Saving..." : "Save changes"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* readonly details when not editing */}
              {!editing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-indigo-50 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                    <div className="flex items-center mb-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                      <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                        Email
                      </p>
                    </div>
                    <p className="text-base font-medium text-gray-800 break-all">
                      {userProfile?.email}
                    </p>
                    <div
                      className={`mt-2 px-2 py-0.5 rounded text-xs ${
                        userProfile?.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      } inline-flex items-center self-start`}
                    >
                      {userProfile?.verified ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" /> Not Verified
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-indigo-50 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                      <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                        Member since
                      </p>
                    </div>
                    <p className="text-base font-medium text-gray-800">
                      {userProfile
                        ? new Date(userProfile.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
