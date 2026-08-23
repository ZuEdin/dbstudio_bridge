@description('Azure Region für das Deployment')
param location string = resourceGroup().location

@description('Umgebungsbezeichnung (z. B. dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'prod'

@description('Projektname für Namenskonventionen')
param projectName string = 'dbstudio-app'

@description('Docker Image URI (z. B. mcr.microsoft.com/azuredocs/aci-helloworld:latest oder aus Azure Container Registry)')
param containerImage string = 'mcr.microsoft.com/azuredocs/aci-helloworld:latest'

@description('Port, auf dem die Applikation im Container lauscht')
param containerPort int = 5000

@description('Zugewiesene CPU-Kerne für die Container App (0.25, 0.5, 0.75, 1.0, 2.0)')
param cpu string = '0.5'

@description('Zugewiesener Arbeitsspeicher für die Container App (0.5Gi, 1.0Gi, 1.5Gi, 2.0Gi)')
param memory string = '1.0Gi'

@description('Minimale Anzahl an Replikaten (0 für Scale-to-Zero)')
param minReplicas int = 1

@description('Maximale Anzahl an Replikaten für Autoscaling')
param maxReplicas int = 5

@description('Erstellt einen Azure Database for MySQL Flexible Server')
param enableMySQL bool = true

@description('Administrator-Benutzername für den MySQL Server')
param mysqlAdminLogin string = 'dbadmin'

@description('Administrator-Passwort für den MySQL Server')
@secure()
param mysqlAdminPassword string = 'ChangeMeInProduction2026!'

var uniqueSuffix = uniqueString(resourceGroup().id)
var logAnalyticsWorkspaceName = '${projectName}-${environment}-law-${uniqueSuffix}'
var containerAppEnvName = '${projectName}-${environment}-cae-${uniqueSuffix}'
var containerAppName = '${projectName}-${environment}-app'
var mysqlServerName = '${projectName}-${environment}-mysql-${uniqueSuffix}'
var databaseName = 'app_db'

// =============================================================================
// 1. LOG ANALYTICS WORKSPACE (MONITORING & LOGS)
// =============================================================================
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// =============================================================================
// 2. AZURE CONTAINER APPS MANAGED ENVIRONMENT
// =============================================================================
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// =============================================================================
// 3. AZURE DATABASE FOR MYSQL FLEXIBLE SERVER (OPTIONAL)
// =============================================================================
resource mysqlServer 'Microsoft.DBforMySQL/flexibleServers@2023-12-30' = if (enableMySQL) {
  name: mysqlServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: mysqlAdminLogin
    administratorLoginPassword: mysqlAdminPassword
    version: '8.0.21'
    storage: {
      storageSizeGB: 20
      iops: 360
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Firewall-Regel: Erlaubt Zugriff für alle internen Azure-Dienste
resource mysqlFirewallAllowAzure 'Microsoft.DBforMySQL/flexibleServers/firewallRules@2023-12-30' = if (enableMySQL) {
  parent: mysqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Standard Datenbank
resource mysqlDatabase 'Microsoft.DBforMySQL/flexibleServers/databases@2023-12-30' = if (enableMySQL) {
  parent: mysqlServer
  name: databaseName
  properties: {
    charset: 'utf8mb4'
    collation: 'utf8mb4_unicode_ci'
  }
}

// =============================================================================
// 4. AZURE CONTAINER APP (SERVERLESS CONTAINER EXECUTION)
// =============================================================================
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: containerPort
        transport: 'auto'
        allowInsecure: false
      }
      secrets: enableMySQL ? [
        {
          name: 'db-password'
          value: mysqlAdminPassword
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'main-app'
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: concat([
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'PORT'
              value: string(containerPort)
            }
          ], enableMySQL ? [
            {
              name: 'DB_HOST'
              value: mysqlServer.properties.fullyQualifiedDomainName
            }
            {
              name: 'DB_PORT'
              value: '3306'
            }
            {
              name: 'DB_NAME'
              value: databaseName
            }
            {
              name: 'DB_USER'
              value: mysqlAdminLogin
            }
            {
              name: 'DB_PASSWORD'
              secretRef: 'db-password'
            }
          ] : [])
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: enableMySQL ? [mysqlDatabase, mysqlFirewallAllowAzure] : []
}

// =============================================================================
// 5. OUTPUTS
// =============================================================================
@description('Öffentliche HTTPS URL der Azure Container App')
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('Vollständiger Hostname des MySQL Flexible Servers')
output mysqlFqdn string = enableMySQL ? mysqlServer.properties.fullyQualifiedDomainName : 'Kein MySQL Server erstellt'

@description('ID des Managed Environment')
output managedEnvironmentId string = containerAppEnv.id
