import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Moon,
  Sun,
  Save,
  Wallet,
  X,
  Download,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Share2,
  Bell,
  BellOff,
} from "lucide-react";
import { useUpdateProfile, useChangePassword } from "../api/auth.js";
import {
  formatCurrency,
  CURRENCIES,
  getCurrencySymbol,
} from "../utils/format.js";
import { useDarkMode } from "../hooks/useDarkMode.js";
import {
  useVapidPublicKey,
  useSubscribePush,
  useUnsubscribePush,
} from "../api/push.js";
import {
  isPushSupported,
  getPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "../utils/push.js";

const inp = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--line)",
  background: "var(--surface-2)",
  color: "var(--ink)",
  fontSize: 14,
  outline: "none",
};
const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 7,
};

export default function Settings({ user }) {
  const update = useUpdateProfile();
  const changePw = useChangePassword();
  const [form, setForm] = useState({
    name: user.name,
    salaryDay: user.salaryDay,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget?.toString() || "",
    upiId: user.upiId || "",
  });
  const [darkMode, toggleDark] = useDarkMode();
  const isDefaultBudget = user.useDefaultBudget ?? true;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [installed, setInstalled] = useState(false);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const canInstall = !isStandalone && (!!window.__pwaPrompt || isIOS);

  const [pushStatus, setPushStatus] = useState("loading");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const { data: vapidKey } = useVapidPublicKey();
  const subscribePush = useSubscribePush();
  const unsubscribePush = useUnsubscribePush();

  useEffect(() => {
    getPushStatus()
      .then(setPushStatus)
      .catch(() => setPushStatus("unsupported"));
  }, []);

  const notificationsCardRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightPush, setHighlightPush] = useState(false);

  useEffect(() => {
    if (searchParams.get("highlight") !== "push") return;
    notificationsCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setHighlightPush(true);
    setSearchParams({}, { replace: true });
    const t = setTimeout(() => setHighlightPush(false), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePush = async () => {
    setPushError("");
    setPushBusy(true);
    try {
      if (pushStatus === "subscribed") {
        const endpoint = await unsubscribeFromPush();
        if (endpoint) await unsubscribePush.mutateAsync(endpoint);
        setPushStatus("unsubscribed");
      } else {
        if (!vapidKey)
          throw new Error("Could not load push configuration. Try again.");
        const subscription = await subscribeToPush(vapidKey);
        await subscribePush.mutateAsync(subscription);
        setPushStatus("subscribed");
      }
    } catch (err) {
      setPushError(err.message || "Something went wrong.");
      getPushStatus().then(setPushStatus);
    } finally {
      setPushBusy(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await update.mutateAsync({
        name: form.name,
        salaryDay: parseInt(form.salaryDay),
        currency: form.currency,
        monthlyBudget: form.monthlyBudget
          ? parseFloat(form.monthlyBudget)
          : null,
        upiId: form.upiId || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    try {
      await changePw.mutateAsync({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSaved(true);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <div className="sp-grid-halves">
      {/* Left — Profile form */}
      <form
        onSubmit={handleSubmit}
        data-tour="settings-profile"
        className="sp-card sp-card-pad"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div className="sp-card-head" style={{ padding: 0 }}>
          <div>
            <div className="sp-card-title">Profile</div>
            <div className="sp-card-sub">
              Update your name, cycle day, currency, and budget
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              fontSize: 13,
              color: "var(--neg)",
              background: "color-mix(in srgb, var(--neg) 10%, transparent)",
              borderRadius: "var(--r-sm)",
              padding: "10px 14px",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label style={lbl}>Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            style={inp}
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <label style={lbl}>Budget Start Day</label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={form.salaryDay}
              onChange={(e) => set("salaryDay", e.target.value)}
              style={inp}
            />
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
              Day 1–31. Auto-caps if the month is shorter.
            </div>
          </div>
          <div>
            <label style={lbl}>Currency</label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              style={{ ...inp, cursor: "pointer" }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {getCurrencySymbol(c)} {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Monthly Budget</label>
          <div style={{ position: "relative" }}>
            <Wallet
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
                pointerEvents: "none",
              }}
            />
            <input
              type="number"
              min="0"
              step="1"
              value={form.monthlyBudget}
              onChange={(e) => set("monthlyBudget", e.target.value)}
              placeholder="e.g. 30000"
              style={{
                ...inp,
                paddingLeft: 40,
                paddingRight: form.monthlyBudget ? 40 : 14,
              }}
            />
            {form.monthlyBudget && (
              <button
                type="button"
                onClick={() => set("monthlyBudget", "")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-3)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
            Your total spending limit per cycle. Shows as "Remaining Budget" on
            the dashboard.
            {user.monthlyBudget && (
              <span
                style={{
                  marginLeft: 6,
                  color: "var(--brand)",
                  fontWeight: 600,
                }}
              >
                Current: {formatCurrency(user.monthlyBudget, form.currency)}
              </span>
            )}
          </div>
        </div>

        <div>
          <label style={lbl}>UPI ID</label>
          <input
            type="text"
            value={form.upiId}
            onChange={(e) => set("upiId", e.target.value)}
            placeholder="yourname@bank"
            style={inp}
          />
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
            Shown to group members so they can pay you directly via UPI when settling up.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              Use this budget every month
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
              {isDefaultBudget
                ? "Applied automatically to every cycle."
                : "You'll be asked to set a budget each time a new cycle starts."}
            </div>
          </div>
          <button
            type="button"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({ useDefaultBudget: !isDefaultBudget })
            }
            style={{
              position: "relative",
              width: 52,
              height: 30,
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              background: isDefaultBudget ? "var(--brand)" : "var(--line)",
              transition: "background var(--d1) var(--e)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: isDefaultBudget ? 25 : 3,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--surface)",
                transition: "left var(--d1) var(--e)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
              }}
            />
          </button>
        </div>

        {form.monthlyBudget && (
          <div
            style={{
              borderRadius: "var(--r-sm)",
              background: "var(--brand-soft)",
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: 13, color: "var(--brand)", fontWeight: 500 }}
            >
              Monthly Budget
            </span>
            <span
              className="sp-num"
              style={{ fontSize: 18, fontWeight: 700, color: "var(--brand)" }}
            >
              {formatCurrency(
                parseFloat(form.monthlyBudget) || 0,
                form.currency,
              )}
            </span>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={update.isPending}
            className="sp-btn sp-btn-primary"
            style={{ gap: 8 }}
          >
            <Save size={15} />
            {saved ? "Saved!" : update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Appearance */}
        <div className="sp-card sp-card-pad">
          <div
            className="sp-card-head"
            style={{ padding: 0, marginBottom: 18 }}
          >
            <div className="sp-card-title">Appearance</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}
              >
                Dark mode
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}
              >
                Switch between light and dark theme
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              style={{
                position: "relative",
                width: 52,
                height: 30,
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                background: darkMode ? "var(--brand)" : "var(--line)",
                transition: "background var(--d1) var(--e)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: darkMode ? 25 : 3,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--surface)",
                  display: "grid",
                  placeItems: "center",
                  transition: "left var(--d1) var(--e)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                }}
              >
                {darkMode ? (
                  <Moon size={11} style={{ color: "var(--brand)" }} />
                ) : (
                  <Sun size={11} style={{ color: "#f59e0b" }} />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {pushStatus !== "unsupported" && (
          <div
            ref={notificationsCardRef}
            className="sp-card sp-card-pad"
            style={{
              transition: "box-shadow 300ms ease",
              ...(highlightPush && {
                boxShadow: "0 0 0 3px var(--brand), var(--sh-lg)",
              }),
            }}
          >
            <div
              className="sp-card-head"
              style={{ padding: 0, marginBottom: 18 }}
            >
              <div className="sp-card-title">Notifications</div>
            </div>
            {pushStatus === "denied" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BellOff
                  size={18}
                  style={{ color: "var(--ink-3)", flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    Notifications blocked
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    Enable notifications for Spendly in your browser or device
                    settings to turn this on.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      Push notifications
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-3)",
                        marginTop: 3,
                      }}
                    >
                      Get notified on this device when there's a new update on
                      Spendly
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={pushBusy || pushStatus === "loading"}
                    onClick={handleTogglePush}
                    style={{
                      position: "relative",
                      width: 52,
                      height: 30,
                      borderRadius: 99,
                      border: "none",
                      cursor: "pointer",
                      background:
                        pushStatus === "subscribed"
                          ? "var(--brand)"
                          : "var(--line)",
                      transition: "background var(--d1) var(--e)",
                      flexShrink: 0,
                      opacity: pushBusy || pushStatus === "loading" ? 0.6 : 1,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: pushStatus === "subscribed" ? 25 : 3,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                        transition: "left var(--d1) var(--e)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                      }}
                    >
                      {pushStatus === "subscribed" ? (
                        <Bell size={11} style={{ color: "var(--brand)" }} />
                      ) : (
                        <BellOff size={11} style={{ color: "var(--ink-3)" }} />
                      )}
                    </span>
                  </button>
                </div>
                {pushError && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--neg)",
                      marginTop: 10,
                    }}
                  >
                    {pushError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Account */}
        <div className="sp-card sp-card-pad">
          <div
            className="sp-card-head"
            style={{ padding: 0, marginBottom: 18 }}
          >
            <div className="sp-card-title">Account</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="sp-avatar"
              style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
              >
                {user.name}
              </div>
              <div
                style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}
              >
                {user.email}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}
              >
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <form
          onSubmit={handleChangePw}
          className="sp-card sp-card-pad"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="sp-card-head" style={{ padding: 0, marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={15} style={{ color: "var(--ink-3)" }} />
              <div className="sp-card-title">Change Password</div>
            </div>
          </div>

          {pwError && (
            <div
              style={{
                fontSize: 13,
                color: "var(--neg)",
                background: "color-mix(in srgb, var(--neg) 10%, transparent)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
              }}
            >
              {pwError}
            </div>
          )}
          {pwSaved && (
            <div
              style={{
                fontSize: 13,
                color: "var(--brand)",
                background: "var(--brand-soft)",
                borderRadius: "var(--r-sm)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={14} /> Password changed successfully
            </div>
          )}

          {[
            {
              key: "current",
              label: "Current Password",
              field: "currentPassword",
            },
            { key: "next", label: "New Password", field: "newPassword" },
            { key: "confirm", label: "Confirm New Password", field: "confirm" },
          ].map(({ key, label, field }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw[key] ? "text" : "password"}
                  required
                  value={pwForm[field]}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  style={{ ...inp, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-3)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={changePw.isPending}
            className="sp-btn sp-btn-primary"
            style={{ gap: 8 }}
          >
            <Lock size={14} />
            {changePw.isPending ? "Saving…" : "Update Password"}
          </button>
        </form>

        {/* Install app */}
        {(canInstall || isStandalone) && (
          <div className="sp-card sp-card-pad">
            <div
              className="sp-card-head"
              style={{ padding: 0, marginBottom: 18 }}
            >
              <div className="sp-card-title">Install App</div>
            </div>
            {isStandalone || installed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle
                  size={18}
                  style={{ color: "var(--brand)", flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    App installed
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    Spendly is running as an installed app
                  </div>
                </div>
              </div>
            ) : isIOS ? (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    marginBottom: 12,
                  }}
                >
                  Add to home screen
                </div>
                {[
                  {
                    icon: <Share2 size={15} />,
                    text: "Tap the Share button at the bottom of Safari",
                  },
                  {
                    icon: <Download size={15} />,
                    text: 'Select "Add to Home Screen"',
                  },
                  {
                    icon: <CheckCircle size={15} />,
                    text: 'Tap "Add" to confirm',
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "var(--brand-soft)",
                        color: "var(--brand)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {step.icon}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                      {step.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    Add to home screen
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    Install Spendly for instant access, works offline
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.__pwaPrompt) return;
                    window.__pwaPrompt.prompt();
                    const { outcome } = await window.__pwaPrompt.userChoice;
                    if (outcome === "accepted") {
                      setInstalled(true);
                      window.__pwaPrompt = null;
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    height: 38,
                    padding: "0 16px",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--brand)",
                    background: "var(--brand-soft)",
                    color: "var(--brand)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Download size={14} />
                  Install
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
