import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequireWorkspace } from "./components/RequireWorkspace";
import { AuditLogPage } from "./pages/AuditLogPage";
import { EquipmentDetailPage } from "./pages/EquipmentDetailPage";
import { EquipmentListPage } from "./pages/EquipmentListPage";
import { LandingPage } from "./pages/LandingPage";
import { MyReservationsPage } from "./pages/MyReservationsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SignInPage } from "./pages/SignInPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route
        path="/app"
        element={
          <RequireWorkspace>
            <AppLayout />
          </RequireWorkspace>
        }
      >
        <Route index element={<Navigate to="equipment" replace />} />
        <Route path="equipment" element={<EquipmentListPage />} />
        <Route path="equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="reservations" element={<MyReservationsPage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
