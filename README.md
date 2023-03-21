# kubesheets

### ¿Qué hace esta aplicación?

Kubesheets permite listar la información de tu Cluster de Kubernetes en una hoja de cálculo de Google.

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
  resources: ["services", "pods", "deployments"]
  verbs: ["get", "watch", "list", "patch"]
  
```

O sino por consola:

```
kubectl create clusterrole service-reader --verb=get,watch,list,patch --resource=services,pods,deployments
```

Y luego bindeando ese rol a la cuenta *default:default* desde la consola usando kubectl:

```
kubectl create clusterrolebinding service-reader-pod \
  --clusterrole=service-reader  \
  --serviceaccount=default:default
```

### ¿Cómo se usa?

1. Creamos una nueva hoja de cálculo de Google Sheets y, en la cinta superior de opciones, seleccionamos *Extenciones > Appscript*. Esto va a crear un nuevo proyecto de Appscript para que trabajemos.

![image](https://user-images.githubusercontent.com/125300618/218547280-5ed66d41-db73-4ab0-b8a0-48e9c9d61522.png)

2. Vamos a necesitar un Token de acceso que nos va a dar Kubectl para interactuar con la API de Kubernetes. Copia y pega este código en la consola y guarda el Token que se emite al final:

```
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


3. Copiamos el código que aparece en el repositorio dentro de *front_end.gs* a la nueva hoja del proyecto de Appscript.

![image](https://user-images.githubusercontent.com/125300618/226501991-afc2bf30-4820-41c1-806c-e3c41bd4b06f.png)

4. Agregamos la biblioteca de "AKI" a nuestro documento introduciendo el siguiente código en el recuadro que dice "ID de secuencia de comandos" "1AssMGoAr4zEdnvFQNdfQTznSbSLLwvteD6p_EAPJlG8Dchch0vqf0vVn":

![image](https://user-images.githubusercontent.com/125300618/226503381-19270cd6-0411-4cab-a568-ae271859d79a.png)

5. Reiniciamos la página de nuestra nueva hoja de cálculo. Debería aparecernos un nuevo menú en la cinta de opciones.

![image](https://user-images.githubusercontent.com/125300618/226502266-724aa81c-0fcd-4258-a83f-ab5ba3bd010d.png)

6. Elegimos la opción que dice "List cluster". Nos pedirá una serie de permisos y deberemos dar nuestra autorización.

![image](https://user-images.githubusercontent.com/125300618/226502613-446cb9d0-2fb0-4b45-80d5-d12c012377ee.png)

7. El programa nos pedirá nuestra dirección IP pública del cluster y el Token que generamos previamente. Insertamos ambas cosas y le damos a "Aceptar".

![image](https://user-images.githubusercontent.com/125300618/226502782-cc594b78-498d-48dd-a4ea-65b8c48217bb.png)

8. Veremos que se crean nuevas hojas en el documento, cáda una correspondiente a un namespace de nuestro cluster.

![image](https://user-images.githubusercontent.com/125300618/226502905-a0774044-b3a9-4ac2-96dc-ef27e9c11526.png)



