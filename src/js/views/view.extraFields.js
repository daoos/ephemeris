var createExtraFieldsView = function () {
  var self ={};
  var objectIsActive = false;

  var init = function () {
    connections()

  }
  var connections =function () {

  }

  var getObjectNameByUuid = function (uuid) {
    let foundItem = query.items("all", i=> i.uuid == uuid)[0]
    if (foundItem) {
      return foundItem.name
    }else {
      return "Missing item"
    }
  }

  var readifyExtraLinks = function () {
    var originalLinks = query.currentProject().extraFields.items
    let data = originalLinks.map(function (l) {
      let visibility = "Visible"
      // alert(l.hidden)
      if (!l.hidden) {
        visibility = "Visible"
      }else if (l.hidden === false) {
        visibility = "Visible"
      }else if (l.hidden === true) {
        visibility = "Hidden"
      }
      // alert(visibility)

      let newItem = {uuid:l.uuid,
        name: l.name,
        prop:l.prop,
        type:l.type,
        hidden:l.hidden,//(l.hidden? "Hidden":"Visible")
        fakevisibility:visibility
      };
      return newItem
    })
    return data.sort(function(a, b) {
      if (a.type && b.type) {
        var nameA = a.type.toUpperCase(); // ignore upper and lowercase
        var nameB = b.type.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {return -1;}
        if (nameA > nameB) {return 1;}
      }
      return 0;})
  }

  var render = async function () {
    var store = await query.currentProject()
    showListMenu({
      sourceData:readifyExtraLinks(),
      displayProp:"name",
      // targetDomContainer:".center-container",
      // fullScreen:true,// TODO: perhaps not full screen?
      display:[
        {prop:"type", displayAs:"Type", edit:false},
        {prop:"name", displayAs:"Name", edit:true},
        {prop:"prop", displayAs:"Registered Property", edit:false},
        {prop:"fakevisibility", displayAs:"Status", edit:false}
      ],
      idProp:"uuid",
      onEditItem: (ev)=>{
        console.log("Edit");
        var newValue = prompt("Edit Item",ev.target.dataset.value)
        if (newValue) {
          push(act.edit("extraFields", {uuid:ev.target.dataset.id, prop:ev.target.dataset.prop, value:newValue}))
          ev.select.updateData(readifyExtraLinks())
        }
      },
      onRemove: (ev)=>{
        if (confirm("remove item definitively?")) {
          let itemToRemove = store.extraFields.items.find(i=>i.uuid == ev.target.dataset.id)
          if (itemToRemove) {
            let type = itemToRemove.type
            let prop = itemToRemove.prop
            //clean all items from this property TODO do in reducer
            store[type].items.forEach(function (i) {
              if (i[prop]) {
                console.log(i);
                console.log(i[prop]);
                delete i[prop]
                console.log("Deleted");
                console.log(i[prop]);
              }
            })
            push(act.remove("extraFields",{uuid:ev.target.dataset.id}))
          }

          ev.select.updateData(readifyExtraLinks())
        }
      },

      extraButtons : [
        {name:"show/hide", class:"iufp_hide", prop:"hidden", closeAfter:true, action: (orev)=>{
          // generateUsersFusionList(owners, orev.dataset.id, orev.dataset.extra )
          console.log(orev);
          if (orev) {
            let isHidden = false
            if (orev.dataset.extra =="true") {
              isHidden = true
            }
            if (orev.dataset.extra =="undefined") {
              isHidden = false
            }
            push(act.edit("extraFields",{uuid:orev.dataset.id, prop:"hidden",value:!isHidden}))
            // orev.select.updateData(readifyExtraLinks())
            update()//TODO close first view

          }
          // let project = query.items("projects").find(p=>p.uuid == orev.dataset.extra)
          // let userToImport= project.stakeholders.items.find(s=>s.uuid == orev.dataset.id)
          // console.log(userToImport)
          // if(store.stakeholders.items.find(s=> s.uuid == userToImport.uuid)){
          //   alert("This user already exist in the current project")
          // }else if (confirm("add user"+ userToImport.name+" "+userToImport.lastName+ " from project "+ project.name+ "?")) {
          //   push(act.add("stakeholders",deepCopy(userToImport)))
          //   setTimeout(function () {
          //     render()
          //   }, 1000);
          // }
        }}
      ],
      // onAdd: (ev)=>{
      //   let tagName = prompt("New tag")
      //   push(act.add("tags",{uuid:genuuid(), name:tagName, color:"#ffffff"}))
      // },
      onClick: (ev)=>{
        //mutations
        // store.metaLinks = store.metaLinks.filter((i)=>i.target != e.target.dataset.id)
        // console.log(ev.target);
        // store.metaLinks.push({source:ev.target.dataset.id , target:e.target.dataset.id})
        // ev.selectDiv.remove()
        // renderCDC(store.db, searchFilter)
      },
      extraActions:[
      ]
    })
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

var extraFieldsView = createExtraFieldsView()
extraFieldsView.init()
