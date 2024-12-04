<template>
  <!-- Bandeau en haut -->
  <div class="header">
    <button @click="goToLogin" class="exit-button">Déconnexion</button>
    <h2 class="page-title">Abonnement aux capteurs</h2>
    <button @click="goToAccueil" class="accueil-button">Page d'Accueil</button>
  </div>

  <!-- Liste des capteurs sous forme de boutons carrés -->
  <div class="sensor-list">
    <div v-for="sensor in topics" :key="sensor.id" class="sensor-item"
      :class="{ selected: selectedTopics.includes(sensor.id) }" @click="toggleSensor(sensor.id)">
      {{ sensor.name }}
    </div>
  </div>

  <!-- Bouton pour valider la sélection -->
  <div class="ok-button">
    <button @click="submitSelection" class="submit-button">OK</button>
  </div>
</template>

<script>
export default {
  name: "AbonnementComponent",
  data() {
    return {
      userID: this.$route.query.userID,
      topics: [], // Liste des capteurs reçus depuis le serveur
      selectedTopics: [], // Liste des capteurs sélectionnés par l'utilisateur
      api_url: 'http://192.168.2.133:30003'
    };
  },
  methods: {

    // Méthode pour (dé)sélectionner un capteur
    toggleSensor(sensorId) {
      const index = this.selectedTopics.indexOf(sensorId);
      if (index === -1) {
        this.selectedTopics.push(sensorId); // Ajouter si non sélectionné
      } else {
        this.selectedTopics.splice(index, 1); // Retirer si déjà sélectionné
      }
    },
    // Méthode pour récupérer la liste des capteurs depuis le serveur
    async fetchSensors() {
      try {
        // Requête pour récupérer la liste des topics
        const response = await fetch(`http://192.168.2.133:30003/topics`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des topics");
        }

        // Stocker les topics dans `this.topics`
        const data = await response.json();
        this.topics = data.topics;
      } catch (error) {
        console.error("Erreur : ", error.message);
      }

    },

    // Méthode pour envoyer la sélection au serveur
    async submitSelection() {
      try {
        const response = await fetch(`http://192.168.2.133:30003/topics/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            selectedTopics: this.selectedTopics,
            userID: this.userID
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors de l'envoi de la sélection");
        }

        // Affiche un message de succès ou redirige l'utilisateur
        console.log("Abonnement réussi !");
        this.$router.push({ path: "/accueil", query: { userID: this.userID } }); // Rediriger vers la page d'accueil
      } catch (error) {
        console.error("Erreur : ", error.message);
        alert(`Erreur : ${error.message}`);
      }
    },

    async fetchCurrentSubscriptions() {
      try {
        const userId = this.userId; // L'ID de l'utilisateur, récupéré via session, token, ou autre mécanisme

        const response = await fetch(`http://192.168.2.133:30003/subscriptions/current/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des abonnements actuels");
        }

        const data = await response.json();
        this.currentSubscriptions = data;  // Liste des abonnements actuels
        console.log("Abonnements actuels : ", this.currentSubscriptions);

      } catch (error) {
        console.error("Erreur : ", error.message);
        alert(`Erreur : ${error.message}`);
      }
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
    this.fetchCurrentSubscriptions();
  }
};
</script>

<style scoped>
/* Bandeau en haut */
.header {
  display: flex;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 1.4em;
  border-bottom: 3px solid #ddd;
  margin-bottom: 1.4em;
  box-sizing: border-box;
}

/* Titre centré dans le bandeau */
.page-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* Liste des capteurs */
.sensor-list {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 10em 0;
  gap: 1.4em;
}

/* Style des carrés pour chaque capteur */
.sensor-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 210px;
  height: 210px;
  background-color: #f0f0f0;
  color: #333;
  font-size: 1.4rem;
  font-weight: bold;
  text-align: center;
  border: 3px solid #ccc;
  border-radius: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5.6px 8.4px rgba(0, 0, 0, 0.2);
}

/* Effet hover sur les carrés */
.sensor-item:hover {
  background-color: #e0e0e0;
}

/* Style des carrés sélectionnés */
.sensor-item.selected {
  background-color: #007bff;
  color: white;
  border: 3px solid #0056b3;
  box-shadow: inset 0 5.6px 8.4px rgba(0, 0, 0, 0.3);
  transform: translateY(2.8px);
}

/* Boutons généraux */
button {
  padding: 0.7em 1.4em;
  font-size: 1.05rem;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

/* Bouton de déconnexion */
.exit-button {
  flex-shrink: 0;
}

/* Bouton de déconnexion */
.ok-button {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 2.8em 0;
  gap: 1.4em;
}

/* Bouton pour aller à la page d'accueil */
.accueil-button {
  flex-shrink: 0;
}
</style>