/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        heading: ['Lato', 'sans-serif'],
        // Rediseño 2026: Avenir Next (institucional) viene instalada en Apple;
        // en el resto de los dispositivos se descarga Nunito Sans (ver src/components.css).
        brand: ['"Avenir Next"', '"Avenir Next LT Pro"', 'Avenir', '"Nunito Sans"', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        ps: {
          ink: '#232323',    // botones y bandas oscuras
          text: '#1C1C1C',   // texto principal
          body: '#3D3D3B',   // texto de reseñas y respuestas
          muted: '#5E5E5C',  // texto secundario (AA sobre ground y panel)
          soft: '#BDBDBA',   // texto secundario sobre ink
          line: '#D9D9D6',
          rule: '#CFCFCC',
          panel: '#EBEBE9',  // paneles grises
          ground: '#F5F5F4', // fondo general
        },
      },
    },
  },
  plugins: [],
};
