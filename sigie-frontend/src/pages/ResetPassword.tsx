import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import logoFull from '../assets/logo-full.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('https://api-sigie.delachemilio.xyz/api/reset-password', {
        token,
        nuevaPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al intentar cambiar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-blue-600 to-blue-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <div className="flex flex-col items-center mb-8">
            <img src={logoFull} alt="SIGIE Logo" className="h-20 object-contain mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Restablecer Contraseña</h2>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center"><CheckCircle className="h-16 w-16 text-green-500" /></div>
              <p className="text-green-700 font-medium">¡Contraseña actualizada con éxito!</p>
              <p className="text-sm text-gray-500">Serás redirigido al login en unos segundos...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input required type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="w-full pl-10 border rounded-lg py-2.5" placeholder="Escribe tu nueva contraseña" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input required type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} className="w-full pl-10 border rounded-lg py-2.5" placeholder="Repite tu contraseña" />
                </div>
              </div>

              <button disabled={isLoading} type="submit" className="w-full py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : 'Actualizar Contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;