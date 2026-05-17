import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, List, AlertTriangle, CheckCircle, XCircle, MessageSquare, Clock, Users, Search, X, Trash2, Download, Edit, Activity, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

const Incidentes = () => {
  const [vista, setVista] = useState<'lista' | 'crear' | 'detalle' | 'editar'>('lista');
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState<any>(null);
  
  const [busquedaGeneral, setBusquedaGeneral] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formularios
  const [tipo, setTipo] = useState('Comportamiento');
  const [gravedad, setGravedad] = useState('Leve');
  const [descripcionBreve, setDescripcionBreve] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');

  // NUEVO: Estado para el Modal de Agendar Reunión (RF-012)
  const [mostrarModalReunion, setMostrarModalReunion] = useState(false);
  const [reuFecha, setReuFecha] = useState('');
  const [reuHora, setReuHora] = useState('');
  const [reuModalidad, setReuModalidad] = useState('Presencial');
  const [reuLugar, setReuLugar] = useState('Dirección Escolar');
  const [reuMotivo, setReuMotivo] = useState('');

  // --- PERMISOS Y ROLES ---
  let usuarioLogueado: any = {};
  try {
    const str = localStorage.getItem('sigie_usuario');
    if (str && str !== 'null') usuarioLogueado = JSON.parse(str);
  } catch (e) {}
  
  const puedeBorrar = usuarioLogueado?.rol === 'ADMIN' || usuarioLogueado?.rol === 'DIRECTOR';
  const puedeEditar = ['ADMIN', 'DIRECTOR', 'ENFERMERA'].includes(usuarioLogueado?.rol);
  const puedeVerMedico = ['ADMIN', 'ENFERMERA'].includes(usuarioLogueado?.rol);
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
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/incidentes', getConfig());
      setIncidentes(response.data);
    } catch (error) {
      console.error('Error al cargar incidentes');
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
      await axios.post('https://api-sigie.delachemilio.xyz/api/incidentes', {
        tipo, gravedad, descripcionBreve, descripcion, alumnosIds: alumnosSeleccionados
      }, getConfig());

      setSuccess('Incidente registrado correctamente. Notificaciones enviadas si aplica.');
      setDescripcionBreve(''); setDescripcion(''); setAlumnosSeleccionados([]); setBusqueda('');
      
      fetchIncidentes();
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el incidente');
    } finally {
      setIsLoading(false);
    }
  };

  const prepararEdicion = (inc: any) => {
    setTipo(inc.tipo);
    setGravedad(inc.gravedad);
    setDescripcionBreve(inc.descripcionBreve);
    setDescripcion(inc.descripcion);
    setVista('editar');
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    try {
      await axios.put(`https://api-sigie.delachemilio.xyz/api/incidentes/${incidenteSeleccionado.id}`, {
        tipo, gravedad, descripcionBreve, descripcion
      }, getConfig());

      setSuccess('Incidente modificado exitosamente. Registrado en auditoría.');
      
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/incidentes', getConfig());
      setIncidentes(response.data);
      const actualizado = response.data.find((i: any) => i.id === incidenteSeleccionado.id);
      setIncidenteSeleccionado(actualizado);

      setTimeout(() => setVista('detalle'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al modificar el incidente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgregarSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoSeguimiento.trim()) return;
    
    setIsLoading(true);
    try {
      await axios.post(`https://api-sigie.delachemilio.xyz/api/incidentes/${incidenteSeleccionado.id}/seguimientos`, {
        descripcion: nuevoSeguimiento
      }, getConfig());

      setSuccess('Actualización agregada al historial.');
      setNuevoSeguimiento('');
      
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/incidentes', getConfig());
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

  // NUEVO: Manejador para Agendar la Reunión
  const handleAgendarReunion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await axios.post(`https://api-sigie.delachemilio.xyz/api/incidentes/${incidenteSeleccionado.id}/reuniones`, {
        fecha: reuFecha, hora: reuHora, modalidad: reuModalidad, lugarEnlace: reuLugar, motivo: reuMotivo
      }, getConfig());

      setSuccess('Reunión agendada. Se ha notificado por correo a los tutores involucrados.');
      setMostrarModalReunion(false);
      setReuFecha(''); setReuHora(''); setReuMotivo('');

      // Recargamos los incidentes para ver el nuevo registro en el historial
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/incidentes', getConfig());
      setIncidentes(response.data);
      setIncidenteSeleccionado(response.data.find((i: any) => i.id === incidenteSeleccionado.id));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agendar la reunión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    setIsLoading(true);
    try {
      await axios.put(`https://api-sigie.delachemilio.xyz/api/incidentes/${incidenteSeleccionado.id}/estado`, {
        estado: nuevoEstado
      }, getConfig());
      
      setSuccess(`Incidente marcado como ${nuevoEstado.replace('_', ' ')}`);
      
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/incidentes', getConfig());
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
      await axios.delete(`https://api-sigie.delachemilio.xyz/api/incidentes/${incidenteSeleccionado.id}`, getConfig());
      
      setSuccess('Incidente eliminado. La acción ha sido auditada.');
      fetchIncidentes(); 
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al intentar eliminar el incidente');
    } finally {
      setIsLoading(false);
    }
  };

  const generarPDF = async () => {
    const elemento = document.getElementById('incidente-imprimible');
    if (!elemento) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(elemento, {
        quality: 1,
        pixelRatio: 2,
        width: 1024,
        style: { width: '1024px', margin: '0', padding: '20px', backgroundColor: '#ffffff' },
        filter: (node) => {
          if (node.tagName !== 'SCRIPT' && node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
          return true;
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Incidente_${incidenteSeleccionado.id}.pdf`);

      setSuccess('Expediente PDF generado correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      setError('Error al generar el documento PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const alumnosFiltrados = busqueda.trim() === '' 
    ? [] 
    : alumnos.filter(a => 
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.apellidoPaterno.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.matricula.includes(busqueda)
      );
  
  const incidentesFiltrados = incidentes.filter(inc => {
    const termino = busquedaGeneral.toLowerCase();
    const folio = (inc.folio || "").toLowerCase();
    const nombresAlumnos = inc.alumnos.map((a: any) => `${a.nombre} ${a.apellidoPaterno}`).join(' ').toLowerCase();
    return folio.includes(termino) || nombresAlumnos.includes(termino);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
      
      {/* NUEVO: MODAL PARA AGENDAR REUNIÓN (RF-012) */}
      {mostrarModalReunion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-blue-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Calendar className="h-5 w-5"/> Agendar Sesión de Seguimiento</h3>
              <button onClick={() => setMostrarModalReunion(false)} className="hover:text-red-300 transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleAgendarReunion} className="p-6 space-y-4">
              <p className="text-sm text-gray-500 mb-4">Al guardar, se enviará un correo automático con estos detalles a todos los tutores de los alumnos involucrados en el incidente.</p>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Motivo de la Reunión *</label>
                <input required type="text" value={reuMotivo} onChange={(e) => setReuMotivo(e.target.value)} placeholder="Ej. Firma de carta responsiva, aclaración de hechos..." className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha *</label>
                  <input required type="date" value={reuFecha} onChange={(e) => setReuFecha(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hora *</label>
                  <input required type="time" value={reuHora} onChange={(e) => setReuHora(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Modalidad</label>
                  <select value={reuModalidad} onChange={(e) => setReuModalidad(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual / Videollamada</option>
                    <option value="Llamada Telefónica">Llamada Telefónica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Lugar / Enlace</label>
                  <input type="text" value={reuLugar} onChange={(e) => setReuLugar(e.target.value)} placeholder="Ej. Dirección Escolar" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModalReunion(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  <Calendar className="h-4 w-4"/> {isLoading ? 'Procesando...' : 'Agendar y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-blue-600" />
          Módulo de Incidentes
        </h2>
        <div className="flex w-full md:w-auto bg-gray-100 rounded-lg p-1">
          <button onClick={() => setVista('lista')} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'lista' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <List className="h-4 w-4" /> Ver Historial
          </button>
          <button onClick={() => { setVista('crear'); setSuccess(''); setError(''); setAlumnosSeleccionados([]); setBusqueda(''); setTipo('Comportamiento'); setGravedad('Leve'); setDescripcionBreve(''); setDescripcion(''); }} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'crear' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <PlusCircle className="h-4 w-4" /> Registrar Incidencia
          </button>
        </div>
      </div>

      {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3"><CheckCircle className="h-5 w-5" /> {success}</div>}
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3"><XCircle className="h-5 w-5" /> {error}</div>}

      {/* --- VISTA LISTA --- */}
      {vista === 'lista' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio o nombre del alumno..."
                value={busquedaGeneral}
                onChange={(e) => setBusquedaGeneral(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4">Folio / Fecha</th>
                  <th className="p-4">Involucrados</th>
                  <th className="p-4">Estado / Gravedad</th>
                  <th className="p-4">Reportado Por</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidentesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      {busquedaGeneral ? 'No se encontraron incidentes que coincidan con la búsqueda.' : 'No hay incidentes registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  incidentesFiltrados.map((inc) => (
                    <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm">
                        <span className="font-bold text-blue-900 block">{inc.folio || `INC-OLD-${inc.id}`}</span>
                        <span className="text-gray-500 text-xs">{new Date(inc.fechaIncidencia).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {inc.alumnos.map((a: any) => `${a.nombre} ${a.apellidoPaterno}`).join(', ')}
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
                          Consultar Incidencia
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

      {/* --- VISTA CREAR INCIDENTE --- */}
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
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-48 overflow-y-auto bg-gray-50 p-2 space-y-2">
                {busqueda.trim() === '' ? (
                  <p className="text-center text-gray-500 text-sm mt-4">Ingresa una matrícula o nombre para buscar.</p>
                ) : alumnosFiltrados.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm mt-4">No se encontraron coincidencias.</p>
                ) : (
                  alumnosFiltrados.map((a) => (
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

      {/* --- VISTA EDITAR INCIDENTE (RF-005) --- */}
      {vista === 'editar' && incidenteSeleccionado && (
        <form onSubmit={handleGuardarEdicion} className="max-w-3xl space-y-6">
          <div className="space-y-5">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-500"/> Modificar Incidente: {incidenteSeleccionado.folio}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white"><option value="Comportamiento">Problema de Comportamiento</option><option value="Médico">Incidente Médico</option><option value="Académico">Problema Académico</option><option value="Bullying">Acoso / Bullying</option><option value="Daño">Daño a Instalaciones</option><option value="Otro">Otro</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Gravedad *</label><select value={gravedad} onChange={(e) => setGravedad(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white"><option value="Leve">Leve</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div>
            </div>
            
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Asunto / Resumen *</label><input required type="text" value={descripcionBreve} onChange={(e) => setDescripcionBreve(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción Inicial *</label><textarea required rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button type="button" onClick={() => setVista('detalle')} className="px-5 py-2.5 border text-gray-700 rounded-lg hover:bg-gray-50">Cancelar Edición</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2 font-bold shadow-md">
              <Edit className="h-4 w-4" /> {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {/* --- VISTA DETALLE Y EXPEDIENTE --- */}
      {vista === 'detalle' && incidenteSeleccionado && (
        <div className="space-y-6" id="incidente-imprimible">
          
          <div className="flex flex-wrap justify-end gap-3" data-html2canvas-ignore="true">

            {/* BOTÓN NUEVO: Agendar Reunión (RF-012) */}
            {puedeEditar && (
              <button 
                onClick={() => setMostrarModalReunion(true)}
                className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Calendar className="h-4 w-4" /> Programar Seguimiento
              </button>
            )}

            <button 
              onClick={generarPDF} 
              disabled={isExporting} 
              className="flex items-center justify-center gap-2 border border-indigo-600 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" /> {isExporting ? 'Generando...' : 'Descargar PDF'}
            </button>

            {puedeEditar && (
              <button 
                onClick={() => prepararEdicion(incidenteSeleccionado)}
                className="flex items-center justify-center gap-2 border border-yellow-500 text-yellow-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-50 transition-colors shadow-sm"
              >
                <Edit className="h-4 w-4" /> Modificar Incidencia
              </button>
            )}

            {incidenteSeleccionado.estado === 'ABIERTO' && (
              <button onClick={() => handleCambiarEstado('EN_PROCESO')} className="flex items-center justify-center border border-blue-600 text-blue-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 shadow-sm transition-colors">
                Atender
              </button>
            )}
            {incidenteSeleccionado.estado === 'EN_PROCESO' && (
              <button onClick={() => handleCambiarEstado('CERRADO')} className="flex items-center justify-center border border-green-600 text-green-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 shadow-sm transition-colors">
                Liberar
              </button>
            )}
            
            {puedeBorrar && (
              <button 
                onClick={handleEliminarIncidente} 
                disabled={isLoading}
                className="flex items-center justify-center gap-2 border border-red-600 text-red-600 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4" /> {isLoading ? 'Borrando...' : 'Eliminar'}
              </button>
            )}

            <button onClick={() => setVista('lista')} className="flex items-center justify-center border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium bg-white transition-colors shadow-sm">
              Volver
            </button>

          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden mt-2">
            <div className={`absolute top-0 left-0 w-2 h-full ${incidenteSeleccionado.gravedad === 'Alta' ? 'bg-red-500' : incidenteSeleccionado.gravedad === 'Media' ? 'bg-orange-400' : 'bg-yellow-400'}`}></div>
            
            <div className="ml-0 md:ml-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">
                  <span className="text-blue-600 mr-2">[{incidenteSeleccionado.folio || `INC-OLD-${incidenteSeleccionado.id}`}]</span> 
                  {incidenteSeleccionado.descripcionBreve}
                </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 ml-0 md:ml-3">
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Reportado Por</p><p className="text-sm font-medium text-gray-800">{incidenteSeleccionado.reportadoPor.nombre} {incidenteSeleccionado.reportadoPor.apellidoPaterno} <span className="text-gray-400">({incidenteSeleccionado.reportadoPor.rol})</span></p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Categoría</p><p className="text-sm font-medium text-gray-800">{incidenteSeleccionado.tipo}</p></div>
              <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Alumnos Involucrados</p><div className="flex flex-wrap gap-2">{incidenteSeleccionado.alumnos.map((a: any) => (<span key={a.id} className="bg-white border text-gray-700 text-xs px-2 py-1 rounded-md">{a.nombre} {a.apellidoPaterno}</span>))}</div></div>
            </div>

            {puedeVerMedico && incidenteSeleccionado.alumnos.some((a: any) => a.expedienteMedico) && (
              <div className="mt-6 ml-0 md:ml-3 bg-red-50/70 p-4 rounded-lg border border-red-100" data-html2canvas-ignore="true">
                <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5"/> Expedientes Médicos Vinculados (Acceso Restringido)
                </h4>
                <div className="space-y-3">
                  {incidenteSeleccionado.alumnos.filter((a: any) => a.expedienteMedico).map((a: any) => (
                    <div key={a.id} className="bg-white p-3 rounded shadow-sm border border-red-100">
                      <p className="text-sm font-bold text-gray-900">{a.nombre} {a.apellidoPaterno}</p>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{a.expedienteMedico}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pl-0 md:pl-3">
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6 mt-8"><Clock className="h-5 w-5 text-blue-600" /> Historial y Seguimientos</h4>
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
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${seg.descripcion.includes('[REUNIÓN') ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    {seg.descripcion.includes('[REUNIÓN') ? <Calendar className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-800 text-sm">{seg.autor.nombre} {seg.autor.apellidoPaterno} <span className="text-gray-400 font-normal">({seg.autor.rol})</span></span><span className="text-xs text-gray-500">{new Date(seg.fecha).toLocaleDateString()} {new Date(seg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{seg.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 bg-blue-50/50 p-6 rounded-xl border border-blue-100 max-w-3xl mx-auto" data-html2canvas-ignore="true">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">Agregar Actualización / Seguimiento</h4>
              <form onSubmit={handleAgregarSeguimiento}>
                <textarea required rows={3} value={nuevoSeguimiento} onChange={(e) => setNuevoSeguimiento(e.target.value)} placeholder="Ej. Se atendió al alumno, se llamó a los padres..." className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                <div className="flex justify-end mt-3"><button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">{isLoading ? 'Guardando...' : 'Registrar Seguimiento'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidentes;