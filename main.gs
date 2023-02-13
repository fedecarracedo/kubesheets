function makeRequest() {
  let ACCESS_TOKEN = ScriptApp.getOAuthToken()
  let PROJECT_ROUTE = "projects/orbital-age-377622"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hoja 1")

  // INSERT KUBERNETES TOKEN HERE!
  const kubeToken = ""
  // ****************************
  
  let kubeApiUrl = 'https://container.googleapis.com/v1beta1/projects/orbital-age-377622/locations/-/clusters/'

  let clusterResponse = UrlFetchApp.fetch(kubeApiUrl, { 
    headers: { Authorization: 'Bearer ' + ACCESS_TOKEN }
  })
  let clusterResponseObj = JSON.parse(clusterResponse)

  const PUBLIC_ADRESS = "https://" + clusterResponseObj.clusters[0].privateClusterConfig.publicEndpoint + "/api/v1/pods"
  if(kubeToken !== "") {
    let podsResponse = UrlFetchApp.fetch(PUBLIC_ADRESS, {"headers": {
      Authorization: 'Bearer ' + kubeToken
    }, validateHttpsCertificates: false, muteHttpExceptions: true})
    let podsResponseObj = JSON.parse(podsResponse)

    let pods = []

    podsResponseObj.items.forEach((item) => pods.push([item.metadata.name]))
    sheet.getRange("A2:A").clear()
    sheet.getRange(2,1, pods.length, 1).setValues(pods)
  }

  Logger.log(clusterResponse)

}