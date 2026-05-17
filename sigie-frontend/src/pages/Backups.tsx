import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Save, Download, Server, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const Backups = () => {
  const [config, setConfig] = useState({ intervalo: 'DIARIO', correoDestino: '', activo: true });
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resConfig, resHistorial] = await Promise.all([
        axios.get('https://api-sigie.delachemilio.xyz/api/backups/config', getConfig()),
        axios.get('https://api-sigie.delachemilio.xyz/api/backups/historial', getConfig())
      ]);
      if (resConfig.data) setConfig(resConfig.data);
      setHistorial(resHistorial.data);
    } catch (err) {
      console.error('Error al cargar datos de backups');
    }
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    setError('');
    try {
      await axios.put('https://api-sigie.delachemilio.xyz/api/backups/config', config, getConfig());
      setSuccess('Configuración de respaldos guardada correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  const generarBackupManual = async () => {
    if (!window.confirm('¿Estás seguro de generar una copia de seguridad en este momento? Esto podría tardar unos segundos.')) return;
    
    setIsGenerating(true);
    setSuccess('');
    setError('');
    try {
      await axios.post('https://api-sigie.delachemilio.xyz/api/backups/generar', {}, getConfig());
      setSuccess('Respaldo manual generado exitosamente y enviado a tu correo.');
      cargarDatos(); // Recargar la tabla
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar el respaldo manual.');
    } finally {
      setIsGenerating(false);
    }
  };

  const descargarArchivo = async (nombreArchivo: string) => {
    try {
      // Usamos Axios con responseType blob para pasar el Token de seguridad
      const response = await axios.get(`https://api-sigie.delachemilio.xyz/api/backups/descargar/${nombreArchivo}`, {
        ...getConfig(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error al descargar el archivo. Es posible que ya no exista en el servidor.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Database className="h-6 w-6 text-blue-700" /></div>
          Generar Copia de Seguridad
        </h2>
        <p className="text-gray-500 mt-1">Configura y administra los respaldos de la base de datos del sistema SIGIE.</p>
      </div>

      {success && <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 font-medium"><CheckCircle className="h-5 w-5"/> {success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 font-medium"><AlertCircle className="h-5 w-5"/> {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Configuración */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-500" />
            <h3 className="font-bold text-gray-700">Configuración Automática</h3>
          </div>
          <form onSubmit={guardarConfiguracion} className="p-5 space-y-4">
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-bold text-gray-700">Activar respaldos automáticos</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.activo} onChange={e => setConfig({...config, activo: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Intervalo de ejecución</label>
              <select disabled={!config.activo} value={config.intervalo} onChange={e => setConfig({...config, intervalo: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100">
                <option value="DIARIO">Diario (Madrugada)</option>
                <option value="SEMANAL">Semanal (Domingos)</option>
                <option value="MENSUAL">Mensual (Día 1 del mes)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Correo de destino</label>
              <input disabled={!config.activo} type="email" required value={config.correoDestino} onChange={e => setConfig({...config, correoDestino: e.target.value})} placeholder="admin@escuela.edu" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              <p className="text-xs text-gray-400 mt-1">Se enviará una copia .sql a esta dirección.</p>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Guardar Ajustes
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Historial y Acciones */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-700">Historial de Copias</h3>
            </div>
            <button 
              type="button" 
              onClick={generarBackupManual}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : <Database className="h-4 w-4" />}
              Generar Ahora
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase tracking-wider text-xs font-bold border-b border-gray-200">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Archivo</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historial.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay respaldos generados aún.</td></tr>
                ) : (
                  historial.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                        {new Date(backup.fechaCreacion).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 block truncate max-w-[200px]">
                          {backup.nombreArchivo}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">{(backup.tamanoBytes / 1024).toFixed(2)} KB</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded">{backup.tipo}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${backup.estado === 'EXITOSO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {backup.estado}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {backup.estado === 'EXITOSO' && (
                          <button onClick={() => descargarArchivo(backup.nombreArchivo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="Descargar .sql">
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Backups;