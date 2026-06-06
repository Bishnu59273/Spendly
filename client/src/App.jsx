import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useMe } from "./api/auth.js";
import Layout from "./components/Layout.jsx";
import Spinner from "./components/Spinner.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Categories from "./pages/Categories.jsx";
import Tags from "./pages/Tags.jsx";
import Settings from "./pages/Settings.jsx";

function AuthGuard({ children }) {
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Spinner />
      </div>
    );
  }

  if (isError || !user) return <Navigate to="/login" replace />;

  return (
    <Layout user={user}>
      {children(user)}
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          element={<AuthGuard>{() => <Tags />}</AuthGuard>}
        />
        <Route
          path="/settings"
          element={<AuthGuard>{(user) => <Settings user={user} />}</AuthGuard>}
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
