# kubesheets

### ¿Qué hace esta aplicación?

Kubesheets permite ver los Pods que estan presentes en los Clusters de Kubernetes que hayas creado en Google Cloud usando el Google Kubernetes Engine (GKE)

### ¿Cómo se usa?

1. Creamos un Cluster en GKE. <a href="https://cloud.google.com/binary-authorization/docs/getting-started-cli?hl=es-419">Link al instructivo</a>
2. Obtenemos nuestro Token en Kubectl y lo guardamos. Copia y pega este código en la consola, reemplazando *<YOUR CLUSTER NAME>* con el nombre del Cluster al que desees acceder:
```
    # Check all possible clusters, as your .KUBECONFIG may have multiple contexts:
    kubectl config view -o jsonpath='{"Cluster name\tServer\n"}{range .clusters[*]}{.name}{"\t"}{.cluster.server}{"\n"}{end}'

    # Select name of cluster you want to interact with from above output:
    export CLUSTER_NAME="<YOUR CLUSTER NAME>"

    # Point to the API server referring the cluster name
    APISERVER=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"$CLUSTER_NAME\")].cluster.server}")

    # Create a secret to hold a token for the default service account
    kubectl apply -f - <<EOF
    apiVersion: v1
    kind: Secret
    metadata:
      name: default-token
      annotations:
        kubernetes.io/service-account.name: default
    type: kubernetes.io/service-account-token
    EOF

    # Wait for the token controller to populate the secret with a token:
    while ! kubectl describe secret default-token | grep -E '^token' >/dev/null; do
      echo "waiting for token..." >&2
      sleep 1
    done

    # Get the token value
    TOKEN=$(kubectl get secret default-token -o jsonpath='{.data.token}' | base64 --decode)

    echo $TOKEN
```
3. Creamos una nueva hoja de cálculo de Google Sheets y, en la cinta superior de opciones, seleccionamos *Extenciones > Appscript*. Esto va a crear un nuevo proyecto de Appscript para que trabajemos
4. Copiamos el código que aparece en el repositorio dentro de *main.gs* a la nueva hoja del proyecto de Appscript. Recorda asignarle a la variable "*kubeToken*" el valor de tu Token obtenido en el Paso 2.
5. Ejecutamos la función *makeRequest()*
