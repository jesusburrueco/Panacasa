# PanACasa - Guia del Proyecto

## Descripcion del Negocio

Servicio de suscripcion para reparto de pan artesanal. Los usuarios se suscriben a un plan, eligen panes de un catalogo y reciben entregas periodicas en zonas de reparto definidas. Hay dos roles: usuario final (suscriptor) y administrador.

## Stack Tecnologico

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 3
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **Pagos**: Stripe (suscripciones recurrentes)
- **Despliegue**: Vercel
- **Fuentes**: EB Garamond (titulos), Be Vietnam Pro (cuerpo)
- **Iconos**: Material Symbols Outlined

## Estructura del Proyecto

```
panacasa/
├── CLAUDE.md
├── stitch-designs/          # Exportacion de Stitch (referencia visual, NO codigo fuente)
│   ├── artisanal_hearth/DESIGN.md
│   ├── [pantalla]/code.html
│   └── [pantalla]/screen.png
├── src/
│   ├── app/
│   │   ├── (public)/        # Rutas publicas (landing, login, registro)
│   │   │   ├── page.tsx               # Landing / Onboarding
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/           # Rutas protegidas del usuario
│   │   │   ├── catalogo/page.tsx
│   │   │   ├── catalogo/[id]/page.tsx # Detalle de producto
│   │   │   ├── plan/page.tsx          # Configura tu plan
│   │   │   ├── pedido/page.tsx        # Finalizar pedido / checkout
│   │   │   ├── perfil/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/         # Panel de administracion
│   │   │   ├── admin/page.tsx                # Dashboard
│   │   │   ├── admin/suscriptores/page.tsx   # Lista suscriptores
│   │   │   ├── admin/suscriptores/[id]/page.tsx  # Detalle suscriptor
│   │   │   ├── admin/catalogo/page.tsx       # Gestion catalogo
│   │   │   ├── admin/zonas/page.tsx          # Puntos y zonas de envio
│   │   │   ├── admin/logistica/page.tsx      # Logistica y beneficios
│   │   │   └── layout.tsx
│   │   ├── api/             # API routes
│   │   │   ├── webhooks/stripe/route.ts
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # Componentes base (Button, Input, Card, Badge, etc.)
│   │   ├── layout/          # Header, Footer, Sidebar, MobileNav
│   │   ├── catalogo/        # ProductCard, ProductGrid, ProductFilters
│   │   ├── plan/            # PlanSelector, PlanSummary
│   │   ├── admin/           # AdminSidebar, StatsCard, DataTable
│   │   └── shared/          # Componentes reutilizables entre ambos paneles
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── types.ts
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── config.ts
│   │   └── utils.ts
│   ├── hooks/               # Custom hooks
│   └── types/               # TypeScript types compartidos
├── supabase/
│   └── migrations/          # SQL migrations
├── public/
│   └── images/
├── .env.local.example
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Design System (Artisanal Hearth)

Referencia completa en `stitch-designs/artisanal_hearth/DESIGN.md`.

### Colores clave para Tailwind config

```
primary: '#6c2f00'           // Marron tostado - CTAs, elementos estructurales
primary-container: '#8b4513' // Contenedores primarios
on-primary: '#ffffff'
background: '#fefccf'        // Fondo crema
surface: '#fefccf'
surface-container: '#f2f0c4' // Cards y contenedores
surface-container-high: '#eceabe'
on-surface: '#1d1d03'        // Texto principal
outline: '#877369'           // Bordes
outline-variant: '#dac2b6'   // Bordes sutiles
tertiary: '#523e00'          // Mostaza/dorado para acentos
tertiary-container: '#6f5400'
error: '#ba1a1a'
```

### Tipografia

- Titulos: EB Garamond (500-600 weight, negative letter-spacing en display)
- Cuerpo: Be Vietnam Pro (400-600 weight)
- Display desktop: 48px/56px; mobile: 36px/42px
- Headlines: 32px/40px y 24px/32px
- Body: 18px/28px y 16px/24px
- Labels: 14px/20px (600 weight) y 12px/16px

### Formas y Espaciado

- Radios: minimo 16px para cards, pill (9999px) para botones
- Sombras: usar marron `rgba(139, 69, 19, 0.08)`, nunca gris
- Spacing base: 8px
- Margenes desktop: 80px, mobile: 20px
- Separacion entre secciones: 64px

## Pantallas del Prototipo

### Flujo publico (usuario)
1. **Onboarding/Landing** - Hero con CTA, propuesta de valor, como funciona
   - Mobile: `stitch-designs/onboarding_breadly/`
   - Desktop: `stitch-designs/onboarding_desktop/`

2. **Login** - Email + contrasena, enlace a registro
   - Mobile: `stitch-designs/iniciar_sesi_n_breadly/`
   - Desktop: `stitch-designs/acceso_y_registro_desktop/` (login + registro en misma pantalla desktop)

3. **Registro** - Nombre, email, contrasena, direccion, zona de reparto
   - Mobile: `stitch-designs/registro_breadly/`

### Flujo del suscriptor (protegido)
4. **Catalogo de panes** - Grid de productos con filtros, busqueda
   - Mobile: `stitch-designs/cat_logo_de_panes/`
   - Desktop: `stitch-designs/cat_logo_de_panes_desktop/`

5. **Detalle de producto** - Foto grande, descripcion, ingredientes, info nutricional
   - Mobile: `stitch-designs/detalle_de_producto/`
   - Desktop: `stitch-designs/detalle_de_producto_desktop/`

6. **Configura tu plan** - Seleccion de frecuencia, cantidad, panes elegidos
   - Mobile: `stitch-designs/configura_tu_plan/`

7. **Finalizar pedido** - Resumen, direccion, metodo pago, confirmar suscripcion
   - Mobile: `stitch-designs/finalizar_pedido/`
   - Desktop: `stitch-designs/finalizar_pedido_desktop/`

8. **Mi perfil** - Datos personales, suscripcion activa, historial, preferencias
   - Mobile: `stitch-designs/mi_perfil_breadly/`
   - Desktop: `stitch-designs/mi_perfil_desktop/`

### Panel de administracion
9. **Dashboard** - Metricas: suscriptores activos, ingresos, entregas pendientes
   - `stitch-designs/dashboard_de_administraci_n_breadly/`

10. **Gestion de suscriptores** - Tabla con filtros, estados, busqueda
    - `stitch-designs/gesti_n_de_suscriptores_breadly/`

11. **Detalle del suscriptor** - Info completa, historial, suscripcion, acciones
    - `stitch-designs/detalle_del_suscriptor_breadly/`

12. **Gestion del catalogo** - CRUD de panes, imagenes, categorias
    - `stitch-designs/gesti_n_del_cat_logo_breadly/`

13. **Zonas de envio** - Mapa con zonas, puntos de reparto, cobertura
    - `stitch-designs/puntos_y_zonas_de_env_o_breadly/`

14. **Logistica y beneficios** - Programacion de entregas, metricas
    - `stitch-designs/log_stica_breadly/`
    - Desktop: `stitch-designs/beneficios_y_log_stica_desktop/`

## Modelo de Datos (Supabase)

### Tablas principales

```sql
-- Usuarios (gestionado por Supabase Auth, extendido con perfil)
profiles (
  id uuid PK references auth.users,
  full_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  delivery_zone_id uuid FK,
  role text DEFAULT 'user',  -- 'user' | 'admin'
  created_at timestamptz
)

-- Catalogo de panes
products (
  id uuid PK,
  name text,
  slug text UNIQUE,
  description text,
  ingredients text,
  nutritional_info jsonb,
  category text,              -- 'masa madre', 'integral', 'especial', etc.
  tags text[],                -- 'vegano', 'sin gluten', etc.
  price_cents integer,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz
)

-- Planes de suscripcion
subscription_plans (
  id uuid PK,
  name text,                  -- 'Basico', 'Familiar', 'Premium'
  description text,
  max_breads integer,         -- panes por entrega
  delivery_frequency text,    -- 'semanal', 'quincenal', 'mensual'
  price_cents integer,
  stripe_price_id text,
  is_active boolean DEFAULT true
)

-- Suscripciones activas
subscriptions (
  id uuid PK,
  user_id uuid FK references profiles,
  plan_id uuid FK references subscription_plans,
  stripe_subscription_id text,
  status text,                -- 'active', 'paused', 'cancelled', 'past_due'
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz
)

-- Panes seleccionados en la suscripcion
subscription_items (
  id uuid PK,
  subscription_id uuid FK,
  product_id uuid FK,
  quantity integer DEFAULT 1
)

-- Zonas de reparto
delivery_zones (
  id uuid PK,
  name text,
  description text,
  postal_codes text[],
  delivery_days text[],       -- ['lunes', 'miercoles']
  is_active boolean DEFAULT true
)

-- Entregas programadas
deliveries (
  id uuid PK,
  subscription_id uuid FK,
  delivery_zone_id uuid FK,
  scheduled_date date,
  status text,                -- 'pending', 'in_transit', 'delivered', 'failed'
  notes text,
  created_at timestamptz
)
```

## Instrucciones para Claude Code

### Enfoque de trabajo
- Leer SIEMPRE los archivos de Stitch (screen.png para referencia visual y code.html para extraer clases/estilos) ANTES de implementar cada pantalla.
- No copiar el HTML de Stitch directamente. Usarlo como referencia para replicar el diseno en componentes React/Next.js.
- Cada pantalla debe ser responsive. Los archivos _desktop y mobile muestran ambas versiones.
- Usar Tailwind con la config del design system, no valores hardcodeados.

### Prioridades de implementacion
1. Setup del proyecto (Next.js, Tailwind config, Supabase, estructura de carpetas)
2. Design system: componentes UI base (Button, Input, Card, Badge, etc.)
3. Layout: Header, Footer, navegacion mobile, sidebar admin
4. Pantallas publicas: Landing, Login, Registro
5. Catalogo y detalle de producto
6. Flujo de suscripcion: configurar plan, checkout
7. Perfil de usuario
8. Panel admin: dashboard, suscriptores, catalogo, zonas
9. Integracion Stripe
10. Integracion Supabase Auth + RLS policies
11. Logistica y entregas

### Reglas de codigo
- Componentes funcionales con TypeScript estricto
- Server Components por defecto, "use client" solo cuando haga falta
- Nombrar componentes y archivos en ingles, contenido UI en espanol
- Extraer colores, fuentes y radios del design system al tailwind.config.ts
- Imagenes de producto con next/image y formatos optimizados
- Formularios con react-hook-form + zod para validacion
- Estados de carga con Suspense y loading.tsx
