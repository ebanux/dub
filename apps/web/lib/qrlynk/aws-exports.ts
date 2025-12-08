/* eslint-disable */
import { Amplify } from 'aws-amplify';
import { CookieStorage } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { qrAppBaseUrl } from "./constants.ts";

export const awsSetup = () => {
  const baseUrl = qrAppBaseUrl;

  Amplify.configure({
    Auth: {
      Cognito: {
        // region: process.env.AMZ_WS_REGION as string,
        // Amazon Cognito User Pool ID
        userPoolId: process.env.NEXT_PUBLIC_AMZ_WS_COGNITO_USER_POOL_ID as string,
        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolClientId: process.env.NEXT_PUBLIC_AMZ_WS_COGNITO_CLIENT_ID as string,
        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        // identityPoolId: process.env.AMZ_WS_COGNITO_IDENTITY_POOL_ID,
        // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
        signUpVerificationMethod: 'code', // or 'link', 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification

        loginWith: {
          // OPTIONAL - Hosted UI configuration
          oauth: {
            domain: process.env.NEXT_PUBLIC_AMZ_WS_COGNITO_DOMAIN as string,
            scopes: ['aws.cognito.signin.user.admin', 'email', 'openid'],
            redirectSignIn: [`${baseUrl}/sign-in`],
            redirectSignOut: [baseUrl],
            responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
          },
        },

        passwordFormat: {
          minLength: 6,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
        },
      },
    },
  });

  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      domain: '.a-qr.link',
      path: '/',
      expires: 30, // 'expires' en días
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
};
