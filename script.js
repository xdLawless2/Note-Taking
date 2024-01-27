/* global Quill */

// Declare quill outside to maintain its instance
var quill;
var activeNoteId = null; // This will keep track of the currently active note

// Initialize the Quill editor
function initQuill() {
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });
    quill.on('text-change', function() {
        saveCurrentNote();
    });
}

function createNewNote() {
    // Save the current note before creating a new one
    if (activeNoteId !== null) {
        saveCurrentNote();
    }
    
    // Initialize Quill if it does not exist
    if (!quill) {
        initQuill();
    }

    // Show the editor and sidebar
    document.getElementById('editor-container').style.display = 'block';
    document.getElementById('sidebar').style.display = 'block';
    
    // Create a new note with empty content
    var note = {
        id: Date.now(),
        content: { ops: [{ insert: '\n' }] } // Initial content set to newline
    };

    // Push the new note to the data array
    data.notes.push(note);
    
    // Set the new note as active
    activeNoteId = note.id;

    // Display the new note
    displayNoteEditor(note.id);

    // Now that the new note is being displayed, save it to local storage
    saveToLocalStorage();

    // Update the sidebar to include the new note
    updateSidebar();

    // Hide the "No notes available" message
    var noNotesMessage = document.getElementById('no-notes');
    if (noNotesMessage) {
        noNotesMessage.style.display = 'none';
    }
}

function checkForNotes() {
    if (data.notes.length === 0) {
        // Instead of replacing innerHTML, let's hide the Quill editor and show the message
        document.getElementById('editor-container').style.display = 'none';
        var noNotesMessage = document.getElementById('no-notes');
        if (!noNotesMessage) {
            noNotesMessage = document.createElement('div');
            noNotesMessage.id = 'no-notes';
            noNotesMessage.style.textAlign = 'center';
            noNotesMessage.style.padding = '20px';
            noNotesMessage.style.cursor = 'pointer';
            noNotesMessage.textContent = 'No notes are available, click here to create one';
            document.body.appendChild(noNotesMessage); // Append it somewhere visible
            noNotesMessage.addEventListener('click', createNewNote);
        }
        noNotesMessage.style.display = 'block'; // Show the message
    } else {
        document.getElementById('no-notes').style.display = 'none'; // Hide the message
        document.getElementById('editor-container').style.display = 'block'; // Show the editor
    }
}

function displayNoteEditor(noteId) {
    // Find the note to be displayed
    var note = data.notes.find(n => n.id === noteId);

    if (!note) {
        console.error('Note with ID ' + noteId + ' not found.');
        return;
    }

    // Update the active note ID first
    activeNoteId = noteId;

    // Then, set the editor contents to the note's content
    quill.setContents(note.content);

    // Update the status display
    updateActiveNoteStatus(noteId);

    // Focus the editor
    quill.focus();
}


function updateActiveNoteStatus(noteId) {
    var noteStatusDiv = document.getElementById('note-status');
    if (noteId) {
        noteStatusDiv.textContent = 'Active Note: ' + noteId;
        noteStatusDiv.style.display = 'block'; // Show the status indicator
    } else {
        noteStatusDiv.style.display = 'none'; // Hide the status indicator if no note is active
    }
}

var data = {
    notes: []
};

function saveToLocalStorage() {
    localStorage.setItem('noteTakingData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    var savedData = localStorage.getItem('noteTakingData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}



function updateSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = ''; // Clear existing sidebar content

    data.notes.forEach((note, index) => {
        var noteContainer = document.createElement('div');
        noteContainer.className = 'note-container'; // Use this class to style the container
        
        var noteDiv = document.createElement('div');
        noteDiv.innerText = 'Note ' + note.id;
        noteDiv.className = 'note-title'; // Use this class to style the title
        noteDiv.onclick = function() {
            displayNoteEditor(note.id);
        };
        
        var deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';
        deleteBtn.className = 'delete-btn'; // Use this class to style the button
        deleteBtn.onclick = function(event) {
            event.stopPropagation(); // Prevent the note from being opened when the delete button is clicked
            deleteNote(note.id);
        };

        // Append the title and delete button to the container
        noteContainer.appendChild(noteDiv);
        noteContainer.appendChild(deleteBtn);

        // If it's the first note, add a top margin
        if (index === 0) {
            noteContainer.style.marginTop = '10px';
        }

        sidebar.appendChild(noteContainer);
    });
}

function deleteNote(noteId) {
    saveCurrentNote();
    // Remove the note with the given id from the data object
    data.notes = data.notes.filter(note => note.id !== noteId);

    // Update the sidebar to reflect the changes
    updateSidebar();

    // Save the updated data to local storage
    saveToLocalStorage();

    // Find the index of the deleted note
    var noteIndex = data.notes.findIndex(note => note.id === noteId);

    // Remove the note with the given id from the data object
    data.notes = data.notes.filter(note => note.id !== noteId);

    // Clear the editor if the deleted note was being displayed
    if (activeNoteId === noteId) {
        quill.setContents([{ insert: '\n' }]); // Reset editor content
        activeNoteId = null; // Reset active note id
        updateActiveNoteStatus(null);
    }

    if (data.notes.length > 0) {
        var newActiveIndex = noteIndex > 0 ? noteIndex - 1 : 0;
        displayNoteEditor(data.notes[newActiveIndex].id);
    } else {
        // If no notes are left, show the "No notes available" message
        checkForNotes();
    }
}

document.getElementById('insert-response').addEventListener('click', function() {
    var botResponse = document.getElementById('bot-response').textContent;
    if (activeNoteId !== null && quill) {
        var range = quill.getSelection();
        if (range) {
            quill.insertText(range.index, botResponse);
        } else {
            quill.insertText(quill.getLength(), botResponse);
        }
    }
});

function saveCurrentNote() {
    if (activeNoteId !== null) {
        var noteIndex = data.notes.findIndex(n => n.id === activeNoteId);
        if (noteIndex !== -1) {
            data.notes[noteIndex].content = quill.getContents(); // Save the delta to the note
            saveToLocalStorage();
        }
    }
}

// Call checkForNotes when loading and after deleting notes
window.onload = function() {
    loadFromLocalStorage();
    updateSidebar();
    checkForNotes(); // Call this instead of initQuill directly
};

window.onload = function() {
    loadFromLocalStorage();
    updateSidebar();
    initQuill(); // Initialize Quill editor

    document.getElementById('welcome-overlay').onclick = function() {
        this.style.display = 'none';
        document.getElementById('sidebar').style.display = 'block'; // Make sure to display the sidebar
        createNewNote();
    };

    if (data.notes.length > 0) {
        displayNoteEditor(data.notes[0].id); // Display the first note by default
    } else {
        updateActiveNoteStatus(null); // No notes, update the status
    }
};