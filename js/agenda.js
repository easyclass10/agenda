const agendaTitleHeader = document.getElementById('agenda-title-header');
const addNoteForm = document.getElementById('add-note-form');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const notesList = document.getElementById('notes-list');

let user = null;
const params = new URLSearchParams(window.location.search);
const agendaId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!agendaId) {
        window.location.href = 'dashboard.html';
        return;
    }
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    user = session.user;
    loadAgendaDetails();
    loadNotes();
});

const loadAgendaDetails = async () => {
    const { data: agenda } = await _supabase.from('agendas').select('title').eq('id', agendaId).single();
    if (agenda) agendaTitleHeader.textContent = agenda.title;
};

const loadNotes = async () => {
    const { data: notes, error } = await _supabase
        .from('notes')
        .select(`*, images(*), links(*)`)
        .eq('agenda_id', agendaId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    notesList.innerHTML = '';
    notes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = 'bg-white p-6 rounded-lg shadow-md';
        noteEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold">${note.title}</h3>
                    <p class="text-gray-700 mt-2">${note.content || ''}</p>
                </div>
                <button onclick="deleteNote(${note.id})" class="text-sm text-red-500 hover:text-red-700">Eliminar</button>
            </div>
            
            <div class="mt-4 border-t pt-4">
                <h4 class="font-semibold">Imágenes</h4>
                <div class="flex gap-4 mt-2 flex-wrap">
                    ${note.images.map(img => `
                        <div class="relative">
                            <img src="${img.image_url}" class="h-24 w-24 object-cover rounded-md">
                            <button onclick="deleteImage(${img.id}, '${img.image_url}')" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">&times;</button>
                        </div>`).join('')}
                </div>
                <input type="file" onchange="uploadImage(event, ${note.id})" class="mt-2 text-sm">
            </div>

            <div class="mt-4 border-t pt-4">
                <h4 class="font-semibold">Enlaces</h4>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    ${note.links.map(link => `
                        <li class="flex justify-between items-center">
                            <a href="${link.link_url}" target="_blank" class="text-indigo-600 hover:underline truncate">${link.link_url}</a>
                            <button onclick="deleteLink(${link.id})" class="text-xs text-red-500 ml-2 flex-shrink-0">Eliminar</button>
                        </li>`).join('')}
                </ul>
                <form onsubmit="addLink(event, ${note.id})" class="flex gap-2 mt-2">
                    <input type="url" placeholder="https://ejemplo.com" required class="flex-grow px-2 py-1 border rounded-md text-sm">
                    <button type="submit" class="px-3 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300">Añadir</button>
                </form>
            </div>`;
        notesList.appendChild(noteEl);
    });
};

addNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    if (!title) return;
    await _supabase.from('notes').insert({ title, content, agenda_id: agendaId, user_id: user.id });
    addNoteForm.reset();
    loadNotes();
});

window.deleteNote = async (id) => {
    if (!confirm('¿Seguro?')) return;
    await _supabase.from('notes').delete().eq('id', id);
    loadNotes();
};

window.uploadImage = async (event, noteId) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileName = `${user.id}/${noteId}/${Date.now()}-${file.name}`;
    await _supabase.storage.from('images').upload(fileName, file);
    const { data } = _supabase.storage.from('images').getPublicUrl(fileName);
    await _supabase.from('images').insert({ note_id: noteId, user_id: user.id, image_url: data.publicUrl });
    loadNotes();
};

window.deleteImage = async (id, imageUrl) => {
    const url = new URL(imageUrl);
    const path = url.pathname.split('/').slice(4).join('/'); // Extraer el path del archivo
    await _supabase.storage.from('images').remove([path]);
    await _supabase.from('images').delete().eq('id', id);
    loadNotes();
};

window.addLink = async (event, noteId) => {
    event.preventDefault();
    const input = event.target.querySelector('input');
    await _supabase.from('links').insert({ note_id: noteId, user_id: user.id, link_url: input.value });
    event.target.reset();
    loadNotes();
};

window.deleteLink = async (id) => {
    await _supabase.from('links').delete().eq('id', id);
    loadNotes();
};