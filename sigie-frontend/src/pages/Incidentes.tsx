import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, List, AlertTriangle, CheckCircle, XCircle, MessageSquare, Clock, Users, Search, X, Trash2, Filter } from 'lucide-react';

const Incidentes = () => {
  const [vista, setVista] = useState<'lista' | 'crear' | 'detalle'>('lista');
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de Búsqueda y Filtros para la Lista
  const [busquedaLista, setBusquedaLista] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroGravedad, setFiltroGravedad] = useState('');

  // Formulario Crear Incidente
  const [tipo, setTipo] = useState('Comportamiento');
  const [gravedad, setGravedad] = useState('Leve');
  const [descripcionBreve, setDescripcionBreve] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>([]);
  const [busquedaAlumno, setBusquedaAlumno] = useState('');

  // Formulario Nuevo Seguimiento
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');

  // --- RECUPERAR ROL PARA PROTECCIÓN DE BORRADO ---
  let usuarioLogueado: any = {};
  try {
    const str = localStorage.getItem('sigie_usuario');
    if (str && str !== 'null') usuarioLogueado = JSON.parse(str);
  } catch (e) {}
  
  const puedeBorrar = usuarioLogueado?.rol === 'ADMIN' || usuarioLogueado?.rol === 'DIRECTOR';
  // ------------------------------------------------

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    fetchIncidentes();
    fetchAlumnos();
  }, []);

  const fetchIncidentes = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/incidentes', getConfig());
      setIncidentes(response.data);
    } catch (error) {
      console.error('Error al cargar incidentes');
    }
  };

  const fetchAlumnos = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/alumnos', getConfig());
      setAlumnos(response.data);
    } catch (error) {
      console.error('Error al cargar alumnos');
    }
  };

  const toggleAlumno = (id: number) => {
    setAlumnosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleCrearIncidente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    if (alumnosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un alumno involucrado.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:4000/api/incidentes', {
        tipo, gravedad, descripcionBreve, descripcion, alumnosIds: alumnosSeleccionados
      }, getConfig());

      setSuccess('Incidente registrado correctamente. Notificaciones enviadas si aplica.');
      setDescripcionBreve(''); setDescripcion(''); setAlumnosSeleccionados([]); setBusquedaAlumno('');
      
      fetchIncidentes();
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el incidente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgregarSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoSeguimiento.trim()) return;
    
    setIsLoading(true);
    try {
      await axios.post(`http://localhost:4000/api/incidentes/${incidenteSeleccionado.id}/seguimientos`, {
        descripcion: nuevoSeguimiento
      }, getConfig());

      setSuccess('Actualización agregada al historial.');
      setNuevoSeguimiento('');
      
      const response = await axios.get('http://localhost:4000/api/incidentes', getConfig());
      setIncidentes(response.data);
      const actualizado = response.data.find((i: any) => i.id === incidenteSeleccionado.id);
      setIncidenteSeleccionado(actualizado);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al agregar el seguimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    setIsLoading(true);
    try {
      await axios.put(`http://localhost:4000/api/incidentes/${incidenteSeleccionado.id}/estado`, {
        estado: nuevoEstado
      }, getConfig());
      
      setSuccess(`Incidente marcado como ${nuevoEstado.replace('_', ' ')}`);
      
      const response = await axios.get('http://localhost:4000/api/incidentes', getConfig());
      setIncidentes(response.data);
      setIncidenteSeleccionado(response.data.find((i: any) => i.id === incidenteSeleccionado.id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al cambiar el estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarIncidente = async () => {
    const confirmar = window.confirm(
      '⚠️ ADVERTENCIA: Esta acción eliminará el incidente y todos sus seguimientos. La acción quedará guardada en la bitácora de auditoría. ¿Desea continuar?'
    );
    
    if (!confirmar) return;

    setIsLoading(true);
    setError('');
    try {
      await axios.delete(`http://localhost:4000/api/incidentes/${incidenteSeleccionado.id}`, getConfig());
      
      setSuccess('Incidente eliminado. La acción ha sido auditada.');
      fetchIncidentes(); 
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al intentar eliminar el incidente');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscador para el formulario de CREAR
  const alumnosFormularioFiltrados = busquedaAlumno.trim() === '' 
    ? [] 
    : alumnos.filter(a => 
        a.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
        a.apellidoPaterno.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
        a.matricula.includes(busquedaAlumno)
      );

  // FILTRADO INTELIGENTE PARA LA LISTA PRINCIPAL
  const incidentesFiltrados = incidentes.filter(inc => {
    const terminoBusqueda = busquedaLista.toLowerCase();
    const tituloIncidente = inc.descripcionBreve.toLowerCase();
    
    // Busca si algún alumno de este incidente coincide con lo que el usuario escribió
    const alumnosMatch = inc.alumnos.some((a: any) => 
      `${a.nombre} ${a.apellidoPaterno} ${a.matricula}`.toLowerCase().includes(terminoBusqueda)
    );

    const coincideBusqueda = tituloIncidente.includes(terminoBusqueda) || alumnosMatch;
    const coincideEstado = filtroEstado === '' || inc.estado === filtroEstado;
    const coincideGravedad = filtroGravedad === '' || inc.gravedad === filtroGravedad;

    return coincideBusqueda && coincideEstado && coincideGravedad;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-blue-600" />
          Módulo de Incidentes
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setVista('lista')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'lista' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <List className="h-4 w-4" /> Ver Historial
          </button>
          <button onClick={() => { setVista('crear'); setSuccess(''); setError(''); setAlumnosSeleccionados([]); setBusquedaAlumno(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'crear' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <PlusCircle className="h-4 w-4" /> Registrar Nuevo
          </button>
        </div>
      </div>

      {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3"><CheckCircle className="h-5 w-5" /> {success}</div>}
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3"><XCircle className="h-5 w-5" /> {error}</div>}

      {vista === 'lista' && (
        <div className="space-y-4">
          
          {/* NUEVA BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por asunto, matrícula o nombre de alumno..."
                value={busquedaLista}
                onChange={(e) => setBusquedaLista(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full md:w-36 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los Estados</option>
                <option value="ABIERTO">Abiertos</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="CERRADO">Cerrados</option>
              </select>

              <select
                value={filtroGravedad}
                onChange={(e) => setFiltroGravedad(e.target.value)}
                className="w-full md:w-36 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cualquier Gravedad</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Leve">Leve</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Involucrados</th>
                  <th className="p-4">Estado / Gravedad</th>
                  <th className="p-4">Reportado Por</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidentesFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron incidentes con los filtros seleccionados.</td></tr>
                ) : (
                  incidentesFiltrados.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{new Date(inc.fechaIncidencia).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {inc.alumnos.map((a: any) => a.nombre).join(', ')}
                        {inc.alumnos.length > 1 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Grupal</span>}
                      </td>
                      <td className="p-4">
                        <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded border mb-1 ${
                          inc.estado === 'ABIERTO' ? 'bg-red-50 text-red-700 border-red-200' :
                          inc.estado === 'EN_PROCESO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {inc.estado.replace('_', ' ')}
                        </div>
                        <br />
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full mt-1 inline-block ${inc.gravedad === 'Alta' ? 'bg-red-100 text-red-700' : inc.gravedad === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inc.gravedad}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{inc.reportadoPor.nombre} {inc.reportadoPor.apellidoPaterno}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => { setIncidenteSeleccionado(inc); setVista('detalle'); setSuccess(''); }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Abrir Expediente
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'crear' && (
        <form onSubmit={handleCrearIncidente} className="max-w-5xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-gray-500"/> Detalles del Evento</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white"><option value="Comportamiento">Problema de Comportamiento</option><option value="Médico">Incidente Médico</option><option value="Académico">Problema Académico</option><option value="Bullying">Acoso / Bullying</option><option value="Daño">Daño a Instalaciones</option><option value="Otro">Otro</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Gravedad *</label><select value={gravedad} onChange={(e) => setGravedad(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white"><option value="Leve">Leve</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Asunto / Resumen *</label><input required type="text" value={descripcionBreve} onChange={(e) => setDescripcionBreve(e.target.value)} placeholder="Ej. Dolor de estómago en clase" className="w-full border rounded-lg p-2.5" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción Inicial (El Reporte) *</label><textarea required rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa la situación al momento del reporte..." className="w-full border rounded-lg p-2.5"></textarea></div>
            </div>

            <div className="space-y-5">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2"><Users className="h-5 w-5 text-gray-500"/> Alumnos Involucrados</h3>
              
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o matrícula..." 
                  value={busquedaAlumno}
                  onChange={(e) => setBusquedaAlumno(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden h-48 overflow-y-auto bg-gray-50 p-2 space-y-2">
                {busquedaAlumno.trim() === '' ? (
                  <p className="text-center text-gray-500 text-sm mt-4">Ingresa una matrícula o nombre para buscar.</p>
                ) : alumnosFormularioFiltrados.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm mt-4">No se encontraron coincidencias.</p>
                ) : (
                  alumnosFormularioFiltrados.map((a) => (
                    <label key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${alumnosSeleccionados.includes(a.id) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                      <input type="checkbox" checked={alumnosSeleccionados.includes(a.id)} onChange={() => toggleAlumno(a.id)} className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{a.nombre} {a.apellidoPaterno}</p>
                        <p className="text-xs text-gray-500">{a.matricula} - Grado: {a.grado}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {alumnosSeleccionados.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Seleccionados para el reporte ({alumnosSeleccionados.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {alumnos.filter(a => alumnosSeleccionados.includes(a.id)).map(a => (
                      <span key={a.id} className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-2 shadow-sm">
                        {a.nombre} {a.apellidoPaterno}
                        <button type="button" onClick={() => toggleAlumno(a.id)} className="hover:text-red-300 transition-colors"><X className="h-3.5 w-3.5"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button type="button" onClick={() => setVista('lista')} className="px-5 py-2.5 border text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Registrar Incidente'}
            </button>
          </div>
        </form>
      )}

      {vista === 'detalle' && incidenteSeleccionado && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${incidenteSeleccionado.gravedad === 'Alta' ? 'bg-red-500' : incidenteSeleccionado.gravedad === 'Media' ? 'bg-orange-400' : 'bg-yellow-400'}`}></div>
            
            <div className="flex justify-between items-start ml-2">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{incidenteSeleccionado.descripcionBreve}</h3>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    incidenteSeleccionado.estado === 'ABIERTO' ? 'bg-red-100 text-red-700 border-red-200' :
                    incidenteSeleccionado.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {incidenteSeleccionado.estado.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Reportado el {new Date(incidenteSeleccionado.fechaIncidencia).toLocaleDateString()} a las {new Date(incidenteSeleccionado.fechaIncidencia).toLocaleTimeString()}</p>
              </div>
              <div className="flex gap-2">
                {incidenteSeleccionado.estado === 'ABIERTO' && (
                  <button onClick={() => handleCambiarEstado('EN_PROCESO')} className="border border-blue-600 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50">Atender</button>
                )}
                {incidenteSeleccionado.estado === 'EN_PROCESO' && (
                  <button onClick={() => handleCambiarEstado('CERRADO')} className="border border-green-600 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-50">Liberar</button>
                )}
                
                {puedeBorrar && (
                  <button 
                    onClick={handleEliminarIncidente} 
                    disabled={isLoading}
                    className="flex items-center gap-1 border border-red-600 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> {isLoading ? 'Borrando...' : 'Eliminar'}
                  </button>
                )}

                <button onClick={() => setVista('lista')} className="border px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium bg-white">Volver</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 ml-2">
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Reportado Por</p><p className="text-sm font-medium text-gray-800">{incidenteSeleccionado.reportadoPor.nombre} {incidenteSeleccionado.reportadoPor.apellidoPaterno} <span className="text-gray-400">({incidenteSeleccionado.reportadoPor.rol})</span></p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Categoría</p><p className="text-sm font-medium text-gray-800">{incidenteSeleccionado.tipo}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Alumnos Involucrados</p><div className="flex flex-wrap gap-2">{incidenteSeleccionado.alumnos.map((a: any) => (<span key={a.id} className="bg-white border text-gray-700 text-xs px-2 py-1 rounded-md">{a.nombre} {a.apellidoPaterno}</span>))}</div></div>
            </div>
          </div>
          
          <div className="pl-2">
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6"><Clock className="h-5 w-5 text-blue-600" /> Historial y Seguimientos</h4>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"><AlertTriangle className="h-4 w-4" /></div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-800 text-sm">Reporte Inicial</span><span className="text-xs text-gray-500">{new Date(incidenteSeleccionado.fechaIncidencia).toLocaleDateString()}</span></div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{incidenteSeleccionado.descripcion}</p>
                </div>
              </div>
              {incidenteSeleccionado.seguimientos.map((seg: any) => (
                <div key={seg.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-100 text-green-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"><MessageSquare className="h-4 w-4" /></div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-800 text-sm">{seg.autor.nombre} {seg.autor.apellidoPaterno} <span className="text-gray-400 font-normal">({seg.autor.rol})</span></span><span className="text-xs text-gray-500">{new Date(seg.fecha).toLocaleDateString()} {new Date(seg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{seg.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 bg-blue-50/50 p-6 rounded-xl border border-blue-100 max-w-3xl mx-auto">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">Agregar Actualización / Seguimiento Médico</h4>
              <form onSubmit={handleAgregarSeguimiento}>
                <textarea required rows={3} value={nuevoSeguimiento} onChange={(e) => setNuevoSeguimiento(e.target.value)} placeholder="Ej. Se atendió al alumno en enfermería, se administró medicamento y reposó..." className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                <div className="flex justify-end mt-3"><button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{isLoading ? 'Guardando...' : 'Guardar en Historial'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidentes;
