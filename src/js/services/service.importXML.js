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
      if (!( event.key == 'i' && event.ctrlKey) ) return true;
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

    alert("fefsef")
    var input=document.createElement('input');
    input.style.display="none"
    input.id="newInput"
    input.type="file";
    document.body.appendChild(input)
    setTimeout(function () {

      reader.addEventListener("load", function() {
        console.log(reader.result);
        var xmlDOM = xmlParser(reader.result)
        xmlToProject(xmlDOM)
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
    //rules
    var parseAsElementFolder =function (folder, targetArray) {
      let type = folder.getAttribute('type')
      doForEach(folder.children, function (item) {
        targetArray.push({id:item.id, name:item.getAttribute("name"), type:type})
      })
    }
    var parseAsRelations =function (folder, targetArray) {
      let type = folder.getAttribute('type')
      doForEach(folder.children, function (item) {
        targetArray.push({id:item.id, name:item.getAttribute("xsi:type"), source:item.getAttribute("source"), target:item.getAttribute("target")})
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
    let store = query.currentProject()
    // create archimate interface Types
    if (store) {
      alert("loading into project")
      // create archimate interface Types
      let archimateRelations = archimateTemplate.specs.relations
      for (var relation in archimateRelations) {
        if (archimateRelations.hasOwnProperty(relation)) {
          let rel = archimateRelations[relation]
          let typeName = rel.name
          let relationId = archimateTemplate.prefix+rel.type
          push(act.add("interfacesTypes",{uuid:relationId, name:typeName, extTyp:rel.type, color:"#ffffff"}))

        }
      }

      //Loading elements
      projectProducts.forEach(function (item) {
        push(addPbs({uuid:item.id, name:item.name}))
        push(addPbsLink({source:query.currentProject().currentPbs.items[0].uuid, target:item.id}))
      })
      projectRelations.forEach(function (item) {
        let interfaceUuid = item.id
        let interfaceTypeTargetId = archimateTemplate.prefix+item.name.substring(10)
        console.log(interfaceTypeTargetId);
        push(act.add("interfaces",{uuid:interfaceUuid, type:undefined, name:item.name,description:"Archimate relation", source:item.source, target:item.target}))
        if (true) {

          push(act.add("metaLinks",{type:"interfacesType", source:interfaceUuid, target:interfaceTypeTargetId}))
        }

      })
    }

  }

  var archimateTemplate = {
    prefix:{idPrefix:'extArchi_'},
    specs:{
      layers:{
        strategy:{name:"Strategy", type:"strategy", color:"#ffffff"},
        business:{name:"Business", type:"business", color:"#ffffff"},
        application:{name:"Application", type:"application", color:"#ffffff"},
        technology:{name:"Technology", type:"technology", color:"#ffffff"},
        physical:{name:"Physical", type:"physical", color:"#ffffff"},
        motivation:{name:"Motivation", type:"motivation", color:"#ffffff"},
        implementation_migration:{name:"Implementation & Migration", type:"implementation_migration", color:"#ffffff"},
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
        CompositionRelationship:{name:"Composition Relationship", type:"CompositionRelationship", layer:"implementation_migration"},
        AggregationRelationship:{name:"Aggregation Relationship", type:"AggregationRelationship", layer:"implementation_migration"},
        AssignmentRelationship:{name:"Assignment Relationship", type:"AssignmentRelationship", layer:"implementation_migration"},
        RealizationRelationship:{name:"Realization Relationship", type:"RealizationRelationship", layer:"implementation_migration"},
        UsedByRelationship:{name:"Used By Relationship", type:"UsedByRelationship", layer:"implementation_migration"},
        AccessRelationship:{name:"Access Relationship", type:"AccessRelationship", layer:"implementation_migration"},
        AssociationRelationship:{name:"Association Relationship", type:"AssociationRelationship", layer:"implementation_migration"},
        FlowRelationship:{name:"Flow Relationship", type:"FlowRelationship", layer:"implementation_migration"},
        TriggeringRelationship:{name:"Triggering Relationship", type:"TriggeringRelationship", layer:"implementation_migration"},
        SpecializationRelationship:{name:"Specialization Relationship", type:"SpecializationRelationship", layer:"implementation_migration"},
        JunctionRelationship:{name:"Junction Relationship", type:"JunctionRelationship", layer:"implementation_migration"},
        GroupingRelationship:{name:"Grouping Relationship", type:"GroupingRelationship", layer:"implementation_migration"}
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
