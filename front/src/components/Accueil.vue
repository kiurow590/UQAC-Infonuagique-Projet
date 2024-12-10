<template>
    <div class="header">
        <button @click="goToLogin" class="nav-btn">Déconnexion</button>
        <h2 class="page-title">Accueil</h2>
        <button @click="goToAbonnement" class="nav-btn">Page d'Abonnement</button>
    </div>
    <div class="home-container">
        <!-- Sélecteur de plages temporelles -->
        <div class="time-range-selector">
            <label for="time-range">Afficher les données pour : </label>
            <select id="time-range" v-model="selectedTimeRange" @change="updateCharts">
                <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>
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
            userId: this.$route.query.userId,
            sensorData: {}, // Map contenant les données des capteurs
            api_url: 'http://192.168.2.133:3000',
            selectedTimeRange: 'all', // Par défaut, "all" est sélectionné
            timeRangeOptions: [
                { label: '1 heure', value: '1h' },
                { label: '6 heures', value: '6h' },
                { label: '12 heures', value: '12h' },
                { label: '1 jour', value: '1j' },
                { label: '7 jours', value: '7j' },
                { label: 'Tout', value: 'all' }
            ],
            chart: null,
            chartInstances: {},

        };
    },
    created() {
        this.connectWebSocket();
    },
    methods: {

        connectWebSocket() {
            const socket = new WebSocket('http://192.168.2.133:3333'); // Remplacez par l'adresse de votre serveur WebSocket

        
            socket.onopen = () => {
                console.log('WebSocket connection established');
                socket.send(JSON.stringify({ userId: this.userId }));
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                var date = data.date;
                var message = data.message;
                for(var i = 0; i < this.subscriptionsData.length; i++){
                    if(this.subscriptionsData[i].topicName == data.topic){
                        this.subscriptionsData[i].messages.push({topic_id: i+1, timestamp: date, message: message});
                    }
                }
                this.processSensorData();
                this.updateCharts();
            };

            socket.onclose = () => {
                console.log('WebSocket connection closed');
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        },

        async fetchInitialData() {
            // Communication avec le serveur pour obtenir les données initiales
            console.log('Récupération des données initiales...');
            console.log("ip to call : " + `${this.api_url}/api/topics/data?userId=${this.userId}`);
            try {
                // const userId = this.userId; // L'ID de l'utilisateur, assurez-vous qu'il est récupéré via un token, une session, etc.
                const response = await fetch(`${this.api_url}/api/topics/data?userId=${this.userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données des abonnements");
                }

                const data = await response.json();
                this.subscriptionsData = data;  // Données des abonnements et messages
                this.processSensorData(); // Traiter les données initiales
                this.renderCharts();  // Méthode pour afficher les graphiques, si nécessaire
            } catch (error) {
                console.error("Erreur : ", error.message);
                //alert(`Erreur : ${error.message}`);
            }

            // Appeler `nextTick` pour attendre que le DOM soit mis à jour
            await nextTick();

            // Appeler la fonction pour afficher les graphiques après que le DOM soit prêt
            this.updateCharts();
        },

        processSensorData() {
            const data = this.subscriptionsData;

            if (!data) return;

            for (let i = 0; i < data.length; i++) {
                const sensorName = data[i].topicName;
                const sensorValues = {};

                for (let j = 0; j < data[i].messages.length; j++) {
                    const value = JSON.parse(data[i].messages[j].message).value;
                    const date = new Date(data[i].messages[j].timestamp);
                    date.setHours(date.getHours() - 5);
                    sensorValues[date] = value;
                }

                this.sensorData[sensorName] = sensorValues;
            }

            // Initialiser les données filtrées à toutes les données
            this.filteredData = JSON.parse(JSON.stringify(this.sensorData));
        },

        updateCharts() {
            // Filtrer les données selon la plage temporelle sélectionnée
            this.filterDataByTimeRange();

            // Supprimer et recréer les graphiques
            const chartIds = Object.keys(this.filteredData);
            chartIds.forEach(sensorName => {
                const chartElement = document.getElementById(`chart-${sensorName}`);
                const chartInstance = Chart.getChart(chartElement);

                if (chartInstance) {
                    chartInstance.destroy();
                }
            });

            this.renderCharts();
        },

        filterDataByTimeRange() {
            const now = new Date();
            const ranges = {
                '1h': 1 * 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '12h': 12 * 60 * 60 * 1000,
                '1j': 24 * 60 * 60 * 1000,
                '7j': 7 * 24 * 60 * 60 * 1000,
                'all': Infinity
            };

            const timeLimit = ranges[this.selectedTimeRange];

            this.filteredData = {};
            Object.entries(this.sensorData).forEach(([sensorName, data]) => {
                const filteredSensorData = {};

                Object.entries(data).forEach(([timestamp, value]) => {
                    const date = new Date(timestamp);
                    if (now - date <= timeLimit) {
                        filteredSensorData[timestamp] = value;
                    }
                });

                this.filteredData[sensorName] = filteredSensorData;
            });
        },

        renderCharts() {
            Object.entries(this.filteredData).forEach(([sensorName, data], index) => {
                const ctx = document.getElementById(`chart-${sensorName}`);
                const values = Object.values(data); // Mesures
                const rawDates = Object.keys(data); // Dates

                const labels = rawDates.map(date => {
                    const parsedDate = new Date(date);
                    return `${parsedDate.getDate().toString().padStart(2, '0')}/${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear().toString().slice(-2)} - ${parsedDate.toLocaleTimeString('fr-FR', { hour12: false })}`;
                });

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
                        animation: false,
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Dates'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Mesures'
                                }
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
            this.$router.push({ path: '/abonnement', query: { userId: this.userId } }); // Redirige vers la page d'abonnement
        }
    },
    mounted() {
        this.fetchInitialData();
    },

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

.time-range-selector {
    margin: 20px 0;
    text-align: center;
}

.time-range-selector label {
    font-weight: bold;
    margin-right: 10px;
}

.time-range-selector select {
    padding: 5px 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
}
</style>