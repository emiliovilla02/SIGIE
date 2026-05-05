import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, PlusCircle, List, CheckCircle, XCircle, Search } from 'lucide-react';

const Enfermeria = () => {
  const [vista, setVista] = useState<'lista' | 'crear'>('lista');
  const [atenciones, setAtenciones] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario
  const [busqueda, setBusqueda] = useState('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(null);
  const [nombreIntervencion, setNombreIntervencion] = useState('');
  const [telefonoIntervencion, setTelefonoIntervencion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const getConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` } });

  useEffect(() => {
    fetchAtenciones();
    fetchAlumnos();
  }, []);

  const fetchAtenciones = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/atenciones', getConfig());
      setAtenciones(response.data);
    } catch (error) {
      console.error('Error al cargar atenciones médicas');
    }
  };

  const fetchAlumnos = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/alumnos', getConfig());
      setAlumnos(response.data);
    } catch (error) {
      console.error('Error al cargar alumnos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoSeleccionado) return setError('Debe seleccionar a un alumno.');
    
    setIsLoading(true); setError(''); setSuccess('');
    
    try {
      await axios.post('https://api-sigie.delachemilio.xyz/api/atenciones', {
        alumnoId: alumnoSeleccionado,
        nombreIntervencion,
        telefonoIntervencion,
        descripcion
      }, getConfig());

      setSuccess('Atención médica registrada exitosamente.');
      setNombreIntervencion(''); setTelefonoIntervencion(''); setDescripcion(''); setBusqueda(''); setAlumnoSeleccionado(null);
      
      fetchAtenciones();
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  const alumnosFiltrados = busqueda.trim() === '' ? [] : alumnos.filter(a => 
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.apellidoPaterno.toLowerCase().includes(busqueda.toLowerCase()) || a.matricula.includes(busqueda)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500" /> Control de Enfermería
          </h2>
          <p className="text-sm text-gray-500">Registro de visitas médicas y curaciones rápidas.</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setVista('lista')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'lista' ? 'bg-white shadow text-red-500' : 'text-gray-600'}`}><List className="h-4 w-4" /> Historial</button>
          <button onClick={() => { setVista('crear'); setSuccess(''); setError(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'crear' ? 'bg-white shadow text-red-500' : 'text-gray-600'}`}><PlusCircle className="h-4 w-4" /> Nueva Atención</button>
        </div>
      </div>

      {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3"><CheckCircle className="h-5 w-5" /> {success}</div>}
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3"><XCircle className="h-5 w-5" /> {error}</div>}

      {vista === 'lista' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Alumno Atendido</th>
                <th className="p-4">Intervención / Síntoma</th>
                <th className="p-4">Descripción del Procedimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {atenciones.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay atenciones médicas registradas.</td></tr> : 
                atenciones.map((at) => (
                  <tr key={at.id} className="hover:bg-red-50/30">
                    <td className="p-4 text-sm text-gray-600">{new Date(at.fechaAtencion).toLocaleString()}</td>
                    <td className="p-4 font-medium text-gray-900">{at.alumno.nombre} {at.alumno.apellidoPaterno} <br/><span className="text-xs text-gray-500">{at.alumno.grado}° "{at.alumno.grupo}"</span></td>
                    <td className="p-4 text-sm"><span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-bold">{at.nombreIntervencion}</span></td>
                    <td className="p-4 text-sm text-gray-600">{at.descripcion}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {vista === 'crear' && (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Search className="h-5 w-5 text-gray-400"/> Seleccionar Paciente</h3>
              <input type="text" placeholder="Buscar por nombre o matrícula..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              <div className="border border-gray-200 rounded-lg overflow-y-auto h-48 bg-gray-50 p-2 space-y-2">
                {busqueda.trim() === '' ? <p className="text-center text-gray-500 text-sm mt-4">Buscar paciente...</p> : alumnosFiltrados.map(a => (
                  <label key={a.id} className={`flex items-center gap-3 p-2 rounded border cursor-pointer ${alumnoSeleccionado === a.id ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                    <input type="radio" name="paciente" checked={alumnoSeleccionado === a.id} onChange={() => setAlumnoSeleccionado(a.id)} className="text-red-500 focus:ring-red-500"/>
                    <div className="text-sm"><p className="font-medium text-gray-800">{a.nombre} {a.apellidoPaterno}</p><p className="text-xs text-gray-500">{a.matricula}</p></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Activity className="h-5 w-5 text-gray-400"/> Detalles Clínicos</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Síntoma Principal *</label><input required type="text" value={nombreIntervencion} onChange={(e) => setNombreIntervencion(e.target.value)} placeholder="Ej. Dolor de cabeza, Curación por caída" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono al que se notificó (Opcional)</label><input type="text" value={telefonoIntervencion} onChange={(e) => setTelefonoIntervencion(e.target.value)} placeholder="Ej. 555-123-4567" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento o Acción Realizada *</label><textarea required rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Se tomó temperatura (36.8°C). Se le permitió reposar 15 minutos..." className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-400"></textarea></div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-6">
            <button type="button" onClick={() => setVista('lista')} className="px-5 py-2.5 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">{isLoading ? 'Guardando...' : 'Registrar Atención Médica'}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Enfermeria;
