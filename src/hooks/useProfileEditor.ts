"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./useApi";

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

export function useProfileEditor(
  userProfile: UserProfile | null,
  onSaved: (updated: UserProfile) => void,
) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [cnic, setCnic] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name ?? "");
      setCnic(userProfile.cnic ?? "");
      setProfileImage(userProfile.profileImage ?? "");
    }
  }, [userProfile]);

  const handleSave = useCallback(async () => {
    setMsg(null);
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        name: name || undefined,
        profileImage: profileImage || undefined,
        cnic: cnic || undefined,
      };
      const res = await api("/auth/me", {
        auth: true,
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to update");
        setMsg({ type: "error", text: text || "Failed to update profile" });
        return;
      }
      const updated = await res.json();
      setMsg({ type: "success", text: "Profile updated successfully" });
      setEditing(false);
      onSaved(updated);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout with cleanup
      timeoutRef.current = setTimeout(() => {
        setMsg(null);
        timeoutRef.current = null;
      }, 2500);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Network error while updating profile" });
    } finally {
      setSaving(false);
    }
  }, [name, cnic, profileImage, onSaved]);

  const handleCancel = useCallback(() => {
    // revert form to original
    setName(userProfile?.name ?? "");
    setCnic(userProfile?.cnic ?? "");
    setProfileImage(userProfile?.profileImage ?? "");
    setEditing(false);
    setMsg(null);
  }, [userProfile]);

  const toggleEditing = useCallback(() => {
    setEditing(!editing);
  }, [editing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
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
    setEditing,
  };
}
