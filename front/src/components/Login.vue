<template>
    <div class="login-container">
        <div class="form-container">
            <div class="login-form">
                <h2>Connexion</h2>
                <form @submit.prevent="login">
                    <div class="input-group">
                        <label for="email">Email :</label>
                        <input type="email" v-model="email" id="email" required />
                    </div>
                    <div class="input-group">
                        <label for="password">Mot de passe :</label>
                        <input type="password" v-model="password" id="password" required />
                    </div>
                    <button type="submit" class="btn-submit">Se connecter</button>
                </form>
            </div>
            <div class="signup-form">
                <h2>Inscription</h2>
                <form @submit.prevent="signup">
                    <div class="input-group">
                        <label for="emailSignup">Email :</label>
                        <input type="email" v-model="emailSignup" id="emailSignup" required />
                    </div>
                    <div class="input-group">
                        <label for="passwordSignup">Mot de passe :</label>
                        <input type="password" v-model="passwordSignup" id="passwordSignup" required />
                    </div>
                    <button type="submit" class="btn-submit">S'inscrire</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginComponent',
    data() {
        return {
            email: '',
            password: '',
            emailSignup: '',
            passwordSignup: '',
            userId: '',
            loginError: "Mail ou mot de passe incorrect",
            api_url: 'http://192.168.2.133:3000'
        };
    },
    methods: {
        async login() {
            try {

                console.log('Connexion en cours...');
                console.log(this.email);
                console.log(this.password);
                console.log("ip to call : " + `${this.api_url}/api/users/login`);
                const response = await fetch(`${this.api_url}/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                });
                const data = await response.json();

                if (!response.ok) {
                    alert(`Erreur : ${data.message || 'Une erreur est survenue'}`);
                    throw new Error(data.message || 'Une erreur est survenue');
                }

                this.userId = data.userId;

                console.log('Connexion réussie:', data);
                this.$router.push({ path: '/accueil', query: { userId: this.userId } }); // Redirection vers la page d'accueil
            } catch (error) {
                alert(`Erreur : ${error.message}`);
                console.error('Erreur lors de la connexion:', error.message);
            }
        },

        async signup() {
            try {

                console.log('Inscription en cours...');
                console.log(this.emailSignup);
                console.log("ip to call : " + `${this.api_url}/api/users/signup`);
                // console.log(this.passwordSignup);

                const response = await fetch(`${this.api_url}/api/users/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.emailSignup,
                        password: this.passwordSignup
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(`Erreur : ${data}`);
                    throw new Error(data);
                }

                this.userId = data.userId;

                console.log(data);
                this.$router.push({ path: '/abonnement', query: { userId: this.userId } }); // Redirection vers la page d'abonnement
            } catch (error) {
                alert('Erreur : mot de passe trop court ou email invalide');
                console.error(error.message);
            }
        }

    }
};
</script>

<style scoped>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
}

body {
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 100px;
    width: 100%;
    height: 100%;
    padding: 2em;
}

.form-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1000px;
}

.login-form,
.signup-form {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 2em;
    width: 45%;
}

h2 {
    text-align: center;
    font-size: 24px;
    color: #333;
    margin-bottom: 1.5em;
}

.input-group {
    margin-bottom: 1.5em;
}

.input-group label {
    font-size: 14px;
    color: #555;
    display: block;
    margin-bottom: 0.5em;
}

input {
    width: 100%;
    padding: 0.8em;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    color: #333;
}

input:focus {
    outline: none;
    border-color: #0056b3;
    box-shadow: 0 0 8px rgba(0, 86, 179, 0.2);
}

button {
    width: 100%;
    padding: 1em;
    background-color: #0056b3;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

button:hover {
    background-color: #004080;
}

.btn-submit {
    background-color: #28a745;
}

.btn-submit:hover {
    background-color: #218838;
}

.login-form,
.signup-form {
    background-color: #f9f9f9;
}

@media screen and (max-width: 768px) {
    .form-container {
        flex-direction: column;
    }

    .login-form,
    .signup-form {
        width: 100%;
        margin-bottom: 1em;
    }
}
</style>
