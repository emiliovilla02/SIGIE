import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz de Express para poder guardar el usuario decodificado
export interface AuthRequest extends Request {
  usuario?: any;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // El token normalmente viaja en el encabezado (header) así: "Bearer eyJhbGciOi..."
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Separamos la palabra "Bearer" del token real

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    return;
  }

  try {
    // Intentamos verificar el token con tu secreto
    const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_respaldo');
    
    // Si es válido, guardamos los datos del usuario en la request y lo dejamos pasar
    req.usuario = decodificado;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
