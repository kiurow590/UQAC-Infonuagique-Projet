<template>
    <div class="header">
        <button @click="goToLogin" class="nav-btn">Déconnexion</button>
        <h2 class="page-title">Accueil</h2>
        <button @click="goToAbonnement" class="nav-btn">Page d'Abonnement</button>
    </div>
    <div class="home-container">

        <!-- Graphiques -->
        <div class="charts-container">
            <div v-for="(data, sensorName) in sensorData" :key="sensorName" class="chart-card">
                <h2>{{ sensorName }}</h2>
                <canvas :id="'chart-' + sensorName"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
import { Chart } from 'chart.js/auto';
import { nextTick } from 'vue';

export default {
    name: 'AccueilComponent',
    data() {
        return {
            userID: this.$route.query.userID,
            sensorData: {} // Map contenant les données des capteurs
        };
    },
    methods: {
        async fetchInitialData() {
            // Communication avec le serveur pour obtenir les données initiales
            try {
               // const userId = this.userId; // L'ID de l'utilisateur, assurez-vous qu'il est récupéré via un token, une session, etc.

                const response = await fetch(`http://localhost:3000/topics/data`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body:{
                        userId : this.userID
                    }
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données des abonnements");
                }

                const data = await response.json();
                this.subscriptionsData = data;  // Données des abonnements et messages
                this.renderCharts();  // Méthode pour afficher les graphiques, si nécessaire

            } catch (error) {
                console.error("Erreur : ", error.message);
                alert(`Erreur : ${error.message}`);
            }

            // Appeler `nextTick` pour attendre que le DOM soit mis à jour
            await nextTick();

            // Appeler la fonction pour afficher les graphiques après que le DOM soit prêt
            this.renderCharts();
        },

        renderCharts() {
            // Supprimer tous les graphiques existants avant de les recréer
            const chartIds = Object.keys(this.sensorData); // Récupère les noms des capteurs
            chartIds.forEach(sensorName => {
                const chartElement = document.getElementById(`chart-${sensorName}`);
                const chartInstance = Chart.getChart(chartElement); // Récupère l'instance du graphique
                if (chartInstance) {
                    chartInstance.destroy(); // Détruit l'instance du graphique
                }
            });

            // Créer un graphique pour chaque capteur
            Object.entries(this.sensorData).forEach(([sensorName, data], index) => {
                const ctx = document.getElementById(`chart-${sensorName}`).getContext('2d');
                const labels = Object.keys(data); // Dates
                const values = Object.values(data); // Mesures

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: sensorName,
                                data: values,
                                backgroundColor: this.getColor(index, 0.2),
                                borderColor: this.getColor(index, 1),
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            });
        },

        getColor(index, alpha = 1) {
            // Retourne une couleur RGBA unique pour chaque capteur
            const colors = [
                `rgba(255, 99, 132, ${alpha})`,  // Rouge
                `rgba(54, 162, 235, ${alpha})`, // Bleu
                `rgba(75, 192, 192, ${alpha})`, // Vert
                `rgba(255, 206, 86, ${alpha})`, // Jaune
                `rgba(153, 102, 255, ${alpha})` // Violet
            ];
            return colors[index % colors.length];
        },
        goToLogin() {
            this.$router.push('/login'); // Redirige vers la page de connexion
        },
        goToAbonnement() {
            this.$router.push({ path: '/abonnement', query: { userID: this.userID }}); // Redirige vers la page d'abonnement
        }
    },
    mounted() {
        this.fetchInitialData();
    }
};
</script>

<style scoped>
.home-container {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
}

.header {
    display: flex;
    justify-content: space-between;
    background-color: #f8f9fa;
    padding: 1.4em;
    border-bottom: 3px solid #ddd;
    margin-bottom: 1.4em;
    box-sizing: border-box;
}

.refresh-btn {
    background-color: #4CAF50;
    color: white;
    padding: 15px 25px;
    margin: 10px 0;
    border: none;
    border-radius: 10px;
    cursor: pointer;
}

.refresh-btn:hover {
    background-color: #45a049;
}

.nav-btn {
    padding: 0.7em 1.4em;
    font-size: 1.05rem;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 7px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.nav-btn:hover {
    background-color: #0056b3;
}

.charts-container {
    display: block;
    margin-top: 20px;
}

.chart-card {
    padding: 15px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

/* Titre centré dans le bandeau */
.page-title {
    font-size: 2.1rem;
    font-weight: bold;
    color: #333;
    margin: 0;
}
</style>