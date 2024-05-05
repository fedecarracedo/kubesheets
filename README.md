# kubesheets

### What does this program do?

Kubesheets allows you to administer your Kubernetes Cluster from a Google Spreadsheet. From simply visualizing your data to creating new replicas of your pods.

### Usage requirements

In order for Kubesheets to work, we need to create a role with the necessary permissions. This can be achieved by creating a ClusterRole inside our Resource Definition like so:

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

Or using kubectl:

```
kubectl create clusterrole service-reader --verb=get,watch,list,patch --resource=services,pods,deployments
```

And then binding that role using kubectl:

```
kubectl create clusterrolebinding service-reader-pod \
  --clusterrole=service-reader  \
  --serviceaccount=default:default
```

### How to use Kubesheets

1. Create a new Google Spreadsheets and, in the top menu, select *Extensions > Appscript*. This will create a new Appscript project for us to work in.

![image](https://user-images.githubusercontent.com/125300618/218547280-5ed66d41-db73-4ab0-b8a0-48e9c9d61522.png)

2. We are going to need an access Token generated through Kubectl to interact with the Kubernetes API. Copy and paste this code in the console and save the Token printed at the end:

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

3. Copy the code inside the *front_end.gs* file and paste it inside your recently created Appscript project:

![image](https://user-images.githubusercontent.com/125300618/226501991-afc2bf30-4820-41c1-806c-e3c41bd4b06f.png)

4. We'll need to add the "AKI" library to our project pasting the following code inside the "Script ID" field, "1AssMGoAr4zEdnvFQNdfQTznSbSLLwvteD6p_EAPJlG8Dchch0vqf0vVn". This contains some basic classes to interact with the Kubernetes API from the Appscript enviroment. If you're interested in it, check the *back_end.gs* file:

![image](https://user-images.githubusercontent.com/125300618/226503381-19270cd6-0411-4cab-a568-ae271859d79a.png)

5. Reload the Spreadsheet. We should see a new menu in the top options:

![image](https://user-images.githubusercontent.com/125300618/226502266-724aa81c-0fcd-4258-a83f-ab5ba3bd010d.png)

6. Choose the option that says "List cluster". It should ask for a series of permissions and we must give our consent.

![image](https://user-images.githubusercontent.com/125300618/226502613-446cb9d0-2fb0-4b45-80d5-d12c012377ee.png)

7. Once running, the program will ask for our Public Cluster IP and the previously generated Kubernetes Token. Insert this information when prompted and click "Accept". 

![image](https://user-images.githubusercontent.com/125300618/226502782-cc594b78-498d-48dd-a4ea-65b8c48217bb.png)

8. We'll see new Sheets being created in the Spreadsheet, each one corresponding to a different namespace inside our cluster.

![image](https://user-images.githubusercontent.com/125300618/226502905-a0774044-b3a9-4ac2-96dc-ef27e9c11526.png)



