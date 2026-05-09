import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, AlertTriangle, Users, FileText, LogOut,
  UserCircle, ShieldAlert, Activity, Menu, X, Megaphone, Bell
} from 'lucide-react';

import logoIcon from '../assets/logo-icon.png';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const temporizadorInactividad = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para las Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [hayNuevasNotificaciones, setHayNuevasNotificaciones] = useState(false);
  
  let usuario: any = null;
  try {
    const usuarioStr = localStorage.getItem('sigie_usuario');
    if (usuarioStr && usuarioStr !== 'null' && usuarioStr !== 'undefined') {
      usuario = JSON.parse(usuarioStr);
    }
  } catch (error) {}

  const rolUsuario = usuario?.rol;

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  const handleLogout = () => {
    localStorage.removeItem('sigie_token');
    localStorage.removeItem('sigie_usuario');
    navigate('/login');
  };

  const reiniciarTemporizador = () => {
    if (temporizadorInactividad.current) clearTimeout(temporizadorInactividad.current);
    temporizadorInactividad.current = setTimeout(() => { handleLogout(); }, 300000);
  };

  useEffect(() => {
    const eventos = ['mousemove', 'keydown', 'click', 'touchstart'];
    eventos.forEach(evento => window.addEventListener(evento, reiniciarTemporizador));
    reiniciarTemporizador();

    // Cargar notificaciones al inicio
    cargarNotificaciones();

    return () => {
      if (temporizadorInactividad.current) clearTimeout(temporizadorInactividad.current);
      eventos.forEach(evento => window.removeEventListener(evento, reiniciarTemporizador));
    };
  }, []);

  // Cerrar el panel lateral y el menú móvil al cambiar de ruta
  useEffect(() => { 
    setSidebarOpen(false); 
    setMostrarNotificaciones(false);
  }, [location.pathname]);

  const cargarNotificaciones = async () => {
    try {
      const res = await axios.get('https://api-sigie.delachemilio.xyz/api/avisos/mis-notificaciones', getConfig());
      const notas = res.data;
      setNotificaciones(notas);

      // Logica para saber si hay nuevas
      if (notas.length > 0) {
        const ultimaVistaId = localStorage.getItem('sigie_ultima_notificacion');
        if (!ultimaVistaId || parseInt(ultimaVistaId) < notas[0].id) {
          setHayNuevasNotificaciones(true);
        }
      }
    } catch (error) {
      console.error('Error al cargar notificaciones');
    }
  };

  const abrirNotificaciones = () => {
    setMostrarNotificaciones(true);
    setHayNuevasNotificaciones(false);
    if (notificaciones.length > 0) {
      localStorage.setItem('sigie_ultima_notificacion', notificaciones[0].id.toString());
    }
  };

  const navItemsEscuela = [
    { name: 'Panel Principal', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Incidentes', path: '/dashboard/incidentes', icon: AlertTriangle },
    ...(rolUsuario === 'ADMIN' || rolUsuario === 'ENFERMERA' 
      ? [
          { name: 'Enfermería', path: '/dashboard/enfermeria', icon: Activity },
          { name: 'Intervenciones', path: '/dashboard/intervenciones', icon: ShieldAlert }
        ] : []),
    ...(rolUsuario === 'ADMIN' || rolUsuario === 'DIRECTOR' 
      ? [{ name: 'Avisos Masivos', path: '/dashboard/avisos', icon: Megaphone }] : []),
    { name: 'Alumnos', path: '/dashboard/alumnos', icon: Users },
    { name: 'Reportes', path: '/dashboard/reportes', icon: FileText },
  ];

  const navItemsTutor = [{ name: 'Portal Familiar', path: '/dashboard/mis-hijos', icon: Users }];
  const navItems = rolUsuario === 'TUTOR' ? navItemsTutor : navItemsEscuela;

  return (
    <div className="min-h-screen bg-gray-100 flex relative overflow-hidden">
      
      {/* Fondo oscuro para menú móvil (z-40) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Lateral (Z-50: Siempre por encima de todo) */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-blue-900 text-white flex flex-col shadow-2xl md:shadow-lg z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex flex-col items-center justify-center border-b border-blue-800 bg-white/5 relative shrink-0">
          <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-blue-200 hover:text-white"><X className="h-6 w-6" /></button>
          <img src={logoIcon} alt="Logo SIGIE" className="h-14 w-14 mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-wider text-white leading-none">SIGIE</h1>
          <p className="text-blue-300 text-xs font-medium mt-1 uppercase tracking-widest">Gestión Escolar</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {['ADMIN', 'DIRECTOR', 'DOCENTE'].includes(rolUsuario) && (
            <NavLink to="/dashboard/usuarios" className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-2 border border-blue-800/50 ${isActive ? 'bg-blue-800 text-white border-blue-700' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span className="font-medium text-sm">Gestión de Personal</span>
            </NavLink>
          )}
        
          {rolUsuario === 'ADMIN' && (
            <NavLink to="/dashboard/auditoria" className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-2 border border-red-800/50 ${isActive ? 'bg-red-800 text-white border-red-700' : 'text-blue-200 hover:bg-red-900 hover:text-white'}`}>
              <ShieldAlert className="h-5 w-5" />
              <span className="font-medium text-sm">Bitácora Auditoría</span>
            </NavLink>
          )}
        </nav>

        {/* Zona inferior del usuario con Campanita Fija */}
        <div className="p-4 border-t border-blue-800 bg-blue-900/50 shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-blue-300" />
              <div>
                <p className="text-sm font-medium text-white">{usuario?.nombre?.split(' ')[0] || 'Usuario'}</p>
                <p className="text-xs text-blue-300 font-semibold tracking-wide">{usuario?.rol || 'Rol'}</p>
              </div>
            </div>
            
            {/* Campanita Fija en el Sidebar */}
            <button 
              onClick={abrirNotificaciones} 
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors relative"
              title="Ver notificaciones"
            >
              <Bell className="h-5 w-5" />
              {hayNuevasNotificaciones && <span className="absolute top-1 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-blue-900"></span>}
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 w-full text-left text-red-300 hover:bg-blue-800 hover:text-red-200 rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* BARRA SUPERIOR SOLO MÓVILES */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-gray-800 text-lg">SIGIE</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200 transition">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* CAMPANITA FLOTANTE INTELIGENTE */}
        {hayNuevasNotificaciones && (
          <button 
            onClick={abrirNotificaciones}
            className="fixed top-20 right-4 md:top-6 md:right-8 z-10 bg-white p-3 rounded-full shadow-lg border border-gray-200 text-blue-700 hover:bg-blue-50 transition-transform transform hover:scale-105 animate-bounce"
            title="¡Tienes nuevos avisos!"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        )}

        {/* CONTENEDOR DE LAS VISTAS */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        {/* PANEL LATERAL DE NOTIFICACIONES (Drawer) */}
        {mostrarNotificaciones && (
          <>
            {/* Fondo transparente (Z-20): Se coloca por DEBAJO del menú lateral */}
            <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm transition-opacity" onClick={() => setMostrarNotificaciones(false)} />
            
            {/* Panel Deslizable (Z-30) */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-50 shadow-2xl z-30 flex flex-col transform transition-transform">
              
              <div className="bg-blue-900 text-white p-5 flex justify-between items-center shrink-0 shadow-md">
                <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="h-5 w-5"/> Notificaciones</h3>
                <button onClick={() => setMostrarNotificaciones(false)} className="p-1.5 hover:bg-blue-800 rounded-md transition-colors"><X className="h-6 w-6"/></button>
              </div>
              
              {/* Contenedor centralizado para mensajes vacíos */}
              <div className={`flex-1 overflow-y-auto p-4 ${notificaciones.length === 0 ? 'flex flex-col items-center justify-center' : 'space-y-3'}`}>
                {notificaciones.length === 0 ? (
                  <div className="text-center">
                    <Bell className="h-14 w-14 mx-auto mb-4 text-gray-800" strokeWidth={2} />
                    <p className="text-gray-500 font-medium">No hay notificaciones recientes.</p>
                  </div>
                ) : (
                  notificaciones.map((aviso) => (
                    <div key={aviso.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-600 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">{aviso.tipoAviso}</span>
                        <span className="text-xs text-gray-400 font-medium">{new Date(aviso.fechaCreacion).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{aviso.asunto}</p>
                      <p className="text-xs text-gray-600 line-clamp-3">{aviso.mensaje}</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;