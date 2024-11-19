<template>
    <div class="abonnement-container">
        <!-- Boutons de navigation -->
        <button @click="goToLogin" class="exit-button">Déconnection</button>
        <button @click="goToAccueil" class="accueil-button">Page d'accueil</button>

        <h2>Abonnement aux capteurs</h2>

        <!-- Liste des capteurs -->
        <div class="sensor-list">
            <div v-for="sensor in sensors" :key="sensor.id" class="sensor-item">
                <label>
                    <input type="checkbox" v-model="selectedSensors" :value="sensor.id" />
                    {{ sensor.name }}
                </label>
            </div>
        </div>

        <!-- Bouton pour valider la sélection -->
        <button @click="submitSelection" class="submit-button">OK</button>
    </div>
</template>

<script>
export default {
    name: "AbonnementComponent",
    data() {
        return {
            sensors: [], // Liste des capteurs reçus depuis le serveur
            selectedSensors: [] // Liste des capteurs sélectionnés par l'utilisateur
        };
    },
    methods: {
        // Méthode pour récupérer la liste des capteurs depuis le serveur
        async fetchSensors() {
            /*try {
              // Exemple de requête au serveur pour récupérer la liste des capteurs
              const response = await fetch('http://localhost:3000/sensors', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
      
              if (!response.ok) {
                throw new Error("Erreur lors de la récupération des capteurs");
              }
      
              // Stocker les capteurs dans `sensors`
              const data = await response.json();
              this.sensors = data.sensors;
            } catch (error) {
              console.error("Erreur : ", error.message);
            }*/
            this.sensors = [
                { id: 1, name: "Capteur de température" },
                { id: 2, name: "Capteur d'humidité" },
                { id: 3, name: "Capteur de luminosité" },
                { id: 4, name: "Capteur de mouvement" }
            ];
        },

        // Méthode pour envoyer la sélection au serveur
        async submitSelection() {
            /*try {
              // Exemple de requête pour envoyer la sélection
              const response = await fetch('http://localhost:3000/sensors/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  selectedSensors: this.selectedSensors
                })
              });
      
              if (!response.ok) {
                throw new Error("Erreur lors de l'envoi de la sélection");
              }
      
              // Rediriger l'utilisateur vers la page d'accueil après validation
              this.$router.push({ path: "/accueil" });
            } catch (error) {
              console.error("Erreur : ", error.message);
            }*/
            this.$router.push({ path: "/accueil" });
        },

        // Méthode pour aller à la page de connexion
        goToLogin() {
            this.$router.push({ path: "/login" });
        },

        // Méthode pour aller à la page d'accueil
        goToAccueil() {
            this.$router.push({ path: "/accueil" });
        }
    },
    created() {
        // Appel à `fetchSensors` lors du montage du composant
        this.fetchSensors();
    }
};
</script>

<style scoped>
.abonnement-container {
    max-width: 800px;
    margin: auto;
    padding: 1em;
    text-align: center;
}

.sensor-list {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin: 2em 0;
}

.sensor-item {
    margin: 1em;
    text-align: center;
}

button {
    padding: 0.5em 1em;
    margin: 1em;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}

.exit-button {
    position: absolute;
    top: 10px;
    left: 10px;
}

.accueil-button {
    position: absolute;
    top: 10px;
    right: 10px;
}
</style>