import React from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  FileText, 
  LogOut,
  UserCircle,
  ShieldAlert,
  Activity
} from 'lucide-react';

import logoIcon from '../assets/logo-icon.png';


const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // SOLUCIÓN ÚNICA, CONSOLIDADA Y A PRUEBA DE BALAS
  let usuario: any = null;
  try {
    const usuarioStr = localStorage.getItem('sigie_usuario');
    // Verificamos que exista y que no sean las palabras literales 'null' o 'undefined'
    if (usuarioStr && usuarioStr !== 'null' && usuarioStr !== 'undefined') {
      usuario = JSON.parse(usuarioStr);
    }
  } catch (error) {
    console.warn("Se encontró basura en la caché, ignorando...");
  }

  // Extraemos el rol de forma segura
  const rolUsuario = usuario?.rol;

  const handleLogout = () => {
    localStorage.removeItem('sigie_token');
    localStorage.removeItem('sigie_usuario');
    navigate('/login');
  };

  const navItemsEscuela = [
    { name: 'Panel Principal', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Incidentes', path: '/dashboard/incidentes', icon: AlertTriangle },
    { name: 'Enfermería', path: '/dashboard/enfermeria', icon: Activity },
    { name: 'Alumnos', path: '/dashboard/alumnos', icon: Users },
    { name: 'Reportes', path: '/dashboard/reportes', icon: FileText },
  ];

  const navItemsTutor = [
    { name: 'Portal Familiar', path: '/dashboard/mis-hijos', icon: Users },
  ];

  // Si el usuario es TUTOR, solo ve el Portal Familiar. Si es personal, ve todo lo demás.
  const navItems = rolUsuario === 'TUTOR' ? navItemsTutor : navItemsEscuela;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col shadow-lg z-10">
        <div className="p-6 flex flex-col items-center justify-center border-b border-blue-800 bg-white/5">
          <img src={logoIcon} alt="Logo SIGIE" className="h-14 w-14 mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-wider text-white leading-none">SIGIE</h1>
          <p className="text-blue-300 text-xs font-medium mt-1 uppercase tracking-widest">Gestión Escolar</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Botones normales */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* BOTÓN PROTEGIDO: Visible para personal administrativo y docente */}
          {['ADMIN', 'DIRECTOR', 'DOCENTE'].includes(rolUsuario) && (
            <NavLink
              to="/dashboard/usuarios"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-2 border border-blue-800/50 ${
                  isActive ? 'bg-blue-800 text-white border-blue-700' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span className="font-medium text-sm">Gestión de Personal</span>
            </NavLink>
          )}
	
	  {/* BOTÓN PROTEGIDO: Solo visible para ADMIN */}
          {rolUsuario === 'ADMIN' && (
            <NavLink
              to="/dashboard/auditoria"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-2 border border-red-800/50 ${
                  isActive ? 'bg-red-800 text-white border-red-700' : 'text-blue-200 hover:bg-red-900 hover:text-white'
                }`
              }
            >
              <ShieldAlert className="h-5 w-5" />
              <span className="font-medium text-sm">Bitácora Auditoría</span>
            </NavLink>
          )}
        </nav>

        {/* Perfil y Logout al fondo */}
        <div className="p-4 border-t border-blue-800 bg-blue-900/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <UserCircle className="h-8 w-8 text-blue-300" />
            <div>
              <p className="text-sm font-medium text-white">{usuario?.nombre?.split(' ')[0] || 'Usuario'}</p>
              <p className="text-xs text-blue-300 font-semibold tracking-wide">{usuario?.rol || 'Rol'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-red-300 hover:bg-blue-800 hover:text-red-200 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
