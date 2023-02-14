# kubesheets

### ¿Qué hace esta aplicación?

Kubesheets permite incluír los nombres de los Pods que estan presentes en los Clusters de Kubernetes que hayas creado en Google Cloud usando el Google Kubernetes Engine (GKE), en una hoja de Google Sheets.

### Requisitos para que funcione

Para que Kubesheets funcione, debemos darle al role *default:default* los permisos necesarios para leer Pods. Esto podemos lograrlo creando un ClusterRole dentro de la Resource Definition de nuestros pods de la siguiente forma:

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  namespace: default
  name: service-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["services", "pods"]
  verbs: ["get", "watch", "list"]
  
```

Y luego bindeando ese rol a la cuenta *default:default* desde la consola usando kubectl:

```
kubectl create clusterrolebinding service-reader-pod \
  --clusterrole=service-reader  \
  --serviceaccount=default:default
```

### ¿Cómo se usa?

1. Creamos un Cluster en GKE y le agregamos nuestros Pods. <a href="https://cloud.google.com/binary-authorization/docs/getting-started-cli?hl=es-419">Link al instructivo</a>

![image](https://user-images.githubusercontent.com/125300618/218554601-11967200-bbb6-4899-b54d-53b108d3f7f9.png)


2. Creamos una nueva hoja de cálculo de Google Sheets y, en la cinta superior de opciones, seleccionamos *Extenciones > Appscript*. Esto va a crear un nuevo proyecto de Appscript para que trabajemos.

![image](https://user-images.githubusercontent.com/125300618/218547280-5ed66d41-db73-4ab0-b8a0-48e9c9d61522.png)

3. Asociamos nuestra hoja de Appscript a nuestro Proyecto de Google Cloud donde hayamos creado los Clusters. Nota: Para esto es necesario tener configurada la *Pantalla de Consentimiento de Oauth*

![image](https://user-images.githubusercontent.com/125300618/218549793-3481266c-e4f9-4839-a762-d62518a148d2.png)

4. Vamos a necesitar un Token de acceso que nos va a dar Kubectl para interactuar con la API de Kubernetes. Copia y pega este código en la consola, reemplazando *YOUR CLUSTER NAME* con el nombre del Cluster al que desees acceder y guarda el Token que se emite al final:

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

![image](https://user-images.githubusercontent.com/125300618/218555118-2b4ec39e-00fb-439b-8a2f-07d836c4464c.png)


5. Copiamos el código que aparece en el repositorio dentro de *main.gs* a la nueva hoja del proyecto de Appscript. Recorda asignarle a la variable "*KUBERNETES_TOKEN*" el valor de tu Token obtenido en el Paso 4 y a la variable "*PROJECT_ID*" el ID de tu proyecto de Google Cloud.

![image](https://user-images.githubusercontent.com/125300618/218555388-6cfad885-b1cb-4252-b97d-c1a8dc12a88d.png)

6. En la configuración del proyecto de Appscript, comprobamos que tenemos marcada la opción "*Mostrar el archivo de manifiesto "appsscript.json" en el editor*".

  ![image](https://user-images.githubusercontent.com/125300618/218546963-3d74d7e7-acdc-4715-879c-4838c9e63ea2.png)

7. Copiamos las oauthScopes dentro de una nueva propiedad en el archivo "*appscript.json*" de nuestro proyecto. Debería quedar así:

![image](https://user-images.githubusercontent.com/125300618/218547126-e8b76dbb-8676-493c-a3b8-fcc20d66923f.png)

8. Ejecutamos la función "*makeRequest*". 

![image](https://user-images.githubusercontent.com/125300618/218550586-ee158f21-5aa3-42a4-bbfa-ecf644a1e1fb.png)

9. Los nombres de los Pods aparecerán en la Columna "A" de nuestra hoja de Google Sheets.

![image](https://user-images.githubusercontent.com/125300618/218550709-86882109-4d90-4bd7-a5d3-6b08e8dda429.png)



