var createNotesManager = function (targetSelector) {
  var self ={};
  var objectIsActive = false;
  var container = document.querySelector(targetSelector)
  let easymde = undefined
  let nodeToDisplay = undefined

  let theme = {}
  theme.noNote = function () {
    return `
    <div class="ui placeholder segment">
      <div class="ui icon header">
        <i class="sticky note outline icon"></i>
        Select a note to display
      </div>
    </div>`
  }
  theme.editor = function (e) {
     html =`
     <div class="noteAreaEditor">
        <h1 class="ui header">${e.title}
          <button data-name="${e.title}" data-id="${e.uuid}" class="ui basic mini button action_note_manager_rename_note">Rename</button>
          <button data-id="${e.uuid}" class="ui basic red mini button action_note_manager_remove_note">Delete Note</button>
        </h1>
       <textarea class="inputNoteAreaEditor"></textarea>
     </div>
    `
    return html
  }
  theme.notePreviewItem = function (i) {
     html =`
     <div data-id="${i.uuid}" class="list-item action_note_manager_load_note">
       <strong data-id="${i.uuid}" >${i.title}</strong>
       <i class="fas fa-sticky-note"></i>
       <div data-id="${i.uuid}" >${i.content.substring(0,135)+".. "}</div>
     </div>`

    return html
  }
  theme.notePreviewList= function (html) {
     html =`
      <div class="title">
        Notes
        <span class="action_note_manager_add_note small button"> Add</span>
      </div>
      <div class="left-list">${html}</div>
    `
    return html
  }


  var init = function () {
    connections()

  }
  var connections =function () {
    connect(".action_note_manager_load_note", "click", (e)=>{
      console.log(e.target.dataset.id);
      let noteId = e.target.dataset.id
      let note = app.store.userData.notes.items.filter(n=>n.uuid == noteId)[0]
      if (note) {
        renderNote(note)
      }
    })
    connect(".action_note_manager_remove_note", "click", (e)=>{
      console.log(e.target.dataset.id);
      if (confirm("This not will be deleted")) {
        let noteId = e.target.dataset.id
        //TODO This has to be removed and routes must be used
        app.store.userData.notes.items = app.store.userData.notes.items.filter(n=>n.uuid != noteId)
        update()
      }
    })
    connect(".action_note_manager_rename_note", "click", (e)=>{
      console.log(e.target.dataset.id);
      let newName = prompt("Enter a new name", e.target.dataset.name)
      if (newName) {
        let noteId = e.target.dataset.id
        //TODO This has to be removed and routes must be used
        let note = app.store.userData.notes.items.filter(n=>n.uuid == noteId)[0]
        if (note) {
          note.title = newName
          renderNote(note)
        }
        update()
      }
    })
    connect(".action_note_manager_add_note", "click", (e)=>{
      app.store.userData.notes.items.push({
        uuid:genuuid(),
        title:"A new Note",
        content:"Click to edit the note"
      })
      update()
    })
  }

  var render = function () {
    container.innerHTML = theme.noNote()
    let treeContainer = document.querySelector(".left-menu-area")
    treeContainer.innerHTML= renderNoteTree()
  }
  function renderNoteTree() {
    let html = ""
    app.store.userData.notes.items.forEach(function (e) {//todo add proper routes
      html += theme.notePreviewItem(e)
    })
    return theme.notePreviewList(html)
  }

  function renderNote(e) {
    container.innerHTML = theme.editor(e)
    console.log(e.content);
    easyMDE = new EasyMDE({
      element: document.querySelector('.inputNoteAreaEditor'),
      autoDownloadFontAwesome:false,
      spellChecker:false,
      initialValue : e.content
    });

    easyMDE.codemirror.on("change", function(){
    	console.log(easyMDE.value());
      e.content = easyMDE.value()//TODO use routes. UGLY
    });
  }

  var update = function () {
    render()
  }

  var setActive =function () {
    objectIsActive = true;
    update()
  }

  var setInactive = function () {
    objectIsActive = false;
  }

  self.setActive = setActive
  self.setInactive = setInactive
  self.update = update
  self.init = init

  return self
}

var notesManager = createNotesManager(".center-container")
notesManager.init()