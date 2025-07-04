import { Duration } from "aws-cdk-lib";
import * as api_gateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export interface CognitoM2MCacheConstructProps {
  tokenUrl: string;
  cacheDuration: Duration;
  name: string;
}

export class CognitoM2MCacheConstruct extends Construct {
  public readonly api: api_gateway.RestApi;
  public readonly cachedTokenUrl: string;

  constructor(
    scope: Construct,
    id: string,
    props: CognitoM2MCacheConstructProps,
  ) {
    super(scope, id);

    this.api = new api_gateway.RestApi(this, "CognitoM2MCacheApi", {
      restApiName: props.name,
      description: "Simple cache for Cognito M2M tokens",
      deployOptions: {
        stageName: "oauth2",
        cachingEnabled: true,
        cacheDataEncrypted: true,
        cacheTtl: props.cacheDuration,
        methodOptions: {
          "/token/POST": {
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheTtl: props.cacheDuration,
          },
        },
      },
      defaultCorsPreflightOptions: {
        allowOrigins: api_gateway.Cors.ALL_ORIGINS,
      },
      defaultMethodOptions: {
        authorizationType: api_gateway.AuthorizationType.NONE,
      },
    });

    const tokenResource = this.api.root.addResource("token");
    tokenResource.addMethod(
      "POST",
      new api_gateway.HttpIntegration(props.tokenUrl, {
        options: {
          cacheKeyParameters: [
            "method.request.header.Authorization",
            "method.request.querystring.scope",
          ],
          requestParameters: {
            "method.request.header.Authorization":
              "method.request.header.Authorization",
            "method.request.querystring.scope":
              "method.request.querystring.scope",
          },
        },
      }),
    );
    this.cachedTokenUrl = this.api.urlForPath(tokenResource.path);
  }
}
