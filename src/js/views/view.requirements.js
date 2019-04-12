var createRequirementsView = function () {
  var self ={};
  var objectIsActive = false;

  var init = function () {
    connections()
    //update()

  }
  var connections =function () {

  }

  var render = function () {

    var store = query.currentProject()
      showListMenu({
        sourceData:store.requirements.items,
        sourceLinks:store.requirements.links,
        metaLinks:store.metaLinks.items,
        targetDomContainer:".center-container",
        fullScreen:true,
        displayProp:"name",
        display:[
          {prop:"name", displayAs:"name", edit:"true"},
          {prop:"desc", displayAs:"Description", edit:"true"},
          {prop:"origin", displayAs:"Reçu de", meta:()=>store.metaLinks.items, choices:()=>store.stakeholders.items, edit:"true"}
        ],
        idProp:"uuid",
        onEditItem: (ev)=>{
          console.log("Edit");
          var newValue = prompt("Edit Item",ev.target.dataset.value)
          if (newValue) {
            push(editRequirement({uuid:ev.target.dataset.id, prop:ev.target.dataset.prop, value:newValue}))
          }
        },
        onEditChoiceItem: (ev)=>{
          var metalinkType = ev.target.dataset.prop;
          var sourceTriggerId = ev.target.dataset.id;
          var currentLinksUuidFromDS = JSON.parse(ev.target.dataset.value)
          showListMenu({
            sourceData:store.stakeholders.items,
            parentSelectMenu:ev.select ,
            multipleSelection:currentLinksUuidFromDS,
            displayProp:"name",
            searchable : true,
            display:[
              {prop:"name", displayAs:"Name", edit:false},
              {prop:"desc", displayAs:"Description", edit:false}
            ],
            idProp:"uuid",
            onCloseMenu: (ev)=>{
              console.log(ev.select);
              ev.select.getParent().update()
            },
            onChangeSelect: (ev)=>{
              console.log(ev.select.getSelected());
              console.log(store.metaLinks.items);
              store.metaLinks.items = store.metaLinks.items.filter(l=>!(l.type == metalinkType && l.source == sourceTriggerId && currentLinksUuidFromDS.includes(l.target)))
              console.log(store.metaLinks.items);
              for (newSelected of ev.select.getSelected()) {
                push(act.add("metaLinks",{type:metalinkType, source:sourceTriggerId, target:newSelected}))
              }
              ev.select.getParent().updateMetaLinks(store.metaLinks.items)
              ev.select.getParent().update()
            },
            onClick: (ev)=>{
              console.log("select");
            }
          })
        },
        onRemove: (ev)=>{
          console.log("remove");
          if (confirm("remove item ?")) {
            push(removeRequirement({uuid:ev.target.dataset.id}))
            ev.select.updateData(store.requirements.items)
          }
        },
        onMove: (ev)=>{
          console.log("move");
          if (confirm("move item ?")) {
            push(moveRequirement({origin:ev.originTarget.dataset.id, target:ev.target.dataset.id}))
            //update links if needed
            push(removeRequirementLink({target:ev.originTarget.dataset.id}))
            if (ev.targetParentId && ev.targetParentId != "undefined") {
              push(addRequirementLink({source:ev.targetParentId, target:ev.originTarget.dataset.id}))
            }
            ev.select.updateData(store.requirements.items)
            ev.select.updateLinks(store.requirements.links)
          }
        },
        onAdd: (ev)=>{
          var newReq = prompt("Nouveau Besoin")
          push(addRequirement({name:newReq}))
        },
        onClick: (ev)=>{
          var originItem = store.requirements.items.filter(e=> e.uuid == ev.target.dataset.id)
          showListMenu({
            sourceData:store.requirements.items,
            sourceLinks:store.requirements.links,
            metaLinks:store.metaLinks.items,
            parentSelectMenu:ev.select ,
            displayProp:"name",
            searchable : false,
            singleElement:originItem[0],
            rulesToDisplaySingleElement:[
              {prop:"name", displayAs:"Name", edit:"true"},
              {prop:"desc", displayAs:"Description", edit:"true"},
              {prop:"origin", displayAs:"Reçu de", meta:()=>store.metaLinks.items, choices:()=>store.stakeholders.items, edit:false}
            ],
            display:[
              {prop:"name", displayAs:"Name", edit:false},
              {prop:"desc", displayAs:"Description", edit:false},
              {prop:"origin", displayAs:"Reçu de", meta:()=>store.metaLinks.items, choices:()=>store.stakeholders.items, edit:false}
            ],
            idProp:"uuid",
            onCloseMenu: (ev)=>{
              //console.log("fefsefse");
              console.log(ev.select);
              ev.select.getParent().update()
            },
            onEditItem: (ev)=>{
              console.log("Edit");
              var newValue = prompt("Edit Item",ev.target.dataset.value)
              if (newValue) {
                push(editRequirement({uuid:ev.target.dataset.id, prop:ev.target.dataset.prop, value:newValue}))
              }
            }
          })
        },
        onClear: (ev)=>{
          renderCDC()
        },
        extraActions:[
          {
            name:"Diagramme",
            action:(ev)=>{
              renderRequirementsTree(ev)
            }
          }
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

  var renderRequirementsTree = function (ev) {
    var store = query.currentProject()
    if (true) {
      function generateDataSource() {
        var placeholder = false
        var data =undefined
        if (store.requirements.items[0]) {
          var targets = store.requirements.links.map(item => item.target)
          var roots = store.requirements.items.filter(item => !targets.includes(item.uuid))
          if (roots && roots[1]) {//if more than one root node
            placeholder = true
            var newData = store.requirements.items.slice()
            var newLinks = store.requirements.links.slice()
            newData.push({uuid:"placeholder", name:"placeholder"})
            for (root of roots) {
              newLinks.push({source:"placeholder", target:root.uuid})
            }
            data = hierarchiesList(newData, newLinks)[0]
          }else {
            data = hierarchiesList(store.requirements.items, store.requirements.links)[0]
          }
          console.log(data);
        }
        return data
      }

      displayThree({
        data:generateDataSource(),
        edit:true,
        onClose:(e)=>{
          renderCDC()
          ev.select.update() //TODO find a better way

        },
        onAdd:(ev)=>{
          var uuid = genuuid()
          var newName = prompt("Name?")
          push(addRequirement({uuid:uuid, name:newName}))
          push(addRequirementLink({source:ev.element.data.uuid, target:uuid}))
          ev.sourceTree.setData(generateDataSource())
          //ev.sourceTree.updateFromRoot(ev.element)
        },
        onMove:(ev)=>{
          push(removeRequirementLink({source:ev.element.parent.data.uuid, target:ev.element.data.uuid}))
          push(addRequirementLink({source:ev.newParent.data.uuid, target:ev.element.data.uuid}))
          ev.sourceTree.setData(generateDataSource())
        },
        onRemove:(ev)=>{
          if (confirm("Keep Childs?")) {
            var originalLinks = store.requirements.links.filter(e=>e.source == ev.element.data.uuid)
            for (link of originalLinks) {
              push(addRequirementLink({source:ev.element.parent.data.uuid, target:link.target}))
            }
          }
          //remove all links
          push(removeRequirementLink({source:ev.element.data.uuid}))
          //addNewLinks
          push(removeRequirement({uuid:ev.element.data.uuid}))
          //push(addPbsLink({source:ev.element.data.uuid, target:uuid}))
          ev.sourceTree.setData(generateDataSource())
        },
        onNodeClicked:(originev)=>{
          var originItem = store.requirements.items.filter(e=> e.uuid == originev.element.data.uuid)
          showListMenu({
            sourceData:store.requirements.items,
            sourceLinks:store.requirements.links,
            displayProp:"name",
            searchable : false,
            singleElement:originItem[0],
            rulesToDisplaySingleElement:[
              {prop:"name", displayAs:"Name", edit:"true"}
            ],
            display:[
              {prop:"name", displayAs:"Name", edit:false}
            ],
            idProp:"uuid",
            onCloseMenu: (ev)=>{
              //console.log("fefsefse");
              console.log(originev.sourceTree);
              // ev.select.getParent().update()
              originev.sourceTree.setData(generateDataSource())
              originev.sourceTree.hardUpdate()//TODO find better way
            },
            onEditItem: (ev)=>{
              console.log("Edit");
              var newValue = prompt("Edit Item",ev.target.dataset.value)
              if (newValue) {
                push(editRequirement({uuid:ev.target.dataset.id, prop:ev.target.dataset.prop, value:newValue}))
              }
              //ev.select.update()
            }
          })
        }
      })
    }
  }

  self.setActive = setActive
  self.setInactive = setInactive
  self.update = update
  self.init = init

  return self
}

var requirementsView = createRequirementsView()
requirementsView.init()
