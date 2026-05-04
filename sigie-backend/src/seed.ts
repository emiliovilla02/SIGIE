import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcrypt';

// 1. Configurar el adaptador de MariaDB (Requisito de Prisma v7)
const adapter = new PrismaMariaDb({
  host: 'localhost',
  user: 'sigie_user',
  password: 'sigie12345',
  database: 'sigie_db'
});

// 2. Inyectar el adaptador a Prisma
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando el poblado de la base de datos...');

  // 1. Hashear contraseña por defecto
  const hashedPassword = await bcrypt.hash('supersecreta', 10);

  // 2. Crear Administrador (Docente)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@sigie.com' },
    update: {},
    create: {
      email: 'admin@sigie.com',
      password: hashedPassword,
      nombre: 'Laura Taide',
      apellidoPaterno: 'Contreras',
      apellidoMaterno: 'Álvarez',
      rol: 'ADMIN',
      estado: 'ACTIVO'
    }
  });

  // 3. Crear Tutor de prueba
  const tutor = await prisma.tutor.upsert({
    where: { correo: 'alejandra@ejemplo.com' },
    update: {},
    create: {
      nombre: 'Alejandra',
      apellidoPaterno: 'Hernández',
      apellidoMaterno: 'Villa',
      correo: 'alejandra@ejemplo.com',
      telefono: '833-555-0199'
    }
  });

  // 4. Crear Alumno de prueba (ahora enlazado al Tutor)
  const alumno = await prisma.alumno.upsert({
    where: { matricula: '20260001' },
    update: {},
    create: {
      matricula: '20260001',
      nombre: 'Emilio',
      apellidoPaterno: 'Hernández',
      apellidoMaterno: 'Villa',
      grado: '6to Semestre',
      tutorId: tutor.id
    }
  });

  console.log('✅ Base de datos poblada con éxito.');
  console.log('Usuarios creados:', { admin: admin.email, alumno: alumno.matricula });
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
