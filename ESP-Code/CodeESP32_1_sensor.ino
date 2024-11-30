//#include <WiFi.h>           // Bibliothèque pour connecter l'ESP32 au Wi-Fi
//#include <PubSubClient.h>   // Bibliothèque pour le protocole MQTT
//
//// Configuration Wi-Fi
//const char* ssid = "544 MORIN";        // Nom du réseau Wi-Fi
//const char* password = "Logetudes";     // Mot de passe Wi-Fi
//
//// Configuration MQTT
//const char* mqttServer = "192.168.2.102";    // Adresse IP du serveur MQTT
//const int mqttPort = 1883;                   // Port du serveur MQTT (par défaut 1883)
//const char* mqttUser = "user";        // Nom d'utilisateur MQTT (si requis)
//const char* mqttPassword = "password";     // Mot de passe MQTT (si requis)
//const char* topic = "capteur/temperature";   // Sujet où publier les données
//
//WiFiClient espClient;        // Création d'une instance de client Wi-Fi
//PubSubClient client(espClient); // Initialisation de MQTT avec le client Wi-Fi
//
//// Broche du capteur LM35 (ADC)
//const int lm35Pin = 34;  // GPIO34, canal ADC1_CH6
//
//// Fonction pour connecter l'ESP32 au Wi-Fi
//void connectWiFi() {
//  Serial.print("Connexion à : ");
//  Serial.println(ssid);
//  WiFi.begin(ssid, password);
//
//  while (WiFi.status() != WL_CONNECTED) {
//    delay(1000);
//    Serial.print(".");
//  }
//
//  Serial.println("\nWi-Fi connecté.");
//  Serial.print("Adresse IP : ");
//  Serial.println(WiFi.localIP());
//}
//
//// Fonction pour connecter l'ESP32 au serveur MQTT
//void connectMQTT() {
//  while (!client.connected()) {
//    Serial.println("Connexion au serveur MQTT...");
//
//    if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
//      Serial.println("Connecté au serveur MQTT !");
//    } else {
//      Serial.print("Échec de la connexion, rc=");
//      Serial.print(client.state());
//      Serial.println(" Nouvelle tentative dans 5 secondes...");
//      delay(5000);
//    }
//  }
//}
//
//// Fonction pour lire la température depuis le LM35
//float readTemperature() {
//  int rawValue = analogRead(lm35Pin);       // Lire la valeur brute du ADC
//  float voltage = (rawValue / 4095.0) * 3.3; // Convertir en tension (0-3.3V)
//  float temperature = voltage * 100.0;      // Convertir en °C (10 mV/°C)
//  return temperature;
//}
//
//void setup() {
//  Serial.begin(115200);   // Initialisation de la communication série
//  connectWiFi();          // Connexion au Wi-Fi
//  client.setServer(mqttServer, mqttPort); // Configuration du serveur MQTT
//}
//
//void loop() {
//  if (!client.connected()) {
//    connectMQTT(); // Reconnexion au MQTT si nécessaire
//  }
//
//  client.loop();
//
//  float temperature = readTemperature(); // Lire la température
//  Serial.print("Données capteur :");
//  Serial.println(temperature);
//  char payload[50];                      // Buffer pour la charge utile JSON
//  snprintf(payload, sizeof(payload), "{\"temperature\": %.2f}", temperature);
//
//  // Publication des données sur le sujet MQTT
//  if (client.publish(topic, payload)) {
//    Serial.println("Données envoyées avec succès !");
//    Serial.println(payload);
//  } else {
//    Serial.println("Erreur lors de l'envoi des données.");
//  }
//
//  delay(5000); // Attente de 5 secondes avant la prochaine lecture
//}
