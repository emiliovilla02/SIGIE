import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertTriangle, CheckCircle, Activity, ShieldCheck } from 'lucide-react';

const PortalTutor = () => {
  const [misHijos, setMisHijos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    fetchMisHijos();
  }, []);

  const fetchMisHijos = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/mis-hijos', getConfig());
      setMisHijos(response.data);
    } catch (err: any) {
      setError('Error al cargar la información del portal familiar.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando portal familiar...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <ShieldCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800">Portal Familiar SIGIE</h2>
        <p className="text-gray-500 mt-2">Bienvenido. Aquí puede monitorear el expediente y los avisos de sus hijos.</p>
      </div>

      {misHijos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center border border-gray-200 shadow-sm">
          <p className="text-gray-600">No hay alumnos vinculados a esta cuenta de tutor en este momento.</p>
          <p className="text-sm text-gray-400 mt-2">Si cree que esto es un error, por favor contacte a la administración escolar.</p>
        </div>
      ) : (
        misHijos.map((hijo) => (
          <div key={hijo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{hijo.nombre} {hijo.apellidoPaterno} {hijo.apellidoMaterno}</h3>
                <p className="text-blue-200 mt-1">Matrícula: {hijo.matricula} | Grado y Grupo: {hijo.grado}° "{hijo.grupo}"</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Médica */}
              <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Activity className="h-5 w-5 text-red-500"/> Información Médica</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{hijo.expedienteMedico || 'No hay registro de condiciones médicas.'}</p>
              </div>

              {/* Historial de Incidentes */}
              <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5 text-orange-500"/> Historial de Incidentes ({hijo.incidentes?.length || 0})</h4>
                
                {hijo.incidentes?.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium text-sm">Sin reportes registrados.</span>
                  </div>
                ) : (
                  <div className="space-y-3 h-48 overflow-y-auto pr-2">
                    {hijo.incidentes.map((inc: any) => (
                      <div key={inc.id} className="bg-white p-3 rounded border border-gray-200 text-sm shadow-sm">
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-gray-800">{inc.tipo}</span>
                          <span className="text-gray-500">{new Date(inc.fechaIncidencia).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{inc.descripcionBreve}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Reportó: {inc.reportadoPor.nombre} ({inc.reportadoPor.rol})</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{inc.estado.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PortalTutor;
