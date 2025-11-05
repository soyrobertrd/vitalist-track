import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

type UserRole = "admin" | "moderator" | "user";

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserProfile();

  useEffect(() => {
    const fetchRole = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .single();

        if (error) {
          console.error("Error fetching role:", error);
          setRole("user"); // Default to user if no role found
        } else {
          setRole(data?.role as UserRole);
        }
      } catch (error) {
        console.error("Error:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [profile?.id]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isUser = role === "user";

  return { role, loading, isAdmin, isModerator, isUser };
};
