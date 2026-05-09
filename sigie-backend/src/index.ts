import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import jwt from 'jsonwebtoken';
import { verificarToken, AuthRequest } from './middlewares/auth';
import nodemailer from 'nodemailer';

// Cargar variables de entorno
dotenv.config();

const app = express();
// Mantenemos el puerto 4000 para no chocar con el otro proyecto que tienes en el 3000
const PORT = process.env.PORT || 4000;

// EL ESTÁNDAR DEFINITIVO DE PRISMA v7: 
// Se pasan las credenciales directamente al adaptador oficial. Prisma gestiona las conexiones.
const adapter = new PrismaMariaDb({
  host: 'localhost',
  user: 'sigie_user',
  password: 'sigie12345',
  database: 'sigie_db'
});

const prisma = new PrismaClient({ adapter });

// Middlewares
app.use(cors());
app.use(express.json());

// --- RUTAS ---

// Ruta de prueba (Healthcheck)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Servidor SIGIE funcionando correctamente' });
});

// Configuración del servicio de correos (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ==========================================
// MÓDULO DE USUARIOS Y JERARQUÍA
// ==========================================

// Función auxiliar para determinar el nivel de jerarquía
const obtenerRangoRol = (rol: string) => {
  const rangos: any = { 'ADMIN': 40, 'DIRECTOR': 30, 'DOCENTE': 20, 'ENFERMERA': 20, 'TUTOR': 10 };
  return rangos[rol] || 0;
};

// 1. OBTENER todos los usuarios (Visible para personal, oculto para tutores)
app.get('/api/usuarios', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.usuario?.rol === 'TUTOR') {
      res.status(403).json({ error: 'Acceso denegado.' });
      return;
    }
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true, email: true, rol: true, estado: true, gradoAsignado: true, grupoAsignado: true },
      orderBy: { id: 'desc' }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. CREAR un nuevo usuario (Respetando Jerarquía)
app.post('/api/usuarios', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rangoEjecutando = obtenerRangoRol(req.usuario!.rol);
    const rangoNuevo = obtenerRangoRol(req.body.rol);

    // Regla de Jerarquía: No puedes crear a alguien de tu mismo nivel o superior
    if (rangoEjecutando <= rangoNuevo) {
      res.status(403).json({ error: 'Jerarquía insuficiente: No puedes crear usuarios de este nivel.' });
      return;
    }

    const { email, password, nombre, apellidoPaterno, apellidoMaterno, rol, gradoAsignado, grupoAsignado } = req.body;
    
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ error: 'El email ya está registrado' }) as any;

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email, password: hashedPassword, nombre, apellidoPaterno,
        apellidoMaterno: apellidoMaterno === '' ? null : apellidoMaterno,
        rol, gradoAsignado, grupoAsignado
      }
    });

    const { password: _, ...usuarioSinPassword } = nuevoUsuario;
    res.status(201).json({ message: 'Usuario registrado', usuario: usuarioSinPassword });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 3. NUEVA RUTA: EDITAR un usuario (Respetando Jerarquía)
app.put('/api/usuarios/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idObjetivo = Number(req.params.id);
    const usuarioObjetivo = await prisma.usuario.findUnique({ where: { id: idObjetivo } });
    
    if (!usuarioObjetivo) return res.status(404).json({ error: 'Usuario no encontrado' }) as any;

    const rangoEjecutando = obtenerRangoRol(req.usuario!.rol);
    const rangoObjetivo = obtenerRangoRol(usuarioObjetivo.rol);

    // Regla de Jerarquía: Solo puedes editar a los que están por debajo de ti
    if (rangoEjecutando <= rangoObjetivo) {
      res.status(403).json({ error: 'Jerarquía insuficiente: No puedes modificar a este usuario.' });
      return;
    }

    const { email, nombre, apellidoPaterno, apellidoMaterno, rol, gradoAsignado, grupoAsignado } = req.body;

    const actualizado = await prisma.usuario.update({
      where: { id: idObjetivo },
      data: {
        email, nombre, apellidoPaterno,
        apellidoMaterno: apellidoMaterno === '' ? null : apellidoMaterno,
        rol, gradoAsignado, grupoAsignado
      },
      select: { id: true, nombre: true, email: true, rol: true } // No devolvemos password
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Ruta para INICIAR SESIÓN (Login)
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      return;
    }

    // 1. Buscar al usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // 2. Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // 3. Generar el JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto_de_respaldo',
      { expiresIn: '8h' } // El token durará 8 horas
    );

    // 4. Enviar respuesta exitosa (sin la contraseña)
    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      message: 'Inicio de sesión exitoso',
      usuario: usuarioSinPassword,
      token
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================

// 1. Solicitar el reseteo (Genera token y envía correo)
app.post('/api/recuperar-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Debes proporcionar un correo electrónico.' });
      return;
    }

    // Buscamos si el correo existe en el sistema
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      // Por seguridad, damos un mensaje genérico o específico. Aquí seremos claros:
      res.status(404).json({ error: 'No existe ninguna cuenta registrada con este correo.' });
      return;
    }

    // Generamos un token especial que SOLO dura 15 minutos
    const resetToken = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'secreto_de_respaldo',
      { expiresIn: '15m' }
    );

    // Creamos el enlace que llevará al usuario a la nueva pantalla que haremos en React
    const resetUrl = `https://sigie.delachemilio.xyz/reset-password?token=${resetToken}`;

    // Enviamos el correo con Nodemailer
    await transporter.sendMail({
      from: `"Soporte SIGIE" <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: `🔒 Recuperación de Contraseña - SIGIE`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Recuperación de Contraseña</h2>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema SIGIE.</p>
          <p>Si fuiste tú, haz clic en el siguiente botón para crear una nueva contraseña. <b>Este enlace caducará en 15 minutos.</b></p>
          <br>
          <div style="text-align: center;">
            <a href="${resetUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer mi Contraseña</a>
          </div>
          <br><br>
          <p style="font-size: 12px; color: #6b7280;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
          <p style="font-size: 11px; color: #3b82f6; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 30px;" />
          <p style="font-size: 11px; color: #6b7280; text-align: center;">Si no solicitaste este cambio, simplemente ignora este correo. Tu cuenta sigue segura.</p>
        </div>
      `
    });

    res.json({ message: 'Se han enviado las instrucciones a tu correo electrónico.' });
  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    res.status(500).json({ error: 'Hubo un error al intentar enviar el correo de recuperación.' });
  }
});

// 2. Ejecutar el reseteo (Recibe el token y la nueva contraseña)
app.post('/api/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      res.status(400).json({ error: 'Faltan datos para realizar el cambio.' });
      return;
    }

    // Verificamos si el token es válido y no ha caducado
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_de_respaldo');
    } catch (err) {
      res.status(401).json({ error: 'El enlace de recuperación es inválido o ya ha caducado. Por favor solicita uno nuevo.' });
      return;
    }

    // Si el token es válido, encriptamos la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizamos al usuario en la base de datos
    await prisma.usuario.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la contraseña.' });
  }
});

// 4. NUEVA RUTA: ELIMINAR un usuario (PROTEGIDO: Solo ADMIN)
app.delete('/api/usuarios/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idObjetivo = Number(req.params.id);

    // 1. Verificación de seguridad: Solo el ADMIN puede borrar
    if (req.usuario?.rol !== 'ADMIN') {
      res.status(403).json({ error: 'Nivel de jerarquía insuficiente para eliminar usuarios.' });
      return;
    }

    // 2. Protección contra auto-borrado suicida
    if (req.usuario.id === idObjetivo) {
      res.status(400).json({ error: 'Operación denegada: No puedes eliminar tu propia cuenta de Administrador.' });
      return;
    }

    // 3. Destruimos el usuario
    await prisma.usuario.delete({
      where: { id: idObjetivo }
    });

    res.json({ message: 'Usuario eliminado del sistema correctamente.' });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    // Si el usuario ya reportó incidentes, la base de datos protegerá esos registros y evitará el borrado
    if (error.code === 'P2003') {
      res.status(400).json({ error: 'No se puede eliminar a este usuario porque ya tiene registros o incidentes asociados en el sistema.' });
    } else {
      res.status(500).json({ error: 'Error interno al intentar eliminar el usuario.' });
    }
  }
});

// Ruta PROTEGIDA de prueba (Solo entras si tienes el token)
app.get('/api/perfil', verificarToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: '¡Bienvenido a la zona protegida de SIGIE!',
    datosDelToken: req.usuario
  });
});

// ==========================================
// MÓDULO DE ALUMNOS Y TUTORES
// ==========================================

// OBTENER todos los tutores (Para el menú desplegable en el frontend)
app.get('/api/tutores', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const tutores = await prisma.usuario.findMany({
      where: { rol: 'TUTOR', estado: 'ACTIVO' },
      select: { id: true, nombre: true, apellidoPaterno: true, email: true }
    });
    res.json(tutores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de tutores' });
  }
});

// Obtener todos los alumnos (Necesario para el select del formulario)
app.get('/api/alumnos', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const alumnos = await prisma.alumno.findMany({
      include: {
        // Le pedimos a Prisma que traiga también el nombre y correo del papá/mamá
        tutor: { 
          select: { nombre: true, apellidoPaterno: true, email: true } 
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// OBTENER detalles de un alumno específico (Incluyendo su historial)
app.get('/api/alumnos/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const alumno = await prisma.alumno.findUnique({
      where: { id: Number(id) },
      include: {
        incidentes: {
          include: { reportadoPor: { select: { nombre: true, apellidoPaterno: true, rol: true } } },
          orderBy: { fechaIncidencia: 'desc' }
        },
        atenciones: {
          orderBy: { fechaAtencion: 'desc' }
        },
	tutor: true,
        // NUEVO: Traemos el historial de enfermería
        atenciones: {
          orderBy: { fechaAtencion: 'desc' }
        }
      }
    });

    if (!alumno) {
      res.status(404).json({ error: 'Alumno no encontrado' });
      return;
    }

    res.json(alumno);
  } catch (error) {
    console.error('Error al obtener el alumno:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// CREAR un nuevo alumno (PROTEGIDO: Solo ADMIN o DIRECTOR)
app.post('/api/alumnos', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Capa de Seguridad RBAC
    const rolUsuario = req.usuario?.rol;
    if (rolUsuario !== 'ADMIN' && rolUsuario !== 'DIRECTOR') {
      res.status(403).json({ error: 'Acceso denegado. Solo Administración o Dirección pueden registrar alumnos.' });
      return;
    }

    const { matricula, nombre, apellidoPaterno, apellidoMaterno, grado, grupo, tutorId, expedienteMedico } = req.body;

    if (!matricula || !nombre || !apellidoPaterno || !grado) {
      res.status(400).json({ error: 'Faltan campos obligatorios' });
      return;
    }

    const nuevoAlumno = await prisma.alumno.create({
      data: { matricula, nombre, apellidoPaterno, apellidoMaterno, grado, 
	grupo: grupo === '' ? null : grupo,
	expedienteMedico,
	tutorId: tutorId ? Number(tutorId) : null
	}
    });

    res.status(201).json({ message: 'Alumno registrado exitosamente', alumno: nuevoAlumno });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un alumno con esta matrícula.' });
    } else {
	console.error('Error al registrar alumno:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// ACTUALIZAR un alumno existente (PROTEGIDO: Solo ADMIN o DIRECTOR)
app.put('/api/alumnos/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Capa de Seguridad RBAC
    const rolUsuario = req.usuario?.rol;
    if (rolUsuario !== 'ADMIN' && rolUsuario !== 'DIRECTOR') {
      res.status(403).json({ error: 'Acceso denegado. Solo Administración o Dirección pueden modificar alumnos.' });
      return;
    }

    const { id } = req.params;
    const { matricula, nombre, apellidoPaterno, apellidoMaterno, grado, grupo, expedienteMedico, tutorId } = req.body;

    const alumnoActualizado = await prisma.alumno.update({
      where: { id: Number(id) },
      data: { matricula, nombre, apellidoPaterno, apellidoMaterno, grado, 
	grupo: grupo === '' ? null : grupo,
	expedienteMedico,
	tutorId: tutorId ? Number(tutorId) : null
	}
    });

    res.json({ message: 'Información actualizada correctamente', alumno: alumnoActualizado });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Alumno no encontrado.' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'La matrícula ingresada ya pertenece a otro alumno.' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// 4. Portal Familiar (Solo trae los hijos del tutor logueado)
app.get('/api/mis-hijos', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Protección de seguridad: Solo los Tutores pueden entrar aquí
    if (req.usuario?.rol !== 'TUTOR') {
      res.status(403).json({ error: 'Acceso denegado. Vista exclusiva para Padres de Familia.' });
      return;
    }

    // Buscamos a los alumnos que tengan como tutorId el ID del usuario actual
    const misHijos = await prisma.alumno.findMany({
      where: { tutorId: req.usuario.id },
      include: {
        // Traemos también el historial de incidentes de cada hijo
        incidentes: {
          include: {
            reportadoPor: { select: { nombre: true, apellidoPaterno: true, rol: true } }
          },
          orderBy: { fechaIncidencia: 'desc' }
        }
      }
    });

    res.json(misHijos);
  } catch (error) {
    console.error('Error al cargar portal familiar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// NUEVA RUTA: ACTUALIZAR expediente médico por el Tutor (Solo sus hijos)
app.put('/api/mis-hijos/:id/expediente', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Protección de seguridad: Solo Tutores
    if (req.usuario?.rol !== 'TUTOR') {
      res.status(403).json({ error: 'Acceso denegado. Solo los tutores pueden usar esta ruta.' });
      return;
    }

    const alumnoId = Number(req.params.id);
    const { expedienteMedico } = req.body;

    // Verificación de seguridad clave: ¿Este alumno realmente es hijo de este tutor?
    const alumno = await prisma.alumno.findUnique({
      where: { id: alumnoId }
    });

    if (!alumno || alumno.tutorId !== req.usuario.id) {
      res.status(403).json({ error: 'Operación rechazada: No tienes permiso para modificar este expediente.' });
      return;
    }

    // Actualizamos ÚNICAMENTE el campo médico
    const alumnoActualizado = await prisma.alumno.update({
      where: { id: alumnoId },
      data: { expedienteMedico }
    });

    res.json({ message: 'Expediente médico actualizado correctamente', alumno: alumnoActualizado });
  } catch (error) {
    console.error('Error al actualizar expediente por tutor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// MÓDULO DE INCIDENTES
// ==========================================

// CREAR un nuevo incidente (Soporta múltiples alumnos)
app.post('/api/incidentes', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tipo, gravedad, descripcionBreve, descripcion, alumnosIds } = req.body;
    const reportadoPorId = req.usuario.id; 

    // Aquí ya busca el arreglo "alumnosIds"
    if (!tipo || !gravedad || !descripcion || !alumnosIds || !Array.isArray(alumnosIds) || alumnosIds.length === 0) {
      res.status(400).json({ error: 'Faltan campos obligatorios o no se seleccionaron alumnos.' });
      return;
    }

    const nuevoIncidente = await prisma.incidente.create({
      data: {
        tipo,
        gravedad,
        descripcionBreve,
        descripcion,
        reportadoPorId,
        alumnos: {
          connect: alumnosIds.map((id: any) => ({ id: Number(id) }))
        }
      }
    });

    // --- Generación de Folio Automático ---
    // Crea un folio tipo: INC-2026-0005
    const folioGenerado = `INC-${new Date().getFullYear()}-${nuevoIncidente.id.toString().padStart(4, '0')}`;
    
    await prisma.incidente.update({
      where: { id: nuevoIncidente.id },
      data: { folio: folioGenerado }
    });

    // 2. SECCIÓN DE NOTIFICACIONES POR CORREO (RF-009)
    // Buscamos a los alumnos involucrados y traemos los datos de sus tutores
    const alumnosInvolucrados = await prisma.alumno.findMany({
      where: { id: { in: alumnosIds } },
      include: { tutor: true }
    });

    // Recorremos cada alumno afectado
    for (const alumno of alumnosInvolucrados) {
      // Si el alumno tiene un tutor asignado y el tutor tiene correo...
      if (alumno.tutor && alumno.tutor.email) {
        try {
          // Disparamos el correo electrónico
          await transporter.sendMail({
            from: `"Sistema SIGIE" <${process.env.EMAIL_USER}>`,
            to: alumno.tutor.email,
            subject: `🚨 Aviso SIGIE: Nuevo reporte registrado - ${alumno.nombre} ${alumno.apellidoPaterno}`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">Aviso Oficial del Sistema SIGIE</h2>
                <p>Estimado/a <strong>${alumno.tutor.nombre} ${alumno.tutor.apellidoPaterno}</strong>,</p>
                <p>Le informamos que el personal de la institución ha registrado un nuevo incidente que involucra a su hijo/a <strong>${alumno.nombre}</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${gravedad === 'Alta' ? '#ef4444' : gravedad === 'Media' ? '#f97316' : '#eab308'}; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Categoría:</strong> ${tipo}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Gravedad:</strong> ${gravedad}</p>
                  <p style="margin: 0;"><strong>Asunto Principal:</strong> ${descripcionBreve}</p>
                </div>

                <p>Para conocer los detalles completos del reporte y darle seguimiento, por favor inicie sesión en su <strong>Portal Familiar</strong>.</p>
                <br>
                <a href="http://localhost:5173/login" style="background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Portal SIGIE</a>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 30px;" />
                <p style="font-size: 11px; color: #6b7280; text-align: center;">Este es un mensaje automático generado por el Sistema de Información para la Gestión de Incidentes Escolares (SIGIE). Por favor no responda directamente a esta dirección de correo.</p>
              </div>
            `
          });
          console.log(`Correo de notificación enviado exitosamente a: ${alumno.tutor.email}`);
        } catch (mailError) {
          console.error(`Fallo al enviar correo a ${alumno.tutor.email}:`, mailError);
        }
      }
    }

    res.status(201).json({ message: 'Incidente registrado exitosamente', incidente: nuevoIncidente });
  } catch (error) {
    console.error('Error al crear incidente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// NUEVA RUTA: ELIMINAR un incidente (Crea registro de auditoría automático)
app.delete('/api/incidentes/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Verificación de seguridad: Solo ADMIN y DIRECTOR pueden borrar
    if (req.usuario?.rol !== 'ADMIN' && req.usuario?.rol !== 'DIRECTOR') {
      res.status(403).json({ error: 'Nivel de jerarquía insuficiente para eliminar registros.' });
      return;
    }

    const incidenteId = Number(req.params.id);

    // 2. Buscamos el incidente ANTES de borrarlo para copiar su información
    const incidenteABorrar = await prisma.incidente.findUnique({ 
      where: { id: incidenteId },
      include: { alumnos: true }
    });

    if (!incidenteABorrar) {
      res.status(404).json({ error: 'El incidente no existe.' });
      return;
    }

    const nombresAlumnos = incidenteABorrar.alumnos.map(a => `${a.nombre} ${a.apellidoPaterno}`).join(', ');

    // 3. LA CAJA NEGRA: Creamos el registro de auditoría
    await prisma.auditoria.create({
      data: {
        accion: 'ELIMINAR_INCIDENTE',
        entidad: 'INCIDENTE',
        entidadId: incidenteId,
        detalles: `Se eliminó reporte de tipo "${incidenteABorrar.tipo}" (Gravedad: ${incidenteABorrar.gravedad}). Alumnos implicados: ${nombresAlumnos}. Descripción original: ${incidenteABorrar.descripcionBreve}`,
        usuarioId: req.usuario.id // Registramos al administrador o director que lo borró
      }
    });

    // 4. Ahora sí, destruimos el incidente
    // Nota: Como configuramos onDelete: Cascade en Seguimientos, se borrarán en cadena sin dar error
    await prisma.incidente.delete({
      where: { id: incidenteId }
    });

    res.json({ message: 'Incidente eliminado de forma segura. La acción ha sido registrada en la bitácora.' });
  } catch (error) {
    console.error('Error en el borrado seguro:', error);
    res.status(500).json({ error: 'Error interno al intentar eliminar el registro.' });
  }
});

// OBTENER todos los incidentes (Incluye el hilo de Seguimientos y Alumnos en plural)
app.get('/api/incidentes', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const incidentes = await prisma.incidente.findMany({
      include: {
        alumnos: { select: { id: true, matricula: true, nombre: true, apellidoPaterno: true } },
        reportadoPor: { select: { nombre: true, apellidoPaterno: true, rol: true } },
        seguimientos: {
          include: { autor: { select: { nombre: true, apellidoPaterno: true, rol: true } } },
          orderBy: { fecha: 'asc' } 
        }
      },
      orderBy: { fechaIncidencia: 'desc' }
    });
    
    res.json(incidentes);
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// NUEVO: AGREGAR un Seguimiento a un Incidente existente (El "Hilo")
app.post('/api/incidentes/:id/seguimientos', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    const autorId = req.usuario.id;

    if (!descripcion) {
      res.status(400).json({ error: 'La descripción del seguimiento es obligatoria.' });
      return;
    }

    const nuevoSeguimiento = await prisma.seguimiento.create({
      data: {
        descripcion,
        incidenteId: Number(id),
        autorId
      }
    });

    res.status(201).json({ message: 'Seguimiento agregado correctamente', seguimiento: nuevoSeguimiento });
  } catch (error) {
    console.error('Error al agregar seguimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// NUEVO: CAMBIAR ESTADO DE UN INCIDENTE
app.put('/api/incidentes/:id/estado', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // "ABIERTO", "EN_PROCESO", "CERRADO"
    const autorId = req.usuario.id;

    // Actualizamos el estado
    const incidenteActualizado = await prisma.incidente.update({
      where: { id: Number(id) },
      data: { estado }
    });

    // Dejamos huella en el historial automáticamente
    await prisma.seguimiento.create({
      data: {
        descripcion: `SISTEMA: El estado del incidente ha sido cambiado a "${estado.replace('_', ' ')}".`,
        incidenteId: Number(id),
        autorId
      }
    });

    res.json({ message: 'Estado actualizado', incidente: incidenteActualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// OBTENER Estadísticas para Reportes
app.get('/api/reportes/stats', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalIncidentes = await prisma.incidente.count();
    const totalAlumnos = await prisma.alumno.count();

    const porGravedad = await prisma.incidente.groupBy({ by: ['gravedad'], _count: { id: true } });
    const porTipo = await prisma.incidente.groupBy({ by: ['tipo'], _count: { id: true } });
    
    // NUEVO: Agrupar por Estado
    const porEstado = await prisma.incidente.groupBy({ by: ['estado'], _count: { id: true } });

    const alumnosCriticos = await prisma.alumno.findMany({
      include: { _count: { select: { incidentes: true } } },
      orderBy: { incidentes: { _count: 'desc' } },
      take: 5
    });

    res.json({
      resumen: { totalIncidentes, totalAlumnos },
      porGravedad,
      porTipo,
      porEstado, // Lo enviamos al frontend
      alumnosCriticos: alumnosCriticos.map(a => ({
        nombre: `${a.nombre} ${a.apellidoPaterno}`, cuenta: a._count.incidentes, matricula: a.matricula
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar estadísticas' });
  }
});

// ==========================================
// MÓDULO DE AUDITORÍA (CAJA NEGRA)
// ==========================================
app.get('/api/auditoria', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Seguridad Máxima: Solo el ADMIN puede ver los registros de borrado
    if (req.usuario?.rol !== 'ADMIN') {
      res.status(403).json({ error: 'Acceso denegado. Se requiere nivel de Administrador.' });
      return;
    }

    const registros = await prisma.auditoria.findMany({
      include: {
        usuario: { select: { nombre: true, apellidoPaterno: true, rol: true } }
      },
      orderBy: { fecha: 'desc' } // Los más recientes primero
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al cargar auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor al cargar la bitácora.' });
  }
});

// ==========================================
// MÓDULO MÉDICO / ENFERMERÍA
// ==========================================

// 1. OBTENER el historial de atenciones médicas
app.get('/api/atenciones', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const atenciones = await prisma.atencionMedica.findMany({
      include: {
        alumno: { select: { nombre: true, apellidoPaterno: true, matricula: true, grado: true, grupo: true } }
      },
      orderBy: { fechaAtencion: 'desc' }
    });
    res.json(atenciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el historial médico' });
  }
});

// 2. CREAR un nuevo registro de atención
app.post('/api/atenciones', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Protección: Solo Enfermería, Directores y Admin pueden hacer esto
    if (!['ADMIN', 'DIRECTOR', 'ENFERMERA'].includes(req.usuario?.rol || '')) {
      res.status(403).json({ error: 'Acceso denegado. Exclusivo para personal médico o directivo.' });
      return;
    }

    const { alumnoId, nombreIntervencion, telefonoIntervencion, descripcion } = req.body;

    if (!alumnoId || !nombreIntervencion || !descripcion) {
      res.status(400).json({ error: 'Faltan campos obligatorios' });
      return;
    }

    const nuevaAtencion = await prisma.atencionMedica.create({
      data: {
        alumnoId: Number(alumnoId),
        nombreIntervencion,
        telefonoIntervencion: telefonoIntervencion || null,
        descripcion
      }
    });

    res.status(201).json(nuevaAtencion);
  } catch (error) {
    console.error('Error al registrar atención médica:', error);
    res.status(500).json({ error: 'Error interno al registrar la atención.' });
  }
});

// ==========================================
// MÓDULO DE DASHBOARD / ESTADÍSTICAS
// ==========================================
app.get('/api/estadisticas', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Contadores Generales
    const totalAlumnos = await prisma.alumno.count();
    const totalIncidentes = await prisma.incidente.count();
    const incidentesAbiertos = await prisma.incidente.count({ where: { estado: 'ABIERTO' } });
    const totalAtenciones = await prisma.atencionMedica.count();

    // 2. Datos para Gráfica de Pastel (Incidentes por Gravedad)
    const incidentesAlta = await prisma.incidente.count({ where: { gravedad: 'Alta' } });
    const incidentesMedia = await prisma.incidente.count({ where: { gravedad: 'Media' } });
    const incidentesLeve = await prisma.incidente.count({ where: { gravedad: 'Leve' } });

    // 3. Últimos 5 incidentes recientes para la tabla de actividad
    const incidentesRecientes = await prisma.incidente.findMany({
      take: 5,
      orderBy: { fechaIncidencia: 'desc' },
      include: {
        alumnos: { select: { nombre: true, apellidoPaterno: true } }
      }
    });

    res.json({
      contadores: {
        alumnos: totalAlumnos,
        incidentes: totalIncidentes,
        alertas: incidentesAbiertos,
        atenciones: totalAtenciones
      },
      graficaGravedad: [
        { name: 'Gravedad Alta', value: incidentesAlta, color: '#ef4444' }, // Rojo
        { name: 'Gravedad Media', value: incidentesMedia, color: '#f97316' }, // Naranja
        { name: 'Gravedad Leve', value: incidentesLeve, color: '#eab308' }  // Amarillo
      ],
      actividadReciente: incidentesRecientes
    });
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
    res.status(500).json({ error: 'Error al cargar los datos del dashboard' });
  }
});

// ==========================================
// MÓDULO DE INTERVENCIONES EXTERNAS
// ==========================================

// 1. CREAR una nueva intervención
app.post('/api/intervenciones', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Solo personal autorizado
    if (req.usuario?.rol === 'TUTOR') {
      res.status(403).json({ error: 'Acceso denegado.' });
      return;
    }

    const { folioIncidente, tipoIntervencion, entidad, fechaHora, noReporteOficial, responsable, observaciones } = req.body;

    // Buscamos el incidente usando el Folio
    const incidenteAsociado = await prisma.incidente.findUnique({
      where: { folio: folioIncidente }
    });

    if (!incidenteAsociado) {
      res.status(404).json({ error: 'No se encontró ningún incidente con ese folio.' });
      return;
    }

    const nuevaIntervencion = await prisma.intervencionExterna.create({
      data: {
        tipoIntervencion,
        entidad,
        fechaHora: new Date(fechaHora),
        noReporteOficial,
        responsable,
        observaciones,
        incidenteId: incidenteAsociado.id,
        registradoPorId: req.usuario.id
      }
    });

    res.status(201).json({ message: 'Intervención registrada correctamente.', intervencion: nuevaIntervencion });
  } catch (error) {
    console.error('Error al crear intervención externa:', error);
    res.status(500).json({ error: 'Error interno del servidor al guardar la intervención.' });
  }
});

// 2. OBTENER Estadísticas para el Dashboard Superior
app.get('/api/intervenciones/stats', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await prisma.intervencionExterna.count();
    const enCurso = await prisma.intervencionExterna.count({ where: { estado: 'EN_CURSO' } });
    const concluidas = await prisma.intervencionExterna.count({ where: { estado: 'CONCLUIDA' } });

    // Calcular intervenciones de este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const esteMes = await prisma.intervencionExterna.count({
      where: { fechaHora: { gte: inicioMes } }
    });

    res.json({ total, enCurso, concluidas, esteMes });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
});

// 3. OBTENER lista de intervenciones
app.get('/api/intervenciones', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const intervenciones = await prisma.intervencionExterna.findMany({
      include: {
        incidente: { select: { folio: true, descripcionBreve: true } },
        registradoPor: { select: { nombre: true, apellidoPaterno: true } }
      },
      orderBy: { fechaHora: 'desc' }
    });
    res.json(intervenciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de intervenciones.' });
  }
});

// 4. CAMBIAR ESTADO (En Curso -> Concluida)
app.put('/api/intervenciones/:id/estado', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const intervencion = await prisma.intervencionExterna.update({
      where: { id: Number(id) },
      data: { estado }
    });

    res.json({ message: 'Estado actualizado correctamente.', intervencion });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado.' });
  }
});

// ==========================================
// MÓDULO DE AVISOS MASIVOS Y NOTIFICACIONES
// ==========================================

// 1. CREAR Y ENVIAR un nuevo aviso masivo
app.post('/api/avisos', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Restricción: Solo el Director (o Admin) puede mandar avisos masivos
    if (req.usuario?.rol !== 'DIRECTOR' && req.usuario?.rol !== 'ADMIN') {
      res.status(403).json({ error: 'Acceso denegado. Función exclusiva para Dirección.' });
      return;
    }

    const { rolesDestino, tipoAviso, asunto, mensaje } = req.body;

    if (!rolesDestino || rolesDestino.length === 0 || !asunto || !mensaje) {
      res.status(400).json({ error: 'Faltan campos obligatorios o no se seleccionaron destinatarios.' });
      return;
    }

    // Buscamos los correos de todos los usuarios activos que tengan los roles seleccionados
    const destinatarios = await prisma.usuario.findMany({
      where: {
        rol: { in: rolesDestino },
        estado: 'ACTIVO'
      },
      select: { email: true }
    });

    // Extraemos solo los textos de los correos y los unimos con comas
    const correosBcc = destinatarios.map(d => d.email).join(', ');

    // Guardamos el registro en la base de datos para la tabla del Director
    const nuevoAviso = await prisma.aviso.create({
      data: {
        asunto,
        mensaje,
        tipoAviso,
        destinosRoles: rolesDestino.join(','), // Guardamos como texto "TUTOR,DOCENTE"
        creadoPorId: req.usuario.id
      }
    });

    // Disparamos el correo a todos los involucrados (Usamos BCC - Copia Oculta por privacidad)
    if (correosBcc) {
      await transporter.sendMail({
        from: `"Dirección SIGIE" <${process.env.EMAIL_USER}>`,
        bcc: correosBcc,
        subject: `📢 Aviso Institucional: ${asunto}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #4c1d95; margin: 0; font-size: 16px;">${tipoAviso.toUpperCase()}</h2>
            </div>
            <h3 style="color: #1f2937; font-size: 20px; margin-top: 0;">${asunto}</h3>
            <p style="color: #4b5563; white-space: pre-line; line-height: 1.6; font-size: 15px;">${mensaje}</p>
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 11px; color: #9ca3af; text-align: center;">Este es un comunicado oficial enviado a través del Sistema SIGIE por la Dirección Escolar.</p>
          </div>
        `
      });
    }

    res.status(201).json({ message: 'Aviso enviado y registrado correctamente.', aviso: nuevoAviso });
  } catch (error) {
    console.error('Error al enviar aviso masivo:', error);
    res.status(500).json({ error: 'Error interno al procesar el aviso masivo.' });
  }
});

// 2. OBTENER historial de avisos para la tabla del Director
app.get('/api/avisos/enviados', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.usuario?.rol !== 'DIRECTOR' && req.usuario?.rol !== 'ADMIN') {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    const avisos = await prisma.aviso.findMany({
      orderBy: { fechaCreacion: 'desc' },
      include: { creadoPor: { select: { nombre: true, apellidoPaterno: true } } }
    });
    res.json(avisos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de avisos' });
  }
});

// 3. OBTENER mis notificaciones (Para la campanita en el Header de cualquier usuario)
app.get('/api/avisos/mis-notificaciones', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const miRol = req.usuario?.rol || '';
    
    // Buscamos avisos donde los destinatarios incluyan el rol del usuario logueado
    const avisos = await prisma.aviso.findMany({
      where: { destinosRoles: { contains: miRol } },
      orderBy: { fechaCreacion: 'desc' },
      take: 10 // Solo mostramos los últimos 10 en la campanita
    });
    res.json(avisos);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar notificaciones' });
  }
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});
