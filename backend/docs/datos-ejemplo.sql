-- Datos de ejemplo de ProMarket: 6 negocios con horario de atencion y servicios, y un cliente.
-- Uso: Supabase > SQL Editor > pegar todo > Run. Requiere que el backend ya haya creado las tablas.
-- Se puede ejecutar varias veces: si el correo de un usuario ya existe, ese usuario y su negocio se omiten.
-- Cuentas (contrasenas guardadas con BCrypt, igual que en el registro):
--   proveedores: los correos de la lista de abajo / Proveedor123
--   cliente:     cliente.demo@example.com / Cliente123
-- Son cuentas de prueba con contrasenas conocidas: no las uses para datos reales.
DO $seed$
DECLARE
  provider_hash CONSTANT text := '$2a$10$Srh4jEqF.UD3QRCATml8Refu5XwQENreT78DgtrEeb/AAT5dUWaH2';
  client_hash   CONSTANT text := '$2a$10$x57CwCwtFvc00bk/EfmVlOKnqc1GJdF5H3PNvHsgFZEEuA8xgD2WC';
  b jsonb;
  s jsonb;
  d text;
  uid uuid;
  bid uuid;
BEGIN
  FOR b IN SELECT * FROM jsonb_array_elements($json$[
  {
    "email": "centro.vital@example.com",
    "first_name": "Jeronimo",
    "last_name": "Martinez",
    "phone": "+573001112233",
    "name": "Centro Vital",
    "category": "Salud y Bienestar",
    "address": "Cra 43A #1-50, Medellín",
    "description": "Centro integral de servicios de salud, belleza y bienestar personal.",
    "days": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ],
    "open": "08:00",
    "close": "18:00",
    "services": [
      {
        "name": "Masaje Descontracturante",
        "category": "Salud y Bienestar",
        "minutes": 60,
        "price": 80000,
        "description": "Masaje profundo para aliviar tensiones musculares."
      },
      {
        "name": "Corte de Cabello Clásico",
        "category": "Belleza",
        "minutes": 45,
        "price": 35000,
        "description": "Corte personalizado con lavado y secado incluido."
      },
      {
        "name": "Limpieza Facial Profunda",
        "category": "Belleza",
        "minutes": 90,
        "price": 110000,
        "available": false,
        "description": "Limpieza y exfoliación facial con productos premium."
      }
    ]
  },
  {
    "email": "estudio.norte@example.com",
    "first_name": "Laura",
    "last_name": "Gómez",
    "phone": "+576017452890",
    "name": "Estudio Norte",
    "category": "Belleza",
    "address": "Calle 93 #14-28, Zona Norte, Bogotá",
    "description": "Especialistas en coloración y cortes de tendencia. Nuestro equipo cuenta con más de 10 años de experiencia y trabaja con productos profesionales.",
    "days": [
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ],
    "open": "09:00",
    "close": "19:00",
    "services": [
      {
        "name": "Corte y estilizado",
        "category": "Belleza",
        "minutes": 45,
        "price": 45000,
        "description": "Corte personalizado con lavado y estilizado utilizando productos premium."
      },
      {
        "name": "Coloración completa",
        "category": "Belleza",
        "minutes": 120,
        "price": 135000,
        "description": "Diagnóstico de color, aplicación profesional y tratamiento de hidratación."
      },
      {
        "name": "Tratamiento capilar",
        "category": "Belleza",
        "minutes": 60,
        "price": 75000,
        "description": "Hidratación profunda para recuperar brillo, suavidad y vitalidad."
      }
    ]
  },
  {
    "email": "punto.activo@example.com",
    "first_name": "Paula",
    "last_name": "Ríos",
    "phone": "+573005556677",
    "name": "Punto Activo",
    "category": "Salud y Bienestar",
    "address": "Av. El Poblado #10-20, Medellín",
    "description": "Masajes terapéuticos y tratamientos corporales integrales.",
    "days": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY"
    ],
    "open": "07:00",
    "close": "15:00",
    "services": [
      {
        "name": "Masaje terapéutico",
        "category": "Salud y Bienestar",
        "minutes": 60,
        "price": 90000,
        "description": "Masaje de relajación profunda para reducir el estrés y la tensión muscular."
      },
      {
        "name": "Drenaje linfático",
        "category": "Salud y Bienestar",
        "minutes": 50,
        "price": 85000,
        "description": "Técnica manual suave que mejora la circulación y reduce la retención de líquidos."
      },
      {
        "name": "Masaje deportivo",
        "category": "Salud y Bienestar",
        "minutes": 45,
        "price": 70000,
        "description": "Recuperación muscular antes o después de entrenar."
      }
    ]
  },
  {
    "email": "hogar.facil@example.com",
    "first_name": "Carlos",
    "last_name": "Pérez",
    "phone": "+573104448899",
    "name": "Hogar Fácil",
    "category": "Hogar",
    "address": "Cra 70 #44-20, Laureles, Medellín",
    "description": "Mantenimiento y reparaciones para el hogar: plomería, electricidad y pintura con técnicos certificados.",
    "days": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ],
    "open": "08:00",
    "close": "17:00",
    "services": [
      {
        "name": "Visita técnica de plomería",
        "category": "Hogar",
        "minutes": 60,
        "price": 60000,
        "description": "Revisión y reparación de fugas, grifos y desagües."
      },
      {
        "name": "Instalación eléctrica básica",
        "category": "Hogar",
        "minutes": 90,
        "price": 95000,
        "description": "Instalación de tomas, interruptores y lámparas."
      },
      {
        "name": "Pintura de habitación",
        "category": "Hogar",
        "minutes": 240,
        "price": 280000,
        "available": false,
        "description": "Pintura de una habitación de hasta 12 m², materiales incluidos."
      }
    ]
  },
  {
    "email": "aula.activa@example.com",
    "first_name": "Andrés",
    "last_name": "Mejía",
    "phone": "+573127778811",
    "name": "Aula Activa",
    "category": "Educacion",
    "address": "Calle 50 #45-30, Centro, Medellín",
    "description": "Clases personalizadas de matemáticas, inglés y programación para estudiantes de colegio y universidad.",
    "days": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY"
    ],
    "open": "14:00",
    "close": "20:00",
    "services": [
      {
        "name": "Clase de matemáticas",
        "category": "Educacion",
        "minutes": 60,
        "price": 50000,
        "description": "Refuerzo en álgebra, cálculo y estadística."
      },
      {
        "name": "Inglés conversacional",
        "category": "Educacion",
        "minutes": 60,
        "price": 55000,
        "description": "Práctica de conversación para mejorar fluidez y pronunciación."
      },
      {
        "name": "Introducción a la programación",
        "category": "Educacion",
        "minutes": 90,
        "price": 70000,
        "description": "Primeros pasos con Python mediante ejercicios prácticos."
      }
    ]
  },
  {
    "email": "tecnofix@example.com",
    "first_name": "Diego",
    "last_name": "López",
    "phone": "+573159990022",
    "name": "TecnoFix",
    "category": "Tecnologia",
    "address": "Calle 19 #4-56, Bogotá",
    "description": "Reparación y mantenimiento de computadores y celulares con garantía.",
    "days": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ],
    "open": "09:00",
    "close": "18:00",
    "services": [
      {
        "name": "Diagnóstico de computador",
        "category": "Tecnologia",
        "minutes": 30,
        "price": 30000,
        "description": "Revisión completa de hardware y software con informe."
      },
      {
        "name": "Mantenimiento preventivo de PC",
        "category": "Tecnologia",
        "minutes": 90,
        "price": 90000,
        "description": "Limpieza interna, cambio de pasta térmica y optimización del sistema."
      },
      {
        "name": "Cambio de pantalla de celular",
        "category": "Tecnologia",
        "minutes": 60,
        "price": 180000,
        "description": "Reemplazo de pantalla con repuesto de calidad original."
      }
    ]
  }
]$json$::jsonb) LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(b->>'email'));

    INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, terms_accepted, is_verified, created_at)
    VALUES (gen_random_uuid(), b->>'first_name', b->>'last_name', b->>'email', b->>'phone', provider_hash,
            'PROVEEDOR', true, true, now())
    RETURNING id INTO uid;

    INSERT INTO businesses (id, user_id, name, category, description, address, created_at)
    VALUES (gen_random_uuid(), uid, b->>'name', b->>'category', b->>'description', b->>'address', now())
    RETURNING id INTO bid;

    FOR d IN SELECT jsonb_array_elements_text(b->'days') LOOP
      INSERT INTO business_hours (business_id, day_of_week, start_time, end_time)
      VALUES (bid, d, (b->>'open')::time, (b->>'close')::time);
    END LOOP;

    -- clock_timestamp() keeps the listed order (the app shows the newest service first).
    FOR s IN SELECT * FROM jsonb_array_elements(b->'services') LOOP
      INSERT INTO services (id, business_id, name, category, description, duration_minutes, price, is_available, created_at)
      VALUES (gen_random_uuid(), bid, s->>'name', s->>'category', s->>'description', (s->>'minutes')::int,
              (s->>'price')::numeric, coalesce((s->>'available')::boolean, true), clock_timestamp());
    END LOOP;
  END LOOP;

  INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, terms_accepted, is_verified, created_at)
  SELECT gen_random_uuid(), 'Cliente', 'Demo', 'cliente.demo@example.com', '+573001234567', client_hash,
         'CLIENTE', true, true, now()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = 'cliente.demo@example.com');
END
$seed$;
