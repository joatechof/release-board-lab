targetScope = 'resourceGroup'

@description('Localização com suporte de Container Apps Consumption, por exemplo westeurope.')
param location string = resourceGroup().location

@description('Nome do laboratório. Usa release-board neste percurso.')
param appName string = 'release-board'

@description('Imagem pública GHCR por digest; não usa latest.')
param containerImage string

resource environment 'Microsoft.App/managedEnvironments@2025-01-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'none'
    }
  }
}

resource app 'Microsoft.App/containerApps@2025-01-01' = {
  name: appName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'web'
          image: containerImage
          env: [
            {
              name: 'APP_ENV'
              value: 'azure-lab'
            }
            {
              name: 'RELEASE_CHANNEL'
              value: 'stable'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          probes: [
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: 3000
              }
              periodSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health/live'
                port: 3000
              }
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
        rules: [
          {
            name: 'http'
            http: { metadata: { concurrentRequests: '10' } }
          }
        ]
      }
    }
  }
}

output url string = 'https://${app.properties.configuration.ingress.fqdn}'
output appId string = app.id
