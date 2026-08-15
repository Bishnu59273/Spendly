import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users } from "lucide-react";
import { useInvitePreview, useJoinGroup } from "../api/groups.js";
import Spinner from "../components/Spinner.jsx";

export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: preview, isLoading, isError } = useInvitePreview(code);
  const join = useJoinGroup();
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    try {
      const group = await join.mutateAsync(code);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      if (!navigator.onLine) {
        setError(
          "You're offline. Joining a group needs an internet connection - try again once you're back online.",
        );
      } else {
        setError(err.response?.data?.error || "Couldn't join this group");
      }
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}
      >
        <Spinner />
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div
        className="sp-card sp-card-pad"
        style={{
          textAlign: "center",
          padding: "48px 24px",
          maxWidth: 420,
          margin: "40px auto",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          Invite not found
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18 }}>
          This invite code may be wrong or may have been regenerated.
        </div>
        <Link to="/groups" className="sp-btn sp-btn-primary">
          Go to your groups
        </Link>
      </div>
    );
  }

  return (
    <div
      className="sp-card sp-card-pad"
      style={{
        textAlign: "center",
        padding: "48px 24px",
        maxWidth: 420,
        margin: "40px auto",
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          fontSize: 26,
          background: `${preview.color}22`,
          margin: "0 auto 16px",
        }}
      >
        {preview.icon}
      </span>
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          color: "var(--ink)",
          marginBottom: 4,
        }}
      >
        {preview.name}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Users style={{ width: 14, height: 14 }} /> {preview.memberCount} member
        {preview.memberCount !== 1 ? "s" : ""}
      </div>

      {preview.alreadyMember ? (
        <button
          className="sp-btn sp-btn-primary"
          onClick={() => navigate(`/groups/${preview.id}`)}
        >
          Go to group
        </button>
      ) : (
        <button
          className="sp-btn sp-btn-primary"
          onClick={handleJoin}
          disabled={join.isPending}
        >
          {join.isPending ? "Joining…" : "Join group"}
        </button>
      )}

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--neg)",
            background: "color-mix(in srgb, var(--neg) 10%, transparent)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            marginTop: 14,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
