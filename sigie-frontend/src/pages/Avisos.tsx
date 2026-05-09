import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Mail, List, CheckCircle, XCircle, Send, Loader2, Eye, Users } from 'lucide-react';

const Avisos = () => {
  const [vista, setVista] = useState<'crear' | 'historial'>('crear');
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Formulario
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [tipoAviso, setTipoAviso] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    if (vista === 'historial') fetchHistorial();
  }, [vista]);

  const fetchHistorial = async () => {
    try {
      const res = await axios.get('https://api-sigie.delachemilio.xyz/api/avisos/enviados', getConfig());
      setHistorial(res.data);
    } catch (err) {
      console.error('Error al cargar historial de avisos');
    }
  };

  const handleCheckboxChange = (rol: string) => {
    setDestinatarios(prev => 
      prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol]
    );
  };

  const limpiarFormulario = () => {
    setDestinatarios([]);
    setTipoAviso('');
    setAsunto('');
    setMensaje('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (destinatarios.length === 0) {
      setError('Debes seleccionar al menos un grupo de destinatarios.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('https://api-sigie.delachemilio.xyz/api/avisos', {
        rolesDestino: destinatarios,
        tipoAviso,
        asunto,
        mensaje
      }, getConfig());

      setSuccess('El aviso masivo ha sido enviado a los correos y notificaciones exitosamente.');
      limpiarFormulario();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el aviso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Cabecera idéntica a la imagen pero en azul */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Megaphone className="h-6 w-6 text-blue-700" /></div>
          Enviar avisos masivos
        </h2>
        <p className="text-gray-500 mt-1">Comunicados oficiales para padres, docentes o personal</p>
      </div>

      {/* Tarjeta Contenedora Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Pestañas estilo Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
          <button 
            onClick={() => setVista('crear')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${vista === 'crear' ? 'bg-white shadow-sm border border-gray-200 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Mail className="h-4 w-4" /> Nuevo aviso
          </button>
          <button 
            onClick={() => setVista('historial')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${vista === 'historial' ? 'bg-white shadow-sm border border-gray-200 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="h-4 w-4" /> Avisos enviados ({historial.length})
          </button>
        </div>

        {/* Contenido de Crear Aviso */}
        {vista === 'crear' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="h-5 w-5"/> {success}</div>}
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><XCircle className="h-5 w-5"/> {error}</div>}

            {/* Fila de Destinatarios */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-3">
                <Users className="h-4 w-4" /> Destinatarios
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${destinatarios.includes('TUTOR') ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={destinatarios.includes('TUTOR')} onChange={() => handleCheckboxChange('TUTOR')} />
                  <span className="text-sm font-medium text-gray-700">Todos los padres/tutores</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${destinatarios.includes('DOCENTE') ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={destinatarios.includes('DOCENTE')} onChange={() => handleCheckboxChange('DOCENTE')} />
                  <span className="text-sm font-medium text-gray-700">Todos los docentes</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${destinatarios.includes('ADMIN') ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={destinatarios.includes('ADMIN')} onChange={() => handleCheckboxChange('ADMIN')} />
                  <span className="text-sm font-medium text-gray-700">Personal administrativo</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${destinatarios.includes('ENFERMERA') ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={destinatarios.includes('ENFERMERA')} onChange={() => handleCheckboxChange('ENFERMERA')} />
                  <span className="text-sm font-medium text-gray-700">Personal de enfermería</span>
                </label>
              </div>
            </div>

            {/* Tipo de aviso y Programar envío */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de aviso <span className="text-red-500">*</span></label>
                <select required value={tipoAviso} onChange={(e) => setTipoAviso(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="">Seleccione</option>
                  <option value="Aviso General">Aviso General</option>
                  <option value="Urgente">Alerta Urgente</option>
                  <option value="Recordatorio de Evento">Recordatorio de Evento</option>
                  <option value="Cuestión Académica">Cuestión Académica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Programar envío</label>
                <select disabled className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-500 cursor-not-allowed">
                  <option value="ahora">Enviar ahora (Inmediato)</option>
                </select>
              </div>
            </div>

            {/* Asunto */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Asunto <span className="text-red-500">*</span></label>
              <input required type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Ej. Suspensión de clases el día..." className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mensaje <span className="text-red-500">*</span></label>
              <textarea required rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Redacte el aviso oficial..." className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>

            {/* Botones Inferiores (Idénticos a la imagen pero azules) */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={limpiarFormulario} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Limpiar
              </button>
              <button type="button" onClick={() => { if(asunto || mensaje) alert(`Vista Previa:\n\n${asunto}\n\n${mensaje}`); }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                <Eye className="h-4 w-4" /> Vista previa
              </button>
              <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-md disabled:opacity-50">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar aviso
              </button>
            </div>

          </form>
        )}

        {/* Contenido de Historial (Tabla) */}
        {vista === 'historial' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Asunto</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Destinatarios</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historial.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500 italic"><Megaphone className="h-6 w-6 mx-auto mb-2 text-gray-400"/> No hay avisos enviados.</td></tr>
                ) : (
                  historial.map((aviso) => (
                    <tr key={aviso.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{new Date(aviso.fechaCreacion).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-gray-900">{aviso.asunto}</td>
                      <td className="p-4"><span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border">{aviso.tipoAviso}</span></td>
                      <td className="p-4 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {aviso.destinosRoles.split(',').map((rol: string) => (
                            <span key={rol} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{rol}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-200">Enviado</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Avisos;