import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileBarChart, PieChart, Users, AlertCircle, TrendingUp } from 'lucide-react';

const Reportes = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/reportes/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error al cargar estadísticas');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <div className="p-10 text-center text-gray-500">Generando reporte ejecutivo...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <FileBarChart className="h-8 w-8 text-blue-600" />
        Reportes y Estadísticas
      </h2>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg"><AlertCircle className="text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Incidentes</p>
            <p className="text-2xl font-bold">{stats?.resumen.totalIncidentes}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg"><Users className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Alumnos Registrados</p>
            <p className="text-2xl font-bold">{stats?.resumen.totalAlumnos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg"><TrendingUp className="text-orange-600" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa de Incidencia</p>
            <p className="text-2xl font-bold">
              {stats?.resumen.totalAlumnos > 0 
                ? (stats.resumen.totalIncidentes / stats.resumen.totalAlumnos).toFixed(2) 
                : 0}
            </p>
          </div>
        </div>
      </div>

	{/* NUEVO: Tarjetas de Estado (Flujo de vida del incidente) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {['ABIERTO', 'EN_PROCESO', 'CERRADO'].map((estadoFiltro) => {
          // Buscamos cuántos incidentes tienen este estado
          const count = stats?.porEstado?.find((e: any) => e.estado === estadoFiltro)?._count.id || 0;
          
          let color = estadoFiltro === 'ABIERTO' ? 'bg-red-50 border-red-200 text-red-700' : 
                      estadoFiltro === 'EN_PROCESO' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                      'bg-green-50 border-green-200 text-green-700';
          
          let titulo = estadoFiltro === 'ABIERTO' ? 'Nuevos / Abiertos' : 
                       estadoFiltro === 'EN_PROCESO' ? 'En Atención' : 'Liberados / Cerrados';

          return (
            <div key={estadoFiltro} className={`p-4 rounded-xl shadow-sm border ${color} flex justify-between items-center`}>
              <span className="font-bold">{titulo}</span>
              <span className="text-2xl font-black">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Gravedad */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-500" /> Incidentes por Gravedad
          </h3>
          <div className="space-y-4">
            {stats?.porGravedad.map((g: any) => (
              <div key={g.gravedad}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-600">{g.gravedad}</span>
                  <span className="text-gray-500">{g._count.id}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      g.gravedad === 'Alta' ? 'bg-red-500' : g.gravedad === 'Media' ? 'bg-orange-400' : 'bg-yellow-400'
                    }`} 
                    style={{ width: `${(g._count.id / stats.resumen.totalIncidentes) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alumnos con mayor recurrencia */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" /> Atención Prioritaria (Top Alumnos)
          </h3>
          <div className="divide-y divide-gray-50">
            {stats?.alumnosCriticos.map((a: any) => (
              <div key={a.matricula} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-800">{a.nombre}</p>
                  <p className="text-xs text-gray-500">{a.matricula}</p>
                </div>
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                  {a.cuenta} incidentes
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
