import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { trackPageView } from "./utils/analytics.js";
import { useMe } from "./api/auth.js";
import Layout from "./components/Layout.jsx";
import Spinner from "./components/Spinner.jsx";
import DomainMigrationBanner from "./components/DomainMigrationBanner.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Categories from "./pages/Categories.jsx";
import Tags from "./pages/Tags.jsx";
import Goals from "./pages/Goals.jsx";
import Groups from "./pages/Groups.jsx";
import GroupDetail from "./pages/GroupDetail.jsx";
import JoinGroup from "./pages/JoinGroup.jsx";
import Settings from "./pages/Settings.jsx";
import Support from "./pages/Support.jsx";
import Updates from "./pages/Updates.jsx";
import LandingPage from "./pages/LandingPage.jsx";

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

function AuthGuard({ children }) {
  const { data: user, isLoading, isError } = useMe();
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Spinner />
      </div>
    );
  }

  if (isError || !user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return (
    <Layout user={user}>
      {({ addOpen, setAddOpen }) => children(user, addOpen, setAddOpen)}
    </Layout>
  );
}

// Wraps /login and /register: a user who is already signed in shouldn't be
// able to reach the auth forms again — send them straight to the app instead.
function PublicRoute({ children }) {
  const { data: user, isLoading } = useMe();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Spinner />
      </div>
    );
  }

  if (user) {
    const redirect = searchParams.get("redirect");
    return <Navigate to={redirect ? decodeURIComponent(redirect) : "/dashboard"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <DomainMigrationBanner />
      <BrowserRouter>
      <PageTracker />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={<AuthGuard>{(user) => <Dashboard user={user} />}</AuthGuard>}
        />
        <Route
          path="/expenses"
          element={<AuthGuard>{(user) => <Expenses user={user} />}</AuthGuard>}
        />
        <Route
          path="/categories"
          element={<AuthGuard>{(user) => <Categories user={user} />}</AuthGuard>}
        />
        <Route
          path="/tags"
          element={<AuthGuard>{(user) => <Tags user={user} />}</AuthGuard>}
        />
        <Route
          path="/goals"
          element={<AuthGuard>{(user) => <Goals user={user} />}</AuthGuard>}
        />
        <Route
          path="/groups"
          element={<AuthGuard>{(user) => <Groups user={user} />}</AuthGuard>}
        />
        <Route
          path="/groups/:groupId"
          element={<AuthGuard>{(user) => <GroupDetail user={user} />}</AuthGuard>}
        />
        <Route
          path="/join/:code"
          element={<AuthGuard>{(user) => <JoinGroup user={user} />}</AuthGuard>}
        />
        <Route
          path="/settings"
          element={<AuthGuard>{(user) => <Settings user={user} />}</AuthGuard>}
        />
        <Route
          path="/support"
          element={<AuthGuard>{(user) => <Support user={user} />}</AuthGuard>}
        />
        <Route
          path="/updates"
          element={<AuthGuard>{() => <Updates />}</AuthGuard>}
        />
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}
