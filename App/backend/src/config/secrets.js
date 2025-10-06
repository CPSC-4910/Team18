// App/backend/src/config/secrets.js
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

let cachedSecrets = null;

/**
 * Retrieves database credentials from AWS Secrets Manager
 * Caches the result to avoid repeated API calls
 */
export async function getDatabaseCredentials() {
  // Return cached secrets if available
  if (cachedSecrets) {
    return cachedSecrets;
  }

  // In local development, use environment variables from .env
  if (process.env.NODE_ENV === 'development') {
    return {
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_HOST: process.env.DB_HOST
    };
  }

  // In production (App Runner), fetch from Secrets Manager
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1"
  });

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN
    });

    const data = await client.send(command);
    
    if (data.SecretString) {
      cachedSecrets = JSON.parse(data.SecretString);
      console.log('✅ Database credentials loaded from Secrets Manager');
      return cachedSecrets;
    }
  } catch (error) {
    console.error('❌ Error retrieving secrets:', error);
    throw new Error('Failed to load database credentials');
  }
}