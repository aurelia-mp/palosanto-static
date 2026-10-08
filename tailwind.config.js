/** @type {import('tailwindcss').Config} */

// Rediseño 2026: Avenir Next (institucional) viene instalada en Apple;
// en el resto de los dispositivos se descarga Nunito Sans (ver src/components.css).
const brandFont = ['"Avenir Next"', '"Avenir Next LT Pro"', 'Avenir', '"Nunito Sans"', '"Segoe UI"', 'sans-serif'];

module.exports = {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: brandFont,
        heading: brandFont,
        brand: brandFont,
      },
      // Bordes y halos de foco sin color explícito: línea del color del texto y separación del color de fondo
      borderColor: { DEFAULT: 'rgb(var(--ps-fg) / 0.16)' },
      ringOffsetColor: { DEFAULT: 'rgb(var(--ps-ground))' },
      colors: {
        ps: {
          // Fondo gris carbón (#1C1C1C). Los valores viven en src/components.css
          // (--ps-ground, --ps-deep, --ps-paper) para poder comparar con el verde #0E1B14 en vivo.
          // El texto y las líneas salen de --ps-fg: blanco en el sitio y carbón dentro de .ps-claro.
          ground: 'rgb(var(--ps-ground) / <alpha-value>)',
          deep: 'rgb(var(--ps-deep) / <alpha-value>)',   // footer
          paper: 'rgb(var(--ps-paper) / <alpha-value>)', // bloque claro de "Reserva directa"
          alt: 'rgb(var(--ps-alt) / <alpha-value>)',     // franja alternada
          text: 'rgb(var(--ps-fg) / <alpha-value>)',     // texto principal
          body: 'rgb(var(--ps-fg) / 0.84)', // texto de reseñas y respuestas
          muted: 'rgb(var(--ps-fg) / 0.72)', // texto secundario (AA sobre ground y panel)
          soft: 'rgb(var(--ps-fg) / 0.6)',  // íconos y marcas secundarias
          line: 'rgb(var(--ps-fg) / 0.16)', // líneas finas
          rule: 'rgb(var(--ps-fg) / 0.28)', // bordes de etiquetas y botones secundarios
          panel: 'rgb(var(--ps-fg) / 0.05)', // paneles
        },
      },
    },
  },
  plugins: [],
};
