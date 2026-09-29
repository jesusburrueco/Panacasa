// Constantes de mapa sin dependencia de Leaflet, para poder importarlas desde
// componentes de servidor o desde el padre de un dynamic-import sin arrastrar
// el paquete "leaflet" (que toca `window`/`document` al cargarse) al bundle
// de servidor.
export const MADRID_CENTER: [number, number] = [40.4168, -3.7038];
