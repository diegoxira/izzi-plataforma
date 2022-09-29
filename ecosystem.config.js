module.exports = {
  apps : [{
    name: 'Plataforma',
    script: 'app.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      LDAP_URL: 'ldap://izzitelecom.net',
      LDAP_BASEDN: 'dc=izzitelecom,dc=net',
      LDAP_USERNAME: 'p-ogonzalezg@izzi.mx',
      LDAP_PASS: 'r5@nLF2ena6r',
      MYSQL_HOST: 'localhost',
      MYSQL_USER: 'xira',
      MYSQL_PASS: 'Xira_2018',
      MYSQL_DB: 'validacionesizzi',
      PORT: 80
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
