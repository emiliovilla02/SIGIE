import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Clock, AlertCircle } from 'lucide-react';

const Auditoria = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    fetchAuditoria();
  }, []);

  const fetchAuditoria = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/auditoria', getConfig());
      setRegistros(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la bitácora.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Analizando registros de seguridad...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Bitácora de Auditoría del Sistema
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Registro inmutable de acciones críticas y eliminaciones de expedientes.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-700">
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Usuario Ejecutor</th>
                <th className="p-4">Acción Realizada</th>
                <th className="p-4">Detalle del Registro Destruido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    No hay registros de eliminaciones o acciones críticas. El sistema está limpio.
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-gray-800">
                        <Clock className="h-3 w-3" /> {new Date(reg.fecha).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(reg.fecha).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-bold text-gray-900">{reg.usuario.nombre} {reg.usuario.apellidoPaterno}</span>
                      <br />
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border mt-1 inline-block">
                        {reg.usuario.rol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200">
                        {reg.accion.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs leading-relaxed">
                        <AlertCircle className="h-3 w-3 text-red-500 inline mr-1 mb-0.5" />
                        {reg.detalles}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
