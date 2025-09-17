const userEmailEl = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const addAgendaForm = document.getElementById('add-agenda-form');
const agendaTitleInput = document.getElementById('agenda-title-input');
const agendasList = document.getElementById('agendas-list');

let user = null;

// Proteger la ruta y obtener sesión
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    user = session.user;
    userEmailEl.textContent = user.email;
    loadAgendas();
});

logoutButton.addEventListener('click', async () => {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
});

const loadAgendas = async () => {
    const { data: agendas, error } = await _supabase
        .from('agendas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        agendasList.innerHTML = `<p class="text-red-500">Error al cargar agendas.</p>`;
        return;
    }

    agendasList.innerHTML = '';
    if (agendas.length === 0) {
        agendasList.innerHTML = '<p class="text-gray-500">No has creado ninguna agenda.</p>';
        return;
    }

    agendas.forEach(agenda => {
        const agendaElement = document.createElement('div');
        agendaElement.className = 'bg-white p-4 rounded-lg shadow-md flex justify-between items-center';
        agendaElement.innerHTML = `
            <a href="agenda.html?id=${agenda.id}" class="text-lg font-semibold text-indigo-600 hover:underline">${agenda.title}</a>
            <button onclick="deleteAgenda(${agenda.id})" class="text-sm text-red-500 hover:text-red-700">Eliminar</button>
        `;
        agendasList.appendChild(agendaElement);
    });
};

addAgendaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = agendaTitleInput.value.trim();
    if (!title) return;

    const { error } = await _supabase.from('agendas').insert({ title, user_id: user.id });
    if (error) {
        alert('Error creando la agenda: ' + error.message);
    } else {
        agendaTitleInput.value = '';
        loadAgendas();
    }
});

window.deleteAgenda = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar esta agenda y todas sus notas?')) return;
    const { error } = await _supabase.from('agendas').delete().eq('id', id);
    if (error) {
        alert('Error eliminando la agenda: ' + error.message);
    } else {
        loadAgendas();
    }
};