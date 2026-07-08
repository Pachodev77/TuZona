/**
 * contact.js — Validación del formulario de contacto.
 *
 * Como la app no tiene backend de correo, el envío es simulado: valida los
 * campos en el cliente y muestra un mensaje de confirmación al usuario.
 * Si más adelante se integra un servicio de email, basta con reemplazar
 * la función `submitMessage`.
 */

const form = document.getElementById('contact-form');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setInvalid(groupId, invalid) {
    const group = document.getElementById(groupId);
    if (group) group.classList.toggle('invalid', invalid);
}

function validate() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    const nameOk = name.length >= 2;
    const emailOk = emailRegex.test(email);
    const subjectOk = subject.length >= 3;
    const messageOk = message.length >= 10;

    setInvalid('group-name', !nameOk);
    setInvalid('group-email', !emailOk);
    setInvalid('group-subject', !subjectOk);
    setInvalid('group-message', !messageOk);

    return nameOk && emailOk && subjectOk && messageOk;
}

/** Muestra un mensaje de éxito temporal sobre el formulario. */
function showSuccess() {
    const successBox = document.createElement('div');
    successBox.className = 'alert alert-success';
    successBox.style.cssText = 'padding:1rem;border-radius:6px;margin-top:1rem;background:rgba(76,175,80,0.15);color:#2e7d32;border:1px solid rgba(76,175,80,0.4);';
    successBox.innerHTML = '<i class="fas fa-check-circle"></i> ¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.';
    form.insertAdjacentElement('afterend', successBox);
    setTimeout(() => successBox.remove(), 6000);
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate()) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';

        // Envío simulado (la app no tiene backend de correo).
        setTimeout(() => {
            form.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            showSuccess();
        }, 900);
    });

    // Limpia el estado de error cuando el usuario corrige un campo.
    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            const group = field.closest('.form-group');
            if (group) group.classList.remove('invalid');
        });
    });
}
