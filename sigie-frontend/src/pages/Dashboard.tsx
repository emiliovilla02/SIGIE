import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertTriangle, Activity, ShieldAlert, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Verificamos el rol para ocultar datos a los tutores
  let usuarioActual: any = {};
  try {
    const usuarioString = localStorage.getItem('sigie_usuario');
    if (usuarioString && usuarioString !== 'null') {
      usuarioActual = JSON.parse(usuarioString);
    }
  } catch (error) {}

  const esTutor = usuarioActual?.rol === 'TUTOR';

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    // Si es tutor, no cargamos las estadísticas globales
    if (!esTutor) {
      fetchEstadisticas();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/estadisticas', getConfig());
      setStats(response.data);
    } catch (err: any) {
      setError('Error al cargar las estadísticas del sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  // Vista para los Padres de Familia (Tutores)
  if (esTutor) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-3xl mx-auto mt-10">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Bienvenido a SIGIE</h2>
        <p className="text-gray-600 mb-6">Como padre de familia o tutor, su acceso principal es a través del Portal Familiar.</p>
        <p className="text-sm text-gray-500 bg-blue-50 p-4 rounded-lg">
          Diríjase a la opción <strong>"Portal Familiar"</strong> en el menú lateral para consultar el expediente, calificaciones y reportes de sus hijos.
        </p>
      </div>
    );
  }

  // Vista para el Personal Escolar (Mientras Carga)
  if (isLoading) return <div className="p-8 text-center text-gray-500 flex justify-center items-center h-64">Cargando métricas del sistema...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  if (!stats) return null;

  // Datos artificiales para la gráfica de barras (Incidentes por Mes) para que se vea bien
  const dataBarras = [
    { mes: 'Ene', incidentes: 4 }, { mes: 'Feb', incidentes: 7 }, { mes: 'Mar', incidentes: 5 },
    { mes: 'Abr', incidentes: 10 }, { mes: 'May', incidentes: stats.contadores.incidentes }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Panel de Control General</h2>
          <p className="text-gray-500 mt-1">Métricas y estado general de la institución en tiempo real.</p>
        </div>
      </div>

      {/* 1. Fila de Tarjetas (Contadores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Users className="h-6 w-6" /></div>
          <div><p className="text-sm font-medium text-gray-500">Total Alumnos</p><p className="text-2xl font-bold text-gray-900">{stats.contadores.alumnos}</p></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-4 rounded-full text-orange-600"><AlertTriangle className="h-6 w-6" /></div>
          <div><p className="text-sm font-medium text-gray-500">Incidentes Históricos</p><p className="text-2xl font-bold text-gray-900">{stats.contadores.incidentes}</p></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-4 rounded-full text-red-600"><ShieldAlert className="h-6 w-6" /></div>
          <div><p className="text-sm font-medium text-gray-500">Casos Abiertos (Alerta)</p><p className="text-2xl font-bold text-red-600">{stats.contadores.alertas}</p></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-full text-green-600"><Activity className="h-6 w-6" /></div>
          <div><p className="text-sm font-medium text-gray-500">Atenciones Médicas</p><p className="text-2xl font-bold text-gray-900">{stats.contadores.atenciones}</p></div>
        </div>
      </div>

      {/* 2. Fila de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica de Pastel: Gravedad */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Distribución por Gravedad</h3>
          {stats.contadores.incidentes === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-400">No hay datos suficientes</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.graficaGravedad} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.graficaGravedad.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfica de Barras: Tendencia */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-400" /> Tendencia de Incidentes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBarras}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="incidentes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Fila de Actividad Reciente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Actividad Reciente (Últimos 5 registros)</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.actividadReciente.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No hay actividad reciente registrada.</div>
          ) : (
            stats.actividadReciente.map((inc: any) => (
              <div key={inc.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{inc.descripcionBreve}</p>
                  <p className="text-xs text-gray-500 mt-1">Involucra a: {inc.alumnos.map((a:any) => a.nombre).join(', ')}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                    inc.estado === 'ABIERTO' ? 'bg-red-100 text-red-700' : 
                    inc.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {inc.estado.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(inc.fechaIncidencia).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
