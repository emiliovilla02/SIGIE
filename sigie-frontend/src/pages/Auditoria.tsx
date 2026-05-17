import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Download, Search, Clock, User, Monitor, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

const Auditoria = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const getConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('sigie_token')}` }
  });

  useEffect(() => {
    fetchAuditoria();
  }, []);

  const fetchAuditoria = async () => {
    try {
      const response = await axios.get('https://api-sigie.delachemilio.xyz/api/auditoria', getConfig());
      setRegistros(response.data);
    } catch (error) {
      console.error('Error al cargar la auditoría');
    } finally {
      setIsLoading(false);
    }
  };

  const generarPDF = async () => {
    const elemento = document.getElementById('auditoria-imprimible');
    if (!elemento) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(elemento, {
        quality: 1,
        pixelRatio: 2,
        width: 1200,
        style: { width: '1200px', margin: '0', padding: '20px', backgroundColor: '#ffffff' },
        filter: (node) => {
          if (node.tagName !== 'SCRIPT' && node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
          return true;
        }
      });

      const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' para Horizontal (Landscape)
      const pdfWidth = 297;
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert('Error al generar el documento PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const registrosFiltrados = registros.filter(r => 
    r.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.detalles.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado y Controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><ShieldAlert className="h-6 w-6 text-red-700" /></div>
            Generar Auditoria
          </h2>
          <p className="text-gray-500 mt-1">Registro inmutable de accesos y acciones críticas del sistema.</p>
        </div>

        <button 
          onClick={generarPDF} 
          disabled={isExporting || isLoading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-colors shadow-md ${
            isExporting || isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <Download className="h-4 w-4" /> {isExporting ? 'Procesando...' : 'Exportar a PDF'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="auditoria-imprimible">
        
        {/* Buscador (Ignorado en el PDF) */}
        <div className="p-4 border-b border-gray-100 bg-gray-50" data-html2canvas-ignore="true">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalles..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        <div className="p-4 bg-white border-b border-gray-200 hidden" style={{ display: isExporting ? 'block' : 'none' }}>
          <h3 className="text-xl font-bold text-gray-800 text-center">Reporte de Auditoría Interna SIGIE</h3>
          <p className="text-sm text-gray-500 text-center">Generado el: {new Date().toLocaleString()}</p>
        </div>

        {/* Tabla de Auditoría */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-xs font-bold border-b border-gray-200">
                <th className="p-4"><Clock className="h-4 w-4 inline mr-1"/> Fecha / Hora</th>
                <th className="p-4"><User className="h-4 w-4 inline mr-1"/> Usuario / Rol</th>
                <th className="p-4"><Activity className="h-4 w-4 inline mr-1"/> Acción</th>
                <th className="p-4"><Monitor className="h-4 w-4 inline mr-1"/> Dir. IP</th>
                <th className="p-4 w-1/3">Detalle del Cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando registros...</td></tr>
              ) : registrosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No se encontraron registros de auditoría.</td></tr>
              ) : (
                registrosFiltrados.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 whitespace-nowrap">
                      <span className="font-semibold block text-gray-800">{new Date(reg.fecha).toLocaleDateString()}</span>
                      <span className="text-xs">{new Date(reg.fecha).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{reg.usuario.nombre} {reg.usuario.apellidoPaterno}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{reg.usuario.rol}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                        reg.accion.includes('ELIMINAR') ? 'bg-red-50 text-red-700 border-red-200' : 
                        reg.accion.includes('CREAR') ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {reg.accion.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{reg.ipAddress || '127.0.0.1'}</td>
                    <td className="p-4 text-gray-700 leading-snug">{reg.detalles}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Auditoria;