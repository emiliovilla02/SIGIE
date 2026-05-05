import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, List, CheckCircle, XCircle, Shield, Edit, Search, Filter } from 'lucide-react';

const Usuarios = () => {
  const [vista, setVista] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuarioAEditar, setUsuarioAEditar] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de Busqueda y Filtro
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Formulario
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('DOCENTE');
  const [gradoAsignado, setGradoAsignado] = useState('');
  const [grupoAsignado, setGrupoAsignado] = useState('');

  // --- LOGICA DE JERARQUIA ---
  let usuarioLogueado: any = {};
  try {
    const str = localStorage.getItem('sigie_usuario');
    if (str && str !== 'null') usuarioLogueado = JSON.parse(str);
  } catch (e) {}

  const obtenerRangoRol = (r: string) => {
    const rangos: any = { 'ADMIN': 40, 'DIRECTOR': 30, 'DOCENTE': 20, 'ENFERMERA': 20, 'TUTOR': 10 };
    return rangos[r] || 0;
  };
  const miRango = obtenerRangoRol(usuarioLogueado?.rol);
  // ---------------------------

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    if (vista === 'lista') fetchUsuarios();
  }, [vista]);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/usuarios', getConfig());
      setUsuarios(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar la lista de usuarios');
    }
  };

  const prepararEdicion = (u: any) => {
    setUsuarioAEditar(u);
    setNombre(u.nombre);
    setApellidoPaterno(u.apellidoPaterno);
    setApellidoMaterno(u.apellidoMaterno || '');
    setEmail(u.email);
    setRol(u.rol);
    setGradoAsignado(u.gradoAsignado || '');
    setGrupoAsignado(u.grupoAsignado || '');
    setVista('editar');
    setError(''); setSuccess('');
  };

  const limpiarFormulario = () => {
    setNombre(''); setApellidoPaterno(''); setApellidoMaterno(''); setEmail(''); setPassword('');
    setRol('DOCENTE'); setGradoAsignado(''); setGrupoAsignado(''); setUsuarioAEditar(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    const payload = {
      nombre, apellidoPaterno, apellidoMaterno, email, rol,
      password: vista === 'crear' ? password : undefined,
      gradoAsignado: rol === 'DOCENTE' ? gradoAsignado : null,
      grupoAsignado: rol === 'DOCENTE' ? grupoAsignado : null
    };

    try {
      if (vista === 'crear') {
        await axios.post('https://api-sigie.delachemilio.xyz/api/usuarios', payload, getConfig());
        setSuccess('Usuario creado exitosamente. Ya puede iniciar sesion.');
      } else {
        await axios.put(`https://api-sigie.delachemilio.xyz/api/usuarios/${usuarioAEditar.id}`, payload, getConfig());
        setSuccess('Usuario modificado exitosamente.');
      }
      
      limpiarFormulario();
      setTimeout(() => setVista('lista'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado de Usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${u.nombre} ${u.apellidoPaterno} ${u.apellidoMaterno || ''}`.toLowerCase();
    
    const coincideBusqueda = nombreCompleto.includes(termino) || u.email.toLowerCase().includes(termino);
    const coincideRol = filtroRol === '' || u.rol === filtroRol;
    
    return coincideBusqueda && coincideRol;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-900" />
          Gestion de Usuarios
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => { limpiarFormulario(); setVista('lista'); }} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'lista' ? 'bg-white shadow text-blue-900' : 'text-gray-600 hover:text-gray-900'}`}>
            <List className="h-4 w-4" /> Personal
          </button>
          <button onClick={() => { limpiarFormulario(); setVista('crear'); setSuccess(''); setError(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${vista === 'crear' ? 'bg-white shadow text-blue-900' : 'text-gray-600 hover:text-gray-900'}`}>
            <UserPlus className="h-4 w-4" /> Alta de Usuario
          </button>
        </div>
      </div>

      {success && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3"><CheckCircle className="h-5 w-5" /> {success}</div>}
      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3"><XCircle className="h-5 w-5" /> {error}</div>}

      {vista === 'lista' && (
        <div className="space-y-4">
          {/* BARRA DE BUSQUEDA Y FILTROS */}
          <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full md:w-48 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Todos los Roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="DIRECTOR">Director</option>
                <option value="DOCENTE">Docente</option>
                <option value="ENFERMERA">Enfermeria</option>
                <option value="TUTOR">Tutor (Padres)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Correo Electronico</th>
                  <th className="p-4">Rol del Sistema</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron usuarios con esos criterios.</td></tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-500">#{u.id}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{u.nombre} {u.apellidoPaterno}</td>
                      <td className="p-4 text-sm text-gray-600">{u.email}</td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <span className="text-green-600 font-medium">{u.estado || 'Activo'}</span>
                      </td>
                      <td className="p-4 text-center">
                        {/* EVALUACION DE JERARQUIA PARA EDITAR */}
                        {miRango > obtenerRangoRol(u.rol) || usuarioLogueado?.id === u.id ? (
                          <button onClick={() => prepararEdicion(u)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 mx-auto">
                            <Edit className="h-4 w-4" /> Editar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No modificable</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(vista === 'crear' || vista === 'editar') && (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
              <input required type="text" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
              <input type="text" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Institucional / Personal *</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@sigie.com" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el Sistema *</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-900">
                {miRango > 30 && <option value="DIRECTOR">Director</option>}
                {miRango > 20 && <option value="DOCENTE">Docente</option>}
                {miRango > 20 && <option value="ENFERMERA">Enfermeria</option>}
                <option value="TUTOR">Padre de Familia / Tutor</option>
              </select>
            </div>
            
            {vista === 'crear' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena Temporal *</label>
                <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ej. CambioObligatorio123" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900" />
              </div>
            )}
          </div>
    
          {rol === 'DOCENTE' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-3">Asignacion de Aula (Titular)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">Grado (Numero) *</label>
                  <select required={rol === 'DOCENTE'} value={gradoAsignado} onChange={(e) => setGradoAsignado(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-900">
                    <option value="">Seleccione Grado</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                    <option value="4">4</option><option value="5">5</option><option value="6">6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-800 mb-1">Grupo (Letra) *</label>
                  <select required={rol === 'DOCENTE'} value={grupoAsignado} onChange={(e) => setGrupoAsignado(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-900">
                    <option value="">Seleccione Grupo</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { limpiarFormulario(); setVista('lista'); }} className="px-5 py-2.5 border text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
              {isLoading ? 'Guardando...' : vista === 'crear' ? 'Dar de Alta Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Usuarios;
