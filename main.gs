function makeRequest() {
  try {
    const ACCESS_TOKEN = ScriptApp.getOAuthToken()

    // INSERT PROJECT ID HERE!
    const PROJECT_ID = ""
    // ****************************

    // INSERT KUBERNETES TOKEN HERE!
    const KUBERNETES_TOKEN = ""
    // ****************************
    

    // Make a request to recover all the clusters
    let kubeApiUrl = `https://container.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/-/clusters/`
    let clusterResponse = UrlFetchApp.fetch(kubeApiUrl, { 
      headers: { Authorization: 'Bearer ' + ACCESS_TOKEN }
    })
    let clusterResponseObj = JSON.parse(clusterResponse)

    // Gets the first cluster and builds the route (Built like this for testing purposes)
    const PUBLIC_ADRESS = "https://" + clusterResponseObj.clusters[0].privateClusterConfig.publicEndpoint + "/api/v1/pods"

    if(KUBERNETES_TOKEN !== "") {
      let podsResponse = UrlFetchApp.fetch(PUBLIC_ADRESS, {"headers": {
        Authorization: 'Bearer ' + KUBERNETES_TOKEN
      }, validateHttpsCertificates: false, muteHttpExceptions: true})
      let podsResponseObj = JSON.parse(podsResponse)

      let pods = []

      podsResponseObj.items.forEach((item) => pods.push([item.metadata.name]))

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
      sheet.getRange("A2:A").clear()
      sheet.getRange(2,1, pods.length, 1).setValues(pods)
    }

    Logger.log("Datos cargados correctamente.")
  } catch(e) {
    Logger.log("Error en el procesamiento: " + e)
  }

}