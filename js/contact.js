(function () {
  const form = document.getElementById('contact-form');
  const statusBox = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();                       // ← evita la navegación a la Thank-you page
    statusBox.textContent = 'Enviando...';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }   // ← pide respuesta JSON
      });

      if (res.ok) {
        form.reset();
        statusBox.textContent = '¡Gracias! Tu mensaje fue enviado.';
      } else {
        // Formspree devuelve JSON con detalles si hay error de validación
        const data = await res.json().catch(() => ({}));
        statusBox.textContent = data?.error || 'Hubo un problema. Intentalo más tarde.';
      }
    } catch (err) {
      statusBox.textContent = 'Error de red. Intentalo más tarde.';
    }
  });
})();