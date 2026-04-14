import { useEffect, useState } from "react";

import ProfileCard from "../components/ProfileCard.jsx";
import { getMe, syncMe, updateMe } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";

const ProfilePage = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");

  const loadProfile = async () => {
    try {
      const data = await getMe(token);
      setProfile(data);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const onSave = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        full_name: formData.get("full_name"),
        bio: formData.get("bio"),
        avatar_url: formData.get("avatar_url") || null,
        preferred_theme: formData.get("preferred_theme")
      };
      const data = await updateMe(token, payload);
      setProfile(data);
      setStatus("Profile updated");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const onSupabaseSync = async () => {
    try {
      const data = await syncMe(token);
      setStatus(data.synced ? "Synced to Supabase" : data.reason || "Not synced");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const testSupabaseRead = async () => {
    if (!supabase || !profile?.id) {
      setStatus("Supabase client not configured in frontend env");
      return;
    }
    const { error } = await supabase.from("profiles").select("id").eq("id", profile.id).limit(1);
    setStatus(error ? error.message : "Supabase read check passed");
  };

  if (!token) {
    return <p className="small">Sign in to edit your profile.</p>;
  }

  return (
    <section className="card grid two">
      <div>
        <h2>Profile</h2>
        <ProfileCard profile={profile} />
        {profile && (
          <form className="grid" onSubmit={onSave}>
            <input name="full_name" defaultValue={profile.full_name || ""} placeholder="Full name" />
            <textarea name="bio" defaultValue={profile.bio || ""} placeholder="Bio" />
            <input name="avatar_url" defaultValue={profile.avatar_url || ""} placeholder="Avatar URL" />
            <select name="preferred_theme" defaultValue={profile.preferred_theme || "light"}>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
            <button type="submit">Save profile</button>
          </form>
        )}
      </div>
      <div>
        <h2>Supabase Connectivity</h2>
        <p className="small">Sync your profile to Supabase and test a read using the frontend client.</p>
        <div className="grid">
          <button onClick={onSupabaseSync}>Sync Profile to Supabase</button>
          <button className="secondary" onClick={testSupabaseRead}>
            Test Supabase Read
          </button>
        </div>
      </div>
      {status && <p className="small">{status}</p>}
    </section>
  );
};

export default ProfilePage;
