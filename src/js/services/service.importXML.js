var createImportXMLService = function () {
  var self ={};
  var objectIsActive = false;

  let file, url, reader = new FileReader;

  var options = {
    attributeNamePrefix : "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName : "#text",
    ignoreAttributes : true,
    ignoreNameSpace : false,
    allowBooleanAttributes : false,
    parseNodeValue : true,
    parseAttributeValue : true,
    localeRange: "", //To support non english character in tag/attribute values.
    parseTrueNumberOnly: false,
    arrayMode: false
};

  var init = function () {
    connections()

  }
  var connections =function () {
    document.addEventListener("keydown", function(event) {
      if (!( event.key == 'k' && event.ctrlKey) ) return true;
      importXML()
      //document.querySelector('#topmenu_project_saver').click()
      //A bit ugly TODO: check for a better way
      event.preventDefault();
      return false;
    })
  }

  var render = function (uuid) {
  }

  function readJSON(e) {
    reader.readAsText(document.querySelector('#newInput').files[0]);
  }

  var xmlParser = function (xml) {
    var sMyString = xml;
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(sMyString, "application/xml");
    // print the name of the root element or error message
    console.log(oDOM.documentElement.nodeName == "parsererror" ? "error while parsing" : oDOM.documentElement.nodeName);
    console.log(oDOM.documentElement.nodeName == "parsererror" ? "error while parsing" : oDOM.documentElement);
    return oDOM.documentElement
  }

  var importXML = function () {

    reader = new FileReader;
    var input=document.createElement('input');
    input.style.display="none"
    input.id="newInput"
    input.type="file";
    document.body.appendChild(input)
    setTimeout(function () {

      reader.addEventListener("load", function() {
        console.log(reader.result);
        var xmlDOM = xmlParser(reader.result)
        if (confirm("Archimate importer Beta: This is an experimental feature. The current open project will be modified. Do you wish to continue")) {
          xmlToProject(xmlDOM)
        }
        //console.log(parser.parse(reader.result, options));
        document.querySelector('#newInput').remove()
      });

      document.querySelector('#newInput').addEventListener("change", readJSON);
      document.querySelector('#newInput').click()

    }, 500);

  }

  var xmlToProject = function (xmlDOM) {
    var projectProducts = []
    var projectRelations = []
    //parsingFunction
    var doForEach = function (item, callback) {
      for (var i = 0; i < item.length; i++) {
        callback(item[i])
      }
    };
    var findElementTypeInChildren = function (item, elementName) {
      for (var i = 0; i < item.length; i++) {
        if (item[i].tagName.toLowerCase() == elementName) {
          return item[i]
        }
      }
    }
    //rules
    var parseAsElementFolder =function (folder, targetArray, folderType) {
      let type = folderType || folder.getAttribute('type')// if type is specified use it or find it
      doForEach(folder.children, function (item) {
        console.log(item.tagName.toLowerCase());
        if (item.tagName.toLowerCase() == "element") {
          let elementId = item.id || item.getAttribute("identifier")
          let elementName = item.getAttribute("name") || findElementTypeInChildren(item.children,"name").innerHTML
          targetArray.push({id:elementId, name:elementName, type:item.getAttribute("xsi:type"), layertype:type})
        }else if (item.tagName.toLowerCase() == "folder") {//if element is another folder
          parseAsElementFolder(item, projectProducts, type)// parse as a folder with the previous folder type
        }
      })
    }
    var parseAsRelations =function (folder, targetArray,folderType) {
      let type = folderType || folder.getAttribute('type')// if type is specified use it or find it
      doForEach(folder.children, function (item) {
        if (item.tagName.toLowerCase() == "element") {
          let elementId = item.id || item.getAttribute("identifier")
          targetArray.push({id:elementId, name:item.getAttribute("xsi:type"), source:item.getAttribute("source"), target:item.getAttribute("target")})
        }else if (item.tagName.toLowerCase() == "folder") {//if element is another folder
          parseAsRelations(item, projectRelations, type)// parse as a folder with the previous folder type
        }
      })
    }

    doForEach(xmlDOM.children, function (folder) {// parse firstLevel
      console.log(folder);
      if (folder.getAttribute('type') != "relations" && folder.getAttribute('type') != "diagrams" && folder.getAttribute('type') != "connectors") {
        parseAsElementFolder(folder, projectProducts)
      }
      //parse relations
      if (folder.getAttribute('type') == "relations") {
        parseAsRelations(folder, projectRelations)
      }
    })

    console.log(projectProducts);
    console.log(projectRelations);

    //send to current project
    //let store = query.currentProject() //DBCHANGE
    let store = false //DBCHANGE
    // create archimate interface Types
    if (store) {
      alert("loading into project")
      // create archimate interface Types
      let archimateRelations = deepCopy(archimateTemplate.specs.relations)//TODO make general
      for (var relation in archimateRelations) {
        if (archimateRelations.hasOwnProperty(relation)) {
          let rel = archimateRelations[relation]
          let typeName = rel.name.slice(0, -12)
          let relationId = archimateTemplate.prefix.idPrefix+rel.type
          push(act.add("interfacesTypes",{uuid:relationId, name:typeName, extTyp:rel.type, color:"#ffffff", dashArray:rel.dashStyle == "dashed"?1:0}))

        }
      }
      // create archimate categories Types
      let archimateLayers = deepCopy(archimateTemplate.specs.layers)//TODO make general
      let archimateCategories = deepCopy(archimateTemplate.specs.elements)//TODO make general
      for (var category in archimateCategories) {
        if (archimateCategories.hasOwnProperty(category)) {
          let cat = archimateCategories[category]
          let typeName = cat.name
          let catId = archimateTemplate.prefix.idPrefix+cat.type
          let linkedLayer = archimateLayers[cat.layer]
          push(act.add("categories",{uuid:catId, name:typeName, extTyp:cat.type, color:linkedLayer.color}))

        }
      }

      //Loading elements
      projectProducts.forEach(function (item) {
        push(addPbs({uuid:item.id, name:item.name}))
        push(addPbsLink({source:query.currentProject().currentPbs.items[0].uuid, target:item.id}))
        if (true) {
          push(act.add("metaLinks",{type:"category", source:item.id, target:archimateTemplate.prefix.idPrefix+item.type.substring(10)}))
        }
      })
      projectRelations.forEach(function (item) {
        if (item.name==null) {
          item.name =  "NULL at import"
        }
        let interfaceUuid = item.id
        let interfaceTypeTargetId = archimateTemplate.prefix.idPrefix+item.name.substring(10)
        console.log(interfaceTypeTargetId);
        push(act.add("interfaces",{uuid:interfaceUuid, type:"Physical connection", name:item.name,description:"Archimate relation", source:item.source, target:item.target}))
        if (true) {
          push(act.add("metaLinks",{type:"interfacesType", source:interfaceUuid, target:interfaceTypeTargetId}))
        }

      })
    }else if (app.state.currentUser) {
      var newProjectFromXMLName = prompt("Add a new Project from XML file")
      //TODO Bad
      if (newProjectFromXMLName) {
        var newProjectFromXml = createNewProject(newProjectFromXMLName)
        // create archimate interface Types
        let archimateRelations = deepCopy(archimateTemplate.specs.relations)//TODO make general
        for (var relation in archimateRelations) {
          if (archimateRelations.hasOwnProperty(relation)) {
            let rel = archimateRelations[relation]
            let typeName = rel.name.slice(0, -12)
            let relationId = archimateTemplate.prefix.idPrefix+rel.type

            newProjectFromXml.interfacesTypes.items.push({uuid:relationId, name:typeName, extTyp:rel.type, color:"#ffffff", dashArray:rel.dashStyle == "dashed"?1:0})
          }
        }
        // create archimate categories Types
        let archimateLayers = deepCopy(archimateTemplate.specs.layers)//TODO make general
        let archimateCategories = deepCopy(archimateTemplate.specs.elements)//TODO make general
        for (var category in archimateCategories) {
          if (archimateCategories.hasOwnProperty(category)) {
            let cat = archimateCategories[category]
            let typeName = cat.name
            let catId = archimateTemplate.prefix.idPrefix+cat.type
            let linkedLayer = archimateLayers[cat.layer]
            newProjectFromXml.categories.items.push({uuid:catId, name:typeName, extTyp:cat.type, color:linkedLayer.color})
          }
        }
        //Loading elements
        newProjectFromXml.currentPbs.items.push({name: newProjectFromXMLName, uuid: genuuid()})
        projectProducts.forEach(function (item) {
          newProjectFromXml.currentPbs.items.push({uuid:item.id, name:item.name})
          console.log(newProjectFromXml);
          newProjectFromXml.currentPbs.links.push({uuid:genuuid(),source:newProjectFromXml.currentPbs.items[0].uuid, target:item.id})
          if (true) {
            newProjectFromXml.metaLinks.items.push({uuid:genuuid(),type:"category", source:item.id, target:archimateTemplate.prefix.idPrefix+item.type.substring(10)})
          }
        })
        projectRelations.forEach(function (item) {
          if (item.name==null) {
            item.name =  "NULL at import"
          }
          let interfaceUuid = item.id
          let interfaceTypeTargetId = archimateTemplate.prefix.idPrefix+item.name.substring(10)
          console.log(interfaceTypeTargetId);
          newProjectFromXml.interfaces.items.push({uuid:interfaceUuid, type:"Physical connection", name:item.name,description:"Archimate relation", source:item.source, target:item.target})
          if (true) {
            newProjectFromXml.metaLinks.items.push({uuid:genuuid(),type:"interfacesType", source:interfaceUuid, target:interfaceTypeTargetId})
          }
        })
        dbConnector.addProject(newProjectFromXml)//use actions DBCHANGE
        // app.store.projects.push(newProjectFromXml)//use actions DBCHANGE
        setTimeout(function () {pageManager.setActivePage("projectSelection")}, 2000);
      }
    }

  }

  var archimateTemplate = {
    prefix:{idPrefix:'extArchi_'},
    specs:{
      layers:{
        strategy:{name:"Strategy", type:"strategy", color:"#fbdb9a"},
        business:{name:"Business", type:"business", color:"#f2c748"},
        application:{name:"Application", type:"application", color:"#5c9dce"},
        technology:{name:"Technology", type:"technology", color:"#97bf83"},
        physical:{name:"Physical", type:"physical", color:"#87cc65"},
        motivation:{name:"Motivation", type:"motivation", color:"#cdcdcd"},
        implementation_migration:{name:"Implementation & Migration", type:"implementation_migration", color:"#f2c4ca"},
        other:{name:"Other", type:"other", color:"#ffffff"},
        relations:{name:"Relations", type:"relations", color:"#ffffff"}//connectors and view missing
      },
      elements:{
        Ressource:{name:"Ressource", type:"Ressource", layer:"strategy"},
        Capability:{name:"Capability", type:"Capability", layer:"strategy"},
        CourseOfAction:{name:"Course of Action", type:"CourseOfAction", layer:"strategy"},
        //strategy
        BusinessObject:{name:"Business Object", type:"BusinessObject", layer:"business"},
        Contract:{name:"Contract", type:"Contract", layer:"business"},
        Representation:{name:"Representation", type:"Representation", layer:"business"},
        Product:{name:"Product", type:"Product", layer:"business"},
        BusinessService:{name:"Business Service", type:"BusinessService", layer:"business"},
        BusinessEvent:{name:"Business Event", type:"BusinessEvent", layer:"business"},
        BusinessFunction:{name:"Business Function", type:"BusinessFunction", layer:"business"},
        BusinessInteraction:{name:"Business Interaction", type:"BusinessInteraction", layer:"business"},
        BusinessProcess:{name:"Business Process", type:"BusinessProcess", layer:"business"},
        BusinessRole:{name:"Business Role", type:"BusinessRole", layer:"business"},
        BusinessCollaboration:{name:"Business Collaboration", type:"BusinessCollaboration", layer:"business"},
        BusinessActor:{name:"Business Actor", type:"BusinessActor", layer:"business"},
        BusinessInterface:{name:"Business Interface", type:"BusinessInterface", layer:"business"},
        //application
        DataObject:{name:"Data Object", type:"DataObject", layer:"application"},
        ApplicationService:{name:"Application Service", type:"ApplicationService", layer:"application"},
        ApplicationEvent:{name:"Application Event", type:"ApplicationEvent", layer:"application"},
        ApplicationFunction:{name:"Application Function", type:"ApplicationFunction", layer:"application"},
        ApplicationInteraction:{name:"Application Interaction", type:"ApplicationInteraction", layer:"application"},
        ApplicationProcess:{name:"Application Process", type:"ApplicationProcess", layer:"application"},
        ApplicationComponent:{name:"Application Component", type:"ApplicationComponent", layer:"application"},
        ApplicationCollaboration:{name:"Application Collaboration", type:"ApplicationCollaboration", layer:"application"},
        ApplicationInterface:{name:"Application Interface", type:"ApplicationInterface", layer:"application"},
        //technology
        Artifact:{name:"Artifact", type:"Artifact", layer:"technology"},
        TechnologyService:{name:"Technology Service", type:"TechnologyService", layer:"technology"},
        TechnologyEvent:{name:"Technology Event", type:"TechnologyEvent", layer:"technology"},
        TechnologyFunction:{name:"Technology Function", type:"TechnologyFunction", layer:"technology"},
        TechnologyInteraction:{name:"Technology Interaction", type:"TechnologyInteraction", layer:"technology"},
        TechnologyProcess:{name:"Technology Process", type:"TechnologyProcess", layer:"technology"},
        Node:{name:"Node", type:"Node", layer:"technology"},
        TechnologyInterface:{name:"Technology Interface", type:"TechnologyInterface", layer:"technology"},
        CommunicationNetwork:{name:"Communication Network", type:"CommunicationNetwork", layer:"technology"},
        SystemSoftware:{name:"System Software", type:"SystemSoftware", layer:"technology"},
        TechnologyCollaboration:{name:"Technology Collaboration", type:"TechnologyCollaboration", layer:"technology"},
        Path:{name:"Path", type:"Path", layer:"technology"},
        Device:{name:"Device", type:"Device", layer:"technology"},
        //physical
        Material:{name:"Materal", type:"Material", layer:"physical"},
        Facility:{name:"Facility", type:"Facility", layer:"physical"},
        Equipment:{name:"Equipment", type:"Equipment", layer:"physical"},
        DistributionNetwork:{name:"Distribution Network", type:"DistributionNetwork", layer:"physical"},
        //implementation_migration
        Deliverable:{name:"Deliverable", type:"Deliverable", layer:"implementation_migration"},
        Gap:{name:"Gap", type:"Gap", layer:"implementation_migration"},
        WorkPackage:{name:"Work Package", type:"WorkPackage", layer:"implementation_migration"},
        ImplementationEvent:{name:"Implementation Event", type:"ImplementationEvent", layer:"implementation_migration"},
        Plateau:{name:"Plateau", type:"Plateau", layer:"implementation_migration"}
        //TODO Add Motivation
      },
      relations:{
        //relations
        CompositionRelationship:{name:"Composition Relationship", type:"CompositionRelationship", layer:"implementation_migration", dashStyle:"normal"},
        AggregationRelationship:{name:"Aggregation Relationship", type:"AggregationRelationship", layer:"implementation_migration", dashStyle:"normal"},
        AssignmentRelationship:{name:"Assignment Relationship", type:"AssignmentRelationship", layer:"implementation_migration", dashStyle:"normal"},
        zationRelationship:{name:"zation Relationship", type:"zationRelationship", layer:"implementation_migration", dashStyle:"dashed"},
        sationRelationship:{name:"sation Relationship", type:"sationRelationship", layer:"implementation_migration", dashStyle:"dashed"},//TODO what is the correct writing?
        UsedByRelationship:{name:"Used By Relationship", type:"UsedByRelationship", layer:"implementation_migration", dashStyle:"normal"},
        AccessRelationship:{name:"Access Relationship", type:"AccessRelationship", layer:"implementation_migration", dashStyle:"dashed"},
        AssociationRelationship:{name:"Association Relationship", type:"AssociationRelationship", layer:"implementation_migration", dashStyle:"normal"},
        FlowRelationship:{name:"Flow Relationship", type:"FlowRelationship", layer:"implementation_migration", dashStyle:"dashed"},
        TriggeringRelationship:{name:"Triggering Relationship", type:"TriggeringRelationship", layer:"implementation_migration", dashStyle:"normal"},
        SpecializationRelationship:{name:"Specialization Relationship", type:"SpecializationRelationship", layer:"implementation_migration", dashStyle:"normal"},
        JunctionRelationship:{name:"Junction Relationship", type:"JunctionRelationship", layer:"implementation_migration", dashStyle:"normal"},
        GroupingRelationship:{name:"Grouping Relationship", type:"GroupingRelationship", layer:"implementation_migration", dashStyle:"normal"}
      }
    }

  }


  var update = function () {
    render()
  }

  self.update = update
  self.init = init

  return self
}

var importXMLService = createImportXMLService()
importXMLService.init()
