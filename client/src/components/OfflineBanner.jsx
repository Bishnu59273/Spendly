import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
      background: "#92400e",
      color: "#fef3c7",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "8px 16px", fontSize: 13, fontWeight: 600,
    }}>
      <WifiOff size={15} />
      You're offline — showing cached data
    </div>
  );
}
