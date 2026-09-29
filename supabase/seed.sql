-- Datos de ejemplo para desarrollo local (supabase db reset los aplica
-- automaticamente despues de las migraciones). No incluye usuarios/perfiles:
-- esos se crean via Supabase Auth (signUp), que dispara el trigger
-- handle_new_user definido en 20260730120100_profiles.sql.

insert into public.delivery_zones
  (name, description, postal_codes, delivery_days, is_active, center_lat, center_lng, radius_meters)
values
  ('Centro Madrid', 'Casco antiguo y barrios centricos.', array['28001','28004','28012','28013'], array['lunes','miercoles','viernes'], true, 40.4168, -3.7038, 2000),
  ('Zona Norte', 'Chamberi, Tetuan y alrededores.', array['28003','28010','28020'], array['martes','jueves'], true, 40.4530, -3.6990, 2500),
  ('Zona Sur', 'Arganzuela, Usera y Carabanchel.', array['28005','28019','28025'], array['martes','jueves','sabado'], true, 40.3900, -3.7130, 2500)
on conflict do nothing;

insert into public.pickup_points (name, address, lat, lng, zone_id, status)
select 'Obrador Principal - Centro', 'Calle Gran Via 15, Madrid', 40.4200, -3.7025, id, 'abierto'
from public.delivery_zones where name = 'Centro Madrid'
on conflict do nothing;

insert into public.pickup_points (name, address, lat, lng, zone_id, status)
select 'Punto Recogida - Chamberi', 'Calle Serrano 42, Madrid', 40.4510, -3.6950, id, 'abierto'
from public.delivery_zones where name = 'Zona Norte'
on conflict do nothing;

insert into public.pickup_points (name, address, lat, lng, zone_id, status)
select 'Almacen Logistico Sur', 'Calle de Toledo 120, Madrid', 40.3950, -3.7150, id, 'cerrado'
from public.delivery_zones where name = 'Zona Sur'
on conflict do nothing;

insert into public.subscription_plans (name, description, max_breads, delivery_frequency, price_cents, is_active)
values
  ('Basico', 'Ideal para probar el ritual de pan fresco.', 2, 'semanal', 1200, true),
  ('Familiar', 'La eleccion mas popular para el hogar.', 4, 'semanal', 2200, true),
  ('Premium', 'Panes de autor cada semana, sin limites.', 6, 'semanal', 3450, true)
on conflict do nothing;

insert into public.products
  (name, slug, description, ingredients, category, tags, price_cents, image_url, is_active)
values
  (
    'Masa Madre Clásica',
    'masa-madre-clasica',
    'Corteza crujiente y miga aireada, fermentada durante 24 horas para desarrollar un perfil de sabor complejo y una digestibilidad superior. Elaborada con técnicas tradicionales que respetan el tiempo del cereal.',
    'Trigo integral, agua filtrada, sal de mar',
    'masa-madre',
    array['Vegano','Sin Azúcares Añadidos','Fermentación Lenta'],
    650,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCkMZaCViJywYgjpIFPxjammEavn8yd0ggWP4vhcHC8J_Sy_FI5Bt5PBdhc3ggv97CnRyM_skaT2uTh5Z-2EStrWUGHSWgHZ12rm5ZsDe5e7Q7KBmPgdPIwaZtP9qZCt4zdips6qErgJkmImV0XMfB0Vtdz9u9OE8JZU7qaDJ04r_Pc2xrMNZhiDqt8gbaXc1CJGcNYp1CpsxHb181ErJrZ85tJezVNIlqEwq0smOK-Zjv4JKVhtqEB',
    true
  ),
  (
    'Baguette Rústica',
    'baguette-rustica',
    'Corteza crujiente y miga alveolada siguiendo la receta clásica parisina. Fermentación lenta de 12 horas sobre masa madre natural para un sabor limpio y ligeramente ácido.',
    'Harina de trigo ecológico, agua filtrada, masa madre natural',
    'masa-madre',
    array['Vegano','Trigo Ecológico'],
    320,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbB62QvD_7RTJ5G5ivvUmuQOi4qvICE_GinpHmwBWILRuFBmGLfo0ZHvWTyGGpniAEvwV3Y28zmmRpfpjUSapn1wchejSELpnuE37DdBxFKtv5g0sRSGPYDhgM0vK2vl6P2mn4gGqkTdNrc4osVE5q6Th39PeOnbStXr4y74vTkNTUQg-8AvhWYxajDf32LO6ZjzVxm8qgksepdCrM9-D-KzzXzSnbXGhPXb44zQX6_isyrlCaZxkm',
    true
  ),
  (
    'Centeno y Semillas',
    'centeno-y-semillas',
    'Mezcla nutritiva de semillas de girasol, calabaza y lino sobre una base de centeno integral molido a piedra. Miga densa y sabor profundo, ideal para el desayuno.',
    'Harina de centeno integral, semillas de girasol y calabaza, agua filtrada',
    'integral',
    array['Integral','Alto en Fibra'],
    780,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCA2iq2qyf6r6bKEC-Hxdu4hREfjbiWUaSZ6Xu2u4dN7oM0mbdOWlINfga3To-X3wUVLivE0KK8bV11NTGOvuBdygvXhsq213iAy7WrQGpu8tbNiV3So0mF2ZdWZGtCZPzBqUFTv-LjRlIJMbtrYFEGvhiuBicSrJU5NaUMaPfMPePyDV5gNWJURuRIpBVZ6mAd1wDdV5qy7D8paXnFBKYeuwIUj7_xLIBOQEl0BysM8KvxTwNLXgTs',
    true
  ),
  (
    'Brioche Premium',
    'brioche-premium',
    'Textura sedosa con un 25% de mantequilla de pasto y un toque de miel de azahar. Fermentación larga en frío para un migajón suave y desmenuzable.',
    'Huevos camperos, mantequilla DOP, miel de azahar',
    'dulce',
    array['Mantequilla DOP'],
    900,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD42K7oDWV2smgti-ZPALnG6PkSmQOrdeH4GLuURJwtBqBzfdaNORxUUw-h87nLS02FG8MR7iyawDonipJskCBOivtyqWf6j0eWLBO2-FGdo7V2mpgEfxUM9nxDdpL8CVsSCbw_uhN4J6XpmPwmiHVoXc3wwVS1kw_J1hDKaCiElTgyEruFXPlaM9e9PpOmtpolXNnCSmzH_HSmWZRZ2GpdOJmy2-bW4Ku1Is_33rHOTxQUMzSn6L3O',
    true
  ),
  (
    'Nueces y Arándanos',
    'nueces-y-arandanos',
    'Nueces tostadas y arándanos deshidratados en una miga abierta de fermentación lenta. El equilibrio perfecto entre dulzor natural y acidez de la masa madre.',
    'Nueces tostadas, arándanos deshidratados, masa madre natural',
    'masa-madre',
    array['Vegano','Con Frutos Secos'],
    820,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDl-T5QfAsaimrfv2ySyjv6jc_n29SWQS_HZNyd8vb-sG7ZGb8n74NeIML52rHkGK1H8RXI7mGjO4uNfoaR5rDogUlmxaTelqr9IN_4gW8Up2gLo6Z582e8S1JOCBaZrCi3Sev1q50SdpmgO9Nu8IMhk-gB9_Mk4kMz0JijOhFK5SPNi0Ppfr4c0zky_XBI1hBBeD1F45qN5PyGohOD7WIJ3tM57Y3uWsBo2gKHwqj7pKy-jgbQyTHG',
    true
  ),
  (
    'Cúrcuma y Sésamo',
    'curcuma-y-sesamo',
    'Cúrcuma fresca y sésamo negro tostado, horneados sobre masa madre natural. Un pan vibrante con propiedades antiinflamatorias y un toque terroso.',
    'Cúrcuma fresca, sésamo negro tostado, agua filtrada',
    'masa-madre',
    array['Vegano','Antiinflamatorio'],
    700,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCAQeIJAW9ESIHLQfCQVg1wbqKxR_j-bfZnsJGFRaOO5KXsrBWo32mD8kjHlQg3DDH0yBGt7OcghTDFaq9O0ZgJirqcYW3JpNA8rEp0zOhiJcHvdh8-O-at8IMfXazJ1TOZH1qQHmwFd5eaPAB4RaZJdKPpOS3vgk6q-SOXEh56XxsgcE6uuYa3oKBlWv59WU33gVXkkPKaRPQoodx7rQIDJmz_uXnlF7JUZq85IyA-Z8WjT3Bavb8B',
    true
  ),
  (
    'Olivas y Romero',
    'olivas-y-romero',
    'Aceitunas verdes y romero fresco horneados en una miga elástica y aromática. Un clásico mediterráneo perfecto para acompañar quesos y embutidos.',
    'Aceitunas verdes, romero fresco, aceite de oliva virgen extra',
    'masa-madre',
    array['Vegano','Mediterráneo'],
    750,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCAvIAOVKHmp0tn406p1iGw_e7-mtQ8S4VGipoyO2TnRVk3ox96aNJQ8I5fk-7Q27PCzoBqXjHK6wKQL8IzuZqrdLKPk7goqfzObhERQ8ZzlMOASN2cUuk2GFi88mN7nNIOCf5EejuIAUDFt-8VIqybAp5AIoJ6bZZ7tW49xjP1Rz_mYl-DsMHdf3ZHP_5hokWAABwRCUgiZmz4A50DwcuxkmNirTMbRUGt6QmxDKlZeekaIubQlA9J',
    true
  ),
  (
    'Integral 100%',
    'integral-100',
    'Harina 100% integral molida a piedra, sin aditivos, para el pan de cada día. Corteza mate y miga densa, horneada en molde para un formato perfecto en sándwiches.',
    'Harina 100% integral, agua filtrada, sal marina',
    'integral',
    array['Vegano','Integral','Molido a Piedra'],
    590,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDlvOay5AgoGtG5A9Eak8XJ-i8-pNItMM6Rjya6um1Kwnmi2EXb07l-wEJCBxdtgymvw7JIzBQkjXf8Dqgc8_Zu-42sLIAYPSstNdvHBjKXMGWMKcmb4fSb_-gvnBIXXW7WggsHS_wsaMxoPmTkiTG_--ODeadqg6VqR6UmbIo44_5iUiOVNeB5U-ES3Gia4s2tULJRhrrMOnR9Qr7vGyGZq6_BxfT6VCqPWC69y0LjGQKTfzAfviJU',
    true
  )
on conflict (slug) do nothing;
