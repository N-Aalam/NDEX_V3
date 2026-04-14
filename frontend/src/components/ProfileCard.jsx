const ProfileCard = ({ profile }) => (
  <div className="card">
    <div className="section-title">
      <h2>User Profile</h2>
      <span className="badge">Enhanced</span>
    </div>
    {!profile ? (
      <p className="small">No profile loaded yet.</p>
    ) : (
      <div className="grid two">
        <div>
          <strong>{profile.full_name || profile.email}</strong>
          <div className="small">{profile.email}</div>
          <div className="small">Theme: {profile.preferred_theme}</div>
        </div>
        <div>
          <strong>Last login</strong>
          <div className="small">
            {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "No login history"}
          </div>
          <div className="small">Joined: {new Date(profile.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    )}
  </div>
);

export default ProfileCard;
