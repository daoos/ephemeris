var query = {}
query.currentProject = async function () {
  let currentProjectUuid = app.state.currentProject
  let currentProjectToReturn = await dbConnector.getProject(currentProjectUuid)
  return currentProjectToReturn
}

query.collection = async function (collectionName) {
  let currentProjectUuid = app.state.currentProject
  let currentCollectionToReturn = await dbConnector.getProjectCollection(currentProjectUuid, collectionName)
  return currentCollectionToReturn
}

 query.items = async (group, condition) => {
  //var store = store;
  var store = await query.currentProject() || app.store.projects[0] //TODO remove super ugly
  var storeGroup = undefined

  if (group == 'all') {//il looking in all groups
    let allItems = []
    for (var keys in store) {
      if (store.hasOwnProperty(keys)) {
        if (store[keys].items) {
          allItems = allItems.concat(store[keys].items)
        }
      }
    }
    return allItems.filter(condition)

  }else {// else group is specified
    //#corner cases
    if (group == "projects") {
      //console.log(app.store.projects);
      // storeGroup = app.store.projects //DBCHANGE
      storeGroup = await dbConnector.getUserProjectList()
      console.log(storeGroup);
    }
    //#general cases

    if (!storeGroup && typeof group == "string") {
      storeGroup = store[group].items;
    }else if (Array.isArray(group)) {
      for (prop of group) {
        console.log(storeGroup);
        storeGroup = storeGroup[prop]
      }
    }

    //#filtering
    if (storeGroup && condition) {
      console.log(storeGroup);
      console.log('condition applied');
      return storeGroup.filter(condition)
    }else {
      console.log(group + " has been queried, return ", storeGroup);
      return storeGroup
    }
  }
}
