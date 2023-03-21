function onOpen() {
  SpreadsheetApp.getUi().createMenu("Kubesheets")
  .addItem("Reset credentials", "saveCredentials")
  .addItem("List cluster", "processClusters")
  .addToUi()
}


// Updates the information in the sheets to match that of the current state of the cluster
function processClusters() {
  const documentProperties = PropertiesService.getDocumentProperties();
  let KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
  let CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")

  if(!KUBE_TOKEN || !CLUSTER_IP) {
    saveCredentials()
    KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
    CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")
  }

  const deployments = getDeployments()
  let namespaces = [... new Set(deployments.map((deployment) => deployment.namespace))]

  const deploymentsByNamespace = separateDeploymentsByNamespace(namespaces, deployments)

  setNamespaceSheets(deploymentsByNamespace)

}

// Checks if the user is asking to create replicas and handles the task.
function checkReplicaRequests() {
  const allSheets = SpreadsheetApp.getActiveSpreadsheet().getSheets()

  allSheets.forEach((sheet) => {
    const sheetName = sheet.getName()
    let ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
    let ssData = ss.getDataRange().getValues()
    for(let i = 2; i < ssData.length; i++) {
      let desiredReplicas = ssData[i][1]
      if(desiredReplicas) {
        let deploymentName = ssData[i][0]
        // Logger.log("Detected desired replicas for namespace " + sheetName + ":" + deploymentName + " Number: " + desiredReplicas	)

        let documentProperties = PropertiesService.getDocumentProperties();
        const KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
        const CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")

        const k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, CLUSTER_IP)
        const Deployments = k8v1api.deployments
        // Remember: sheet name == namespace name
        Deployments.update_replicas(sheetName, deploymentName, desiredReplicas)

        ss.getRange(i+1, 2).setValue("")
        Utilities.sleep(5000)
        processClusters()
      }
    }

  })

}








// **************************** HELPER FUNCTIONS ****************************

// Given an array of namespaces, creates a sheet for every namespace and lists the corresponding pods.
function setNamespaceSheets(deploymentsByNamespace) {
  let ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheets = ss.getSheets()

  deploymentsByNamespace.forEach((group) => {

    let sheet = sheets.find((elem) => elem.getName() == group.namespace)

    if(!sheet) sheet = ss.insertSheet().setName(group.namespace)

    let rows = group.deployments.map((deployment) => {
      return [deployment.name, "" , deployment.replicas]
    })
    rows.unshift(["Deployment name", "Desired replicas", "Actual replicas"])
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows)

  })
}

// Takes the array of every namespace available and groups the deployments accordingly
function separateDeploymentsByNamespace(namespaces, deployments) {
  let deploymentsByNamespace = namespaces.map((namespace) => {
    let thisNamespaceDeployments = []
    deployments.forEach((deployment) => deployment.namespace == namespace ? thisNamespaceDeployments.push(deployment) : "")
    return {
      namespace: namespace,
      deployments: thisNamespaceDeployments
    }
  })
  return deploymentsByNamespace
}

// Gets every deployment in the cluster
function getDeployments() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const KUBE_TOKEN = documentProperties.getProperty("KUBE_TOKEN")
  const CLUSTER_IP = documentProperties.getProperty("CLUSTER_IP")

  if(KUBE_TOKEN && CLUSTER_IP) {
    const k8v1api = new AKI.createK8V1Api(KUBE_TOKEN, CLUSTER_IP)
    const Deployments = k8v1api.deployments
    let deploymentList = JSON.parse(Deployments.listAll()).items

    let userDeployments = deploymentList.filter((deployment) => deployment.metadata.namespace !== "kube-system")

    let deploymentData = userDeployments.map((deployment) => {
      return {
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
        replicas: deployment.spec.replicas
      }
    })

    return deploymentData
  }
}


function saveCredentials() {
  const documentProperties = PropertiesService.getDocumentProperties();
  var ui = SpreadsheetApp.getUi();
  var cluster_ip_response = ui.prompt('Insert cluster IP adress',"Your cluster IP is", ui.ButtonSet.OK_CANCEL);
  documentProperties.setProperty("CLUSTER_IP", cluster_ip_response.getResponseText())

  var kube_token_response = ui.prompt('Insert your Kube-token',"Your cluster Kubernetes token is", ui.ButtonSet.OK_CANCEL);
  documentProperties.setProperty("KUBE_TOKEN", kube_token_response.getResponseText())
}


