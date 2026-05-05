import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Loader2 } from 'lucide-react';
import logoFull from '../assets/logo-full.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('https://api-sigie.delachemilio.xyz/api/login', {
        email,
        password
      });

      const { token, usuario } = response.data;

      localStorage.setItem('sigie_token', token);
      localStorage.setItem('sigie_usuario', JSON.stringify(usuario));

      navigate('/dashboard');
      
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Fondo con gradiente usando los colores del logo (Turquesa a Azul Profundo)
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-blue-600 to-blue-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Tarjeta principal con sombra pronunciada para resaltar sobre el fondo */}
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Logo y título integrados dentro de la tarjeta blanca */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex justify-center mb-2">
              <img src={logoFull} alt="SIGIE Logo" className="h-24 object-contain drop-shadow-sm" />
            </div>
            <p className="mt-2 text-center text-lg font-semibold text-gray-800 tracking-wide">
              Sistema de Gestión de Incidentes Escolares
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border transition-colors"
                  placeholder="Ingresa tu correo electrónico registrado"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-600 focus:border-blue-600 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border transition-colors"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
