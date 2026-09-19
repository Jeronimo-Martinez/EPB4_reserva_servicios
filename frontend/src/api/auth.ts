import {
  LoginCredentials,
  LoginResponse,
  RegisterClientDTO,
  RegisterClientResponse,
  VerifyCodeDTO,
  VerifyCodeResponse,
  User,
  UserRole,
} from '@/types/auth';

const MOCK_USERS_KEY = 'promarket_mock_registered_users';

const INITIAL_MOCK_USERS: Record<string, { password: string; user: User }> = {
  'cliente.demo@example.com': {
    password: 'Cliente123',
    user: {
      id: 'usr-client-demo',
      email: 'cliente.demo@example.com',
      firstName: 'Ana',
      lastName: 'Gómez',
      phone: '+57 300 123 4567',
      role: 'CLIENTE',
      isVerified: true,
    },
  },
  'maria.gonzalez@ejemplo.com': {
    password: 'Cliente1!',
    user: {
      id: 'usr-client-maria',
      email: 'maria.gonzalez@ejemplo.com',
      firstName: 'María',
      lastName: 'González',
      phone: '+52 55 1234 5678',
      role: 'CLIENTE',
      isVerified: true,
    },
  },
  'contacto@centrovital.com': {
    password: 'Proveedor1!',
    user: {
      id: 'usr-prov-centro',
      email: 'contacto@centrovital.com',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      businessName: 'Centro Vital Salud y Bienestar',
      businessCategory: 'Salud y Bienestar',
      phone: '+52 55 9876 5432',
      role: 'PROVEEDOR',
      isVerified: true,
    },
  },
};

function getMockUsers(): Record<string, { password: string; user: User }> {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return INITIAL_MOCK_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_USERS;
  }
}

function saveMockUser(email: string, pass: string, user: User) {
  try {
    const all = getMockUsers();
    all[email.toLowerCase()] = { password: pass, user };
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error guardando usuario simulado', e);
  }
}

// Simulación de delay de red para realismo UI/UX
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  await delay(400);

  const emailClean = credentials.email.trim().toLowerCase();
  const allUsers = getMockUsers();
  const existing = allUsers[emailClean];

  if (existing) {
    if (existing.password === credentials.password) {
      return {
        message: 'Inicio de sesión exitoso',
        email: existing.user.email,
        role: existing.user.role,
        redirectTo: existing.user.role === 'CLIENTE' ? '/catalogo' : '/servicios',
        user: existing.user,
      };
    } else {
      throw new Error('Correo electrónico o contraseña incorrectos.');
    }
  }

  // Si ingresa una cuenta libre para prueba rápida
  const role: UserRole =
    emailClean.includes('proveedor') || emailClean.includes('negocio')
      ? 'PROVEEDOR'
      : 'CLIENTE';

  const newUser: User = {
    id: `usr-${Date.now()}`,
    email: emailClean,
    firstName: emailClean.split('@')[0].charAt(0).toUpperCase() + emailClean.split('@')[0].slice(1),
    role,
    isVerified: true,
    businessName: role === 'PROVEEDOR' ? 'Mi Negocio Profesional' : undefined,
    businessCategory: role === 'PROVEEDOR' ? 'Salud y Bienestar' : undefined,
  };

  saveMockUser(emailClean, credentials.password, newUser);

  return {
    message: 'Inicio de sesión exitoso',
    email: newUser.email,
    role: newUser.role,
    redirectTo: newUser.role === 'CLIENTE' ? '/catalogo' : '/servicios',
    user: newUser,
  };
}

export async function registerClientApi(
  data: RegisterClientDTO
): Promise<RegisterClientResponse> {
  await delay(350);

  const emailClean = data.email.trim().toLowerCase();
  const newUser: User = {
    id: `usr-client-${Date.now()}`,
    email: emailClean,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: 'CLIENTE',
    isVerified: false,
  };

  saveMockUser(emailClean, data.password, newUser);

  return {
    message: 'Código de verificación generado con éxito.',
    email: emailClean,
    verificationRequired: true,
  };
}

export async function verifyClientCodeApi(
  data: VerifyCodeDTO
): Promise<VerifyCodeResponse> {
  await delay(300);

  const codeClean = data.code.trim();
  if (codeClean.length !== 6) {
    throw new Error('El código debe contener exactamente 6 dígitos.');
  }

  const allUsers = getMockUsers();
  const emailClean = data.email.trim().toLowerCase();
  if (allUsers[emailClean]) {
    allUsers[emailClean].user.isVerified = true;
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(allUsers));
  }

  return {
    message: 'Cuenta verificada correctamente.',
    email: emailClean,
    role: 'CLIENTE',
  };
}
