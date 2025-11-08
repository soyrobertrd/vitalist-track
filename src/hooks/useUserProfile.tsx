import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  avatar_url: string | null;
  telefono: string | null;
  especialidad: string | null;
  rol: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

      // Get profile (without .single() to avoid error when no profile exists)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setLoading(false);
        return;
      }

      // If no profile exists, return
      if (!profileData || profileData.length === 0) {
        console.error("No profile found for user");
        setLoading(false);
        return;
      }

      const profile = profileData[0];

        // Get role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

      if (profile) {
        setProfile({
          ...profile,
          rol: roleData?.role || "medico"
        });
      }
      } catch (error) {
        console.error("Error in loadProfile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'rol'>>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("No user") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  return { profile, loading, updateProfile };
}