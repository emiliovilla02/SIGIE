import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, List, FileText, CheckCircle, XCircle, Activity, AlertTriangle, Edit, UserCircle, Download, Search, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

const Alumnos = () => {
  const [vista, setVista] = useState<'lista' | 'crear' | 'detalle' | 'editar'>('lista');
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [tutores, setTutores] = useState<any[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de Busqueda y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');

  // NUEVO: Estado para buscar tutores en el formulario
  const [busquedaTutor, setBusquedaTutor] = useState('');

  // Estados del Formulario
  const [matricula, setMatricula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [grado, setGrado] = useState('1');
  const [grupo, setGrupo] = useState('A');
  const [tutoresIds, setTutoresIds] = useState<string[]>([]);
  const [expedienteMedico, setExpedienteMedico] = useState('');

  // Verificacion de Roles
  let usuarioActual: any = {};
  try {
    const usuarioString = localStorage.getItem('sigie_usuario');
    if (usuarioString && usuarioString !== 'null' && usuarioString !== 'undefined') {
      usuarioActual = JSON.parse(usuarioString);
    }
  } catch (error) {}

  const tienePermisos = usuarioActual?.rol === 'ADMIN' || usuarioActual?.rol === 'DIRECTOR';
  
  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    if (vista === 'lista') fetchAlumnos();
    if (vista === 'crear' || vista === 'editar') fetchTutores();
  }, [vista]);

  const fetchAlumnos = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/alumnos', getConfig());
      setAlumnos(response.data);
    } catch (error) {
      console.error('Error al cargar alumnos', error);
    }
  };

  const fetchTutores = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/tutores', getConfig());
      setTutores(response.data);
    } catch (error) {
      console.error('Error al cargar la lista de tutores', error);
    }
  };

  const verDetalles = async (id: number) => {
    try {
      const response = await axios.get(`https://api-sigie.delachemilio.xyz/api/alumnos/${id}`, getConfig());
      setAlumnoSeleccionado(response.data);
      setVista('detalle');
    } catch (error) {
      console.error('Error al cargar los detalles del alumno', error);
    }
  };

  const prepararEdicion = () => {
    setMatricula(alumnoSeleccionado.matricula);
    setNombre(alumnoSeleccionado.nombre);
    setApellidoPaterno(alumnoSeleccionado.apellidoPaterno);
    setApellidoMaterno(alumnoSeleccionado.apellidoMaterno || '');
    setGrado(alumnoSeleccionado.grado);
    setGrupo(alumnoSeleccionado.grupo || 'A');
    setTutoresIds(alumnoSeleccionado.tutores ? alumnoSeleccionado.tutores.map((t: any) => t.id.toString()) : []);
    setExpedienteMedico(alumnoSeleccionado.expedienteMedico || '');
    setBusquedaTutor(''); // Limpiamos la búsqueda
    setVista('editar');
    setError(''); setSuccess('');
  };

  const limpiarFormulario = () => {
    setMatricula(''); setNombre(''); setApellidoPaterno(''); setApellidoMaterno(''); setExpedienteMedico('');
    setGrado('1'); setGrupo('A'); setTutoresIds([]); setBusquedaTutor('');
  };

  const toggleTutor = (id: string) => {
    setTutoresIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    const payload = { matricula, nombre, apellidoPaterno, apellidoMaterno, grado, grupo, expedienteMedico, tutoresIds };

    try {
      if (vista === 'crear') {
        await axios.post('https://api-sigie.delachemilio.xyz/api/alumnos', payload, getConfig());
        setSuccess('Alumno registrado correctamente.');
      } else if (vista === 'editar') {
        await axios.put(`https://api-sigie.delachemilio.xyz/api/alumnos/${alumnoSeleccionado.id}`, payload, getConfig());
        setSuccess('Información actualizada correctamente.');
      }

      limpiarFormulario();
      setTimeout(() => setVista('lista'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const generarPDF = async () => {
    const elemento = document.getElementById('expediente-imprimible');
    if (!elemento) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(elemento, {
        quality: 1,
        pixelRatio: 2,
        width: 1024,
        style: { width: '1024px', margin: '0', padding: '20px' },
        filter: (node) => {
          if (node.tagName !== 'SCRIPT' && node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') {
            return false;
          }
          return true;
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Expediente_${alumnoSeleccionado.matricula}.pdf`);

      setSuccess('Expediente descargado correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Detalle tecnico del error PDF:", error);
      setError('Error al generar el documento PDF.');
    } finally {
      setIsLoading(false);
      setIsExporting(false);
    }
  };

  // Lógica de Filtrado General
  const alumnosFiltrados = alumnos.filter(a => {
    const terminoBusqueda = busqueda.toLowerCase();
    const nombreCompleto = `${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno || ''}`.toLowerCase();
    const coincideBusqueda = nombreCompleto.includes(terminoBusqueda) || a.matricula.toLowerCase().includes(terminoBusqueda);
    const coincideGrado = filtroGrado === '' || a.grado.toString() === filtroGrado;
    return coincideBusqueda && coincideGrado;
  });

  // NUEVO: Lógica de Filtrado Exclusiva para la lista de tutores del formulario
  const tutoresFiltrados = tutores.filter(t => 
    `${t.nombre} ${t.apellidoPaterno} ${t.email}`.toLowerCase().includes(busquedaTutor.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Directorio de Alumnos
        </h2>
        <div className="flex w-full md:w-auto bg-gray-100 rounded-lg p-1">
          <button onClick={() => setVista('lista')} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'lista' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <List className="h-4 w-4" /> Directorio de Alumnos
          </button>

          {tienePermisos && (
            <button onClick={() => { limpiarFormulario(); setVista('crear'); setSuccess(''); setError(''); }} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'crear' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              <UserPlus className="h-4 w-4" /> Registrar Nuevo Alumno
            </button>
          )}
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
                placeholder="Buscar por matricula o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filtroGrado}
                onChange={(e) => setFiltroGrado(e.target.value)}
                className="w-full md:w-48 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos los Grados</option>
                <option value="1">1er Grado</option>
                <option value="2">2do Grado</option>
                <option value="3">3er Grado</option>
                <option value="4">4to Grado</option>
                <option value="5">5to Grado</option>
                <option value="6">6to Grado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4">Matricula</th>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Grado y Grupo</th>
                  <th className="p-4">Contactos Vinculados</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron alumnos con los criterios de busqueda.</td></tr>
                ) : (
                  alumnosFiltrados.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{a.matricula}</td>
                      <td className="p-4 text-gray-700">{a.nombre} {a.apellidoPaterno} {a.apellidoMaterno}</td>
                      <td className="p-4 font-bold text-blue-800 bg-blue-50/50">
                        {a.grado}° "{a.grupo || '-'}"
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {a.tutores && a.tutores.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {a.tutores.map((t: any) => (
                              <div key={t.id} className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4 text-gray-400" />
                                <span>{t.nombre} {t.apellidoPaterno}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-red-400 italic text-xs border border-red-200 px-2 py-0.5 rounded bg-red-50">Sin Tutor Asignado</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => verDetalles(a.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1 w-full">
                          <FileText className="h-4 w-4" /> Expediente
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

      {/* --- VISTA CREAR Y EDITAR ALUMNO --- */}
      {(vista === 'crear' || vista === 'editar') && (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Matricula Escolar *</label>
                <input required type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Ej. ALM-2026-001" className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Grado (Numero) *</label>
                <select required value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                  <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Grupo (Letra) *</label>
                <select required value={grupo} onChange={(e) => setGrupo(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
                <input required type="text" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                <input type="text" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (s) *</label>
                <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* SECCIÓN ACTUALIZADA: Búsqueda y selección de tutores */}
            <div className="md:col-span-3 border-t pt-4">
              <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-2"><UserCircle className="h-5 w-5 text-gray-500"/> Vincular Padres / Tutores de Contacto</label>
              <p className="text-xs text-gray-500 mb-3">Busque y seleccione a los tutores registrados en el sistema. Puede vincular más de uno.</p>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar tutor por nombre o correo electrónico"
                  value={busquedaTutor}
                  onChange={(e) => setBusquedaTutor(e.target.value)}
                  className="pl-9 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
              </div>

              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-gray-50 p-2 space-y-1">
                {tutoresFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2 text-center">
                    {busquedaTutor ? 'No se encontraron tutores con esa búsqueda.' : 'No hay tutores registrados en el sistema.'}
                  </p>
                ) : (
                  tutoresFiltrados.map(t => (
                    <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${tutoresIds.includes(t.id.toString()) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={tutoresIds.includes(t.id.toString())} 
                        onChange={() => toggleTutor(t.id.toString())} 
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{t.nombre} {t.apellidoPaterno}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expediente Medico / Alergias / Condiciones</label>
              <textarea rows={3} value={expedienteMedico} onChange={(e) => setExpedienteMedico(e.target.value)} placeholder="Ej. Alergico a la penicilina. Asma leve." className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => { limpiarFormulario(); setVista(vista === 'editar' ? 'detalle' : 'lista'); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : vista === 'crear' ? 'Registrar Alumno' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {/* --- VISTA DETALLE DEL EXPEDIENTE --- */}
      {vista === 'detalle' && alumnoSeleccionado && (
        <div className="space-y-6" id="expediente-imprimible">
          <div className="bg-blue-50 p-4 md:p-6 rounded-lg border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm" data-html2canvas-ignore="false">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-blue-900">{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellidoPaterno} {alumnoSeleccionado.apellidoMaterno}</h3>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
                <span className="bg-white border border-blue-200 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Matricula: {alumnoSeleccionado.matricula}
                </span>
                <span className="bg-white border border-blue-200 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Aula: {alumnoSeleccionado.grado}° "{alumnoSeleccionado.grupo}"
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0" data-html2canvas-ignore="true">
              <button
                onClick={generarPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-1 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg border border-indigo-700 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex-1 md:flex-none"
              >
                <Download className="h-4 w-4" /> {isExporting ? 'Generando...' : 'Descargar PDF'}
              </button>

              {tienePermisos && (
                <button onClick={prepararEdicion} className="flex items-center justify-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg border border-blue-700 hover:bg-blue-700 transition-colors shadow-sm flex-1 md:flex-none">
                  <Edit className="h-4 w-4" /> Editar
                </button>
              )}
              <button onClick={() => setVista('lista')} className="text-sm bg-white px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full md:w-auto">Volver</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2">
                <UserCircle className="h-5 w-5 text-indigo-500" /> Contactos / Tutores ({alumnoSeleccionado.tutores?.length || 0})
              </h4>
              {alumnoSeleccionado.tutores && alumnoSeleccionado.tutores.length > 0 ? (
                <div className="space-y-3">
                  {alumnoSeleccionado.tutores.map((tutor: any) => (
                    <div key={tutor.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="font-bold text-gray-900 text-sm mb-1">{tutor.nombre} {tutor.apellidoPaterno}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-2"><span className="font-medium">✉</span> {tutor.email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-700">Sin Tutores Asignados</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2"><Activity className="h-5 w-5 text-red-500" /> Informacion Medica</h4>
              <p className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px]">
                {alumnoSeleccionado.expedienteMedico || 'No hay informacion medica registrada para este alumno.'}
              </p>
            </div>

            <div className="md:col-span-2 border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                <Activity className="h-5 w-5 text-red-500" /> Bitacora de Visitas a Enfermeria ({alumnoSeleccionado.atenciones?.length || 0})
              </h4>

              {!alumnoSeleccionado.atenciones || alumnoSeleccionado.atenciones.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500 italic">No hay registros de atenciones menores o curaciones rapidas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alumnoSeleccionado.atenciones.map((at: any) => (
                    <div key={at.id} className="bg-red-50/30 p-4 rounded-lg border border-red-100 relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                          {at.nombreIntervencion}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(at.fechaAtencion).toLocaleDateString()} - {new Date(at.fechaAtencion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed italic">"{at.descripcion}"</p>
                      {at.telefonoIntervencion && (
                        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                          📞 Notificado a: <span className="font-semibold">{at.telefonoIntervencion}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" /> Historial de Incidentes Disciplinarios ({alumnoSeleccionado.incidentes?.length || 0})
              </h4>
              {alumnoSeleccionado.incidentes?.length === 0 ? (
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-green-800">Expediente Disciplinario Limpio</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alumnoSeleccionado.incidentes.map((inc: any) => (
                    <div key={inc.id} className="bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden">
                      <div className={`absolute left-0 top-0 w-1.5 h-full ${inc.gravedad === 'Alta' ? 'bg-red-500' : inc.gravedad === 'Media' ? 'bg-orange-400' : 'bg-yellow-400'}`}></div>
                      <div className="flex justify-between font-bold text-gray-900 mb-2 pl-2">
                        <span className="text-sm">{inc.tipo}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full border bg-gray-50 text-gray-600">{new Date(inc.fechaIncidencia).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm mb-3 pl-2 line-clamp-2">{inc.descripcionBreve}</p>
                      <div className="flex justify-between items-center pl-2 pt-2 border-t text-xs">
                        <span className="text-gray-500">Por: {inc.reportadoPor.nombre}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${inc.estado === 'ABIERTO' ? 'bg-red-100 text-red-700' : inc.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {inc.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Alumnos;