# UQAC-Infonuagique-Projet

## Contexte
Ce projet a été réalisé dans le cadre du cours d'infonuagique à l'UQAC. Il vise à présenter un exemple d'application d'une Architecture IoT basé sur la communication MQTT avec l'utilisation du pattern Publish/Subscribe.

## Equipe
- **Sofiane EL NAGGAR**
- **Matéo HANY** 
- **Aubry TONNERRE**

## Structure du projet

### Code Arduino
Le dossier `ESP-Code/` contient le code pour les capteurs ESP32 :
- `CodeESP32_1_sensor.ino`
- `CodeESP32_2_sensor.ino`

### Code MQTT-Listener
Le dossier `mqtt-subscriber/` contient le code pour le service d'écoute du broker MQTT : 
 - Objectif premier : set up la base de données
 - Objectif second : écouter les messages MQTT et les stocker dans la base de données les messages reçus en fonction du topic

### Code API REST
Le dossier `api_rest/` contient le code pour l'API REST, y compris :
- `server.js` : le point d'entrée principal de l'API REST.
- `logger.mjs` : module de journalisation.
- `/app` : répertoire contenant les fichiers de l'application.
- `Dockerfile` : fichier Docker pour construire l'image de l'API REST.
- `package.json` : fichier de configuration npm.

### Code Websocket
Le dossier `websocker_server/` contient le code pour le serveur WebSocket.


### Code Frontend
Le dossier `front/` contient le code pour l'application frontend Vue.js, y compris :
- `src/` : le code source de l'application Vue.js.
- `Dockerfile` : fichier Docker pour construire et servir l'application frontend.
- `nginx.conf` : configuration Nginx pour servir l'application.

### Configuration Kubernetes
Le dossier `k8s/` contient les fichiers de configuration Kubernetes pour déployer les différents services :
- `api-rest-deployment.yaml` : déploiement et service pour l'API REST.
- `front-deployment.yaml` : déploiement et service pour l'application frontend.

## Installation et exécution



## issues

## Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.