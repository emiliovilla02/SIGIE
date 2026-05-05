import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  FileText, 
  LogOut,
  UserCircle,
  ShieldAlert,
  Activity,
  Menu,
  X
} from 'lucide-react';

import logoIcon from '../assets/logo-icon.png';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const temporizadorInactividad = useRef<NodeJS.Timeout | null>(null);
  
  // SOLUCIÓN ÚNICA, CONSOLIDADA Y A PRUEBA DE BALAS
  let usuario: any = null;
  try {
    const usuarioStr = localStorage.getItem('sigie_usuario');
    if (usuarioStr && usuarioStr !== 'null' && usuarioStr !== 'undefined') {
      usuario = JSON.parse(usuarioStr);
    }
  } catch (error) {
    console.warn("Se encontró basura en la caché, ignorando...");
  }

  const rolUsuario = usuario?.rol;

  const handleLogout = () => {
    localStorage.removeItem('sigie_token');
    localStorage.removeItem('sigie_usuario');
    navigate('/login');
  };

  // --- LÓGICA DE INACTIVIDAD (5 Minutos) ---
  const reiniciarTemporizador = () => {
    if (temporizadorInactividad.current) {
      clearTimeout(temporizadorInactividad.current);
    }
    
    // 300,000 milisegundos = 5 minutos
    temporizadorInactividad.current = setTimeout(() => {
      handleLogout();
    }, 300000);
  };

  useEffect(() => {
    // Escuchar eventos de actividad del usuario
    const eventos = ['mousemove', 'keydown', 'click', 'touchstart'];
    
    eventos.forEach(evento => {
      window.addEventListener(evento, reiniciarTemporizador);
    });

    // Iniciar temporizador al montar el componente
    reiniciarTemporizador();

    // Limpiar temporizador y escuchadores al desmontar
    return () => {
      if (temporizadorInactividad.current) {
        clearTimeout(temporizadorInactividad.current);
      }
      eventos.forEach(evento => {
        window.removeEventListener(evento, reiniciarTemporizador);
      });
    };
  }, []);
  // -----------------------------------------

  // Cerrar sidebar al cambiar de ruta en móviles
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  const navItems = rolUsuario === 'TUTOR' ? navItemsTutor : navItemsEscuela;

  return (
    <div className="min-h-screen bg-gray-100 flex relative overflow-hidden">
      
      {/* OVERLAY PARA MÓVILES: Fondo oscuro que aparece al abrir el menú */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Lateral */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 w-64 bg-blue-900 text-white flex flex-col shadow-2xl md:shadow-lg z-30 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex flex-col items-center justify-center border-b border-blue-800 bg-white/5 relative">
          {/* Botón para cerrar en móviles (solo visible dentro del sidebar) */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 text-blue-200 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img src={logoIcon} alt="Logo SIGIE" className="h-14 w-14 mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-wider text-white leading-none">SIGIE</h1>
          <p className="text-blue-300 text-xs font-medium mt-1 uppercase tracking-widest">Gestión Escolar</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* BARRA SUPERIOR PARA MÓVILES */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <img src={logoIcon} alt="Logo SIGIE Pequeño" className="h-8 w-8" />
            <span className="font-bold text-gray-800 tracking-wide text-lg">SIGIE</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* CONTENEDOR DE LAS VISTAS (Outlet) */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};

export default DashboardLayout;