const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const toggleLink = document.getElementById('toggle-form');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const messageEl = document.getElementById('message');

let isLogin = true;

// Redirigir si el usuario ya está logueado
(async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
})();

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    formTitle.textContent = isLogin ? 'Iniciar Sesión' : 'Registro';
    submitButton.textContent = isLogin ? 'Iniciar Sesión' : 'Registrarse';
    toggleLink.textContent = isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión';
    messageEl.textContent = '';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Cargando...';
    messageEl.textContent = '';
    messageEl.classList.remove('text-red-500', 'text-green-500');

    try {
        if (isLogin) {
            const { error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'dashboard.html';
        } else {
            const { error } = await _supabase.auth.signUp({ email, password });
            if (error) throw error;
            messageEl.textContent = '¡Registro exitoso! Revisa tu email para confirmar tu cuenta.';
            messageEl.classList.add('text-green-500');
        }
    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.classList.add('text-red-500');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isLogin ? 'Iniciar Sesión' : 'Registrarse';
    }
});