import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, PlusCircle, Clock, CheckCircle, Calendar, 
  Search, FileText, User, MapPin, Loader2, Check 
} from 'lucide-react';

const Intervenciones = () => {
  const [intervenciones, setIntervenciones] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, enCurso: 0, concluidas: 0, esteMes: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    folioIncidente: '',
    tipoIntervencion: '',
    entidad: '',
    fechaHora: '',
    noReporteOficial: '',
    responsable: '',
    observaciones: ''
  });

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resList, resStats] = await Promise.all([
        axios.get('https://api-sigie.delachemilio.xyz/api/intervenciones', getConfig()),
        axios.get('https://api-sigie.delachemilio.xyz/api/intervenciones/stats', getConfig())
      ]);
      setIntervenciones(resList.data);
      setStats(resStats.data);
    } catch (err) {
      console.error("Error al cargar datos de intervenciones");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await axios.post('https://api-sigie.delachemilio.xyz/api/intervenciones', formData, getConfig());
      setSuccess('Intervención registrada correctamente.');
      setFormData({ folioIncidente: '', tipoIntervencion: '', entidad: '', fechaHora: '', noReporteOficial: '', responsable: '', observaciones: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar la intervención.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizar = async (id: number) => {
    try {
      await axios.put(`https://api-sigie.delachemilio.xyz/api/intervenciones/${id}/estado`, { estado: 'CONCLUIDA' }, getConfig());
      fetchData();
    } catch (err) {
      alert("Error al actualizar el estado");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-blue-600" /> Intervenciones Externas
        </h2>
        <p className="text-gray-500 text-sm">Registro de apoyos externos: IMSS, ambulancia, policía, protección civil, bomberos.</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="flex flex-col md:flex-row md:items-stretch gap-4">
        {[
          { label: 'Total intervenciones', val: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'En curso', val: stats.enCurso, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Concluidas', val: stats.concluidas, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Este mes', val: stats.esteMes, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 flex-1">
            <div className={`p-3 rounded-lg ${s.bg} shrink-0`}>
              <s.icon className={`h-6 w-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.val}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de Registro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-gray-700">Registrar nueva intervención</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {success && <div className="md:col-span-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4"/> {success}</div>}
          {error && <div className="md:col-span-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4"/> {error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folio del incidente *</label>
            <input required type="text" value={formData.folioIncidente} onChange={e => setFormData({...formData, folioIncidente: e.target.value})} placeholder="Ej. INC-2026-0001" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de intervención *</label>
            <select required value={formData.tipoIntervencion} onChange={e => setFormData({...formData, tipoIntervencion: e.target.value})} className="w-full border rounded-lg p-2.5 bg-white">
              <option value="">Seleccione</option>
              <option value="Médica">Médica / Ambulancia</option>
              <option value="Seguridad">Seguridad / Policía</option>
              <option value="Rescate">Protección Civil / Bomberos</option>
              <option value="Legal">Apoyo Legal / DIF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad / Institución *</label>
            <input required type="text" value={formData.entidad} onChange={e => setFormData({...formData, entidad: e.target.value})} placeholder="Ej. Cruz Roja Mexicana" className="w-full border rounded-lg p-2.5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
            <input required type="datetime-local" value={formData.fechaHora} onChange={e => setFormData({...formData, fechaHora: e.target.value})} className="w-full border rounded-lg p-2.5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. de reporte oficial</label>
            <input type="text" value={formData.noReporteOficial} onChange={e => setFormData({...formData, noReporteOficial: e.target.value})} placeholder="No. de folio externo" className="w-full border rounded-lg p-2.5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable del servicio</label>
            <input type="text" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} placeholder="Nombre del paramédico u oficial" className="w-full border rounded-lg p-2.5" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea rows={3} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full border rounded-lg p-2.5" placeholder="Detalles de la intervención..."></textarea>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button disabled={isLoading} type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-800 transition-all flex items-center gap-2 shadow-md disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              Registrar Intervención
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Seguimiento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold text-gray-700">Bitácora de Apoyos Externos</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
                <th className="p-4">Folio Incidente</th>
                <th className="p-4">Servicio / Entidad</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {intervenciones.map((int) => (
                <tr key={int.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-bold text-blue-900">{int.incidente.folio}</td>
                  <td className="p-4">
                    <span className="font-medium text-gray-800">{int.tipoIntervencion}</span>
                    <p className="text-xs text-gray-400">{int.entidad}</p>
                  </td>
                  <td className="p-4 text-gray-600">{new Date(int.fechaHora).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${int.estado === 'EN_CURSO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {int.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {int.estado === 'EN_CURSO' && (
                      <button onClick={() => handleFinalizar(int.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors border border-green-200" title="Marcar como Concluida">
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Intervenciones;