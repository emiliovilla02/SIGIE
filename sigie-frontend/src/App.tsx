import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import Incidentes from './pages/Incidentes';
import Alumnos from './pages/Alumnos';
import Reportes from './pages/Reportes'; // <-- 1. Importamos el componente nuevo
import Usuarios from './pages/Usuarios';
import PortalTutor from './pages/PortalTutor';
import Auditoria from './pages/Auditoria';
import Enfermeria from './pages/Enfermeria';
import Dashboard from './pages/Dashboard';
import Intervenciones from './pages/Intervenciones';
import Avisos from './pages/Avisos';
import Backups from './pages/Backups';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Nueva ruta pública para el cambio de contraseña */}
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rutas Protegidas envueltas en el Layout - ESTA ES LA LÍNEA QUE FALTABA */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* El index ahora carga el nuevo Dashboard.tsx */}
          <Route index element={<Dashboard />} />
          
          <Route path="incidentes" element={<Incidentes />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="backups" element={<Backups />} />
          <Route path="mis-hijos" element={<PortalTutor />} />
          <Route path="auditoria" element={<Auditoria />} />
          {/* Módulo deshabilitado temporalmente */}
          {/* <Route path="enfermeria" element={<Enfermeria />} /> */}
          <Route path="intervenciones" element={<Intervenciones />} />
          {/* <Route path="avisos" element={<Avisos />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
