#include <WiFi.h>           // Bibliothèque pour connecter l'ESP32 au Wi-Fi
#include <PubSubClient.h>   // Bibliothèque pour le protocole MQTT

// Configuration Wi-Fi
const char* ssid = "544 MORIN";        // Nom du réseau Wi-Fi
const char* password = "Logetudes";     // Mot de passe Wi-Fi

// Configuration MQTT
const char* mqttServer = "192.168.2.102";    // Adresse IP du serveur MQTT
const int mqttPort = 1883;                   // Port du serveur MQTT (par défaut 1883)
const char* mqttUser = "user";        // Nom d'utilisateur MQTT (si requis)
const char* mqttPassword = "password";     // Mot de passe MQTT (si requis)
const char* topic = "capteurs/donnees";      // Sujet pour publier les données

WiFiClient espClient;        // Création d'une instance de client Wi-Fi
PubSubClient client(espClient); // Initialisation de MQTT avec le client Wi-Fi

// Définition des broches pour les capteurs
const int lightSensorPin = 36;  // GPIO36 pour le capteur de luminosité
const int moistureSensorPin = 34; // GPIO34 pour le capteur d'humidité

// Fonction pour connecter l'ESP32 au Wi-Fi
void connectWiFi() {
  Serial.print("Connexion à : ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nWi-Fi connecté.");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
}

// Fonction pour connecter l'ESP32 au serveur MQTT
void connectMQTT() {
  while (!client.connected()) {
    Serial.println("Connexion au serveur MQTT...");

    if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
      Serial.println("Connecté au serveur MQTT !");
    } else {
      Serial.print("Échec de la connexion, rc=");
      Serial.print(client.state());
      Serial.println(" Nouvelle tentative dans 5 secondes...");
      delay(5000);
    }
  }
}

// Fonction pour lire les données du capteur de luminosité
int readLightSensor() {
  return analogRead(lightSensorPin); // Lire la valeur brute du capteur (0 à 4095)
}

// Fonction pour lire les données du capteur d'humidité
int readMoistureSensor() {
  //return analogRead(moistureSensorPin); // Lire la valeur brute du capteur (0 à 4095)
  return random(0, 100); // Simule un pourcentage d'humidité (0% à 100%)
}

void setup() {
  Serial.begin(115200);   // Initialisation de la communication série
  connectWiFi();          // Connexion au Wi-Fi
  client.setServer(mqttServer, mqttPort); // Configuration du serveur MQTT
}

void loop() {
  if (!client.connected()) {
    connectMQTT(); // Reconnexion au MQTT si nécessaire
  }

  client.loop();

  // Lecture des capteurs
  int lightValue = readLightSensor();           // Lecture du capteur de luminosité
  int moistureValue = readMoistureSensor();     // Lecture du capteur d'humidité

  // Création de la charge utile JSON
  char payload[100];
  snprintf(payload, sizeof(payload), "{\"luminosite\": %d, \"humidite\": %d}", lightValue, moistureValue);

  // Publication des données sur le sujet MQTT
  if (client.publish(topic, payload)) {
    Serial.println("Données envoyées avec succès !");
    Serial.println(payload);
  } else {
    Serial.println("Erreur lors de l'envoi des données.");
  }

  delay(5000); // Attente de 5 secondes avant la prochaine lecture
}
